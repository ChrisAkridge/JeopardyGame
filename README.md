# JeopardyGame
An entirely local, full-featured Jeopardy game. The host runs the show, and players answer questions, just like on real Jeopardy.

## Playing Locally

1. Clone the repository.
2. Run `python -m SimpleHTTPServer 8080` in a terminal in the folder you cloned the code to.
3. Navigate to `localhost:8080` in your browser. This is the *view*, which displays the board, questions, and daily doubles.
4. A popup opens. (You may need to accept popups.) This is the *controller*, which allows the host to drive the game.