// Jeopardy! Index Script
// This script controls the index.html page, the page that the players see

var controller;
var playerInfo = [];
var dailyDoubleHighlightedPlayer = -1;

// Sounds
var ddSound = zounds.load('sounds/dailyDouble.mp3');
var fjTheme = zounds.load('sounds/finalJeopardy.mp3');
var timeOutSound = zounds.load('sounds/timeOut.mp3');
var creditsSound = zounds.load('sounds/credits.mp3');

function init() {
	controller = window.open("controller.html", "", 'location=0, status=1, toolbar=0, menubar=0, resizable=1, scrollbars=, height=480, width=640');
	window.addEventListener("message", messageReceived, false);
}

function messageReceived(event) {
	var message = event.data;
	if (message.type == 'playerInfo') {
		displayScoreboard(message.playerInfo);
	} else if (message.type == 'newBoard') {
		showQuestionBoard(message.boardValue);
	} else if (message.type == 'revealCategory') {
		revealCategory(message.index, message.categoryName);
	} else if (message.type == 'displayQuestion') {
		displayQuestion(message.questionText, message.isFinalJeopardy);
	} else if (message.type == 'updateScore') {
		updateScore(message.playerIndex, message.newScore);
	} else if (message.type == 'hideQuestion') {
		hideQuestion(message.category, message.question);
	} else if (message.type == 'returnToBoard') {
		returnToBoard(message.isTimeOut);
	} else if (message.type == 'displayDailyDoubleLogo') {
		displayDailyDoubleLogo();
	} else if (message.type == 'highlightDailyDoublePlayer') {
		highlightDailyDoublePlayer(message.playerIndex);
	} else if (message.type == 'clearPlayerHighlighting') {
		clearPlayerHighlighting();
	} else if (message.type == 'displayFinalJeopardyLogo') {
		displayFinalJeopardyLogo(message.category);
	} else if (message.type == 'completeGame') {
		completeGame();
	}
}

function displayScoreboard(players) {
	playerInfo = players;

	for (var i = 0; i < players.length; i++) {
		makePlayerScore(players[i].name, i, players.length);
	}

	$("#game-intro").hide();
	$("#scoreboard").css({display: 'flex'});
}

function makePlayerScore(playerName, playerIndex, playerCount) {
	var container = $('<div class="player-score-container" id="player-' + playerIndex + '-score"></div>');
	container.append($('<div class="player-name">' + playerName + '</div>'));
	container.append($('<div class="player-score">$0</div>'));
	container.css({width: (100 / playerCount) + "%"});
	$("#scoreboard").append(container);
}

function setCellSize(elementSelector) {
	var width = $("#board").width();
	var height = $("#board").height();

	$(elementSelector).css({width: (width / 6) + "px"});
	$(elementSelector).css({height: (height / 6) + "px"});
}

function resizeBoard() {
	setCellSize(".category-header");
	setCellSize(".question");
}

function showQuestionBoard(value) {
	if (value === 2) {
		$(".category-header").text("DOUBLE JEOPARDY!");
		for (var i = 1; i <= 6; i++) {
			for (var j = 1; j <= 5; j++) {
				$("#question-" + i + "-" + j + " .box-text").text("$" + (200 * j * value));
			}
		}
	}

	$("#board").css({display: "flex"});
	resizeBoard();
}

function revealCategory(index, categoryName) {
	$("#header-" + (index + 1)).text(categoryName);
}

function displayQuestion(questionText, isFinalJeopardy) {
	$("#board").hide();
	$("#daily-double").hide();
	$("#final-jeopardy").hide();
	$("#clue").text(questionText);
	$("#clue").css({display: 'flex'});

	if (isFinalJeopardy) {
		fjTheme.play();
	}
}

function updateScore(playerIndex, newScore) {
	var prefix = (newScore > 0) ? "$" : "-$";
	newScore = Math.abs(newScore);
	$("#player-" + playerIndex + "-score .player-score").text(prefix + newScore.toFixed(0));
}

function hideQuestion(category, question) {
	$("#question-" + category + "-" + question + " .box-text").empty();
}

function returnToBoard(isTimeOut) {
	$("#clue").hide();
	$("#daily-double").hide();
	$("#board").css({display: 'flex'});

	if (isTimeOut) {
		timeOutSound.play();
	}
}

function displayDailyDoubleLogo() {
	$("#board").hide();
	$("#daily-double").css({display: 'flex'});
	ddSound.play();
}

function highlightDailyDoublePlayer(playerIndex) {
	$("#player-" + playerIndex + "-score").css({'background-color': '#00FF00'});
	dailyDoubleHighlightedPlayer = playerIndex;
}

function clearPlayerHighlighting() {
	$("player-" + dailyDoubleHighlightedPlayer + "-score").css({'background-color': ''});
	dailyDoubleHighlightedPlayer = -1;
}

function displayFinalJeopardyLogo(categoryName) {
	$("#board").hide();
	$("#final-jeopardy").css({display: 'flex'});
	$("#fj-category").text(categoryName);
}

function completeGame() {
	$("#clue").hide();
	$("#game-intro").css({display: 'flex'});
	creditsSound.play();
}