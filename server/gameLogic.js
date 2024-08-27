const initializeGame = () => {
    return {
        grid: Array(25).fill(null),
        currentPlayer: 'A',
        playerAPositions: [],
        playerBPositions: [],
    };
};

const processMove = (gameState, move) => {
    const { character, direction } = move;
    const index = gameState.grid.findIndex(c => c === character);
    if (index === -1) return gameState; // Character not found

    const newIndex = calculateNewIndex(index, direction);
    if (newIndex === null) return gameState; // Invalid direction

    // Validate move and apply game rules
    if (isValidMove(gameState, index, newIndex, character)) {
        handleCombat(gameState, newIndex);
        gameState.grid[index] = null;
        gameState.grid[newIndex] = character;
        gameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';
    }

    return gameState;
};

const calculateNewIndex = (index, direction) => {
    const moves = {
        'L': index - 1,
        'R': index + 1,
        'F': index - 5,
        'B': index + 5,
        'FL': index - 6,
        'FR': index - 4,
        'BL': index + 4,
        'BR': index + 6
    };
    return moves[direction] !== undefined ? moves[direction] : null;
};

const isValidMove = (gameState, index, newIndex, character) => {
    if (newIndex < 0 || newIndex >= 25) return false; // Out of bounds
    if (gameState.grid[newIndex] && gameState.grid[newIndex].startsWith(character[0])) return false; // Targeting friendly character

    const rowDifference = Math.abs(Math.floor(newIndex / 5) - Math.floor(index / 5));
    const colDifference = Math.abs(newIndex % 5 - index % 5);

    if (character.includes('P')) { // Pawn validation
        return (rowDifference <= 1 && colDifference <= 1 && (rowDifference > 0 || colDifference > 0));
    } else if (character.includes('H1')) { // Hero1 validation
        return (rowDifference === 2 && colDifference === 0) || (rowDifference === 0 && colDifference === 2);
    } else if (character.includes('H2')) { // Hero2 validation
        return (rowDifference === 2 && colDifference === 2);
    }

    return false;
};

const handleCombat = (gameState, index) => {
    const opponent = gameState.currentPlayer === 'A' ? 'B' : 'A';
    if (gameState.grid[index] && gameState.grid[index].startsWith(opponent)) {
        gameState.grid[index] = null; // Remove opponent's character
    }
};

const checkWinCondition = (gameState) => {
    const playerAWin = gameState.grid.every(cell => cell === null || !cell.startsWith('A'));
    const playerBWin = gameState.grid.every(cell => cell === null || !cell.startsWith('B'));

    if (playerAWin) return 'Player B Wins!';
    if (playerBWin) return 'Player A Wins!';

    return null;
};

module.exports = {
    initializeGame,
    processMove,
    checkWinCondition
};