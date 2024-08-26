#Chess-Like Game

This project is a web-based chess-like game that can be played between two players. It uses WebSocket for real-time communication and features a 5x5 game board with different types of characters: Pawns, Hero1, and Hero2.


Features:

 Game Board: 5x5 grid where players can move their characters.
 Character Types:
   Pawn: Moves one block in any direction (Left, Right, Forward, Backward).
   Hero1: Moves two blocks straight in any direction and captures any opponent’s character in its path.
   Hero2: Moves two blocks diagonally in any direction and captures any opponent’s character in its path.
 Move History: Keeps track of all moves made during the game.
 Player Turn Indication: Shows which player’s turn it is.
 Game Over Screen: Displays the winner and offers an option to start a new game.

Requirements:
  Node.js
  WebSocket library ('ws')

SET UP:
  mkdir chess-like-game
  cd chess-like-game
  npm init -y

 installation:
   Install Dependencies:  npm install
                          npm install ws express
                          
   Start the Server:   node server.js

USAGE:
  Open the Client:
       Open index.html in your web browser. You can use any modern web browser to interact with the game.


Usage:

   Initializing the Game:

    When prompted, enter your player ID (A or B).
    Enter the characters you want to use (e.g., P1,P2,...).
 
 Playing the Game:

    Click on your character to select it.
    Valid moves for the selected character will be displayed as buttons below the game board.
    Click on a valid move button to execute the move.
    The turn will switch between players automatically after each move.
Handling Moves:

    Pawns move one block in any direction.
    Hero1 moves two blocks straight and captures any opponent’s character in its path.
    Hero2 moves two blocks diagonally and captures any opponent’s character in its path.
 
Viewing Move History:

   Move history is displayed below the game board.

Starting a New Game:

     After the game is over, click the "Start New Game" button to reset the game board and start a new match.

File Structure:
  server.js: WebSocket server implementation.
  game.js: Client-side JavaScript for game logic and WebSocket communication.
  index.html: HTML file with the game board and UI components.
  README.md: This file.


