/**
 * SubtractionGame (also supports Addition)
 * 
 * Math game for addition and subtraction with configurable digits and difficulty.
 * Features interactive problem-solving with carry/borrow tracking.
 * 
 * Features:
 * - Configurable number of digits (2-5)
 * - Multiple difficulty levels with adaptive timing
 * - Support for both addition and subtraction operations
 * - Interactive carry/borrow marking
 * - Dynamic UI generation based on digit count
 * - Firebase group leaderboard
 * - Time-based scoring system
 */

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
        this.selectedCell = 0; // Start with rightmost digit (index 0 = ones)
        this.carryStates = []; // Will be initialized based on numDigits
        
        this.initElements();
        this.attachEventListeners();
        this.loadConfig();
    }

    initElements() {
        // Screens
        this.setupScreen = document.getElementById('subtractionSetupScreen');
        this.gameScreen = document.getElementById('subtractionGameScreen');
        this.resultsScreen = document.getElementById('subtractionResultsScreen');
        
        // Setup screen
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
        this.continueBtn = document.getElementById('subContinueBtn');
        this.numBtns = document.querySelectorAll('.num-btn');
        this.feedbackEl = document.getElementById('subFeedback');
        // Note: digit elements (num1Digit*, num2Digit*, answerDigit*) and carry toggles 
        // are created dynamically in buildProblemUI()
        
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
        
        // Number buttons
        this.numBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleNumberClick(btn.dataset.num));
        });
        
        // Note: Answer cells and carry toggles are set up dynamically in buildProblemUI()
        
        // Continue button
        this.continueBtn.addEventListener('click', () => this.checkAnswer());
        
        this.playAgainBtn.addEventListener('click', () => this.resetGame());
        
        // View Leaderboard button
        const viewLeaderboardBtn = document.getElementById('viewSubtractionLeaderboardBtn');
        if (viewLeaderboardBtn) {
            viewLeaderboardBtn.addEventListener('click', () => this.viewLeaderboard());
        }
        
        // Back to Setup button
        const backToSetupBtn = document.getElementById('subtractionBackToSetupBtn');
        if (backToSetupBtn) {
            backToSetupBtn.addEventListener('click', () => this.backToSetup());
        }
    }

    getPlayerName() {
        // Get player name from global input
        const globalPlayerNameInput = document.getElementById('globalPlayerName');
        return globalPlayerNameInput ? globalPlayerNameInput.value.trim() : '';
    }
    
    getGroupId() {
        // Get group ID from global input or use saved one
        const globalGroupIdInput = document.getElementById('globalGroupId');
        let groupId = globalGroupIdInput ? globalGroupIdInput.value.trim().toLowerCase() : '';
        
        if (!groupId) {
            // If empty, use existing or generate new
            groupId = groupManager.getGroupId();
            if (globalGroupIdInput) {
                globalGroupIdInput.value = groupId;
            }
        }
        
        return groupId;
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
                
                // Start with leftmost digit (non-zero)
                digits1.push(Math.floor(Math.random() * 9) + 1); // 1-9
                digits2.push(Math.floor(Math.random() * 9) + 1); // 1-9
                
                // Middle digits (if any)
                for (let i = 1; i < this.numDigits - 1; i++) {
                    digits1.push(Math.floor(Math.random() * 10));
                    digits2.push(Math.floor(Math.random() * 10));
                }
                
                // Force carry in rightmost position (ones)
                const d1 = Math.floor(Math.random() * 5) + 5; // 5-9
                const d2 = Math.floor(Math.random() * 5) + 5; // 5-9 (ensures d1+d2 >= 10)
                digits1.push(d1);
                digits2.push(d2);
                
                num1 = parseInt(digits1.join(''));
                num2 = parseInt(digits2.join(''));
                
                // Ensure result doesn't overflow (rare edge case)
                if (num1 + num2 > max) {
                    // Reduce last digit of num2
                    digits2[digits2.length - 1] = 5;
                    num2 = parseInt(digits2.join(''));
                }
            } else {
                // No carrying - each position sum < 10
                const digits1 = [];
                const digits2 = [];
                
                // First digit (non-zero)
                const d1First = Math.floor(Math.random() * 9) + 1;
                const d2First = Math.floor(Math.random() * Math.min(9, 10 - d1First)) + 1;
                digits1.push(d1First);
                digits2.push(d2First);
                
                // Remaining digits
                for (let i = 1; i < this.numDigits; i++) {
                    const d1 = Math.floor(Math.random() * 10);
                    const d2 = Math.floor(Math.random() * (10 - d1));
                    digits1.push(d1);
                    digits2.push(d2);
                }
                
                num1 = parseInt(digits1.join(''));
                num2 = parseInt(digits2.join(''));
            }
            return { operation: 'addition', num1, num2 };
        } else {
            // Subtraction
            if (withCarry) {
                // Generate numbers that require borrowing
                const digits1 = [];
                const digits2 = [];
                
                // First digit: num1 must be >= num2 overall, so start with higher or equal
                const d1First = Math.floor(Math.random() * 9) + 1; // 1-9
                const d2First = Math.floor(Math.random() * d1First) + 1; // 1 to d1First
                digits1.push(d1First);
                digits2.push(d2First);
                
                // Middle digits (if any) - can be anything
                for (let i = 1; i < this.numDigits - 1; i++) {
                    digits1.push(Math.floor(Math.random() * 10));
                    digits2.push(Math.floor(Math.random() * 10));
                }
                
                // Force borrow in rightmost position (ones): d1 < d2
                const d1Last = Math.floor(Math.random() * 5); // 0-4
                const d2Last = Math.floor(Math.random() * (10 - d1Last - 1)) + d1Last + 1; // d1+1 to 9
                digits1.push(d1Last);
                digits2.push(d2Last);
                
                num1 = parseInt(digits1.join(''));
                num2 = parseInt(digits2.join(''));
                
                // Ensure num1 > num2 (should be guaranteed by construction)
                if (num1 <= num2) {
                    // Increase first digit of num1
                    digits1[0] = digits2[0] + 1;
                    num1 = parseInt(digits1.join(''));
                }
            } else {
                // No borrowing - each position of num1 >= num2
                const digits1 = [];
                const digits2 = [];
                
                // First digit (non-zero, num1 >= num2)
                const d1First = Math.floor(Math.random() * 9) + 1;
                const d2First = Math.floor(Math.random() * (d1First + 1));
                digits1.push(d1First);
                digits2.push(d2First);
                
                // Remaining digits
                for (let i = 1; i < this.numDigits; i++) {
                    const d1 = Math.floor(Math.random() * 10);
                    const d2 = Math.floor(Math.random() * (d1 + 1));
                    digits1.push(d1);
                    digits2.push(d2);
                }
                
                num1 = parseInt(digits1.join(''));
                num2 = parseInt(digits2.join(''));
            }
            return { operation: 'subtraction', num1, num2 };
        }
    }

    startGame() {
        const playerName = this.getPlayerName();
        if (!playerName) {
            alert('Моля, въведи име!');
            return;
        }
        
        if (this.operations.length === 0) {
            alert('Моля, избери поне една операция!');
            return;
        }
        
        this.playerName = playerName;
        this.groupId = this.getGroupId();
        
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
        
        // Build UI based on number of digits
        this.buildProblemUI();
        
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

    buildProblemUI() {
        const problemContainer = document.querySelector('.subtraction-problem');
        const numCols = this.numDigits + 1; // +1 for operator/empty column
        
        // Build carry row - NO carry button above overflow (leftmost position)
        let carryRow = '<div class="sub-row carry-row">';
        carryRow += '<div class="sub-cell empty"></div>'; // operator column
        // Empty cell above overflow position (no carry possible there)
        carryRow += `<div class="sub-cell empty"></div>`;
        for (let i = 0; i < this.numDigits - 1; i++) {
            carryRow += `<div class="sub-cell"><button class="carry-toggle" id="carry${i}" data-position="${i}"></button></div>`;
        }
        carryRow += '<div class="sub-cell empty"></div>'; // ones column (no carry above)
        carryRow += '</div>';
        
        // Build num1 row - with extra cell for potential overflow
        let num1Row = '<div class="sub-row">';
        num1Row += '<div class="sub-cell empty"></div>'; // operator column
        num1Row += '<div class="sub-cell empty"></div>'; // extra cell for overflow position
        for (let i = 0; i < this.numDigits; i++) {
            num1Row += `<div class="sub-cell digit" id="num1Digit${i}"></div>`;
        }
        num1Row += '</div>';
        
        // Build operator row
        let opRow = '<div class="sub-row operator-row">';
        opRow += '<div class="sub-cell operator">−</div>';
        opRow += '<div class="sub-cell empty"></div>'; // extra cell for overflow position
        for (let i = 0; i < this.numDigits; i++) {
            opRow += '<div class="sub-cell empty"></div>';
        }
        opRow += '</div>';
        
        // Build num2 row - with extra cell for potential overflow
        let num2Row = '<div class="sub-row">';
        num2Row += '<div class="sub-cell empty"></div>'; // operator column
        num2Row += '<div class="sub-cell empty"></div>'; // extra cell for overflow position
        for (let i = 0; i < this.numDigits; i++) {
            num2Row += `<div class="sub-cell digit" id="num2Digit${i}"></div>`;
        }
        num2Row += '</div>';
        
        // Build divider row - just a solid line, no cells needed
        let dividerRow = '<div class="divider-row"></div>';
        
        // Build answer row - with extra cell for overflow digit
        let answerRow = '<div class="sub-row answer-row">';
        answerRow += '<div class="sub-cell empty"></div>'; // operator column
        answerRow += `<div class="sub-cell answer-cell" id="answerDigitOverflow" data-position="overflow"></div>`; // overflow digit
        for (let i = 0; i < this.numDigits; i++) {
            answerRow += `<div class="sub-cell answer-cell" id="answerDigit${i}" data-position="${i}"></div>`;
        }
        answerRow += '</div>';
        
        problemContainer.innerHTML = carryRow + num1Row + opRow + num2Row + dividerRow + answerRow;
        
        // Re-attach event listeners for carry toggles
        for (let i = 0; i < this.numDigits - 1; i++) {
            const carryBtn = document.getElementById(`carry${i}`);
            if (carryBtn) {
                carryBtn.addEventListener('click', () => this.toggleCarry(i));
            }
        }
        
        // Re-attach event listeners for answer cells
        const answerOverflowCell = document.getElementById('answerDigitOverflow');
        if (answerOverflowCell) {
            answerOverflowCell.addEventListener('click', () => this.selectCell('overflow'));
        }
        
        for (let i = 0; i < this.numDigits; i++) {
            const answerCell = document.getElementById(`answerDigit${i}`);
            if (answerCell) {
                answerCell.addEventListener('click', () => this.selectCell(i));
            }
        }
    }

    showQuestion() {
        this.currentQuestion++;
        this.questionNumEl.textContent = this.currentQuestion;
        this.currentScoreEl.textContent = this.score;
        
        const questionData = this.questions[this.currentQuestion - 1];
        
        // Display numbers with proper digit handling
        const num1Str = questionData.num1.toString().padStart(this.numDigits, '0');
        const num2Str = questionData.num2.toString().padStart(this.numDigits, '0');
        
        // Update all digit displays
        for (let i = 0; i < this.numDigits; i++) {
            const digit1El = document.getElementById(`num1Digit${i}`);
            const digit2El = document.getElementById(`num2Digit${i}`);
            if (digit1El) digit1El.textContent = num1Str[i];
            if (digit2El) digit2El.textContent = num2Str[i];
        }
        
        // Update operator display
        const operatorEl = document.querySelector('.operator');
        operatorEl.textContent = questionData.operation === 'addition' ? '+' : '−';
        
        // Reset answer fields including overflow
        const answerOverflowCell = document.getElementById('answerDigitOverflow');
        if (answerOverflowCell) {
            answerOverflowCell.innerHTML = '';
            answerOverflowCell.dataset.value = '';
        }
        
        for (let i = 0; i < this.numDigits; i++) {
            const answerCell = document.getElementById(`answerDigit${i}`);
            if (answerCell) {
                answerCell.innerHTML = '';
                answerCell.dataset.value = '';
            }
        }
        
        // Reset all carry toggles (no overflow carry)
        this.carryStates = {};
        for (let i = 0; i < this.numDigits - 1; i++) {
            this.carryStates[i] = false;
        }
        
        for (let i = 0; i < this.numDigits - 1; i++) {
            const carryBtn = document.getElementById(`carry${i}`);
            if (carryBtn) {
                carryBtn.classList.remove('active');
            }
        }
        
        // Select rightmost digit (ones) by default
        this.selectCell(this.numDigits - 1);
        
        // Update progress
        const tasksProgress = (this.currentQuestion / this.totalQuestions) * 100;
        document.getElementById('subTasksBar').style.width = tasksProgress + '%';
        
        this.questionStartTime = Date.now();
        this.startQuestionTimer();
    }
    
    selectCell(position) {
        this.selectedCell = position;
        
        // Remove selected class from all cells including overflow
        const overflowCell = document.getElementById('answerDigitOverflow');
        if (overflowCell) overflowCell.classList.remove('selected');
        
        for (let i = 0; i < this.numDigits; i++) {
            const cell = document.getElementById(`answerDigit${i}`);
            if (cell) cell.classList.remove('selected');
        }
        
        // Add selected class to chosen cell
        const cellId = position === 'overflow' ? 'answerDigitOverflow' : `answerDigit${position}`;
        const selectedCell = document.getElementById(cellId);
        if (selectedCell) selectedCell.classList.add('selected');
    }
    
    handleNumberClick(num) {
        const cellId = this.selectedCell === 'overflow' ? 'answerDigitOverflow' : `answerDigit${this.selectedCell}`;
        const cell = document.getElementById(cellId);
        if (!cell) return;
        
        cell.innerHTML = `<span class="answer-value">${num}</span>`;
        cell.dataset.value = num;
        
        // Auto-switch to next digit to the left
        if (this.selectedCell === 'overflow') {
            // Already at leftmost, stay here
            return;
        } else if (this.selectedCell > 0) {
            this.selectCell(this.selectedCell - 1);
        } else {
            // At position 0 (leftmost n-digit), move to overflow
            this.selectCell('overflow');
        }
    }
    
    toggleCarry(position) {
        this.carryStates[position] = !this.carryStates[position];
        const carryBtn = document.getElementById(`carry${position}`);
        if (carryBtn) {
            if (this.carryStates[position]) {
                carryBtn.classList.add('active');
            } else {
                carryBtn.classList.remove('active');
            }
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
        const { operation, num1, num2 } = questionData;
        
        // Get user answers for all digits including overflow
        const overflowCell = document.getElementById('answerDigitOverflow');
        const userOverflow = overflowCell ? overflowCell.dataset.value : '';
        
        const userDigits = [];
        for (let i = 0; i < this.numDigits; i++) {
            const cell = document.getElementById(`answerDigit${i}`);
            userDigits.push(cell ? cell.dataset.value : '');
        }
        
        // Calculate correct answer
        const correctResult = operation === 'addition' ? num1 + num2 : num1 - num2;
        const correctResultStr = correctResult.toString();
        
        // Determine if we need overflow digit (result is n+1 digits)
        const hasOverflow = correctResultStr.length > this.numDigits;
        const correctOverflow = hasOverflow ? correctResultStr[0] : '';
        const correctStr = hasOverflow 
            ? correctResultStr.slice(1).padStart(this.numDigits, '0')
            : correctResultStr.padStart(this.numDigits, '0');
        
        // Determine which positions need carry/borrow
        const needsCarry = {};
        for (let i = 0; i < this.numDigits - 1; i++) {
            needsCarry[i] = false;
        }
        
        const num1Str = num1.toString().padStart(this.numDigits, '0');
        const num2Str = num2.toString().padStart(this.numDigits, '0');
        
        if (operation === 'addition') {
            let carry = 0;
            // Check from rightmost to leftmost
            for (let i = this.numDigits - 1; i >= 0; i--) {
                const d1 = parseInt(num1Str[i]);
                const d2 = parseInt(num2Str[i]);
                const sum = d1 + d2 + carry;
                carry = sum >= 10 ? 1 : 0;
                
                // Mark carry needed at position to the left (but not overflow)
                if (carry === 1 && i > 0) {
                    needsCarry[i - 1] = true;
                }
            }
        } else {
            let borrow = 0;
            for (let i = this.numDigits - 1; i > 0; i--) {
                const d1 = parseInt(num1Str[i]);
                const d2 = parseInt(num2Str[i]);
                if (d1 - borrow < d2) {
                    needsCarry[i - 1] = true;
                    borrow = 1;
                } else {
                    borrow = 0;
                }
            }
        }
        
        // Check overflow digit
        let overflowCorrect = true;
        if (hasOverflow) {
            // Should have overflow digit
            if (userOverflow !== correctOverflow) {
                overflowCorrect = false;
            }
        } else {
            // Should NOT have overflow digit (or should be empty/0)
            if (userOverflow !== '' && userOverflow !== '0') {
                overflowCorrect = false;
            }
        }
        
        // Check if all digits are correct
        let digitsCorrect = true;
        for (let i = 0; i < this.numDigits; i++) {
            const correctDigit = correctStr[i];
            const userDigit = userDigits[i];
            
            // For leading zeros, allow empty or '0'
            if (i < this.numDigits - 1 && correctDigit === '0') {
                if (userDigit !== '' && userDigit !== '0') {
                    digitsCorrect = false;
                    break;
                }
            } else {
                if (userDigit !== correctDigit) {
                    digitsCorrect = false;
                    break;
                }
            }
        }
        
        // Check if all carry/borrow marks are correct
        let carryCorrect = true;
        
        // Check regular carries (no overflow carry to check)
        for (let i = 0; i < this.numDigits - 1; i++) {
            if (this.carryStates[i] !== needsCarry[i]) {
                carryCorrect = false;
                break;
            }
        }
        
        const isCorrect = digitsCorrect && carryCorrect && overflowCorrect;
        
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
            date: new Date().toLocaleString('bg-BG'),
            timestamp: Date.now()
        });
        
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.remove('hidden');
        
        // Render leaderboard (async)
        this.renderLeaderboard().catch(err => console.error('[SubtractionGame] Error rendering leaderboard:', err));
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'днес';
        if (days === 1) return 'преди 1 ден';
        return `преди ${days} дни`;
    }

    async saveToLeaderboard(result) {
        // Include configuration in leaderboard key
        const opsKey = this.operations.sort().join('_');
        const key = `leaderboard_math_${this.numQuestions}q_${this.numDigits}d_${opsKey}_${this.difficulty}`;
        
        // Запазваме локално (backup)
        let leaderboard = JSON.parse(localStorage.getItem(key) || '[]');
        leaderboard.push(result);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10);
        localStorage.setItem(key, JSON.stringify(leaderboard));
        
        // Записваме в Firebase
        const config = {
            numQuestions: this.numQuestions,
            numDigits: this.numDigits,
            operations: this.operations,
            difficulty: this.difficulty,
            groupId: this.groupId
        };
        await firebaseService.saveScore('math', config, result);
    }

    async renderLeaderboard() {
        // Вземи cloud leaderboard за текущата група
        const config = {
            numQuestions: this.numQuestions,
            numDigits: this.numDigits,
            operations: this.operations,
            difficulty: this.difficulty,
            groupId: this.groupId || groupManager.getGroupId()  // Fallback ако не е зададен
        };
        
        // Вземи от Firebase - това е единственият източник за групови leaderboards
        const leaderboard = await firebaseService.getLeaderboard('math', config);
        
        // НЕ merge-ваме с localStorage, защото той не е group-specific
        
        const opsLabel = this.operations.map(op => 
            op === 'addition' ? '+' : '−'
        ).join(', ');
        const groupName = config.groupId || 'default';
        this.leaderboardDifficultyEl.textContent = `Група: ${groupName} | ${this.numQuestions} задачи, ${this.numDigits} цифри, ${opsLabel}, ${this.difficultySettings[this.difficulty].name}`;
        
        if (leaderboard.length === 0) {
            this.leaderboardListEl.innerHTML = '<p style="text-align:center;color:#999;">Все още няма резултати за тази група</p>';
            return;
        }
        
        this.leaderboardListEl.innerHTML = leaderboard.map((entry, index) => {
            const timeAgo = entry.timestamp ? this.formatTimeAgo(entry.timestamp) : '';
            const timeAgoHtml = timeAgo ? `<span style="color: #999; font-size: 0.85em;"> (${timeAgo})</span>` : '';
            
            return `
            <div class="leaderboard-entry">
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-name">${entry.name}${timeAgoHtml}</div>
                <div class="leaderboard-stats">
                    <div class="leaderboard-score">${entry.score}т</div>
                    <div>${this.formatTime(entry.time)} • ${entry.scorePerMinute}т/мин</div>
                </div>
            </div>
        `;
        }).join('');
    }

    async viewLeaderboard() {
        // Update configuration
        this.totalQuestions = this.numQuestions;
        this.groupId = this.getGroupId(); // ВАЖНО: Записва groupId преди рендериране
        
        // Generate config key for leaderboard
        const opsKey = this.operations.sort().join('_');
        const configKey = `leaderboard_math_${this.numQuestions}q_${this.numDigits}d_${opsKey}_${this.difficulty}`;
        
        // Update difficulty display
        const diffName = this.difficultySettings[this.difficulty].name;
        const opsDisplay = this.operations.map(op => op === 'addition' ? '+' : '−').join(', ');
        this.leaderboardDifficultyEl.textContent = `${this.numQuestions} задачи, ${this.numDigits} цифри, ${opsDisplay}, ${diffName}`;
        
        // Hide setup, show results (without game screen)
        this.setupScreen.classList.add('hidden');
        this.resultsScreen.classList.remove('hidden');
        
        // Hide score/time display (since no game was played)
        this.finalScoreEl.parentElement.style.display = 'none';
        this.finalTimeEl.parentElement.style.display = 'none';
        this.scorePerMinuteEl.parentElement.style.display = 'none';
        
        // Render leaderboard
        await this.renderLeaderboard();
    }

    backToSetup() {
        // Show setup, hide results
        this.resultsScreen.classList.add('hidden');
        this.setupScreen.classList.remove('hidden');
        
        // Restore score/time display
        this.finalScoreEl.parentElement.style.display = '';
        this.finalTimeEl.parentElement.style.display = '';
        this.scorePerMinuteEl.parentElement.style.display = '';
    }

    resetGame() {
        this.gameInProgress = false;
        this.resultsScreen.classList.add('hidden');
        this.setupScreen.classList.remove('hidden');
        
        // Restore score/time display
        this.finalScoreEl.parentElement.style.display = '';
        this.finalTimeEl.parentElement.style.display = '';
        this.scorePerMinuteEl.parentElement.style.display = '';
        
        if (window.history.state && window.history.state.subtractionGame) {
            window.history.back();
        }
    }
}

// Global instance
let subtractionGame;
