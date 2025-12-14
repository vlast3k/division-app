// Division Calculator App
class DivisionCalculator {
    constructor() {
        this.history = this.loadHistory();
        this.initElements();
        this.attachEventListeners();
        this.renderHistory();
    }

    initElements() {
        this.dividendInput = document.getElementById('dividend');
        this.divisorInput = document.getElementById('divisor');
        this.calculateBtn = document.getElementById('calculateBtn');
        this.resultDiv = document.getElementById('result');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistory');
    }

    attachEventListeners() {
        this.calculateBtn.addEventListener('click', () => this.calculate());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Allow Enter key to calculate
        [this.dividendInput, this.divisorInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.calculate();
            });
        });
    }

    calculate() {
        const dividend = parseFloat(this.dividendInput.value);
        const divisor = parseFloat(this.divisorInput.value);

        if (isNaN(dividend) || isNaN(divisor)) {
            this.showResult('Please enter valid numbers', false);
            return;
        }

        if (divisor === 0) {
            this.showResult('Cannot divide by zero!', false);
            return;
        }

        const result = dividend / divisor;
        const calculationText = `${dividend} ÷ ${divisor} = ${result.toFixed(4)}`;
        
        this.showResult(calculationText, true);
        this.addToHistory(calculationText);
    }

    showResult(message, isSuccess) {
        this.resultDiv.textContent = message;
        this.resultDiv.className = `result ${isSuccess ? 'success' : 'error'}`;
    }

    addToHistory(calculation) {
        const timestamp = new Date().toLocaleString('bg-BG');
        const entry = { calculation, timestamp };
        
        this.history.unshift(entry);
        
        // Keep only last 10 entries
        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }
        
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        this.historyList.innerHTML = '';
        
        this.history.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${entry.calculation}</strong><br>
                <small style="color: #666;">${entry.timestamp}</small>
            `;
            this.historyList.appendChild(li);
        });
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear the history?')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
        }
    }

    saveHistory() {
        localStorage.setItem('divisionHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('divisionHistory');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DivisionCalculator();
});
