// Game Manager - handles navigation between games
class GameManager {
    constructor() {
        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        // Screens
        this.gameSelectionScreen = document.getElementById('gameSelectionScreen');
        
        // Selection buttons
        this.selectDivisionBtn = document.getElementById('selectDivisionGame');
        this.selectSubtractionBtn = document.getElementById('selectSubtractionGame');
        
        // Back buttons
        this.backBtns = document.querySelectorAll('.back-btn');
    }

    attachEventListeners() {
        this.selectDivisionBtn.addEventListener('click', () => this.showDivisionSetup());
        this.selectSubtractionBtn.addEventListener('click', () => this.showSubtractionSetup());
        
        this.backBtns.forEach(btn => {
            btn.addEventListener('click', () => this.showGameSelection());
        });
    }

    showGameSelection() {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
        // Show selection screen
        this.gameSelectionScreen.classList.remove('hidden');
    }

    showDivisionSetup() {
        this.gameSelectionScreen.classList.add('hidden');
        document.getElementById('divisionSetupScreen').classList.remove('hidden');
    }

    showSubtractionSetup() {
        this.gameSelectionScreen.classList.add('hidden');
        document.getElementById('subtractionSetupScreen').classList.remove('hidden');
    }
}

// Division Game Class
class DivisionGame {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.totalQuestions = 20;
        this.numQuestions = 20;
        this.currentQuestion = 0;
        this.score = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.questions = [];
        this.difficulty = 'medium';
        this.difficultySettings = {
            easy: { time: 15, name: 'Лесно' },
            medium: { time: 10, name: 'Средно' },
            hard: { time: 6, name: 'Трудно' }
        };
        
