// Game state stores the values that change while playing.
let score = 0;
let cleanWater = 0;
let animalsRescued = 0;
let timeLeft = 45;
let gameRunning = false;
let timerInterval = null;

const rescueGoal = 3;
const startingTime = 45;
const waterNeededForRescue = 2;
const rescuePoints = 3;
const contaminationPenalty = 1;
const animals = ["🐕", "🐈", "🐇"];
const animalNames = ['dog', 'cat', 'rabbit'];

// These elements show the game state on the page.
const scoreDisplay = document.getElementById('score');
const waterDisplay = document.getElementById('water-count');
const animalsDisplay = document.getElementById('animals-rescued');
const timerDisplay = document.getElementById('timer');
const progressBar = document.querySelector('.progress-track');
const progressFill = document.getElementById('safe-haven-progress');
const progressText = document.getElementById('progress-text');
const gameMessage = document.getElementById('game-message');
const gameArea = document.getElementById('game-area');
const cleanWaterObject = document.getElementById('clean-water-object');
const animalObject = document.getElementById('animal-object');
const contaminatedWaterObject = document.getElementById('contaminated-water-object');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');

// Update the numbers and Safe Haven progress shown on the page.
function updateDisplay() {
	const progressPercent = Math.round((animalsRescued / rescueGoal) * 100);

	scoreDisplay.textContent = score;
	waterDisplay.textContent = cleanWater;
	animalsDisplay.textContent = animalsRescued;
	timerDisplay.textContent = timeLeft;
	progressFill.style.width = `${progressPercent}%`;
	progressText.textContent = `${progressPercent}%`;
	progressBar.setAttribute('aria-valuenow', progressPercent);
}

// Pick a random position while keeping the whole can inside the game area.
function moveCleanWater() {
	const edgePadding = 20;
	const topPadding = 50;
	const availableWidth = gameArea.clientWidth - cleanWaterObject.offsetWidth - edgePadding * 2;
	const availableHeight = gameArea.clientHeight - cleanWaterObject.offsetHeight - topPadding - edgePadding;
	const randomLeft = edgePadding + Math.random() * availableWidth;
	const randomTop = topPadding + Math.random() * availableHeight;

	cleanWaterObject.style.left = `${randomLeft}px`;
	cleanWaterObject.style.top = `${randomTop}px`;
}

// Move the animal to a random spot with room around the game-area edges.
function moveAnimal() {
	const edgePadding = 20;
	const topPadding = 50;
	const availableWidth = gameArea.clientWidth - animalObject.offsetWidth - edgePadding * 2;
	const availableHeight = gameArea.clientHeight - animalObject.offsetHeight - topPadding - edgePadding;
	const randomLeft = edgePadding + Math.random() * availableWidth;
	const randomTop = topPadding + Math.random() * availableHeight;

	animalObject.style.left = `${randomLeft}px`;
	animalObject.style.top = `${randomTop}px`;
}

// Move the contaminated-water obstacle to a random spot inside the game area.
function moveContaminatedWater() {
	const edgePadding = 20;
	const topPadding = 50;
	const availableWidth = gameArea.clientWidth - contaminatedWaterObject.offsetWidth - edgePadding * 2;
	const availableHeight = gameArea.clientHeight - contaminatedWaterObject.offsetHeight - topPadding - edgePadding;
	const randomLeft = edgePadding + Math.random() * availableWidth;
	const randomTop = topPadding + Math.random() * availableHeight;

	contaminatedWaterObject.style.left = `${randomLeft}px`;
	contaminatedWaterObject.style.top = `${randomTop}px`;
}

// Collect clean water only while a game is running.
function collectCleanWater() {
	if (gameRunning === false) {
		gameMessage.textContent = 'Press Start before collecting water.';
		return;
	}

	score = score + 1;
	cleanWater = cleanWater + 1;
	updateDisplay();
	gameMessage.textContent = '+1 clean water! Keep searching.';
	moveCleanWater();
}

// Avoid contaminated water; a hit costs one point but never goes below zero.
function hitContaminatedWater() {
	if (gameRunning === false) {
		gameMessage.textContent = 'Press Start before entering the flooded area.';
		return;
	}

	if (score > 0) {
		score = score - contaminationPenalty;
	}

	updateDisplay();
	gameMessage.textContent = 'Contaminated water! -1 point. Look for the yellow clean-water can.';
	moveContaminatedWater();
}

// Celebrate without preventing the game from working if the library is unavailable.
function celebrateWin() {
	if (typeof confetti === 'function') {
		confetti({
			particleCount: 90,
			spread: 70,
			origin: { y: 0.65 },
			colors: ['#FFC907', '#2E9DF7', '#8BD1CB']
		});
	}
}

