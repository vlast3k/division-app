/**
 * GameManager
 * 
 * Handles navigation between different game screens and modes.
 * Manages screen visibility and user navigation flow.
 * 
 * Features:
 * - Game selection screen
 * - Navigation to Division and Subtraction game setups
 * - Back button handling
 * - Screen state management
 */

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

// Global instance
const gameManager = new GameManager();
