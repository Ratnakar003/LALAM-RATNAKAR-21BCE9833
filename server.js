const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let gameState = {
    players: { A: null, B: null },
    board: Array(5).fill(null).map(() => Array(5).fill(null)),
    turn: 'A',
    moveHistory: [] // Add move history
};

wss.on('connection', ws => {
    console.log('New connection');
    ws.on('message', message => {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'initialize':
                handleInitialization(data, ws);
                break;
            case 'move':
                handleMove(data, ws);
                break;
            case 'requestValidMoves':
                handleRequestValidMoves(data, ws);
                break;
            case 'newGame':
                handleNewGame(ws);
                break;
            default:
                console.error('Unknown message type');
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Handle client disconnection if needed
    });
});

function handleInitialization(data, ws) {
    const player = data.player;
    if (!gameState.players[player]) {
        gameState.players[player] = { characters: data.characters };
        // Set initial positions
        const row = player === 'A' ? 0 : 4;
        data.characters.forEach((char, index) => {
            gameState.board[row][index] = `${player}-${char}`;
        });
        // Notify the player and all others about the updated game state
        broadcastGameState();
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Player already initialized' }));
    }
}

function handleMove(data, ws) {
    const { player, character, move } = data;

    if (gameState.turn !== player) {
        ws.send(JSON.stringify({ type: 'invalidMove', message: 'Not your turn' }));
        return;
    }

    if (validateMove(character, move)) {
        updateGameState(character, move);
        // Record the move in history
        gameState.moveHistory.push({ player, move });
        if (checkGameOver()) {
            broadcastGameState({ type: 'gameOver', winner: player });
        } else {
            gameState.turn = gameState.turn === 'A' ? 'B' : 'A'; // Switch turn
            broadcastGameState();
        }
    } else {
        ws.send(JSON.stringify({ type: 'invalidMove', message: 'Invalid move' }));
    }
}

function handleRequestValidMoves(data, ws) {
    const { character } = data;
    const [row, col] = findCharacterPosition(character);
    const validMoves = getValidMoves(character, row, col);
    ws.send(JSON.stringify({ type: 'validMoves', moves: validMoves }));
}

function handleNewGame(ws) {
    gameState = {
        players: { A: null, B: null },
        board: Array(5).fill(null).map(() => Array(5).fill(null)),
        turn: 'A',
        moveHistory: [] // Reset move history
    };
    broadcastGameState();
}

function validateMove(character, move) {
    const [charName, moveCommand] = move.split(':');
    const charType = charName.charAt(0); // P for Pawn, H for Hero
    const [row, col] = findCharacterPosition(character);

    if (row === -1 || col === -1) {
        return false; // Character not found
    }

    switch (charType) {
        case 'P':
            return validatePawnMove(row, col, moveCommand);
        case 'H':
            return validateHeroMove(row, col, moveCommand);
        default:
            return false;
    }
}

function validatePawnMove(row, col, moveCommand) {
    const directions = {
        'L': [0, -1],
        'R': [0, 1],
        'F': [-1, 0],
        'B': [1, 0]
    };
    const [dr, dc] = directions[moveCommand] || [];
    if (dr === undefined || dc === undefined) return false;

    const newRow = row + dr;
    const newCol = col + dc;

    return isWithinBounds(newRow, newCol) && !isFriendlyOccupied(newRow, newCol);
}

function validateHeroMove(row, col, moveCommand) {
    const directions = {
        'L': [0, -2],
        'R': [0, 2],
        'F': [-2, 0],
        'B': [2, 0],
        'FL': [-2, -2],
        'FR': [-2, 2],
        'BL': [2, -2],
        'BR': [2, 2]
    };
    const [dr, dc] = directions[moveCommand] || [];
    if (dr === undefined || dc === undefined) return false;

    const newRow = row + dr;
    const newCol = col + dc;

    return isWithinBounds(newRow, newCol) && !isFriendlyOccupied(newRow, newCol);
}

function getValidMoves(character, row, col) {
    const charType = character.charAt(0);
    const moves = [];
    const directions = charType === 'P'
        ? { 'L': [0, -1], 'R': [0, 1], 'F': [-1, 0], 'B': [1, 0] }
        : { 'L': [0, -2], 'R': [0, 2], 'F': [-2, 0], 'B': [2, 0], 'FL': [-2, -2], 'FR': [-2, 2], 'BL': [2, -2], 'BR': [2, 2] };

    for (const [moveCommand, [dr, dc]] of Object.entries(directions)) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (isWithinBounds(newRow, newCol) && !isFriendlyOccupied(newRow, newCol)) {
            moves.push({ label: moveCommand, command: `${character}:${moveCommand}` });
        }
    }

    return moves;
}

function updateGameState(character, move) {
    const [charName, moveCommand] = move.split(':');
    const charType = charName.charAt(0);
    const [row, col] = findCharacterPosition(character);
    const [dr, dc] = getMoveDelta(charType, moveCommand);

    const newRow = row + dr;
    const newCol = col + dc;

    if (isWithinBounds(newRow, newCol)) {
        const targetCell = gameState.board[newRow][newCol];
        if (targetCell && !isFriendlyOccupied(newRow, newCol)) {
            // Capture opponent's character
            removeCharacter(targetCell);
        }
        // Move character
        gameState.board[newRow][newCol] = character;
        gameState.board[row][col] = null;
    }
}

function getMoveDelta(charType, moveCommand) {
    const directions = {
        'P': {
            'L': [0, -1],
            'R': [0, 1],
            'F': [-1, 0],
            'B': [1, 0]
        },
        'H': {
            'L': [0, -2],
            'R': [0, 2],
            'F': [-2, 0],
            'B': [2, 0]
        },
        'H2': {
            'FL': [-2, -2],
            'FR': [-2, 2],
            'BL': [2, -2],
            'BR': [2, 2]
        }
    };
    return directions[charType][moveCommand] || [0, 0];
}

function findCharacterPosition(character) {
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (gameState.board[r][c] === character) {
                return [r, c];
            }
        }
    }
    return [-1, -1]; // Character not found
}

function isWithinBounds(row, col) {
    return row >= 0 && row < 5 && col >= 0 && col < 5;
}

function isFriendlyOccupied(row, col) {
    const currentPlayer = gameState.turn;
    const cell = gameState.board[row][col];
    return cell && cell.startsWith(currentPlayer);
}

function removeCharacter(character) {
    const [row, col] = findCharacterPosition(character);
    if (row !== -1 && col !== -1) {
        gameState.board[row][col] = null;
    }
}

function checkGameOver() {
    const playerAHasPieces = gameState.board.flat().some(cell => cell && cell.startsWith('A'));
    const playerBHasPieces = gameState.board.flat().some(cell => cell && cell.startsWith('B'));
    return !playerAHasPieces || !playerBHasPieces;
}

function broadcastGameState(message = { type: 'gameState', gameState }) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

console.log('WebSocket server is running on ws://localhost:8080');
