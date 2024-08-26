const socket = new WebSocket('ws://localhost:8080');

let selectedCharacter = null;
let currentPlayer = prompt('Enter your player ID (A or B):');
document.getElementById('player-info').textContent = `Player: ${currentPlayer}`;

socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'initialize', player: currentPlayer, characters: prompt('Enter your characters (e.g., P1,P2,...):').split(',') }));
};

socket.onmessage = event => {
    const message = JSON.parse(event.data);
    switch (message.type) {
        case 'gameInitialization':
        case 'gameState':
            updateGameBoard(message.gameState.board);
            updateMoveHistory(message.gameState.moveHistory);
            break;
        case 'invalidMove':
            alert(`Invalid move: ${message.message}`);
            break;
        case 'gameOver':
            alert(`Game Over! Player ${message.winner} wins!`);
            break;
        case 'validMoves':
            displayValidMoves(message.moves);
            break;
        default:
            console.error('Unknown message type');
    }
};

function updateGameBoard(board) {
    const gameBoardElement = document.getElementById('game-board');
    gameBoardElement.innerHTML = '';

    board.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            const cellElement = document.createElement('div');
            cellElement.className = `cell ${cell ? 'occupied ' + cell.charAt(0) : ''}`;
            cellElement.textContent = cell ? cell.split('-')[1] : '';
            cellElement.onclick = () => handleCellClick(rowIndex, cellIndex, cell);
            gameBoardElement.appendChild(cellElement);
        });
    });
}

function handleCellClick(row, col, cell) {
    if (cell && cell.startsWith(currentPlayer)) { // Only allow interaction with own characters
        if (selectedCharacter) {
            const move = prompt('Enter move command (e.g., P1:L, H2:BR):');
            if (move) {
                socket.send(JSON.stringify({ type: 'move', player: currentPlayer, character: selectedCharacter, move }));
                selectedCharacter = null; // Deselect after move
            }
        } else {
            selectedCharacter = cell; // Select the character
            // Request valid moves from the server
            socket.send(JSON.stringify({ type: 'requestValidMoves', character: cell }));
        }
    }
}

function displayValidMoves(moves) {
    const validMovesContainer = document.getElementById('valid-moves');
    validMovesContainer.innerHTML = ''; // Clear previous moves

    moves.forEach(move => {
        const button = document.createElement('button');
        button.textContent = move.label;
        button.onclick = () => {
            socket.send(JSON.stringify({ type: 'move', player: currentPlayer, character: selectedCharacter, move: move.command }));
            selectedCharacter = null; // Deselect after move
        };
        validMovesContainer.appendChild(button);
    });
}

function updateMoveHistory(moveHistory) {
    const moveHistoryElement = document.getElementById('move-history');
    moveHistoryElement.innerHTML = '';

    moveHistory.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.textContent = `Player ${entry.player}: ${entry.move}`;
        moveHistoryElement.appendChild(entryElement);
    });
}

function setupNewGameButton() {
    const newGameButton = document.getElementById('new-game');
    newGameButton.onclick = () => {
        socket.send(JSON.stringify({ type: 'newGame' }));
    };
}

// Initialize new game button
setupNewGameButton();
