

var timeInterval;
var game;
var rows, columns, mineCount;
var isGameStarted = false;
const tilePrefix = "tile_";


var time = 0;
var last = 0;
var isCounting = false;

var prevTime = 0;

function loop(now) {
    // each seconds call the updateTimer() function
    if (!last || now - last >= 1000) {
        last = now;
        updateTimer(time++);
    }
    if (isRunning) requestAnimationFrame(loop); // I used request animation frame for same use of setInterval
}

function startTimer() {
    if (!isCounting) {
        isRunning = true;
        loop();             /// starts loop
    }
}

function clearTimer() {
    isRunning = false;
    time = 0;
    updateTimer(time);
}


function updateTimer(timeValue) {
    document.getElementById("timer").innerHTML = timeValue;
}

function buildGrid() {

    // Fetch grid and clear out old elements.
    var grid = document.getElementById("minefield");
    grid.innerHTML = "";


    // Build DOM Grid
    var tile;
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < columns; j++) {

            tile = createTile(i, j);

            grid.appendChild(tile);
        }
    }

    var style = window.getComputedStyle(tile);

    var width = parseInt(style.width.slice(0, -2));
    var height = parseInt(style.height.slice(0, -2));

    grid.style.width = (columns * width) + "px";
    grid.style.height = (rows * height) + "px";
}

function getTileElementId(row, column) {
    return `${tilePrefix}${row}-${column}`
}

function createTile(row, column) {
    var tile = document.createElement("div");

    tile.classList.add("tile");
    tile.classList.add("hidden");

    //storing tileType in tile element
    tile.dataset.row = row;
    tile.dataset.column = column;

    var id = getTileElementId(row, column)
    tile.setAttribute("id", id);


    tile.addEventListener("auxclick", function (e) { e.preventDefault(); }); // Middle Click
    tile.addEventListener("contextmenu", function (e) { e.preventDefault(); }); // Right Click
    tile.addEventListener("mouseup", handleTileClick); // All Clicks

    return tile;
}



function countMines(gamePlan, i, j) {
    var mineCount = 0;

    const prevRow = gamePlan[i - 1];
    const currentRow = gamePlan[i]
    const nextRow = gamePlan[i + 1];

    [prevRow, currentRow, nextRow].forEach(row => {
        if (row) {
            if (row[j - 1] === '*')
                mineCount++;
            if (row[j] == '*')
                mineCount++;
            if (row[j + 1] == '*')
                mineCount++;
        }
    })

    return mineCount;
}

// returns multi array like below 
// [
//      ["tile_1", "tile_2", 'mine'],
//      ["mine", "tile_3", "tile_2"],
//      ["tile_2", "mine", "tile_1"]
// ]
function createGame(gamePlan) {

    return gamePlan.map((row, i) => {
        return row.map((column, j) => {
            var tileType;
            if (column === '*') {
                tileType = "mine";
            } else {
                var mineCount = countMines(gamePlan, i, j);
                if (mineCount === 0) {
                    tileType = "clear";
                } else {
                    tileType = tilePrefix + mineCount;
                }
            }

            // set tileType in tile element data 
            var elementId = getTileElementId(i, j);
            var tile = document.getElementById(elementId);
            tile.dataset.tileType = tileType;

            return tileType;
        })
    })
}




