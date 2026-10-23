// Game state stores the values that change while playing.
let score = 0;
let cleanWater = 0;
let animalsRescued = 0;
let timeLeft = 45;
let gameRunning = false;
let timerInterval = null;
let cleanWaterTimeout = null;
let contaminatedWaterTimeout = null;
let animalTimeout = null;
let selectedDifficulty = "normal";
let startingTime = 45;
let waterNeededForRescue = 2;
let contaminationPenalty = 1;
let soundEnabled = true;

const waterSound = new Audio('sounds/water.mp3');
const contaminationSound = new Audio('sounds/contamination.mp3');
const rescueSound = new Audio('sounds/rescue.mp3');
const winSound = new Audio('sounds/win.mp3');

const rescueGoal = 3;
const rescuePoints = 3;
const animals = ["🐕", "🐈", "🐇"];
const animalNames = ['dog', 'cat', 'rabbit'];
const milestones = [
	{
		score: 3,
		message: "First steps! Every drop makes a difference."
	},
	{
		score: 6,
		message: "Making an impact! Keep going."
	},
	{
		score: 10,
		message: "Water hero! The Safe Haven is within reach."
	}
];
let reachedMilestones = [];

// These elements show the game state on the page.
const scoreDisplay = document.getElementById('score');
const waterDisplay = document.getElementById('water-count');
const animalsDisplay = document.getElementById('animals-rescued');
const timerDisplay = document.getElementById('timer');
const progressBar = document.querySelector('.progress-track');
const progressFill = document.getElementById('safe-haven-progress');
const progressText = document.getElementById('progress-text');
const gameMessage = document.getElementById('game-message');
const milestoneMessage = document.getElementById('milestone-message');
const gameArea = document.getElementById('game-area');
const cleanWaterObject = document.getElementById('clean-water-object');
const animalObject = document.getElementById('animal-object');
const contaminatedWaterObject = document.getElementById('contaminated-water-object');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');
const soundButton = document.getElementById('sound-button');
const easyButton = document.getElementById('easy-button');
const normalButton = document.getElementById('normal-button');
const hardButton = document.getElementById('hard-button');
const difficultyInfo = document.getElementById('difficulty-info');

// Play a sound effect only when the player has sound enabled.
function playSound(sound) {
	if (soundEnabled) {
		sound.currentTime = 0;
		sound.play().catch(function () {
			// Ignore playback errors so the game can continue.
		});
	}
}

// Apply the rules and selected appearance for the chosen difficulty.
function setDifficulty(difficulty) {
	if (difficulty === 'easy') {
		selectedDifficulty = 'easy';
		startingTime = 60;
		waterNeededForRescue = 2;
		contaminationPenalty = 1;
		difficultyInfo.textContent = 'Easy: 60 sec · 2 water per rescue · -1 contamination penalty';
	} else if (difficulty === 'normal') {
		selectedDifficulty = 'normal';
		startingTime = 45;
		waterNeededForRescue = 2;
		contaminationPenalty = 1;
		difficultyInfo.textContent = 'Normal: 45 sec · 2 water per rescue · -1 contamination penalty';
	} else if (difficulty === 'hard') {
		selectedDifficulty = 'hard';
		startingTime = 30;
		waterNeededForRescue = 3;
		contaminationPenalty = 2;
		difficultyInfo.textContent = 'Hard: 30 sec · 3 water per rescue · -2 contamination penalty';
	}

	easyButton.classList.toggle('selected', selectedDifficulty === 'easy');
	normalButton.classList.toggle('selected', selectedDifficulty === 'normal');
	hardButton.classList.toggle('selected', selectedDifficulty === 'hard');
	easyButton.setAttribute('aria-pressed', selectedDifficulty === 'easy');
	normalButton.setAttribute('aria-pressed', selectedDifficulty === 'normal');
	hardButton.setAttribute('aria-pressed', selectedDifficulty === 'hard');

	if (gameRunning === false) {
		timeLeft = startingTime;
		updateDisplay();
	}
}

// Keep difficulty choices locked only while a game is active.
function setDifficultyButtonsDisabled(disabled) {
	easyButton.disabled = disabled;
	normalButton.disabled = disabled;
	hardButton.disabled = disabled;
}

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

