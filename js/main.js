import { Grid } from "./grid.js";
import { Tile } from "./tile.js";

const gameBoard = document.getElementById('game-board');
const grid = new Grid(gameBoard);
const modalText = document.getElementById('modal-text__container')
let winningFlag = false
let blockMovement = false;

grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
setupInputOnce()

function setupInputOnce() {
    window.addEventListener("keydown", handleInput, {once: true});
};

async function handleInput(event) {
    if (blockMovement) {
        setupInputOnce();
        return;
    }

    switch (event.key) {
        case "ArrowUp":
            if(!canMoveUp()){
                setupInputOnce();
                return;
            }
            await moveUp();
            break;

        case "ArrowDown":
            if(!canMoveDown()){
                setupInputOnce();
                return;
            }
            await moveDown();
            break;

        case "ArrowLeft":
            if(!canMoveLeft()){
                setupInputOnce();
                return;
            }
            await moveLeft();
            break;

        case "ArrowRight":
            if(!canMoveRight()){
                setupInputOnce();
                return;
            }
            await moveRight();
            break;   

        default:
            setupInputOnce();
            return;
    }

    const newTile = new Tile(gameBoard);
    grid.getRandomEmptyCell().linkTile(newTile)
    // проверка на проигрыш
    if(!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()){
        await newTile.waitForAnimationEnd();
        blockMovement = true
        modalManagement(winningFlag)
    }
    // проверка на выигрыш 
    for (const cell of grid.cells) {
        if (cell.linkedTile && cell.linkedTile.value === 2048) {
            winningFlag = true
            blockMovement = true
            modalManagement(winningFlag);
        }
    }
  
    setupInputOnce();
};

async function moveUp(){
    await slideTiles(grid.cellsGroupedByColumn);
}

async function moveDown(){
    await slideTiles(grid.cellsGroupedByReversedColumn);
}

async function moveLeft(){
    await slideTiles(grid.cellsGroupedByRow);
}

async function moveRight(){
    await slideTiles(grid.cellsGroupedByReversedRow);
}

async function slideTiles(groupedCell){
    const promises = [];
    groupedCell.forEach(group => slideTilesInGroup(group, promises));

    await Promise.all(promises);

    grid.cells.forEach(cell => {
        cell.hasTileForMerge() && cell.mergeTiles()
    });

}

function slideTilesInGroup(group, promises) {
    for (let i = 1; i < group.length ; i++) {
        if (group[i].isEmpty()) {
            continue;
        }

        const cellWithTile = group[i];   
        
        let targetCell;
        let j = i - 1;
        while (j>= 0 && group[j].canAccept(cellWithTile.linkedTile)){
            targetCell = group[j]
            j--;
        }
        
        if (!targetCell) {
            continue;
        }

        promises.push(cellWithTile.linkedTile.waitForTransitionEnd());

        if(targetCell.isEmpty()){
            targetCell.linkTile(cellWithTile.linkedTile);
        }else{
            targetCell.linkTileForMerge(cellWithTile.linkedTile)
        }
        
        cellWithTile.unlinkTile();

    }
}

function canMoveUp(){
    return canMove(grid.cellsGroupedByColumn);
}

function canMoveDown(){
    return canMove(grid.cellsGroupedByReversedColumn);
}

function canMoveLeft(){
    return canMove(grid.cellsGroupedByRow);
}

function canMoveRight(){
    return canMove(grid.cellsGroupedByReversedRow);
}

function canMove(groupedCell){
    return groupedCell.some(group => canMoveInGroup(group));
}

function canMoveInGroup(group){
   return group.some((cell, index) => {
        if(index === 0){
            return false;
        }

        if(cell.isEmpty()){
            return false;
        }

        const targetCell = group[index - 1]
        return targetCell.canAccept(cell.linkedTile)
   }) 
}

// модальное окно



function modalManagement(flag) {
    const modal = document.querySelector('#main-modal');
    
    modal.classList.add('open-modal');
  
    document.querySelector('#modal-close').addEventListener('click', function() {
      modal.classList.remove('open-modal');
    });
  
    // закрытие модального окна клавишей Esc
    window.addEventListener('keydown', (e) =>{
        if(e.key === 'Escape'){
            modal.classList.remove('open-modal')
        }
    })
  
    // закрытие модального окна при клике вне его
    modal.addEventListener('click', (event) => {
      if (event.target.id === 'modal-close') return;
      modal.classList.remove('open-modal');
    });
    // проверка флага
    if(!flag){
        modalText.innerHTML = "You lose, try again"
    }else{
        modalText.innerHTML = "Congratulation!!!"
    }
    
}