// returns multi array like below 
// [
//     [0, 0, '*'],
//     ['*', 0, 0],
//     [0, '*', 0]
// ]
// row and column values for start with clear
function createRandomGamePlan(row, column) {

    // array filled all 0 in initialization
    var gamePlan = createAndFillTwoDArray(rows, columns, 0);


    //iterating mineCount and placing mines randomly
    for (var i = 0; i < mineCount; i++) {
        var randomRow, randomColumn;

        // I used do while because it can set first mine wherever came from random index
        // Also it will place a mine eventually
        do {
            randomRow = getRandomInt(rows);
            randomColumn = getRandomInt(columns);

            // prepare game that not contain mines adjacent to these row and column values
            if (Math.abs(randomRow - row) > 1 || Math.abs(randomColumn - column) > 1) {
                gamePlan[randomRow][randomColumn] = '*';
            }

        }
        while (gamePlan[randomRow][randomColumn] !== '*')

    }

    return gamePlan;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function createAndFillTwoDArray(rows, columns, defaultValue) {
    return Array.from({ length: rows }, () => (
        Array.from({ length: columns }, () => defaultValue)
    ))
}


function prepareGame() {
    setDifficulty();

    buildGrid();

    //set total mine count at initialization to remaining mines
    updateRemainingMines(mineCount);

}

function startGame(row, column) {
    var gamePlan = createRandomGamePlan(row, column);

    game = createGame(gamePlan);

    startTimer();

    isGameStarted = true;

}

function handleTileClick(event) {
    var tile = event.target;

    var row = parseInt(tile.dataset.row);
    var column = parseInt(tile.dataset.column);
    var tileType = tile.dataset.tileType || "clear"; // it is always start with clear state

    // if user clicked two times in 2 second, face turn limbo, if more return face up
    if (prevTime !== 0 && time - prevTime < 2) {
        smileyLimbo();
    } else {
        smileyUp();
    }

    // Left Click
    if (event.which === 1) {

        if (!tile.classList.contains("flag")) {
            if (!isGameStarted) {
                startGame(row, column);
            }
            onTileReveal(row, column, tileType, false);
        }
    }
    // Middle Click
    else if (event.which === 2) {
        // "mine" is not here because if player reveal one mine, game over and tile events will be removed
        var invalidTypes = ["flag", "hidden", "clear"];

        if (!invalidTypes.some(tileType => tile.classList.contains(tileType))) {
            onMiddleClick(row, column, tileType);
        }

    }
    // Right Click
    else if (event.which === 3) {
        if (tile.classList.contains("flag")) {
            tile.classList.remove("flag");
            tile.classList.add("hidden");
            increaseRemainingMines();
        } else if (tile.classList.contains("hidden")) {

            const remainingMines = parseInt(document.getElementById("remainingMines").innerHTML);

            //this control is not included in requirements but I added to limit flag count with mine count
            if (remainingMines !== 0) {
                tile.classList.remove("hidden");
                tile.classList.add("flag");
                decreaseRemainingMines();
            }

        }
        checkGameFinished();
    }

    prevTime = time;
}

function onMiddleClick(row, column, tileType) {
    var id = getTileElementId(row, column);
    var tile = document.getElementById(id);

    var initialRowIndex = Math.max(row - 1, 0);
    var initialColumnIndex = Math.max(column - 1, 0);

    var lastRowIndex = Math.min(row + 1, rows - 1);
    var lastRowColumn = Math.min(column + 1, columns - 1);

    var flagCount = 0;

    for (var i = initialRowIndex; i <= lastRowIndex; i++) {
        for (var j = initialColumnIndex; j <= lastRowColumn; j++) {
            var id = getTileElementId(i, j);
            var tile = document.getElementById(id);
            if (tile.classList.contains("flag")) {
                flagCount++;
            }
        }
    }

    //dont need null check, because tileType checked with invalid types before onMiddleClick call
    var mineCount = parseInt(tileType.split("_")[1]);
    if (mineCount === flagCount) {
        onTileReveal(row, column, tileType, true);
    }
}


function onTileReveal(row, column, tileType, isMiddleClick) {
    //Check if the end-user clicked on a mine
    if (tileType === "mine") {

        //Game Over
        gameOver(row, column);

    } else {
        var id = getTileElementId(row, column);
        var tile = document.getElementById(id);

        tile.classList.remove("hidden");
        tile.classList.add(tileType);

        //Reveal all adjacent cells that has not mine
        if (tileType === "clear" || isMiddleClick) {
            var initialRowIndex = Math.max(row - 1, 0);
            var initialColumnIndex = Math.max(column - 1, 0);

            var lastRowIndex = Math.min(row + 1, rows - 1);
            var lastRowColumn = Math.min(column + 1, columns - 1);

            for (var i = initialRowIndex; i <= lastRowIndex; i++) {
                for (var j = initialColumnIndex; j <= lastRowColumn; j++) {
                    var currentId = getTileElementId(i, j);
                    var currentTile = document.getElementById(currentId);

                    if (game[i][j] === "clear") {
                        if (!currentTile.classList.contains("clear")) {

                            //Recursive
                            onTileReveal(i, j, game[i][j], false);
                        }
                    } else if (game[i][j].startsWith(tilePrefix)) {
                        currentTile.classList.remove("hidden");
                        currentTile.classList.add(game[i][j]);

                        //Recursive

                        onTileReveal(i, j, game[i][j], false);

                    }

                }
            }
        }


        checkGameFinished();
    }
}

function checkGameFinished() {
    var isHiddenFound = false;

    for (var i = 0; i < rows && !isHiddenFound; i++) {
        for (var j = 0; j < columns && !isHiddenFound; j++) {
            var id = getTileElementId(i, j);
            var tile = document.getElementById(id);
            if (tile.classList.contains("hidden")) {
                isHiddenFound = true;
            }
        }
    }

    // false means, there is no hidden tile exist and game is finished. 
    if (!isHiddenFound) {
        gameWin();
    }

    return isHiddenFound ? false : true;
}

// Reveal all mines and set clicked mine -> mine_hit
// row and column values are optional, if game finished it reveals all flagged mines -> mine_marked
function revealMines(row, column) {
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < columns; j++) {
            var id = getTileElementId(i, j);
            var tile = document.getElementById(id);
            var tileType = tile.dataset.tileType;

            if (row && column &&
                i === row && j === column) {
                if (tile.classList.contains("hidden")) {
                    tile.classList.remove("hidden");
                    tile.classList.add("mine_hit");
                }
            } else {
                if (tileType === "mine") {
                    if (tile.classList.contains("hidden")) {
                        tile.classList.remove("hidden");
                        tile.classList.add("mine");
                    }
                    else if (tile.classList.contains("flag")) {
                        tile.classList.remove("flag");
                        tile.classList.add("mine_marked");
                    }
                }
            }
        }
    }

}

