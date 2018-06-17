// https://stackoverflow.com/questions/35268660/webrtc-between-two-pages-in-the-same-machine

var pc = new RTCPeerConnection(), dc, enterPressed = e => e.keyCode == 13;

var connect = () => init(dc = pc.createDataChannel("chat"));
pc.ondatachannel = e => init(dc = e.channel);

var init = dc => {
  dc.onopen = e => (dc.send("Hi!"), chat.select());
  dc.onclose = e => log("Bye!");
  dc.onmessage = e => log(e.data);
};

chat.onkeypress = e => {
  if (!enterPressed(e)) return;
  dc.send(chat.value);
  log("> " + chat.value);
  chat.value = "";
};

var sc = new localSocket(), send = obj => sc.send(JSON.stringify(obj));
var incoming = msg => msg.sdp &&
  pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
  .then(() => pc.signalingState == "stable" || pc.createAnswer()
    .then(answer => pc.setLocalDescription(answer))
    .then(() => send({ sdp: pc.localDescription })))
  .catch(log) || msg.candidate &&
  pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(log);
sc.onmessage = e => { console.log(e); incoming(JSON.parse(e.data));  }

pc.oniceconnectionstatechange = e => log(pc.iceConnectionState);
pc.onicecandidate = e => send({ candidate: e.candidate });
pc.onnegotiationneeded = e => pc.createOffer()
  .then(offer => pc.setLocalDescription(offer))
  .then(() => send({ sdp: pc.localDescription }))
  .catch(log);

var log = msg => div.innerHTML += "<br>" + msg;

function localSocket() {
    localStorage.a = localStorage.b = JSON.stringify([]);
    this.index = 0;
    this.interval = setInterval(() => {
      if (!this.in) {
        if (!JSON.parse(localStorage.a).length) return;
        this.in = "a"; this.out = "b";
      }
      var arr = JSON.parse(localStorage[this.in]);
      if (arr.length <= this.index) return;
      if (this.onmessage) this.onmessage({ data: arr[this.index] });
      this.index++;
    }, 200);
    setTimeout(() => this.onopen && this.onopen({}));
    }
  this.send = function(msg) {
    if (!this.out) {
      this.out = "a"; this.in = "b";
    }
    var arr = JSON.parse(localStorage[this.out]);
    arr.push(msg);
    localStorage[this.out] = JSON.stringify(arr);
    }
  this.close = function() {
    clearInterval(this.interval);
  }