// Stop the timer and show the completed Safe Haven state.
function winGame() {
	clearInterval(timerInterval);
	timerInterval = null;
	gameRunning = false;
	animalsRescued = rescueGoal;
	updateDisplay();
	startButton.disabled = true;
	cleanWaterObject.style.visibility = 'hidden';
	contaminatedWaterObject.style.visibility = 'hidden';
	animalObject.style.visibility = 'hidden';
	gameMessage.textContent = 'SAFE HAVEN RESTORED! You rescued all 3 animals. Every drop made an impact!';
	celebrateWin();
}

// Rescue the current animal if the game is running and water is available.
function rescueAnimal() {
	if (gameRunning === false) {
		gameMessage.textContent = 'Press Start before attempting a rescue.';
		return;
	}

	if (animalsRescued >= rescueGoal) {
		return;
	}

	if (cleanWater < waterNeededForRescue) {
		gameMessage.textContent = 'You need 2 clean water to rescue this animal. Keep searching!';
		return;
	}

	cleanWater = cleanWater - waterNeededForRescue;
	score = score + rescuePoints;
	animalsRescued = animalsRescued + 1;
	updateDisplay();

	if (animalsRescued === rescueGoal) {
		winGame();
	} else {
		animalObject.textContent = animals[animalsRescued];
		animalObject.setAttribute('aria-label', `Rescue the stranded ${animalNames[animalsRescued]}`);
		gameMessage.textContent = 'Animal rescued! You used 2 clean water. +3 points. Another animal needs your help!';
		moveAnimal();
	}
}

// Start a new game and count down one second at a time.
function startGame() {
	if (gameRunning) {
		return;
	}

	gameRunning = true;
	score = 0;
	cleanWater = 0;
	animalsRescued = 0;
	timeLeft = startingTime;
	updateDisplay();
	cleanWaterObject.style.visibility = 'visible';
	moveCleanWater();
	animalObject.style.visibility = 'visible';
	animalObject.textContent = animals[0];
	animalObject.setAttribute('aria-label', `Rescue the stranded ${animalNames[0]}`);
	moveAnimal();
	contaminatedWaterObject.style.visibility = 'visible';
	moveContaminatedWater();

	gameMessage.textContent = 'Find clean water and help 3 stranded animals!';
	startButton.disabled = true;

	timerInterval = setInterval(function () {
		timeLeft = timeLeft - 1;
		updateDisplay();

		if (timeLeft === 0) {
			clearInterval(timerInterval);
			timerInterval = null;
			gameRunning = false;
			startButton.disabled = false;
			cleanWaterObject.style.visibility = 'hidden';
			contaminatedWaterObject.style.visibility = 'hidden';
			animalObject.style.visibility = 'hidden';
			gameMessage.textContent = `Time's up! You rescued ${animalsRescued} of ${rescueGoal} animals. Every drop counts — try again and restore the Safe Haven!`;
		}
	}, 1000);
}

// Stop the timer and return the game to its starting values.
function resetGame() {
	clearInterval(timerInterval);
	timerInterval = null;
	gameRunning = false;
	score = 0;
	cleanWater = 0;
	animalsRescued = 0;
	timeLeft = startingTime;
	updateDisplay();
	cleanWaterObject.style.left = '20%';
	cleanWaterObject.style.top = '35%';
	animalObject.style.visibility = 'visible';
	animalObject.textContent = animals[0];
	animalObject.setAttribute('aria-label', `Rescue the stranded ${animalNames[0]}`);
	animalObject.style.left = '20%';
	animalObject.style.top = '35%';
	contaminatedWaterObject.style.left = '70%';
	contaminatedWaterObject.style.top = '35%';
	cleanWaterObject.style.visibility = 'visible';
	contaminatedWaterObject.style.visibility = 'visible';
	if (typeof confetti === 'function') {
		confetti.reset();
	}

	startButton.disabled = false;
	gameMessage.textContent = 'Press Start when you\'re ready. Every drop matters.';
}

// Connect the buttons to their game actions.
startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
cleanWaterObject.addEventListener('click', collectCleanWater);
cleanWaterObject.addEventListener('keydown', function (event) {
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		collectCleanWater();
	}
});
animalObject.addEventListener('click', rescueAnimal);
animalObject.addEventListener('keydown', function (event) {
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		rescueAnimal();
	}
});
contaminatedWaterObject.addEventListener('click', hitContaminatedWater);

// Show the starting values as soon as the page loads.
cleanWaterObject.style.left = '20%';
cleanWaterObject.style.top = '35%';
animalObject.style.left = '20%';
animalObject.style.top = '35%';
contaminatedWaterObject.style.left = '70%';
contaminatedWaterObject.style.top = '35%';
updateDisplay();
