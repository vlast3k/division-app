// Division Game App
class DivisionGame {
    constructor() {
        this.totalQuestions = 20;
        this.currentQuestion = 0;
        this.score = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.questions = [];
        
        this.initElements();
        this.attachEventListeners();
        this.loadPlayerName();
    }

    initElements() {
        // Screens
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.resultsScreen = document.getElementById('resultsScreen');
        
        // Start screen
        this.playerNameInput = document.getElementById('playerName');
        this.startBtn = document.getElementById('startBtn');
        
        // Game screen
        this.questionNumEl = document.getElementById('questionNum');
        this.currentScoreEl = document.getElementById('currentScore');
        this.gameTimeEl = document.getElementById('gameTime');
        this.timePenaltyEl = document.getElementById('timePenalty');
        this.numberDisplayEl = document.getElementById('numberDisplay');
        this.answerBtns = document.querySelectorAll('.answer-btn');
        this.feedbackEl = document.getElementById('feedback');
        
        // Results screen
        this.finalScoreEl = document.getElementById('finalScore');
        this.finalTimeEl = document.getElementById('finalTime');
        this.scorePerMinuteEl = document.getElementById('scorePerMinute');
        this.leaderboardListEl = document.getElementById('leaderboardList');
        this.playAgainBtn = document.getElementById('playAgainBtn');
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGame();
        });
        
        this.answerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnswer(e.target.dataset.answer));
        });
        
        this.playAgainBtn.addEventListener('click', () => this.resetGame());
    }

    loadPlayerName() {
        const saved = localStorage.getItem('playerName');
        if (saved) {
            this.playerNameInput.value = saved;
        }
    }

    generateNumber(type) {
        // Generate a number based on type: 'div9', 'div6', 'div3', or 'other'
        const is2Digit = Math.random() < 0.4;
        const min = is2Digit ? 10 : 100;
        const max = is2Digit ? 99 : 999;
        
        let num;
        if (type === 'div9') {
            // Divisible by 9
            const base = Math.floor(Math.random() * ((max - min) / 9)) + Math.ceil(min / 9);
            num = base * 9;
        } else if (type === 'div6') {
            // Divisible by 6 but NOT by 9
            do {
                const base = Math.floor(Math.random() * ((max - min) / 6)) + Math.ceil(min / 6);
                num = base * 6;
            } while (num % 9 === 0);
        } else if (type === 'div3') {
            // Divisible by 3 but NOT by 6
            do {
                const base = Math.floor(Math.random() * ((max - min) / 3)) + Math.ceil(min / 3);
                num = base * 3;
            } while (num % 6 === 0);
        } else {
            // Not divisible by 3
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
        // 0-4 sec: 10 points
        // 4-8 sec: linearly decreases from 10 to 5
        // 8+ sec: 5 points
        
        if (elapsedSeconds <= 4) {
            return 10;
        } else if (elapsedSeconds <= 8) {
            // Linear interpolation: 10 -> 5 over 4 seconds
            return Math.round(10 - ((elapsedSeconds - 4) * 1.25));
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
        
        // Reset game state
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = [];
        
        // Generate fixed composition: 5 of each type
        const types = ['div9', 'div6', 'div3', 'other'];
        types.forEach(type => {
            for (let i = 0; i < 5; i++) {
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
        
        // Show game screen
        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        
        // Start timer
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => this.updateTimer(), 100);
        
        // Show first question
        this.showQuestion();
    }

    showQuestion() {
        this.currentQuestion++;
        this.questionNumEl.textContent = this.currentQuestion;
        this.currentScoreEl.textContent = this.score;
        
        const questionData = this.questions[this.currentQuestion - 1];
        this.numberDisplayEl.textContent = questionData.number;
        
        // Update only tasks progress bar (not points yet)
        const tasksProgress = (this.currentQuestion / this.totalQuestions) * 100;
        document.getElementById('tasksBar').style.width = tasksProgress + '%';
        
        // Reset button states
        this.answerBtns.forEach(btn => {
            btn.classList.remove('correct', 'incorrect');
            btn.disabled = false;
        });
        
        // Start question timer
        this.questionStartTime = Date.now();
        this.startQuestionTimer();
    }
    
    updateProgressBars() {
        // Points progress - both bars update together
        const maxPossiblePoints = this.currentQuestion * 10;
        const earnedProgress = (this.score / 200) * 100;
        const possibleProgress = (maxPossiblePoints / 200) * 100;
        
        document.getElementById('pointsEarnedBar').style.width = earnedProgress + '%';
        document.getElementById('pointsPossibleBar').style.width = possibleProgress + '%';
    }
    
    startQuestionTimer() {
        // Clear existing timer
        if (this.questionTimerInterval) {
            clearInterval(this.questionTimerInterval);
        }
        
        const progressBar = document.querySelector('.question-progress-bar');
        const pointsLabel = document.querySelector('.question-points-label');
        
        this.questionTimerInterval = setInterval(() => {
            const elapsed = (Date.now() - this.questionStartTime) / 1000;
            const points = this.calculatePoints(elapsed);
            
            // Update progress bar (8 seconds total)
            const progress = Math.min(elapsed / 8 * 100, 100);
            progressBar.style.width = (100 - progress) + '%';
            
            // Color based on time
            if (elapsed <= 4) {
                progressBar.style.backgroundColor = '#28a745'; // green
            } else if (elapsed <= 6) {
                progressBar.style.backgroundColor = '#ffc107'; // yellow
            } else if (elapsed <= 7) {
                progressBar.style.backgroundColor = '#fd7e14'; // orange
            } else {
                progressBar.style.backgroundColor = '#dc3545'; // red
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
        
        // Update progress bars immediately
        this.updateProgressBars();
        
        // Visual feedback
        this.answerBtns.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.answer === userAnswer) {
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
        });
        
        // Show points earned
        this.showFeedback(isCorrect, isCorrect ? `+${points}т` : '0т');
        
        // Move to next question or end game
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
        clearInterval(this.timerInterval);
        this.stopQuestionTimer();
        
        const totalSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const finalScore = this.score; // No time penalty on total score
        const minutes = totalSeconds / 60;
        const scorePerMinute = minutes > 0 ? Math.round(finalScore / minutes) : finalScore;
        
        // Show results
        this.finalScoreEl.textContent = finalScore;
        this.finalTimeEl.textContent = this.formatTime(totalSeconds);
        this.scorePerMinuteEl.textContent = scorePerMinute;
        
        // Save to leaderboard
        this.saveToLeaderboard({
            name: this.playerName,
            score: finalScore,
            time: totalSeconds,
            scorePerMinute: scorePerMinute,
            date: new Date().toLocaleString('bg-BG')
        });
        
        // Show results screen
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
        let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        leaderboard.push(result);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10); // Keep top 10
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }

    renderLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        
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
        this.resultsScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DivisionGame();
});