// Announce each score milestone once during the current game.
function checkMilestones() {
	for (let i = 0; i < milestones.length; i++) {
		if (score >= milestones[i].score && reachedMilestones.includes(milestones[i].score) === false) {
			reachedMilestones.push(milestones[i].score);
			milestoneMessage.textContent = milestones[i].message;
		}
	}
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

// Cancel unfinished effects so old timeouts cannot change a reset or ended game.
function clearInteractionEffects() {
	clearTimeout(cleanWaterTimeout);
	clearTimeout(contaminatedWaterTimeout);
	clearTimeout(animalTimeout);
	cleanWaterTimeout = null;
	contaminatedWaterTimeout = null;
	animalTimeout = null;
	cleanWaterObject.classList.remove('collected');
	contaminatedWaterObject.classList.remove('hit-obstacle');
	animalObject.classList.remove('rescued');
}

// Collect clean water only while a game is running.
function collectCleanWater() {
	if (gameRunning === false) {
		gameMessage.textContent = 'Press Start before collecting water.';
		return;
	}
	if (cleanWaterObject.classList.contains('collected')) {
		return;
	}

	score = score + 1;
	cleanWater = cleanWater + 1;
	updateDisplay();
	checkMilestones();
	playSound(waterSound);
	gameMessage.textContent = '+1 clean water! Keep searching.';
	cleanWaterObject.classList.add('collected');
	cleanWaterTimeout = setTimeout(function () {
		cleanWaterTimeout = null;
		if (gameRunning) {
			moveCleanWater();
			cleanWaterObject.classList.remove('collected');
		}
	}, 250);
}

// Avoid contaminated water; a hit costs one point but never goes below zero.
function hitContaminatedWater() {
	if (gameRunning === false) {
		gameMessage.textContent = 'Press Start before entering the flooded area.';
		return;
	}
	if (contaminatedWaterObject.classList.contains('hit-obstacle')) {
		return;
	}

	playSound(contaminationSound);
	score = Math.max(0, score - contaminationPenalty);

	updateDisplay();
	const pointLabel = contaminationPenalty === 1 ? 'point' : 'points';
	gameMessage.textContent = `Contaminated water! -${contaminationPenalty} ${pointLabel}. Look for the yellow clean-water can.`;
	contaminatedWaterObject.classList.add('hit-obstacle');
	contaminatedWaterTimeout = setTimeout(function () {
		contaminatedWaterTimeout = null;
		if (gameRunning) {
			moveContaminatedWater();
			contaminatedWaterObject.classList.remove('hit-obstacle');
		}
	}, 250);
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
	playSound(winSound);
	clearInteractionEffects();
	clearInterval(timerInterval);
	timerInterval = null;
	gameRunning = false;
	animalsRescued = rescueGoal;
	updateDisplay();
	startButton.disabled = false;
	setDifficultyButtonsDisabled(false);
	cleanWaterObject.style.visibility = 'hidden';
	contaminatedWaterObject.style.visibility = 'hidden';
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
	if (animalObject.classList.contains('rescued')) {
		return;
	}

	if (cleanWater < waterNeededForRescue) {
		gameMessage.textContent = `You need ${waterNeededForRescue} clean water to rescue this animal. Keep searching!`;
		return;
	}

	cleanWater = cleanWater - waterNeededForRescue;
	score = score + rescuePoints;
	animalsRescued = animalsRescued + 1;
	updateDisplay();
	checkMilestones();
	playSound(rescueSound);

	if (animalsRescued === rescueGoal) {
		winGame();
		animalObject.classList.add('rescued');
		animalTimeout = setTimeout(function () {
			animalTimeout = null;
			animalObject.classList.remove('rescued');
			animalObject.style.visibility = 'hidden';
		}, 300);
	} else {
		animalObject.classList.add('rescued');
		gameMessage.textContent = `Animal rescued! You used ${waterNeededForRescue} clean water. +3 points. Another animal needs your help!`;
		animalTimeout = setTimeout(function () {
			animalTimeout = null;
			if (gameRunning && animalsRescued < rescueGoal) {
				animalObject.textContent = animals[animalsRescued];
				animalObject.setAttribute('aria-label', `Rescue the stranded ${animalNames[animalsRescued]}`);
				moveAnimal();
				animalObject.classList.remove('rescued');
			}
		}, 300);
	}
}

// Start a new game and count down one second at a time.
function startGame() {
	if (gameRunning) {
		return;
	}

	clearInteractionEffects();
	gameRunning = true;
	score = 0;
	cleanWater = 0;
	animalsRescued = 0;
	reachedMilestones = [];
	milestoneMessage.textContent = 'Milestones will appear here as you make an impact.';
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
	setDifficultyButtonsDisabled(true);

	timerInterval = setInterval(function () {
		timeLeft = timeLeft - 1;
		updateDisplay();

		if (timeLeft === 0) {
			clearInterval(timerInterval);
			timerInterval = null;
			gameRunning = false;
			clearInteractionEffects();
			startButton.disabled = false;
			setDifficultyButtonsDisabled(false);
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
	clearInteractionEffects();
	gameRunning = false;
	score = 0;
	cleanWater = 0;
	animalsRescued = 0;
	reachedMilestones = [];
	milestoneMessage.textContent = 'Milestones will appear here as you make an impact.';
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
	setDifficultyButtonsDisabled(false);
	gameMessage.textContent = 'Press Start when you\'re ready. Every drop matters.';
}

// Connect the buttons to their game actions.
easyButton.addEventListener('click', function () {
	setDifficulty('easy');
});
normalButton.addEventListener('click', function () {
	setDifficulty('normal');
});
hardButton.addEventListener('click', function () {
	setDifficulty('hard');
});
startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
soundButton.addEventListener('click', function () {
	soundEnabled = !soundEnabled;
	soundButton.textContent = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
	soundButton.setAttribute('aria-pressed', soundEnabled);
});
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
