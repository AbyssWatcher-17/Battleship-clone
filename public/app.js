document.addEventListener('DOMContentLoaded',() =>{
 const userGrid = document.querySelector('.grid-user')
 const computerGrid = document.querySelector('.grid-computer')
 const displayGrid = document.querySelector('.grid-display')
 const ships = document.querySelectorAll('.ship')
 const destroyer = document.querySelector('.destroyer-container')
 const submarine = document.querySelector('.submarine-container')
 const cruiser = document.querySelector('.cruiser-container')
 const battleship = document.querySelector('.battleship-container')
 const carrier = document.querySelector('.carrier-container')
const startButton = document.querySelector('#start')
const rotateButton = document.querySelector('#rotate')
const turnDisplay = document.querySelector('#whose-go')
const infoDisplay = document.querySelector('#info')

const setupButtons = document.getElementById('setup-buttons')

const userSquares = []
const computerSquares = []
let isHorizontal =  true
let isGameOver = false
let currentPlayer = 'user'

const width = 10

let playerNum = 0
let ready = false
let enemyReady = false
let allShipsPlaced = false
let shotFired = -1

//Ships

const shipArray = [
  {
      name: 'destroyer',
      directions: [
          [0,1],
          [0,width]
      ]
  },
  {
      name: 'submarine',
      directions: [
          [0,1,2],
          [0,width,width*2]
      ]
  },
  {
      name: 'cruiser',
      directions: [
          [0,1,2],
          [0,width,width*2]
      ]
  },
  {
      name: 'battleship',
      directions: [
          [0,1,2,3],
          [0,width,width*2,width*3]
      ]
  },
  {
      name: 'carrier',
      directions: [
          [0,1,2,3,4], /*Bunu yapmamızın sebebi alt alta yada yan yana arada boşluk bırakmadan girmelerini sağlamak*/
          [0,width,width*2,width*3,width*4]
      ]
  },
]

createBoard(userGrid,userSquares)/*bu oyuncunun tarafındaki kareyi 100 parçaya bölüyor */
createBoard(computerGrid,computerSquares)/*bu bilgisayar tarafındaki kareyi 100 parçaya bölüyor */


 // Select Player Mode
if(gameMode ==='singlePlayer'){
startSinglePlayer()
}else{
  startMultiPlayer()
}

// Multiplayer
function startMultiPlayer() {

    const socket = io();

 // Get your player number
 socket.on('player-number', num => {
    if (num === -1) {
      infoDisplay.innerHTML = "Sorry, the server is full"
    }else {
        playerNum = parseInt(num)
        if(playerNum === 1) currentPlayer = "enemy"
       
        console.log(playerNum)

         // Get other player status
         socket.emit('check-players')
    }
})
 // Another player has connected or disconnected
 socket.on('player-connection', num => {
    console.log(`Player number ${num} has connected or disconnected`)
    playerConnectedOrDisconnected(num)
  })

    // On enemy ready
    socket.on('enemy-ready', num => {
        enemyReady = true
        playerReady(num)
        if (ready){ 
          playGameMulti(socket)
          setupButtons.style.display = 'none'
      } 
     })

      // Check player status
    socket.on('check-players', players => {
        players.forEach((p, i) => {
          if(p.connected) playerConnectedOrDisconnected(i)
          if(p.ready) {
            playerReady(i)
            if(i !== playerNum) enemyReady = true
          }
        })
      })

      // On Timeout
    socket.on('timeout', () => {
        infoDisplay.innerHTML = 'You have reached the 10 minute limit'
      })

    // Ready button click
    startButton.addEventListener('click', () => {
        if(allShipsPlaced) playGameMulti(socket)
        else infoDisplay.innerHTML = "Please place all ships"
        })

    // Setup event listeners for firing
    computerSquares.forEach(square => {
        square.addEventListener('click', () => {
          if(currentPlayer === 'user' && ready && enemyReady) {
            shotFired = square.dataset.id
            socket.emit('fire', shotFired)
          }
        })
      })

        // On Fire Received
    socket.on('fire', id => {
        enemyGo(id)
        const square = userSquares[id]
        socket.emit('fire-reply', square.classList)
        playGameMulti(socket)
      })

      // On Fire Reply Received
    socket.on('fire-reply', classList => {
        revealSquare(classList)
        playGameMulti(socket)
      })

  function playerConnectedOrDisconnected(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .connected`).classList.toggle('active')
    if(parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold'
  }

}
// Single Player
  function startSinglePlayer() {
    generate(shipArray[0])
    generate(shipArray[1])
    generate(shipArray[2])
    generate(shipArray[3])
    generate(shipArray[4])
   
    startButton.addEventListener('click', () =>{
      setupButtons.style.display = 'none'
      playGameSingle()
    })

}


//Create Board 10*10 size

function createBoard(grid,squares){
 for(let i =0; i<width*width; i++){
     const square = document.createElement('div')
     square.dataset.id= i
     grid.appendChild(square)
     squares.push(square)
    }
} 





// Draw the computer ships Random locations

function generate(ship){
    let randomDirection = Math.floor(Math.random() * ship.directions.length)
    let current = ship.directions[randomDirection]

     if(randomDirection === 0) direction = 1
     if(randomDirection === 1) direction = 10
     
    let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length * direction)))
/* Math.floor sayesinde yuvarlama yaptırtıyo -> 32.46 = 32 
                                                 41.76 = 41
                                                -5.05 = -6*/
    const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'))
    const isAtRightEdge = current.some(index => (randomStart +index) % width === width -1)
    const isAtLeftEdge = current.some(index => (randomStart +index) % width === 0)
    
    if(!isTaken && !isAtRightEdge && !isAtLeftEdge)
        current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name))
        
    else generate(ship)
                                        
 }




 //Rotate the ships

 function rotate(){
    if(isHorizontal){
        destroyer.classList.toggle('destroyer-container-vertical')
        submarine.classList.toggle('submarine-container-vertical')
        cruiser.classList.toggle('cruiser-container-vertical')
        battleship.classList.toggle('battleship-container-vertical')
        carrier.classList.toggle('carrier-container-vertical')
        isHorizontal = false
        console.log(isHorizontal)
        return 
    }
   else if(!isHorizontal){
        destroyer.classList.toggle('destroyer-container-vertical')
        submarine.classList.toggle('submarine-container-vertical')
        cruiser.classList.toggle('cruiser-container-vertical')
        battleship.classList.toggle('battleship-container-vertical')
        carrier.classList.toggle('carrier-container-vertical')
        isHorizontal = true
        console.log(isHorizontal)
        return
    }
 }

 rotateButton.addEventListener('click',rotate)

 //move around user ship

 ships.forEach(ship => ship.addEventListener('dragstart',dragStart))
 userSquares.forEach(square => square.addEventListener('dragstart',dragStart))
 userSquares.forEach(square => square.addEventListener('dragover',dragOver))
 userSquares.forEach(square => square.addEventListener('dragenter',dragEnter))
 userSquares.forEach(square => square.addEventListener('dragleave',dragLeave))
 userSquares.forEach(square => square.addEventListener('drop',dragDrop))
 userSquares.forEach(square => square.addEventListener('dragend',dragEnd))

 let selectedShipNameWithIndex
 let draggedShip
 let draggedShipLength

 
 
 ships.forEach(ship => ship.addEventListener('mousedown',(e) =>{
 selectedShipNameWithIndex = e.target.id
 console.log("selectedShipNameWithIndex == "+selectedShipNameWithIndex)
 }))

 function dragStart(){
  draggedShip = this
    draggedShipLength = this.childNodes.length
    console.log("draggedship == ")
     console.log(draggedShip)
 }

 function dragOver(e){
     e.preventDefault()

}

function dragEnter(e){
    e.preventDefault()

}

function dragLeave(){
    console.log('drag leave')
}

function dragDrop(){
    
    let shipNameWithLastId = draggedShip.lastChild.id
    let shipClass = shipNameWithLastId.slice(0,-2)/*Burası ilk başta slice yüzüden hata veriyordu ama html de hepsini arka arkaya dizdik en uafk bir boşluk bırakmadan */
    console.log('shipclass== ')
    console.log(shipClass)
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
    let shipLastId = lastShipIndex + parseInt(this.dataset.id)
     console.log(shipLastId)
     selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))

    shipLastId = shipLastId - selectedShipIndex
    console.log('2 ==')
    console.log(shipLastId)

    const notAllowedHorizontal =[0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93]
    const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60]

    const newNotAllowedHorizontal = notAllowedHorizontal.splice(0,10 *lastShipIndex)
    const newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex)


    if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)){
        for (let i=0; i < draggedShipLength; i++) {
          let directionClass
          if(i === 0) directionClass = 'start'
          if(i === draggedShipLength -1) directionClass = 'end'
            userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken','horizontal', directionClass ,shipClass)
          }
    } else if(!isHorizontal && !newNotAllowedVertical.includes(shipLastId)){
        for (let i=0; i < draggedShipLength; i++) {
          let directionClass
          if(i === 0) directionClass = 'start'
          if(i === draggedShipLength -1) directionClass = 'end'
            userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken','vertical',directionClass , shipClass)
          }
       
    }else return

    displayGrid.removeChild(draggedShip)
    if(!displayGrid.querySelector('.ship')) allShipsPlaced = true
   
}

function dragEnd(){
console.log("drag end")
}
//Game Logic for Multiplayer
function playGameMulti(socket) {
    if(isGameOver) return
    if(!ready) {
      socket.emit('player-ready')
      ready = true
      playerReady(playerNum)
    }

    if(enemyReady) {
        if(currentPlayer === 'user') {
          turnDisplay.innerHTML = 'Your Go'
        }
        if(currentPlayer === 'enemy') {
          turnDisplay.innerHTML = "Enemy's Go"
        }
      }
}

function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .ready`).classList.toggle('active')
  }


//Game Logic For Singleplayer
function playGameSingle() {
    if (isGameOver) return
    if (currentPlayer === 'user') {
      turnDisplay.innerHTML = 'Your Go'
      computerSquares.forEach(square => square.addEventListener('click', function(e) {
        shotFired = square.dataset.id
        revealSquare(square.classList)
      }))
    }
    if (currentPlayer === 'enemy') {
      turnDisplay.innerHTML = 'Computers Go!'
      setTimeout(enemyGo, 1000)
    }
  }

let destroyerCount = 0
let submarineCount = 0
let cruiserCount = 0
let battleshipCount = 0
let carrierCount = 0

function  revealSquare(classList){
    const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
    const obj = Object.values(classList)
    if(!enemySquare.classList.contains('boom')&& currentPlayer === 'user' && !isGameOver) 
    {
    if(obj.includes('destroyer')) destroyerCount++
    if(obj.includes('submarine')) submarineCount++
    if(obj.includes('cruiser')) cruiserCount++
    if(obj.includes('battleship')) battleshipCount++
    if(obj.includes('carrier')) carrierCount++
    }
    if(obj.includes('taken')){
        enemySquare.classList.add('boom')
        console.log('click')
    }else {
        enemySquare.classList.add('miss')
    }
    checkForWins()
    currentPlayer = 'enemy'
    if(gameMode === 'singlePlayer') playGameSingle()
}

let cpudestroyerCount = 0
let cpusubmarineCount = 0
let cpucruiserCount = 0
let cpubattleshipCount = 0
let cpucarrierCount = 0

function enemyGo(square){
    if (gameMode === 'singlePlayer') square = Math.floor(Math.random() * userSquares.length)
if(!userSquares[square].classList.contains('boom')){
  const hit = userSquares[square].classList.contains('taken')
  userSquares[square].classList.add(hit ? 'boom' : 'miss')
    userSquares[square].classList.add('boom')
    if(userSquares[square].classList.contains('destroyer')) cpudestroyerCount++
    if(userSquares[square].classList.contains('submarine')) cpusubmarineCount++
    if(userSquares[square].classList.contains('cruiser')) cpucruiserCount++
    if(userSquares[square].classList.contains('battleship')) cpubattleshipCount++
    if(userSquares[square].classList.contains('carrier')) cpucarrierCount++
    checkForWins()
 }else  if (gameMode === 'singlePlayer') enemyGo()
 currentPlayer = 'user'
 turnDisplay.innerHTML = 'Your Go!'

}

function checkForWins(){
    let enemy = 'computer'
    if(gameMode === 'multiPlayer') enemy = 'enemy'
    if(destroyerCount ===2){
        infoDisplay.innerHTML = `You sunk the ${enemy}'s destroyer`
        destroyerCount = 10    
    }
    if(submarineCount ===3){
        infoDisplay.innerHTML = `You sunk the ${enemy}'s submarine`
        submarineCount = 10 
    }
    if(cruiserCount ===3){
        infoDisplay.innerHTML = `You sunk the ${enemy}'s cruiser`
        cruiserCount = 10
    }
    if(battleshipCount ===4){
        infoDisplay.innerHTML = `You sunk the ${enemy}'s battleship`
        battleshipCount = 10
    }
    if(carrierCount ===5){
        infoDisplay.innerHTML = `You sunk the ${enemy}'s carrier`
        carrierCount = 10
    }


    if(cpudestroyerCount ===2){
        infoDisplay.innerHTML = `${enemy} sunk your destroyer`
        cpudestroyerCount = 10    
    }
    if(cpusubmarineCount ===3){
        infoDisplay.innerHTML =  `${enemy} sunk your submarine`       
         cpusubmarineCount = 10 
    }
    if(cpucruiserCount ===3){
        infoDisplay.innerHTML =  `${enemy} sunk your cruiser`      
        cpucruiserCount = 10
    }
    if(cpubattleshipCount ===4){
        infoDisplay.innerHTML =  `${enemy} sunk your battleship`
        cpubattleshipCount = 10
    }
    if(cpucarrierCount  ===5){
        infoDisplay.innerHTML =  `${enemy} sunk your carrier`     
         cpucruiserCount = 10
    }


    if((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) ===50){
        infoDisplay.innerHTML = 'YOU WİN!'
        gameOver()
    }
    if((cpudestroyerCount + cpusubmarineCount + cpucruiserCount + cpubattleshipCount + cpucarrierCount) ===50){
        infoDisplay.innerHTML = `${enemy.toUpperCase()} WİNS!`
        gameOver()
    }
}
function gameOver(){
    isGameOver = true
    startButton.removeEventListener('click', playGameSingle)
}
})