function updateRemainingMines(remainingMines) {
    document.getElementById("remainingMines").innerHTML = remainingMines;
}

function decreaseRemainingMines() {
    var prevValue = document.getElementById("remainingMines").innerHTML;

    document.getElementById("remainingMines").innerHTML = parseInt(prevValue) - 1;
}

function increaseRemainingMines() {
    var prevValue = document.getElementById("remainingMines").innerHTML;

    document.getElementById("remainingMines").innerHTML = parseInt(prevValue) + 1;
}

function setDifficulty() {

    // I transfer it because player can start game on page load with default mode: easy

    // Fetch grid and clear out old elements.
    var grid = document.getElementById("minefield");
    grid.innerHTML = "";
    updateRemainingMines("");
    clearTimer();
    document.getElementById("score").innerHTML = "";
    isGameStarted = false;

    var difficultySelector = document.getElementById("difficulty");
    var difficulty = difficultySelector.selectedIndex;

    switch (difficulty) {
        case 0: // mode: easy
            rows = 9;
            columns = 9;
            mineCount = 10;
            break;
        case 1: // mode: medium
            rows = 16;
            columns = 16;
            mineCount = 40;
            break;
        case 2: // hard mode: hard
            rows = 30;
            columns = 30;
            mineCount = 99;
            break;
        default: // default mode: easy
            rows = 9;
            columns = 9;
            mineCount = 10;
            break;
    }
}

function gameOver(row, column) {

    console.info("game over")

    revealMines(row, column);
    smileyLose();

    // remove all event listeners from tiles by replacing clone node method
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < columns; j++) {
            var id = getTileElementId(i, j);
            var tile = document.getElementById(id);
            var cloneTile = tile.cloneNode(true);
            tile.parentNode.replaceChild(cloneTile, tile);
        }
    }
    isGameStarted = false;
    showScore(false);
    clearTimer();

}

function gameWin() {

    console.info("game win")

    revealMines();
    smileyWin();

    // remove all event listeners from tiles by replacing clone node method
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < columns; j++) {
            var id = getTileElementId(i, j);
            var tile = document.getElementById(id);
            var cloneTile = tile.cloneNode(true);
            tile.parentNode.replaceChild(cloneTile, tile);
        }
    }

    showScore(true);
    clearTimer();
}

function showScore(isWin) {
    let message = isWin ? "You Win!" : "You Lose!";

    document.getElementById("score").innerHTML = `${message} Score: ${time - 1}`;

}

function smileyDown() {
    var smiley = document.getElementById("smiley");
    smiley.className = "smiley"; // that set remove all others and just put smiley (default value)
    smiley.classList.add("face_down");
}

function smileyUp() {
    var smiley = document.getElementById("smiley");
    smiley.className = "smiley"; // default class has face_up so we dont need to add that
}

function smileyWin() {
    var smiley = document.getElementById("smiley");
    smiley.className = "smiley";
    smiley.classList.add("face_win");
}

function smileyLose() {
    var smiley = document.getElementById("smiley");
    smiley.className = "smiley";
    smiley.classList.add("face_lose");
}

function smileyLimbo() {
    var smiley = document.getElementById("smiley");
    smiley.className = "smiley";
    smiley.classList.add("face_limbo");
}
