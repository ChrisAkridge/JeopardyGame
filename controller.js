// Jeopardy! Controller Script
// This is the script for the controller window, which the host uses to control the game.

var players = [];
var board = [];
var gameSource;
var isDoubleJeopardy;
var lastRevealedCategory = -1;
var playingCategory = -1;
var playingQuestion = -1;
var selectedBy = -1;
var activeClues = 30;

function init() {
	window.addEventListener("message", messageReceived, false);
}

function sendMessage(message) {
	window.opener.postMessage(message, "*");
}

function messageReceived(event) {

}

function setPlayerCount() {
	var playerCount = $("#player-count").val();

	for (var i = 0; i < playerCount; i++) {
		var playerNameInputID = 'player-' + i + '-name';
		var playerInputDivText = '<div id="player-' + i + '-input"></div>';
		var playerInputDiv = $(playerInputDivText);
		playerInputDiv.append($('<label for="player-' + i + '-name">Name:</label>'));
		playerInputDiv.append($('<input type="text" id="' + playerNameInputID + '" name="' + playerNameInputID + '" />'));
		$("#player-inputs").append(playerInputDiv);

		$("#player-info-submit").show();
	}
}

function setPlayerInfo() {
	var i = 0;

	while ($("#player-" + i + "-name").length > 0) {
		var playerName = $("#player-" + i + "-name").val();
		players.push({name: playerName, score: 0});

		i++;
	}

	sendMessage({
		type: "playerInfo",
		playerInfo: players
	});

	$("#set-player-info").hide();
	$("#choose-game-source").show();

	createQuestionSelectedByElements();
}

function setGameSource() {
	var isJServiceGame = $("input[name=source]:checked").val() === 'jservice';
	gameSource = (isJServiceGame) ? "jService" : "local";
	isDoubleJeopardy = false;

	if (isJServiceGame) {
		startJServiceGame();
	} else {
		alert("Support for local games coming soon!");
	}
}

function startJServiceGame() {
	for (var i = 0; i < 6; i++) {
		var category = pickFiveFromCategory(getJServiceCategory());
		for (var j = 0; j < 5; j++) {
			category[j].scoreValue = ((j+1) * 100) * ((isDoubleJeopardy) ? 4 : 2);
			category[j].answered = false;
		}
		board.push(category);
	}

	sendMessage({
		type: "newBoard",
		boardValue: (isDoubleJeopardy) ? 2 : 1
	})

	$("#choose-game-source").hide();
	$("#category-reveal").show();

	setControllerBoard();
}

function getJServiceCategory() {
	var categoryNumber = Math.floor(Math.random() * 18417) + 1;

	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://jservice.io/api/clues?category=" + categoryNumber, false);
	xhr.send();

	if (xhr.readyState === 4 && xhr.status === 200) {
		categoryJSON = JSON.parse(xhr.responseText);
	} else {
		alert("Tried to get category " + categoryNumber + " from jService.io, but it failed with status code " + xhr.status);
	}

	return categoryJSON;
}

function pickFiveFromCategory(category) {
	var resultCategory = [];
	for (var i = 0; i < 5; i++) {
		var index = Math.floor(Math.random() * category.length);
		resultCategory.push(category.splice(index, 1)[0]);
	}
	return resultCategory;
}

function revealCategory() {
	if (lastRevealedCategory <= 4) {
		lastRevealedCategory++;

		sendMessage({
			type: "revealCategory",
			index: lastRevealedCategory,
			categoryName: board[lastRevealedCategory][0].category.title
		});
	}
	else {
		$("#category-reveal").hide();
		$("#board").show();
	}
}

function setControllerBoard() {
	for (var i = 0; i < 6; i++) {
		$("#board-c" + (i + 1) + "h").text(board[i][0].category.title.toUpperCase());

		if (isDoubleJeopardy) {
			for (var j = 0; j < 5; j++) {
				$("#board-c" + (i + 1) + "q" + (j + 1)).text("$" + ((j+1) * 400));
			}
		}
	}
}

function createQuestionSelectedByElements() {
	for (let i = 0; i < players.length; i++) {
		var playerDiv = $('<div id="selected-by-' + i + '">' + players[i].name + '</div>');
		playerDiv.css({
			'width': "200px",
			'text-align': 'center',
			'border': '1px solid black'
		});
		playerDiv.click(function() {
			playerSelectedQuestion(i);
		})
		$("#question-played-by").append(playerDiv);
	}
}

function playQuestion(c, q) {
	playingCategory = c - 1;
	playingQuestion = q - 1;

	$("#question-played-by").show();
}

function playerSelectedQuestion(playerIndex) {
	$("#question-played-by").hide();
	selectedBy = playerIndex;

	var question = board[playingCategory][playingQuestion];
	var answerText = "$" + question.scoreValue + ": " + question.answer;
	$("#answer").text(answerText);

	$("#answer-info").show();

	sendMessage({
		type: "displayQuestion",
		questionText: question.question
	});
}

function questionAnswered() {
	activeClues--;
	if (activeClues === 0) {alert("Board clear!");}

	$("#answer-info").hide();

	$("#board-c" + (playingCategory+1) + "q" + (playingQuestion+1)).off("click");
	$("#board-c" + (playingCategory+1) + "q" + (playingQuestion+1)).text("");

	sendMessage({
		type: "updateScore",
		playerIndex: selectedBy,
		newScore: players[selectedBy].score
	});

	sendMessage({
		type: "hideQuestion",
		category: playingCategory + 1,
		question: playingQuestion + 1
	});

	sendMessage({
		type: "returnToBoard"
	});

	playingCategory = playingQuestion = selectedBy = -1;
}

function rightAnswer() {
	var question = board[playingCategory][playingQuestion];
	players[selectedBy].score += question.scoreValue;

	questionAnswered();
}

function wrongAnswer() {
	var question = board[playingCategory][playingQuestion];
	players[selectedBy].score -= question.scoreValue;

	questionAnswered();
}