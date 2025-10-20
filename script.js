document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const wordInput = document.getElementById('word-input');
    const gridSizeInput = document.getElementById('grid-size');
    const generateBtn = document.getElementById('generate-btn');
    const solutionBtn = document.getElementById('solution-btn');
    const saveBtn = document.getElementById('save-btn');
    const puzzleControls = document.getElementById('puzzle-controls');
    const gridContainer = document.getElementById('word-search-grid');
    const wordListContainer = document.getElementById('word-list');
    const placementInfo = document.getElementById('placement-info');

    // --- State ---
    let currentPuzzle = {};
    let isSolutionVisible = false;

    // --- Core Logic: Word Search Generation ---
    const DIRECTIONS = {
        E: [0, 1], W: [0, -1], S: [1, 0], N: [-1, 0],
        SE: [1, 1], NW: [-1, -1], SW: [1, -1], NE: [-1, 1]
    };

    function generateWordSearch(words, gridSize) {
        let solutionGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
        let placedWords = [];
        const wordsToPlace = [...words].sort((a, b) => b.length - a.length);

        for (const word of wordsToPlace) {
            let placed = false;
            for (let attempts = 0; attempts < 150 && !placed; attempts++) {
                const directionKeys = Object.keys(DIRECTIONS);
                const direction = DIRECTIONS[directionKeys[Math.floor(Math.random() * directionKeys.length)]];
                const startRow = Math.floor(Math.random() * gridSize);
                const startCol = Math.floor(Math.random() * gridSize);

                const endRow = startRow + (word.length - 1) * direction[0];
                const endCol = startCol + (word.length - 1) * direction[1];

                if (endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) continue;

                let canPlace = true;
                for (let i = 0; i < word.length; i++) {
                    const r = startRow + i * direction[0];
                    const c = startCol + i * direction[1];
                    if (solutionGrid[r][c] !== '' && solutionGrid[r][c] !== word[i]) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    for (let i = 0; i < word.length; i++) {
                        const r = startRow + i * direction[0];
                        const c = startCol + i * direction[1];
                        solutionGrid[r][c] = word[i];
                    }
                    placed = true;
                    placedWords.push(word);
                }
            }
        }

        const puzzleGrid = JSON.parse(JSON.stringify(solutionGrid)); // Deep copy
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (puzzleGrid[r][c] === '') {
                    puzzleGrid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
                }
            }
        }
        return { placedWords: placedWords.sort(), puzzleGrid, solutionGrid };
    }

    // --- Rendering Functions ---
    function renderGrid() {
        gridContainer.innerHTML = '';
        const gridSize = currentPuzzle.puzzleGrid.length;
        gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.textContent = currentPuzzle.puzzleGrid[r][c];
                cell.dataset.row = r;
                cell.dataset.col = c;
                gridContainer.appendChild(cell);
            }
        }
    }

    function renderWordList() {
        wordListContainer.innerHTML = '';
        currentPuzzle.placedWords.forEach(word => {
            const p = document.createElement('p');
            p.textContent = word;
            wordListContainer.appendChild(p);
        });
    }
    
    // --- Event Handlers ---
    generateBtn.addEventListener('click', () => {
        const words = wordInput.value.split('\n').map(w => w.trim().toUpperCase()).filter(w => w);
        const gridSize = parseInt(gridSizeInput.value, 10);
        
        if (words.length === 0) {
            alert("Please enter at least one word.");
            return;
        }

        currentPuzzle = generateWordSearch(words, gridSize);
        renderGrid();
        renderWordList();
        
        const unplacedWords = words.filter(w => !currentPuzzle.placedWords.includes(w));
        if (unplacedWords.length > 0) {
            placementInfo.textContent = `Note: Could not place the following words: ${unplacedWords.join(', ')}`;
        } else {
            placementInfo.textContent = 'All words placed successfully!';
        }

        isSolutionVisible = false;
        solutionBtn.textContent = 'Show Solution';
        solutionBtn.classList.remove('active');
        puzzleControls.classList.remove('hidden');
    });

    solutionBtn.addEventListener('click', () => {
        isSolutionVisible = !isSolutionVisible;
        solutionBtn.textContent = isSolutionVisible ? 'Hide Solution' : 'Show Solution';
        solutionBtn.classList.toggle('active', isSolutionVisible);

        for (const cell of gridContainer.children) {
            const r = parseInt(cell.dataset.row, 10);
            const c = parseInt(cell.dataset.col, 10);
            if (isSolutionVisible && currentPuzzle.solutionGrid[r][c] !== '') {
                cell.classList.add('solution');
            } else {
                cell.classList.remove('solution');
            }
        }
    });

    saveBtn.addEventListener('click', async () => {
        const canvas = document.createElement('canvas');
        const PADDING = 50;
        const GRID_AREA_SIZE = 800;
        const FONT_SIZE_GRID = Math.floor(GRID_AREA_SIZE / currentPuzzle.puzzleGrid.length * 0.7);

        // Calculate needed height for word list
        const numWords = currentPuzzle.placedWords.length;
        const listCols = 3;
        const listRows = Math.ceil(numWords / listCols);
        const LIST_AREA_HEIGHT = listRows * 35 + 100;

        canvas.width = GRID_AREA_SIZE + 2 * PADDING;
        canvas.height = PADDING + 60 + GRID_AREA_SIZE + LIST_AREA_HEIGHT;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = 'black';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Word Search Puzzle', canvas.width / 2, PADDING + 10);

        // Grid
        const cellSize = GRID_AREA_SIZE / currentPuzzle.puzzleGrid.length;
        ctx.font = `bold ${FONT_SIZE_GRID}px 'Courier New', monospace`;
        for (let r = 0; r < currentPuzzle.puzzleGrid.length; r++) {
            for (let c = 0; c < currentPuzzle.puzzleGrid.length; c++) {
                const char = currentPuzzle.puzzleGrid[r][c];
                const x = PADDING + c * cellSize + cellSize / 2;
                const y = PADDING + 80 + r * cellSize + cellSize / 2;
                
                if (isSolutionVisible && currentPuzzle.solutionGrid[r][c] !== '') {
                    ctx.fillStyle = '#fff176'; // Highlight background
                    ctx.beginPath();
                    ctx.arc(x, y - (FONT_SIZE_GRID/4), FONT_SIZE_GRID * 0.7, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.fillStyle = '#d32f2f'; // Solution text color
                } else {
                    ctx.fillStyle = 'black';
                }
                ctx.fillText(char, x, y);
            }
        }

        // Word List
        ctx.textAlign = 'left';
        ctx.fillStyle = 'black';
        ctx.font = 'bold 28px Arial';
        const listStartY = PADDING + 80 + GRID_AREA_SIZE + 50;
        ctx.fillText('Words to Find:', PADDING, listStartY);
        
        ctx.font = '22px Arial';
        const colWidth = (canvas.width - 2 * PADDING) / listCols;
        currentPuzzle.placedWords.forEach((word, i) => {
            const col = i % listCols;
            const row = Math.floor(i / listCols);
            ctx.fillText(word, PADDING + col * colWidth, listStartY + 40 + row * 35);
        });

        // Download
        const link = document.createElement('a');
        link.download = `word-search-${isSolutionVisible ? 'solution' : 'puzzle'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});
