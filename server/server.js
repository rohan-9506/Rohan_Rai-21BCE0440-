const WebSocket = require('ws');
const { initializeGame, processMove, checkWinCondition } = require('./gameLogic');

const wss = new WebSocket.Server({ port: 8080 });
let gameState = initializeGame();

wss.on('connection', ws => {
    ws.on('message', message => {
        const data = JSON.parse(message);
        
        if (data.type === 'startGame') {
            gameState.grid = Array(25).fill(null);
            data.playerAPositions.forEach(({ character, position }) => {
                gameState.grid[position] = character;
            });
            data.playerBPositions.forEach(({ character, position }) => {
                gameState.grid[position] = character;
            });
            broadcastGameState();
        }

        if (data.type === 'move') {
            gameState = processMove(gameState, data.move);
            const winMessage = checkWinCondition(gameState);
            if (winMessage) {
                broadcastMessage({
                    type: 'gameOver',
                    message: winMessage
                });
            } else {
                broadcastGameState();
            }
        }
    });
});

function broadcastGameState() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'updateGameState',
                gameState
            }));
        }
    });
}

function broadcastMessage(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}