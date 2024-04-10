const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  dx: 3, // Default ball speed
  dy: 3, // Default ball speed
  radius: 10
};

const playerPaddle = {
  width: 10,
  height: 100,
  x: 10,
  y: canvas.height / 2 - 50,
  speed: 15 // Increase player paddle speed
};

const opponentPaddle = {
  width: 10,
  height: 100,
  x: canvas.width - 20,
  y: canvas.height / 2 - 50,
  speed: 1 // Opponent paddle default speed (level 1)
};

let playerScore = 0;
let opponentScore = 0;
let gameInterval; // Variable to store the setInterval reference for pausing/resuming the game
let gamePaused = false; // Track the game pause state
let opponentHits = 0;
let movesCounter = 0; // Counter to track moves of the ball
const movesToStop = 5; // Number of moves after which opponentPaddle slows down
const stopDuration = 3000; // Duration in milliseconds for opponentPaddle to slow down
const maxHitsToMiss = 6; // Maximum hits to miss for opponentPaddle to slow down
let hitsSurvived = 0; // Counter to track hits survived by the player
let gameSpeed = 4; // Speed multiplier for opponent paddle movement

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.closePath();
}

function drawPaddle(paddle) {
  ctx.beginPath();
  ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.closePath();
}

function drawScore() {
  ctx.font = '30px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Player: ${playerScore}`, 50, 50);
  ctx.fillText(`Opponent: ${opponentScore}`, canvas.width - 250, 50);
}

let difficulty = 'easy'; // Default difficulty

function setDifficulty(level) {
  difficulty = level;
  if (level === 'easy') {
    ball.dx = 3;
    ball.dy = 3;
  } else if (level === 'hard') {
    ball.dx = 7; // Increase ball speed for hard level
    ball.dy = 7; // Increase ball speed for hard level
  }
}

function resetPoints() {
  playerScore = 0;
  opponentScore = 0;
}

function startGame() {
  gameInterval = setInterval(draw, 10); // Start the game interval
}

let timeLimit = 60; // Time limit in seconds
let startTime = Date.now(); // Start time
let remainingTime = timeLimit; // Remaining time

// Function to update the remaining time
function updateRemainingTime() {
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  remainingTime = Math.max(timeLimit - elapsedTime, 0);
}

// Function to draw the clock displaying remaining time
function drawClock() {
  ctx.font = '20px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Time: ${remainingTime} seconds`, canvas.width - 150, 30);
}

// Update function
function draw() {
  // Update remaining time
  updateRemainingTime();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBall();
  drawPaddle(playerPaddle);
  drawPaddle(opponentPaddle);
  drawScore();
  drawClock(); // Draw the clock

  // Update ball position
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Adjust ball speed to prevent it from moving too fast
  const maxSpeed = 5;
  ball.dx = Math.min(Math.max(ball.dx, -maxSpeed), maxSpeed);
  ball.dy = Math.min(Math.max(ball.dy, -maxSpeed), maxSpeed);

  // Check if the ball hits the top or bottom wall
  if (ball.y + ball.dy > canvas.height - ball.radius || ball.y + ball.dy < ball.radius) {
    ball.dy = -ball.dy; // Reverse the y direction
  }

  // Check if the ball hits the left or right wall
  if (ball.x + ball.dx > canvas.width - ball.radius) {
    // Player scores a point
    playerScore++;
    if (playerScore >= 3) {
      handleGameOver('win');
      return; // Exit the function to prevent further game updates
    }
    resetBall();
  } else if (ball.x + ball.dx < ball.radius) {
    // Opponent scores a point
    opponentScore++;
    if (opponentScore >= 3) {
      handleGameOver('lose');
      return; // Exit the function to prevent further game updates
    }
    resetBall();
  }

  // Check for collision with player paddle
  if (
    ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
    ball.x + ball.radius > playerPaddle.x &&
    ball.y - ball.radius < playerPaddle.y + playerPaddle.height &&
    ball.y + ball.radius > playerPaddle.y
  ) {
    // Reverse the x direction and adjust the y direction based on the position of the paddle
    const deltaY = ball.y - (playerPaddle.y + playerPaddle.height / 2);
    ball.dx = Math.abs(ball.dx); // Ensure ball moves towards opponent
    ball.dy = deltaY / (playerPaddle.height / 2);
  }

  // Check for collision with opponent paddle
  if (
    ball.x - ball.radius < opponentPaddle.x + opponentPaddle.width &&
    ball.x + ball.radius > opponentPaddle.x &&
    ball.y - ball.radius < opponentPaddle.y + opponentPaddle.height &&
    ball.y + ball.radius > opponentPaddle.y
  ) {
    // Reverse the x direction and adjust the y direction based on the position of the paddle
    const deltaY = ball.y - (opponentPaddle.y + opponentPaddle.height / 2);
    ball.dx = -Math.abs(ball.dx); // Ensure ball moves towards player
    ball.dy = deltaY / (opponentPaddle.height / 2);
  }

  // Prevent the ball from sticking inside the paddles
  if (
    ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
    ball.x + ball.radius > playerPaddle.x &&
    ball.y + ball.radius > playerPaddle.y &&
    ball.y - ball.radius < playerPaddle.y + playerPaddle.height
  ) {
    // Move the ball outside the paddle to avoid sticking
    ball.x = playerPaddle.x + playerPaddle.width + ball.radius;
  }

  if (
    ball.x - ball.radius < opponentPaddle.x + opponentPaddle.width &&
    ball.x + ball.radius > opponentPaddle.x &&
    ball.y + ball.radius > opponentPaddle.y &&
    ball.y - ball.radius < opponentPaddle.y + opponentPaddle.height
  ) {
    // Move the ball outside the paddle to avoid sticking
    ball.x = opponentPaddle.x - ball.radius;
  }

  // Move opponent paddle
  moveOpponentPaddle();
}
function handleGameOver(outcome) {
  clearInterval(gameInterval); // Stop the game interval

  // Display victory or defeat message
  const message = outcome === 'win' ? 'Congratulations! You win!' : 'Game Over! You lose!';
  ctx.font = '40px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(message, canvas.width / 2 - 200, canvas.height / 2);

  // Delay before resetting the game
  setTimeout(() => {
    // Reset scores
    playerScore = 0;
    opponentScore = 0;
    // Reset ball
    resetBall();
    // Start a new game
    gameInterval = setInterval(draw, 10);
  }, 2000); // Adjust the delay time as needed
}