        this.initElements();
        this.attachEventListeners();
        this.loadPlayerName();
        this.loadDifficulty();
    }

    initElements() {
        // Screens
        this.setupScreen = document.getElementById('divisionSetupScreen');
        this.gameScreen = document.getElementById('divisionGameScreen');
        this.resultsScreen = document.getElementById('divisionResultsScreen');
        
        // Setup screen
        this.playerNameInput = document.getElementById('playerName');
        this.startBtn = document.getElementById('startDivisionBtn');
        this.difficultyBtns = this.setupScreen.querySelectorAll('.difficulty-btn');
        this.divisionQuestionsBtns = this.setupScreen.querySelectorAll('.division-questions-btn');
        
        // Game screen
        this.questionNumEl = document.getElementById('questionNum');
        this.totalQuestionsEl = document.getElementById('divTotalQuestions');
        this.maxScoreEl = document.getElementById('divMaxScore');
        this.currentScoreEl = document.getElementById('currentScore');
        this.gameTimeEl = document.getElementById('gameTime');
        this.numberDisplayEl = document.getElementById('numberDisplay');
        this.answerBtns = document.querySelectorAll('.answer-btn');
        this.feedbackEl = document.getElementById('feedback');
        
        // Results screen
        this.finalScoreEl = document.getElementById('finalScore');
        this.finalTimeEl = document.getElementById('finalTime');
        this.scorePerMinuteEl = document.getElementById('scorePerMinute');
        this.leaderboardListEl = document.getElementById('leaderboardList');
        this.leaderboardDifficultyEl = document.getElementById('leaderboardDifficulty');
        this.playAgainBtn = document.getElementById('divisionPlayAgainBtn');
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGame();
        });
        
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.difficultyBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.difficulty = btn.dataset.difficulty;
                localStorage.setItem('difficulty_division', this.difficulty);
            });
        });
        
        this.divisionQuestionsBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.divisionQuestionsBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.numQuestions = parseInt(btn.dataset.questions);
                localStorage.setItem('numQuestions_division', this.numQuestions);
            });
        });
        
        this.answerBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleAnswer(btn.dataset.answer));
        });
        
        this.playAgainBtn.addEventListener('click', () => this.resetGame());
    }

    loadPlayerName() {
        const saved = localStorage.getItem('playerName');
        if (saved) {
            this.playerNameInput.value = saved;
        }
    }
    
    loadDifficulty() {
        const saved = localStorage.getItem('difficulty_division');
        if (saved) {
            this.difficulty = saved;
        }
        
        this.difficultyBtns.forEach(btn => {
            if (btn.dataset.difficulty === this.difficulty) {
                btn.classList.add('selected');
            }
        });
        
        // Load number of questions
        const savedQuestions = localStorage.getItem('numQuestions_division');
        if (savedQuestions) {
            this.numQuestions = parseInt(savedQuestions);
        }
        
        this.divisionQuestionsBtns.forEach(btn => {
            if (parseInt(btn.dataset.questions) === this.numQuestions) {
                btn.classList.add('selected');
            }
        });
    }

    generateNumber(type) {
        const is2Digit = Math.random() < 0.4;
        const min = is2Digit ? 10 : 100;
        const max = is2Digit ? 99 : 999;
        
        let num;
        if (type === 'div9') {
            const base = Math.floor(Math.random() * ((max - min) / 9)) + Math.ceil(min / 9);
            num = base * 9;
        } else if (type === 'div6') {
            do {
                const base = Math.floor(Math.random() * ((max - min) / 6)) + Math.ceil(min / 6);
                num = base * 6;
            } while (num % 9 === 0);
        } else if (type === 'div3') {
            do {
                const base = Math.floor(Math.random() * ((max - min) / 3)) + Math.ceil(min / 3);
                num = base * 3;
            } while (num % 6 === 0);
        } else {
            do {
                num = Math.floor(Math.random() * (max - min + 1)) + min;
            } while (num % 3 === 0);
        }
        
        return num;
    }

    getCorrectAnswer(number) {
        if (number % 9 === 0) return '9';
        if (number % 6 === 0) return '6';
        if (number % 3 === 0) return '3';
        return 'other';
    }

    calculatePoints(elapsedSeconds) {
        const maxTime = this.difficultySettings[this.difficulty].time;
        const halfTime = maxTime / 2;
        
        if (elapsedSeconds <= halfTime) {
            return 10;
        } else if (elapsedSeconds <= maxTime) {
            return Math.round(10 - ((elapsedSeconds - halfTime) / halfTime * 5));
        } else {
            return 5;
        }
    }

    startGame() {
        const playerName = this.playerNameInput.value.trim();
        if (!playerName) {
            alert('Моля, въведи име!');
            return;
        }
        
        localStorage.setItem('playerName', playerName);
        this.playerName = playerName;
        
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = [];
        this.gameInProgress = true;
        
        const types = ['div9', 'div6', 'div3', 'other'];
        types.forEach(type => {
            for (let i = 0; i < 5; i++) {
                this.questions.push({
                    number: this.generateNumber(type),
                    type: type
                });
            }
        });
        
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
        
        this.setupScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        
        this.setupBackButtonHandler();
        
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => this.updateTimer(), 100);
        
        this.showQuestion();
    }
    
    setupBackButtonHandler() {
        window.history.pushState({ divisionGame: true }, '');
        
        this.backButtonHandler = (e) => {
            if (this.gameInProgress) {
                e.preventDefault();
                const confirm = window.confirm('Искаш ли да приключиш играта и да се върнеш на началния екран?');
                if (confirm) {
                    this.quitGame();
                } else {
                    window.history.pushState({ divisionGame: true }, '');
                }
            }
        };
        
        window.addEventListener('popstate', this.backButtonHandler);
    }
    
    quitGame() {
        this.gameInProgress = false;
        clearInterval(this.timerInterval);
        this.stopQuestionTimer();
        
        window.removeEventListener('popstate', this.backButtonHandler);
        
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
        this.setupScreen.classList.remove('hidden');
    }

    showQuestion() {
        this.currentQuestion++;
        this.questionNumEl.textContent = this.currentQuestion;
        this.currentScoreEl.textContent = this.score;
        
        const questionData = this.questions[this.currentQuestion - 1];
        this.numberDisplayEl.textContent = questionData.number;
        
        const tasksProgress = (this.currentQuestion / this.totalQuestions) * 100;
        document.getElementById('tasksBar').style.width = tasksProgress + '%';
        
        this.answerBtns.forEach(btn => {
            btn.classList.remove('correct', 'incorrect');
            btn.disabled = false;
        });
        
        this.questionStartTime = Date.now();
        this.startQuestionTimer();
    }
    
    updateProgressBars() {
        // Points progress - both bars update together
        const maxPossiblePoints = this.currentQuestion * 10;
        const maxTotalPoints = this.totalQuestions * 10;
        const earnedProgress = (this.score / maxTotalPoints) * 100;
        const possibleProgress = (maxPossiblePoints / maxTotalPoints) * 100;
        
        document.getElementById('pointsEarnedBar').style.width = earnedProgress + '%';
        document.getElementById('pointsPossibleBar').style.width = possibleProgress + '%';
    }
    
    startQuestionTimer() {
        if (this.questionTimerInterval) {
            clearInterval(this.questionTimerInterval);
        }
        
        const progressBar = document.querySelector('.question-progress-bar');
        const pointsLabel = document.querySelector('.question-points-label');
        const maxTime = this.difficultySettings[this.difficulty].time;
        
        this.questionTimerInterval = setInterval(() => {
            const elapsed = (Date.now() - this.questionStartTime) / 1000;
            const points = this.calculatePoints(elapsed);
            
            const progress = Math.min(elapsed / maxTime * 100, 100);
            progressBar.style.width = (100 - progress) + '%';
            
            const timePercent = elapsed / maxTime;
            if (timePercent <= 0.5) {
                progressBar.style.backgroundColor = '#28a745';
            } else if (timePercent <= 0.75) {
                progressBar.style.backgroundColor = '#ffc107';
            } else if (timePercent <= 0.9) {
                progressBar.style.backgroundColor = '#fd7e14';
            } else {
                progressBar.style.backgroundColor = '#dc3545';
            }
            
            pointsLabel.textContent = points + 'т';
        }, 50);
    }
    
    stopQuestionTimer() {
        if (this.questionTimerInterval) {
            clearInterval(this.questionTimerInterval);
            this.questionTimerInterval = null;
        }
    }

    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.gameTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    handleAnswer(userAnswer) {
        this.stopQuestionTimer();
        
        const questionData = this.questions[this.currentQuestion - 1];
        const elapsed = (Date.now() - this.questionStartTime) / 1000;
        const correctAnswer = this.getCorrectAnswer(questionData.number);
        
        const isCorrect = userAnswer === correctAnswer;
        const points = isCorrect ? this.calculatePoints(elapsed) : 0;
        
        this.score += points;
        this.currentScoreEl.textContent = this.score;
        
        this.updateProgressBars();
        
        this.answerBtns.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.answer === userAnswer) {
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
        });
        
        this.showFeedback(isCorrect, isCorrect ? `+${points}т` : '0т');
        
        setTimeout(() => {
            this.feedbackEl.classList.add('hidden');
            
            if (this.currentQuestion >= this.totalQuestions) {
                this.endGame();
            } else {
                this.showQuestion();
            }
        }, 600);
    }

    showFeedback(isCorrect, text) {
        this.feedbackEl.textContent = text;
        this.feedbackEl.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        this.feedbackEl.classList.remove('hidden');
    }

    endGame() {
        this.gameInProgress = false;
        clearInterval(this.timerInterval);
        this.stopQuestionTimer();
        
        window.removeEventListener('popstate', this.backButtonHandler);
        
        const totalSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const finalScore = this.score;
        const minutes = totalSeconds / 60;
        const scorePerMinute = minutes > 0 ? Math.round(finalScore / minutes) : finalScore;
        
        this.finalScoreEl.textContent = finalScore;
        this.finalTimeEl.textContent = this.formatTime(totalSeconds);
        this.scorePerMinuteEl.textContent = scorePerMinute;
        
        this.saveToLeaderboard({
            name: this.playerName,
            score: finalScore,
            time: totalSeconds,
            scorePerMinute: scorePerMinute,
            date: new Date().toLocaleString('bg-BG')
        });
        
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.remove('hidden');
        
        this.renderLeaderboard();
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    saveToLeaderboard(result) {
        const key = `leaderboard_division_${this.numQuestions}q_${this.difficulty}`;
        let leaderboard = JSON.parse(localStorage.getItem(key) || '[]');
        leaderboard.push(result);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10);
        localStorage.setItem(key, JSON.stringify(leaderboard));
    }

    renderLeaderboard() {
        const key = `leaderboard_division_${this.numQuestions}q_${this.difficulty}`;
        const leaderboard = JSON.parse(localStorage.getItem(key) || '[]');
        
        this.leaderboardDifficultyEl.textContent = `${this.numQuestions} задачи, ${this.difficultySettings[this.difficulty].name}`;
        
        if (leaderboard.length === 0) {
            this.leaderboardListEl.innerHTML = '<p style="text-align:center;color:#999;">Все още няма резултати</p>';
            return;
        }
        
        this.leaderboardListEl.innerHTML = leaderboard.map((entry, index) => `
            <div class="leaderboard-entry">
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-name">${entry.name}</div>
                <div class="leaderboard-stats">
                    <div class="leaderboard-score">${entry.score}т</div>
                    <div>${this.formatTime(entry.time)} • ${entry.scorePerMinute}т/мин</div>
                </div>
            </div>
        `).join('');
    }

    resetGame() {
        this.gameInProgress = false;
        this.resultsScreen.classList.add('hidden');
        this.setupScreen.classList.remove('hidden');
        
        if (window.history.state && window.history.state.divisionGame) {
            window.history.back();
        }
    }
}

