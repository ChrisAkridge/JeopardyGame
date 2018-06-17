// Jeopardy! Controller Script
// This is the script for the controller window, which the host uses to control the game.

var players = [];
var board = [];
var gameSource;
var isDoubleJeopardy;
var lastRevealedCategory = -1;
var playingCategory = -1;
var playingQuestion = -1;
var guessesRemaining = -1;
var activeClues = 30;

function init() {
	window.addEventListener("message", messageReceived, false);
}

function sendMessage(message) {
	window.opener.postMessage(message, "*");
}

function messageReceived(event) {

}

function getQuestion(categoryNumber, questionNumber) {
	return board[categoryNumber][questionNumber];
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
			category[j].isDailyDouble = false;
		}
		board.push(category);
	}

	pickDailyDoubles((isDoubleJeopardy) ? 2 : 1);

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

function pickDailyDoubles(ddCount) {
	while (ddCount > 0) {
		var questionsAlreadyPicked = [];
		var categoryNumber;
		var questionNumber;

		do {
			categoryNumber = Math.floor(Math.random() * 6);
			questionNumber = Math.floor(Math.random() * 5);
		} while (questionsAlreadyPicked.includes(categoryNumber * questionNumber));

		board[categoryNumber][questionNumber].isDailyDouble = true;
		questionsAlreadyPicked.push(categoryNumber * questionNumber);
		$("#daily-doubles").append(categoryNumber + '-' + questionNumber);

		ddCount--;
	}
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

function playQuestion(c, q) {
	playingCategory = c - 1;
	playingQuestion = q - 1;
	guessesRemaining = players.length;

	var question = board[playingCategory][playingQuestion];
	if (!question.isDailyDouble) {
		playStandardQuestion(question);
	} else {
		chooseDailyDoublePlayer(question);
	}
}

function playStandardQuestion(question) {
	var answerText = "$" + question.scoreValue + ": " + question.answer;
	$("#answer").text(answerText);

	makePlayerQuestionButtons();

	$("#answer-info").show();

	sendMessage({
		type: "displayQuestion",
		questionText: question.question
	});
}

function chooseDailyDoublePlayer() {
	$("#answer-buttons").empty();
	$("#answer-buttons").append('<p>Pick Daily Double player:</p>');

	for (let i = 0; i < players.length; i++) {
		var playerDiv = $('<div>' + players[i].name + '</div>');
		var selectButton = $('<button>Select</button>');
		playerDiv.append(selectButton);

		selectButton.click(function() {
			selectDailyDoublePlayer(i);
		});

		$("#answer-buttons").append(playerDiv);
	}

	$("#answer-info").show();

	sendMessage({
		type: "displayDailyDoubleLogo"
	});
}

function selectDailyDoublePlayer(playerIndex) {
	var question = getQuestion(playingCategory, playingQuestion);

	sendMessage({
		type: "highlightDailyDoublePlayer",
		index: playerIndex
	});

	var player = players[playerIndex];
	var maxWager = (player.score >= 1000) ? player.score : 1000;
	var wagerText;

	while (isNaN(wagerText)) {
		wagerText = prompt('Player ' + player.name + ' can wager up to $' + maxWager.toFixed(0));
	}

	var wager = parseInt(wagerText);

	$("#answer-buttons").empty();
	var answerText = "$" + question.scoreValue + ": " + question.answer;
	$("#answer").text(answerText);

	var rightButton = $('<button>Correct</button>');
	var wrongButton = $('<button>Incorrect</button>');

	rightButton.click(function() {
		answerDailyDouble(playerIndex, wager);
	});

	wrongButton.click(function() {
		answerDailyDouble(playerIndex, -wager);
	});

	$("#answer-buttons").append(rightButton);
	$("#answer-buttons").append(wrongButton);

	sendMessage({
		type: "displayQuestion",
		questionText: question.question
	});
}

function makePlayerQuestionButtons() {
	$("#answer-buttons").empty();

	for (let i = 0; i < players.length; i++) {
		var playerDiv = $('<div>' + players[i].name + '</div>');
		var rightButton = $('<button>Correct</button>');
		var wrongButton = $('<button>Incorrect</button>');

		rightButton.click(function () {
			rightAnswer(i);
		});

		wrongButton.click(function () {
			wrongAnswer(i);
		});

		playerDiv.append(rightButton);
		playerDiv.append(wrongButton);

		$("#answer-buttons").append(playerDiv);
	}
}

function questionAnswered(playerIndex, wasCorrect) {
	sendMessage({
		type: "updateScore",
		playerIndex: playerIndex,
		newScore: players[playerIndex].score
	});

	sendMessage({
		type: "clearPlayerHighlighting"
	});

	guessesRemaining--;

	if (guessesRemaining === 0 || wasCorrect) {
		finishQuestion();
	}
}

function finishQuestion() {
	activeClues--;
	guessesRemaining = -1;
	if (activeClues === 0) {alert("Board clear!");}

	$("#answer-info").hide();

	$("#board-c" + (playingCategory+1) + "q" + (playingQuestion+1)).off("click");
	$("#board-c" + (playingCategory+1) + "q" + (playingQuestion+1)).text("-");

	sendMessage({
		type: "hideQuestion",
		category: playingCategory + 1,
		question: playingQuestion + 1
	});

	sendMessage({
		type: "returnToBoard"
	});

	playingCategory = playingQuestion = -1;
}

function rightAnswer(playerIndex) {
	var question = board[playingCategory][playingQuestion];
	players[playerIndex].score += question.scoreValue;

	questionAnswered(playerIndex, true);
}

function wrongAnswer(playerIndex) {
	var question = board[playingCategory][playingQuestion];
	players[playerIndex].score -= question.scoreValue;

	questionAnswered(playerIndex, false);
}

function answerDailyDouble(playerIndex, wager) {
	players[playerIndex].score += wager;

	questionAnswered(playerIndex, false);
	finishQuestion();
}