function moveOpponentPaddle() {
  // Calculate the center of the opponent paddle
  const opponentPaddleCenter = opponentPaddle.y + opponentPaddle.height / 2;

  // Calculate the distance between the center of the paddle and the ball
  const deltaY = ball.y - opponentPaddleCenter;

  // Adjust the opponent paddle's position based on the distance and its speed
  opponentPaddle.y += deltaY * opponentPaddle.speed;

  // Ensure the opponent paddle stays within the canvas bounds
  opponentPaddle.y = Math.max(0, Math.min(canvas.height - opponentPaddle.height, opponentPaddle.y));
}

// Function to randomly set the ball direction within a given range
function setRandomBallDirection() {
  const min = -5; // Minimum value for ball direction
  const max = 5; // Maximum value for ball direction
  ball.dx = Math.floor(Math.random() * (max - min + 1)) + min;
  ball.dy = Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to start the game with a random ball direction




function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = -ball.dx; // Change ball direction
}

// Paddle Movement - Follow Mouse Position
canvas.addEventListener('mousemove', function(event) {
  handleMouseMovement(event);
});

function handleMouseMovement(event) {
  // Get the mouse position relative to the canvas
  const mouseY = event.clientY - canvas.getBoundingClientRect().top;

  // Set the player paddle position based on the mouse position
  playerPaddle.y = mouseY - (playerPaddle.height / 2);

  // Ensure the player paddle stays within the canvas bounds
  playerPaddle.y = Math.max(0, Math.min(canvas.height - playerPaddle.height, playerPaddle.y));

  // Calculate the desired position for the opponent paddle based on the ball's position
  const desiredY = ball.y - opponentPaddle.height / 2;

  // Calculate the difference between the desired position and the current position
  const deltaY = desiredY - opponentPaddle.y;

  // Adjust the opponent paddle's position based on the difference and its speed
  if (deltaY > 0) {
    opponentPaddle.y += Math.min(opponentPaddle.speed, deltaY);
  } else {
    opponentPaddle.y -= Math.min(opponentPaddle.speed, -deltaY);
  }

  // Adjust the player paddle's position based on the ball's position
  const playerCenterY = playerPaddle.y + playerPaddle.height / 2;
  const ballCenterY = ball.y;
  const paddleCenterDiff = ballCenterY - playerCenterY;

  // Adjust the player paddle's position to follow the ball's movement vertically
  playerPaddle.y += paddleCenterDiff * 0.05; // Adjust the 0.05 factor as needed for responsiveness
  // Ensure the player paddle stays within the canvas bounds
  playerPaddle.y = Math.max(0, Math.min(canvas.height - playerPaddle.height, playerPaddle.y));

  // Adjust opponent speed based on difficulty level
  adjustOpponentSpeed(difficulty);
}


function adjustOpponentSpeed(level) {
  if (level === 'easy') {
    opponentPaddle.speed = 1; // Set opponent paddle speed for easy level
  } else if (level === 'hard') {
    opponentPaddle.speed = 2; // Set opponent paddle speed for hard level
  } else if (level === 'expert') {
    opponentPaddle.speed = 3; // Set opponent paddle speed for expert level
  }
}

// Function to handle game difficulty level change
function changeDifficulty(level) {
  setDifficulty(level);
  resetPoints(); // Reset player and opponent scores
  resetBall(); // Reset ball position
}

// Define additional movement patterns for the ball
const movementPatterns = [
  { dx: 3, dy: 3 },    // Straight line movement
  { dx: -3, dy: 3 },   // Diagonal movement
  { dx: 0, dy: 5 },    // Vertical movement
  { dx: 5, dy: 0 },    // Horizontal movement
  { dx: 2, dy: 2 },    // Custom pattern 1
  { dx: -2, dy: -2 },  // Custom pattern 2
  { dx: 4, dy: -3 },   // Custom pattern 3
  { dx: -4, dy: 3 },   // Custom pattern 4
  // Add more patterns as needed
];

// Function to randomly select a movement pattern for the ball
function setRandomBallPattern() {
  const patternIndex = Math.floor(Math.random() * movementPatterns.length);
  const pattern = movementPatterns[patternIndex];
  ball.dx = pattern.dx;
  ball.dy = pattern.dy;
}
// Function to start the game with a random ball direction and pattern
function startGameWithRandomDirectionAndPattern() {
  setRandomBallDirection();
  setRandomBallPattern();
  startGame();
}

// Call the function to start the game with random direction and pattern
startGameWithRandomDirectionAndPattern();
