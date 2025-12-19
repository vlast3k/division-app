/**
 * DivisionGame
 * 
 * Division game implementation with divisibility rules for 3, 6, and 9.
 * Features difficulty levels, configurable number of questions, and Firebase leaderboard integration.
 * 
 * Features:
 * - Multiple difficulty levels (easy, medium, hard) with time-based scoring
 * - Configurable number of questions (10 or 20)
 * - Number generation for different divisibility rules
 * - Time-based point calculation
 * - Firebase group leaderboard
 * - Progress tracking and visual feedback
 */

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
        this.answers = [];  // Записва всички отговори с детайли
        this.answerLocked = false;  // Блокира многократно натискане
        this.difficulty = 'medium';
        this.difficultySettings = {
            easy: { time: 15, name: 'Лесно' },
            medium: { time: 10, name: 'Средно' },
            hard: { time: 6, name: 'Трудно' }
        };
        
        this.initElements();
        this.attachEventListeners();
        this.loadDifficulty();
    }

    initElements() {
        // Screens
        this.setupScreen = document.getElementById('divisionSetupScreen');
        this.gameScreen = document.getElementById('divisionGameScreen');
        this.resultsScreen = document.getElementById('divisionResultsScreen');
        
        // Setup screen
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
        this.answersListEl = document.getElementById('divisionAnswersList');
        this.playAgainBtn = document.getElementById('divisionPlayAgainBtn');
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        
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
        
        // View Leaderboard button
        const viewLeaderboardBtn = document.getElementById('viewDivisionLeaderboardBtn');
        if (viewLeaderboardBtn) {
            viewLeaderboardBtn.addEventListener('click', () => this.viewLeaderboard());
        }
        
        // Back to Setup button
        const backToSetupBtn = document.getElementById('divisionBackToSetupBtn');
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
        const oneThirdTime = maxTime / 3;
        const twoThirdsTime = maxTime * 2 / 3;
        
        if (elapsedSeconds <= oneThirdTime) {
            return 10;
        } else if (elapsedSeconds <= maxTime) {
            // От 10 до 3 точки за последните 2/3 от времето
            return Math.round(10 - ((elapsedSeconds - oneThirdTime) / twoThirdsTime * 7));
        } else {
            return 3;
        }
    }

    startGame() {
        const playerName = this.getPlayerName();
        if (!playerName) {
            alert('Моля, въведи име!');
            return;
        }
        
        this.playerName = playerName;
        this.groupId = this.getGroupId();
        
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = [];
        this.answers = [];
        this.gameInProgress = true;
        
        // Генерираме правилния брой задачи според избора
        const types = ['div9', 'div6', 'div3', 'other'];
        const questionsPerType = this.numQuestions / types.length; // 10/4=2.5 или 20/4=5
        
        types.forEach(type => {
            for (let i = 0; i < questionsPerType; i++) {
                this.questions.push({
                    number: this.generateNumber(type),
                    type: type
                });
            }
        });
        
        // Shuffle questions
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
        
        this.totalQuestions = this.questions.length; // Обновяваме total според реалния брой
        
        this.setupScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        
        // Обновяваме UI елементите
        this.totalQuestionsEl.textContent = this.totalQuestions;
        this.maxScoreEl.textContent = this.totalQuestions * 10;
        
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
        
        // Reset state при quit
        this.score = 0;
        this.currentQuestion = 0;
        
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
        this.setupScreen.classList.remove('hidden');
    }

    showQuestion() {
        this.answerLocked = false;  // Отключваме за нов въпрос
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
        // Предотвратяваме двойно натискане
        if (this.answerLocked) {
            return;
        }
        this.answerLocked = true;
        
        this.stopQuestionTimer();
        
        const questionData = this.questions[this.currentQuestion - 1];
        const elapsed = (Date.now() - this.questionStartTime) / 1000;
        const correctAnswer = this.getCorrectAnswer(questionData.number);
        
        const isCorrect = userAnswer === correctAnswer;
        const points = isCorrect ? this.calculatePoints(elapsed) : 0;
        
        // Запазваме отговора
        this.answers.push({
            questionNum: this.currentQuestion,
            number: questionData.number,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            points: points
        });
        
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
            date: new Date().toLocaleString('bg-BG'),
            timestamp: Date.now()
        });
        
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.remove('hidden');
        
        // Render answers list
        this.renderAnswersList();
        
        // Render leaderboard (async)
        this.renderLeaderboard().catch(err => console.error('[DivisionGame] Error rendering leaderboard:', err));
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

    renderAnswersList() {
        if (!this.answersListEl) return;
        
        const answerLabels = {
            '3': '3',
            '6': '6',
            '9': '9',
            'other': 'Друго'
        };
        
        const html = this.answers.map(answer => {
            const userLabel = answerLabels[answer.userAnswer] || answer.userAnswer;
            const correctLabel = answerLabels[answer.correctAnswer] || answer.correctAnswer;
            const rowClass = answer.isCorrect ? 'answer-row-correct' : 'answer-row-incorrect';
            
            return `
                <div class="answer-row ${rowClass}">
                    <span class="answer-num">${answer.questionNum}.</span>
                    <span class="answer-number">${answer.number}</span>
                    <span class="answer-user">→ ${userLabel}</span>
                    ${!answer.isCorrect ? `<span class="answer-correct">(${correctLabel})</span>` : ''}
                    <span class="answer-points">${answer.points}т</span>
                </div>
            `;
        }).join('');
        
        this.answersListEl.innerHTML = html;
    }

    async saveToLeaderboard(result) {
        const key = `leaderboard_division_${this.numQuestions}q_${this.difficulty}`;
        
        // Запазваме локално (backup)
        let leaderboard = JSON.parse(localStorage.getItem(key) || '[]');
        leaderboard.push(result);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10);
        localStorage.setItem(key, JSON.stringify(leaderboard));
        
        // Записваме в Firebase
        const config = {
            numQuestions: this.numQuestions,
            difficulty: this.difficulty,
            groupId: this.groupId
        };
        await firebaseService.saveScore('division', config, result);
    }

    async renderLeaderboard() {
        // Вземи cloud leaderboard за текущата група
        const config = {
            numQuestions: this.numQuestions,
            difficulty: this.difficulty,
            groupId: this.groupId || groupManager.getGroupId()  // Fallback ако не е зададен
        };
        
        // Вземи от Firebase - това е единственият източник за групови leaderboards
        const leaderboard = await firebaseService.getLeaderboard('division', config);
        
        // НЕ merge-ваме с localStorage, защото той не е group-specific
        
        // Показваме група + конфигурация
        const groupName = config.groupId || 'default';
        this.leaderboardDifficultyEl.textContent = `Група: ${groupName} | ${this.numQuestions} задачи, ${this.difficultySettings[this.difficulty].name}`;
        
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
        const configKey = `leaderboard_division_${this.numQuestions}q_${this.difficulty}`;
        
        // Update difficulty display
        const diffName = this.difficultySettings[this.difficulty].name;
        this.leaderboardDifficultyEl.textContent = `${this.numQuestions} задачи, ${diffName}`;
        
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
        
        if (window.history.state && window.history.state.divisionGame) {
            window.history.back();
        }
    }
}

// Global instance
let divisionGame;
