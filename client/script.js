const grid = document.getElementById('grid');
const statusDiv = document.getElementById('status');
const confirmSetupButton = document.getElementById('confirm-setup');

let selectedCharacter = null;
let playerTurn = 'A';  // Track whose turn it is to place characters
let gameStarted = false;

const playerACharacters = ['A-P1', 'A-H1', 'A-H2', 'A-P2', 'A-P3'];
const playerBCharacters = ['B-P1', 'B-H1', 'B-H2', 'B-P2', 'B-P3'];
let playerAPositions = [];
let playerBPositions = [];

// Create 5x5 grid
for (let i = 0; i < 25; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.addEventListener('click', () => onCellClick(i));
    grid.appendChild(cell);
}

function onCellClick(index) {
    console.log(`Cell clicked: ${index}`);
    if (!gameStarted) {
        if (selectedCharacter) {
            const cell = document.querySelector(`.cell[data-index='${index}']`);
            if (playerTurn === 'A' && index < 5 && !cell.textContent) {
                if (!playerAPositions.some(p => p.character === selectedCharacter)) {
                    cell.textContent = selectedCharacter;
                    playerAPositions.push({ character: selectedCharacter, position: index });
                    selectedCharacter = null;
                    updateAvailableCharacters('A');
                    if (playerAPositions.length === 5) confirmSetupButton.disabled = false;
                }
            } else if (playerTurn === 'B' && index >= 20 && !cell.textContent) {
                if (!playerBPositions.some(p => p.character === selectedCharacter)) {
                    cell.textContent = selectedCharacter;
                    playerBPositions.push({ character: selectedCharacter, position: index });
                    selectedCharacter = null;
                    updateAvailableCharacters('B');
                    if (playerBPositions.length === 5) confirmSetupButton.disabled = false;
                }
            }
        }
    } else {
        handleGameMove(index);
    }
}

function handleGameMove(index) {
    console.log(`Handling game move: ${index}`);
    const selectedCell = grid.children[index];
    if (selectedCharacter) {
        if (selectedCell.textContent && selectedCell.textContent.startsWith(playerTurn)) {
            selectedCharacter = selectedCell.textContent;
            statusDiv.textContent = `Selected: ${selectedCharacter}`;
        } else {
            const direction = determineMoveDirection(selectedCharacter, index);
            if (direction) {
                console.log(`Sending move: ${selectedCharacter} ${direction}`);
                sendMove(selectedCharacter, direction); // Use sendMove function here
                selectedCharacter = null;
            } else {
                statusDiv.textContent = 'Invalid move.';
            }
        }
    }
}

function determineMoveDirection(character, targetIndex) {
    const characterIndex = Array.from(grid.children).findIndex(cell => cell.textContent === character);
    if (characterIndex === -1) return null;

    const rowDifference = Math.floor(targetIndex / 5) - Math.floor(characterIndex / 5);
    const colDifference = (targetIndex % 5) - (characterIndex % 5);

    // Define movement directions for Pawn
    if (character.includes('P')) {
        if (rowDifference === 0 && colDifference === -1) return 'L';
        if (rowDifference === 0 && colDifference === 1) return 'R';
        if (rowDifference === -1 && colDifference === 0) return 'F';
        if (rowDifference === 1 && colDifference === 0) return 'B';
    }

    // Define movement directions for Hero1
    if (character.includes('H1')) {
        if (rowDifference === 0 && colDifference === -2) return 'L';
        if (rowDifference === 0 && colDifference === 2) return 'R';
        if (rowDifference === -2 && colDifference === 0) return 'F';
        if (rowDifference === 2 && colDifference === 0) return 'B';
    }
    
    // Define movement directions for Hero2
    if (character.includes('H2')) {
        if (rowDifference === -2 && colDifference === -2) return 'FL';
        if (rowDifference === -2 && colDifference === 2) return 'FR';
        if (rowDifference === 2 && colDifference === -2) return 'BL';
        if (rowDifference === 2 && colDifference === 2) return 'BR';
    }

    return null;
}

function setupPhase() {
    statusDiv.textContent = `Player ${playerTurn} - Arrange your characters.`;
    const characters = playerTurn === 'A' ? playerACharacters : playerBCharacters;
    characters.forEach(char => {
        const charElement = document.createElement('div');
        charElement.classList.add('character');
        charElement.textContent = char;
        charElement.addEventListener('click', () => {
            selectedCharacter = char;
            statusDiv.textContent = `Selected: ${selectedCharacter}`;
            console.log(`Character selected: ${selectedCharacter}`);
        });
        document.body.appendChild(charElement);
    });
}

function updateAvailableCharacters(player) {
    const characters = player === 'A' ? playerACharacters : playerBCharacters;
    document.querySelectorAll('.character').forEach(e => {
        e.classList.toggle('disabled', !characters.includes(selectedCharacter));
    });
}

confirmSetupButton.addEventListener('click', () => {
    if (playerTurn === 'A') {
        playerTurn = 'B';
        document.querySelectorAll('.character').forEach(e => e.remove());
        setupPhase();
    } else {
        gameStarted = true;
        statusDiv.textContent = 'Game Started! Player A\'s Turn.';
        document.querySelectorAll('.character').forEach(e => e.remove());
        confirmSetupButton.remove();
        startGame();
    }
});

function startGame() {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        console.log('WebSocket connection opened');
        ws.send(JSON.stringify({
            type: 'startGame',
            playerAPositions,
            playerBPositions
        }));
    };

    ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        console.log('Received message:', data);
        if (data.type === 'updateGameState') {
            updateGrid(data.gameState);
        } else if (data.type === 'gameOver') {
            statusDiv.textContent = data.message;
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed');
    };

    function updateGrid(gameState) {
        for (let i = 0; i < 25; i++) {
            grid.children[i].textContent = gameState.grid[i] || '';
        }
        statusDiv.textContent = `Player ${gameState.currentPlayer}'s Turn`;
    }

    window.sendMove = (character, direction) => {
        console.log(`Sending move: ${character} ${direction}`);
        ws.send(JSON.stringify({
            type: 'move',
            move: { character, direction }
        }));
    };
}

setupPhase();