// Subtraction Game Class
class SubtractionGame {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.totalQuestions = 20;
        this.currentQuestion = 0;
        this.score = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.questions = [];
        this.difficulty = 'medium';
        this.numDigits = 2;
        this.numQuestions = 20;
        this.operations = ['subtraction']; // Can be 'addition', 'subtraction', or both
        this.difficultySettings = {
            easy: { baseTime: 18, extraTimePerDigit: 8, name: 'Лесно' },
            medium: { baseTime: 12, extraTimePerDigit: 4, name: 'Средно' },
            hard: { baseTime: 6, extraTimePerDigit: 2, name: 'Трудно' }
        };
        this.selectedCell = 'ones'; // Start with ones selected
        
        this.initElements();
        this.attachEventListeners();
        this.loadPlayerName();
        this.loadConfig();
    }

    initElements() {
        // Screens
        this.setupScreen = document.getElementById('subtractionSetupScreen');
        this.gameScreen = document.getElementById('subtractionGameScreen');
        this.resultsScreen = document.getElementById('subtractionResultsScreen');
        
        // Setup screen
        this.playerNameInput = document.getElementById('playerNameSubtraction');
        this.startBtn = document.getElementById('startSubtractionBtn');
        this.difficultyBtns = this.setupScreen.querySelectorAll('.difficulty-btn');
        this.digitsBtns = this.setupScreen.querySelectorAll('.digits-btn');
        this.questionsBtns = this.setupScreen.querySelectorAll('.questions-btn');
        this.operationBtns = this.setupScreen.querySelectorAll('.operation-btn');
        this.timeLabels = {
            easy: document.getElementById('easyTimeLabel'),
            medium: document.getElementById('mediumTimeLabel'),
            hard: document.getElementById('hardTimeLabel')
        };
        
        // Game screen
        this.questionNumEl = document.getElementById('subQuestionNum');
        this.totalQuestionsEl = document.getElementById('subTotalQuestions');
        this.maxScoreEl = document.getElementById('subMaxScore');
        this.currentScoreEl = document.getElementById('subCurrentScore');
        this.gameTimeEl = document.getElementById('subGameTime');
        this.num1TensEl = document.getElementById('num1Tens');
        this.num1OnesEl = document.getElementById('num1Ones');
        this.num2TensEl = document.getElementById('num2Tens');
        this.num2OnesEl = document.getElementById('num2Ones');
        this.answerTensEl = document.getElementById('answerTens');
        this.answerOnesEl = document.getElementById('answerOnes');
        this.carryToggleEl = document.getElementById('carryToggle');
        this.continueBtn = document.getElementById('subContinueBtn');
        this.numBtns = document.querySelectorAll('.num-btn');
        this.feedbackEl = document.getElementById('subFeedback');
        
        // Results screen
        this.finalScoreEl = document.getElementById('subFinalScore');
        this.finalTimeEl = document.getElementById('subFinalTime');
        this.scorePerMinuteEl = document.getElementById('subScorePerMinute');
        this.leaderboardListEl = document.getElementById('subLeaderboardList');
        this.leaderboardDifficultyEl = document.getElementById('subLeaderboardDifficulty');
        this.playAgainBtn = document.getElementById('subtractionPlayAgainBtn');
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGame();
        });
        
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.difficultyBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.difficulty = btn.dataset.difficulty;
                localStorage.setItem('difficulty_subtraction', this.difficulty);
            });
        });
        
        this.digitsBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.digitsBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.numDigits = parseInt(btn.dataset.digits);
                localStorage.setItem('numDigits_subtraction', this.numDigits);
                this.updateTimeLabels();
            });
        });
        
        this.questionsBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.questionsBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.numQuestions = parseInt(btn.dataset.questions);
                localStorage.setItem('numQuestions_subtraction', this.numQuestions);
            });
        });
        
        this.operationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const operation = btn.dataset.operation;
                if (btn.classList.contains('selected')) {
                    // Deselect only if at least one other is selected
                    const otherSelected = Array.from(this.operationBtns).some(b => 
                        b !== btn && b.classList.contains('selected')
                    );
                    if (otherSelected) {
                        btn.classList.remove('selected');
                        this.operations = this.operations.filter(op => op !== operation);
                    }
                } else {
                    btn.classList.add('selected');
                    if (!this.operations.includes(operation)) {
                        this.operations.push(operation);
                    }
                }
                localStorage.setItem('operations_subtraction', JSON.stringify(this.operations));
            });
        });
        
        // Answer cell selection
        this.answerTensEl.addEventListener('click', () => this.selectCell('tens'));
        this.answerOnesEl.addEventListener('click', () => this.selectCell('ones'));
        
        // Number buttons
        this.numBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleNumberClick(btn.dataset.num));
        });
        
        // Carry toggle
        this.carryToggleEl.addEventListener('click', () => this.toggleCarry());
        
        // Continue button
        this.continueBtn.addEventListener('click', () => this.checkAnswer());
        
        this.playAgainBtn.addEventListener('click', () => this.resetGame());
    }

    loadPlayerName() {
        const saved = localStorage.getItem('playerName');
        if (saved) {
            this.playerNameInput.value = saved;
        }
    }
    
    loadConfig() {
        // Load difficulty
        const savedDifficulty = localStorage.getItem('difficulty_subtraction');
        if (savedDifficulty) {
            this.difficulty = savedDifficulty;
        }
        
        this.difficultyBtns.forEach(btn => {
            if (btn.dataset.difficulty === this.difficulty) {
                btn.classList.add('selected');
            }
        });
        
        // Load number of digits
        const savedDigits = localStorage.getItem('numDigits_subtraction');
        if (savedDigits) {
            this.numDigits = parseInt(savedDigits);
        }
        
        this.digitsBtns.forEach(btn => {
            if (parseInt(btn.dataset.digits) === this.numDigits) {
                btn.classList.add('selected');
            }
        });
        
        // Load number of questions
        const savedQuestions = localStorage.getItem('numQuestions_subtraction');
        if (savedQuestions) {
            this.numQuestions = parseInt(savedQuestions);
        }
        
        this.questionsBtns.forEach(btn => {
            if (parseInt(btn.dataset.questions) === this.numQuestions) {
                btn.classList.add('selected');
            }
        });
        
        // Load operations
        const savedOperations = localStorage.getItem('operations_subtraction');
        if (savedOperations) {
            this.operations = JSON.parse(savedOperations);
        }
        
        this.operationBtns.forEach(btn => {
            if (this.operations.includes(btn.dataset.operation)) {
                btn.classList.add('selected');
            }
        });
        
        this.updateTimeLabels();
    }
    
    updateTimeLabels() {
        ['easy', 'medium', 'hard'].forEach(diff => {
            const settings = this.difficultySettings[diff];
            const totalTime = settings.baseTime + (this.numDigits - 2) * settings.extraTimePerDigit;
            this.timeLabels[diff].textContent = `${totalTime} сек`;
        });
    }
    
    getTimeForDifficulty() {
        const settings = this.difficultySettings[this.difficulty];
        return settings.baseTime + (this.numDigits - 2) * settings.extraTimePerDigit;
    }

    generateProblem(operation, withCarry) {
        // Generate numbers based on numDigits configuration
        const min = Math.pow(10, this.numDigits - 1);
        const max = Math.pow(10, this.numDigits) - 1;
        
        let num1, num2;
        
        if (operation === 'addition') {
            // Addition
            if (withCarry) {
                // Generate numbers that require carrying
                // Build digit by digit ensuring at least one carry
                const digits1 = [];
                const digits2 = [];
                let hasCarry = false;
                
                for (let i = 0; i < this.numDigits; i++) {
                    if (i === 0 && !hasCarry) {
                        // Force a carry in first position
                        const d1 = Math.floor(Math.random() * 5) + 5; // 5-9
                        const d2 = Math.floor(Math.random() * (10 - d1)) + (10 - d1); // ensure d1+d2 >= 10
                        digits1.push(d1);
                        digits2.push(Math.min(d2, 9));
                        hasCarry = true;
                    } else {
                        const d1 = Math.floor(Math.random() * 10);
                        const d2 = Math.floor(Math.random() * 10);
                        digits1.push(d1);
                        digits2.push(d2);
                    }
                }
                
                num1 = parseInt(digits1.reverse().join(''));
                num2 = parseInt(digits2.reverse().join(''));
                
                // Ensure result doesn't overflow
                if (num1 + num2 > max) {
                    num2 = Math.floor(max - num1);
                }
            } else {
                // No carrying - each position sum < 10
                const digits1 = [];
                const digits2 = [];
                for (let i = 0; i < this.numDigits; i++) {
                    const d1 = Math.floor(Math.random() * 10);
                    const d2 = Math.floor(Math.random() * (10 - d1));
                    digits1.push(d1);
                    digits2.push(d2);
                }
                num1 = parseInt(digits1.reverse().join(''));
                num2 = parseInt(digits2.reverse().join(''));
            }
            return { operation: 'addition', num1, num2 };
        } else {
            // Subtraction
            if (withCarry) {
                // Generate numbers that require borrowing
                // Build digit by digit ensuring at least one borrow
                const digits1 = [];
                const digits2 = [];
                let hasBorrow = false;
                
                for (let i = 0; i < this.numDigits; i++) {
                    if (i === 0 && !hasBorrow) {
                        // Force a borrow in first position
                        const d1 = Math.floor(Math.random() * 5); // 0-4
                        const d2 = Math.floor(Math.random() * (10 - d1 - 1)) + d1 + 1; // d2 > d1
                        digits1.push(d1);
                        digits2.push(d2);
                        hasBorrow = true;
                    } else {
                        const d1 = Math.floor(Math.random() * 10);
                        const d2 = Math.floor(Math.random() * 10);
                        digits1.push(d1);
                        digits2.push(d2);
                    }
                }
                
                num1 = parseInt(digits1.reverse().join(''));
                num2 = parseInt(digits2.reverse().join(''));
                
                // Ensure num1 > num2 and both in range
                if (num1 <= num2 || num1 < min) {
                    num1 = Math.floor(Math.random() * (max - min + 1)) + min;
                    num2 = Math.floor(Math.random() * (num1 - min)) + min;
                }
            } else {
                // No borrowing - each position of num1 >= num2
                const digits1 = [];
                const digits2 = [];
                for (let i = 0; i < this.numDigits; i++) {
                    const d1 = Math.floor(Math.random() * 10);
                    const d2 = Math.floor(Math.random() * (d1 + 1));
                    digits1.push(d1);
                    digits2.push(d2);
                }
                num1 = parseInt(digits1.reverse().join(''));
                num2 = parseInt(digits2.reverse().join(''));
                // Ensure num1 >= min
                if (num1 < min) num1 = min;
            }
            return { operation: 'subtraction', num1, num2 };
        }
    }

    startGame() {
        const playerName = this.playerNameInput.value.trim();
        if (!playerName) {
            alert('Моля, въведи име!');
            return;
        }
        
        if (this.operations.length === 0) {
            alert('Моля, избери поне една операция!');
            return;
        }
        
        localStorage.setItem('playerName', playerName);
        this.playerName = playerName;
        
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = [];
        this.gameInProgress = true;
        this.totalQuestions = this.numQuestions;
        
        // Update UI with total questions and max score
        this.totalQuestionsEl.textContent = this.totalQuestions;
        this.maxScoreEl.textContent = this.totalQuestions * 10;
        
        // Generate questions: 1/4 without carry/borrow, 3/4 with carry/borrow
        const withoutCarry = Math.floor(this.totalQuestions / 4);
        const withCarry = this.totalQuestions - withoutCarry;
        
        for (let i = 0; i < withoutCarry; i++) {
            const operation = this.operations[Math.floor(Math.random() * this.operations.length)];
            this.questions.push(this.generateProblem(operation, false));
        }
        for (let i = 0; i < withCarry; i++) {
            const operation = this.operations[Math.floor(Math.random() * this.operations.length)];
            this.questions.push(this.generateProblem(operation, true));
        }
        
        // Shuffle questions
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
        
        this.setupScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        
        this.setupBackButtonHandler();
        
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => this.updateTimer(), 100);
        
        this.showQuestion();
    }
    
    setupBackButtonHandler() {
        window.history.pushState({ subtractionGame: true }, '');
        
        this.backButtonHandler = (e) => {
            if (this.gameInProgress) {
                e.preventDefault();
                const confirm = window.confirm('Искаш ли да приключиш играта и да се върнеш на началния екран?');
                if (confirm) {
                    this.quitGame();
                } else {
                    window.history.pushState({ subtractionGame: true }, '');
                }
            }
        };
        
        window.addEventListener('popstate', this.backButtonHandler);
    }
    
    quitGame() {
        this.gameInProgress = false;
        clearInterval(this.timerInterval);
        this.stopQuestionTimer();
        
        window.removeEventListener('popstate', this.backButtonHandler);
        
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
        this.setupScreen.classList.remove('hidden');
    }

    showQuestion() {
        this.currentQuestion++;
        this.questionNumEl.textContent = this.currentQuestion;
        this.currentScoreEl.textContent = this.score;
        
        const questionData = this.questions[this.currentQuestion - 1];
        
        // Display numbers with proper digit handling
        const num1Str = questionData.num1.toString().padStart(this.numDigits, '0');
        const num2Str = questionData.num2.toString().padStart(this.numDigits, '0');
        
        // For now, we only display up to tens and ones (2 digits)
        // TODO: Extend UI to support more digits
        const displayDigits = Math.min(this.numDigits, 2);
        this.num1TensEl.textContent = num1Str[num1Str.length - 2];
        this.num1OnesEl.textContent = num1Str[num1Str.length - 1];
        this.num2TensEl.textContent = num2Str[num2Str.length - 2];
        this.num2OnesEl.textContent = num2Str[num2Str.length - 1];
        
        // Update operator display
        const operatorEl = document.querySelector('.operator');
        operatorEl.textContent = questionData.operation === 'addition' ? '+' : '−';
        
        // Reset answer fields
        this.answerTensEl.innerHTML = '';
        this.answerOnesEl.innerHTML = '';
        this.answerTensEl.dataset.value = '';
        this.answerOnesEl.dataset.value = '';
        
        // Reset carry
        this.carryToggleEl.classList.remove('active');
        this.carryChecked = false;
        
        // Select ones by default
        this.selectCell('ones');
        
        // Update progress
        const tasksProgress = (this.currentQuestion / this.totalQuestions) * 100;
        document.getElementById('subTasksBar').style.width = tasksProgress + '%';
        
        this.questionStartTime = Date.now();
        this.startQuestionTimer();
    }
    
    selectCell(position) {
        this.selectedCell = position;
        this.answerTensEl.classList.remove('selected');
        this.answerOnesEl.classList.remove('selected');
        
        if (position === 'tens') {
            this.answerTensEl.classList.add('selected');
        } else {
            this.answerOnesEl.classList.add('selected');
        }
    }
    
    handleNumberClick(num) {
        const cell = this.selectedCell === 'tens' ? this.answerTensEl : this.answerOnesEl;
        cell.innerHTML = `<span class="answer-value">${num}</span>`;
        cell.dataset.value = num;
        
        // Auto-switch to tens after ones is filled
        if (this.selectedCell === 'ones') {
            this.selectCell('tens');
        }
    }
    
    toggleCarry() {
        this.carryChecked = !this.carryChecked;
        if (this.carryChecked) {
            this.carryToggleEl.classList.add('active');
        } else {
            this.carryToggleEl.classList.remove('active');
        }
    }
    
    calculatePoints(elapsedSeconds) {
        const maxTime = this.getTimeForDifficulty();
        const halfTime = maxTime / 2;
        
        if (elapsedSeconds <= halfTime) {
            return 10;
        } else if (elapsedSeconds <= maxTime) {
            return Math.round(10 - ((elapsedSeconds - halfTime) / halfTime * 5));
        } else {
            return 5;
        }
    }
    
    updateProgressBars() {
        const maxPossiblePoints = this.currentQuestion * 10;
        const maxTotalPoints = this.totalQuestions * 10;
        const earnedProgress = (this.score / maxTotalPoints) * 100;
        const possibleProgress = (maxPossiblePoints / maxTotalPoints) * 100;
        
        document.getElementById('subPointsEarnedBar').style.width = earnedProgress + '%';
        document.getElementById('subPointsPossibleBar').style.width = possibleProgress + '%';
    }
    
    startQuestionTimer() {
        if (this.questionTimerInterval) {
            clearInterval(this.questionTimerInterval);
        }
        
        const progressBar = document.getElementById('subQuestionProgressBar');
        const pointsLabel = document.getElementById('subQuestionPointsLabel');
        const maxTime = this.getTimeForDifficulty();
        
        this.questionTimerInterval = setInterval(() => {
            const elapsed = (Date.now() - this.questionStartTime) / 1000;
            const points = this.calculatePoints(elapsed);
            
            const progress = Math.min(elapsed / maxTime * 100, 100);
            progressBar.style.width = (100 - progress) + '%';
            
            const timePercent = elapsed / maxTime;
            if (timePercent <= 0.5) {
                progressBar.style.backgroundColor = '#28a745';
            } else if (timePercent <= 0.75) {
                progressBar.style.backgroundColor = '#ffc107';
            } else if (timePercent <= 0.9) {
                progressBar.style.backgroundColor = '#fd7e14';
            } else {
                progressBar.style.backgroundColor = '#dc3545';
            }
            
            pointsLabel.textContent = points + 'т';
        }, 50);
    }
    
    stopQuestionTimer() {
        if (this.questionTimerInterval) {
            clearInterval(this.questionTimerInterval);
            this.questionTimerInterval = null;
        }
    }

    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.gameTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    checkAnswer() {
        this.stopQuestionTimer();
        
        const questionData = this.questions[this.currentQuestion - 1];
        const elapsed = (Date.now() - this.questionStartTime) / 1000;
        
        // Get user answer
        const userTens = this.answerTensEl.dataset.value;
        const userOnes = this.answerOnesEl.dataset.value;
        
        // Calculate correct answer based on operation
        let correctResult;
        let needsCarry;
        
        if (questionData.operation === 'addition') {
            correctResult = questionData.num1 + questionData.num2;
            // Check if carrying is needed
            const num1Ones = questionData.num1 % 10;
            const num2Ones = questionData.num2 % 10;
            needsCarry = (num1Ones + num2Ones) >= 10;
        } else {
            correctResult = questionData.num1 - questionData.num2;
            // Check if borrowing is needed
            const num1Ones = questionData.num1 % 10;
            const num2Ones = questionData.num2 % 10;
            needsCarry = num1Ones < num2Ones;
        }
        
        const correctTens = Math.floor(correctResult / 10);
        const correctOnes = correctResult % 10;
        
        // Check if answer is correct
        // Allow empty tens if result is single digit (correctTens === 0)
        const tensCorrect = correctTens === 0 ? 
            (userTens === '' || userTens === '0') : 
            (userTens === String(correctTens));
        const onesCorrect = userOnes === String(correctOnes);
        const carryCorrect = this.carryChecked === needsCarry;
        const isCorrect = tensCorrect && onesCorrect && carryCorrect;
        
        const points = isCorrect ? this.calculatePoints(elapsed) : 0;
        
        this.score += points;
        this.currentScoreEl.textContent = this.score;
        
        this.updateProgressBars();
        
        this.showFeedback(isCorrect, isCorrect ? `+${points}т` : '0т');
        
        setTimeout(() => {
            this.feedbackEl.classList.add('hidden');
            
            if (this.currentQuestion >= this.totalQuestions) {
                this.endGame();
            } else {
                this.showQuestion();
            }
        }, 600);
    }

    showFeedback(isCorrect, text) {
        this.feedbackEl.textContent = text;
        this.feedbackEl.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        this.feedbackEl.classList.remove('hidden');
    }

    endGame() {
        this.gameInProgress = false;
        clearInterval(this.timerInterval);
        this.stopQuestionTimer();
        
        window.removeEventListener('popstate', this.backButtonHandler);
        
        const totalSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const finalScore = this.score;
        const minutes = totalSeconds / 60;
        const scorePerMinute = minutes > 0 ? Math.round(finalScore / minutes) : finalScore;
        
        this.finalScoreEl.textContent = finalScore;
        this.finalTimeEl.textContent = this.formatTime(totalSeconds);
        this.scorePerMinuteEl.textContent = scorePerMinute;
        
        this.saveToLeaderboard({
            name: this.playerName,
            score: finalScore,
            time: totalSeconds,
            scorePerMinute: scorePerMinute,
            date: new Date().toLocaleString('bg-BG')
        });
        
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.remove('hidden');
        
        this.renderLeaderboard();
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    saveToLeaderboard(result) {
        // Include configuration in leaderboard key
        const opsKey = this.operations.sort().join('_');
        const key = `leaderboard_math_${this.numQuestions}q_${this.numDigits}d_${opsKey}_${this.difficulty}`;
        let leaderboard = JSON.parse(localStorage.getItem(key) || '[]');
        leaderboard.push(result);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10);
        localStorage.setItem(key, JSON.stringify(leaderboard));
    }

    renderLeaderboard() {
        const opsKey = this.operations.sort().join('_');
        const key = `leaderboard_math_${this.numQuestions}q_${this.numDigits}d_${opsKey}_${this.difficulty}`;
        const leaderboard = JSON.parse(localStorage.getItem(key) || '[]');
        
        const opsLabel = this.operations.map(op => 
            op === 'addition' ? '+' : '−'
        ).join(', ');
        this.leaderboardDifficultyEl.textContent = `${this.numQuestions} задачи, ${this.numDigits} цифри, ${opsLabel}, ${this.difficultySettings[this.difficulty].name}`;
        
        if (leaderboard.length === 0) {
            this.leaderboardListEl.innerHTML = '<p style="text-align:center;color:#999;">Все още няма резултати</p>';
            return;
        }
        
        this.leaderboardListEl.innerHTML = leaderboard.map((entry, index) => `
            <div class="leaderboard-entry">
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-name">${entry.name}</div>
                <div class="leaderboard-stats">
                    <div class="leaderboard-score">${entry.score}т</div>
                    <div>${this.formatTime(entry.time)} • ${entry.scorePerMinute}т/мин</div>
                </div>
            </div>
        `).join('');
    }

    resetGame() {
        this.gameInProgress = false;
        this.resultsScreen.classList.add('hidden');
        this.setupScreen.classList.remove('hidden');
        
        if (window.history.state && window.history.state.subtractionGame) {
            window.history.back();
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const gameManager = new GameManager();
    new DivisionGame(gameManager);
    new SubtractionGame(gameManager);
});
