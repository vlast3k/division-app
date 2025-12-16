/**
 * Application Entry Point
 * 
 * This file contains initialization code only.
 * All classes have been moved to separate modules in the js/ directory.
 * 
 * Module loading order (from index.html):
 * 1. firebase-service.js
 * 2. js/group-manager.js
 * 3. js/game-manager.js
 * 4. js/division-game.js
 * 5. js/subtraction-game.js
 * 6. app.js (this file)
 */

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize group from URL if present
    groupManager.initFromUrl();
    
    // Load global player name and group ID
    const globalPlayerNameInput = document.getElementById('globalPlayerName');
    const globalGroupIdInput = document.getElementById('globalGroupId');
    
    // Load saved player name
    const savedName = localStorage.getItem('playerName');
    if (savedName && globalPlayerNameInput) {
        globalPlayerNameInput.value = savedName;
    }
    
    // Load saved group ID
    const savedGroupId = groupManager.getGroupId();
    if (savedGroupId && globalGroupIdInput) {
        globalGroupIdInput.value = savedGroupId;
    }
    
    // Save player name on change
    if (globalPlayerNameInput) {
        globalPlayerNameInput.addEventListener('input', () => {
            const name = globalPlayerNameInput.value.trim();
            if (name) {
                localStorage.setItem('playerName', name);
            }
        });
    }
    
    // Save group ID on change
    if (globalGroupIdInput) {
        globalGroupIdInput.addEventListener('input', () => {
            const groupId = globalGroupIdInput.value.trim().toLowerCase();
            if (groupId) {
                groupManager.setGroupId(groupId);
            }
        });
    }
    
    // Create game instances (global variables are defined in the module files)
    divisionGame = new DivisionGame(gameManager);
    subtractionGame = new SubtractionGame(gameManager);
    
    // Setup global load button
    const globalLoadBtn = document.getElementById('globalLoadGroupBtn');
    if (globalLoadBtn) {
        globalLoadBtn.addEventListener('click', async () => {
            const groupId = globalGroupIdInput.value.trim().toLowerCase();
            
            if (!groupId) {
                alert('Моля, въведи код на група!');
                return;
            }
            
            // Save the group ID
            groupManager.setGroupId(groupId);
            
            // Show loading state
            globalLoadBtn.textContent = '⏳ Зареждане...';
            globalLoadBtn.disabled = true;
            
            try {
                // Load players from both games for this group
                const players = new Set();
                
                // Load from division game leaderboards
                const divisionConfigs = [
                    { numQuestions: 10, difficulty: 'easy' },
                    { numQuestions: 10, difficulty: 'medium' },
                    { numQuestions: 10, difficulty: 'hard' },
                    { numQuestions: 20, difficulty: 'easy' },
                    { numQuestions: 20, difficulty: 'medium' },
                    { numQuestions: 20, difficulty: 'hard' }
                ];
                
                for (const config of divisionConfigs) {
                    const leaderboard = await firebaseService.getLeaderboard('division', {
                        ...config,
                        groupId: groupId
                    });
                    leaderboard.forEach(entry => {
                        if (entry.name) players.add(entry.name);
                    });
                }
                
                // Load from subtraction game leaderboards (sample common configs)
                const subtractionConfigs = [
                    { numQuestions: 20, numDigits: 2, operations: ['subtraction'], difficulty: 'medium' },
                    { numQuestions: 20, numDigits: 3, operations: ['subtraction'], difficulty: 'medium' },
                    { numQuestions: 20, numDigits: 2, operations: ['addition', 'subtraction'], difficulty: 'medium' }
                ];
                
                for (const config of subtractionConfigs) {
                    const leaderboard = await firebaseService.getLeaderboard('math', {
                        ...config,
                        groupId: groupId
                    });
                    leaderboard.forEach(entry => {
                        if (entry.name) players.add(entry.name);
                    });
                }
                
                // Update select dropdown
                const selectElement = document.getElementById('globalPlayerNameSelect');
                const inputElement = document.getElementById('globalPlayerName');
                
                if (selectElement && inputElement) {
                    selectElement.innerHTML = '<option value="">Избери от списъка...</option>';
                    const sortedPlayers = Array.from(players).sort();
                    sortedPlayers.forEach(name => {
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        selectElement.appendChild(option);
                    });
                    
                    // Show/hide appropriate element
                    if (players.size > 0) {
                        selectElement.classList.remove('hidden');
                        inputElement.placeholder = 'Или въведи ново име';
                        
                        // Add change listener to populate input when selected
                        selectElement.onchange = () => {
                            if (selectElement.value) {
                                inputElement.value = selectElement.value;
                            }
                        };
                    } else {
                        selectElement.classList.add('hidden');
                        inputElement.placeholder = 'Въведи ново име';
                    }
                }
                
                // Show success
                globalLoadBtn.textContent = `✅ ${players.size} играча`;
                setTimeout(() => {
                    globalLoadBtn.innerHTML = '📥 Зареди';
                    globalLoadBtn.disabled = false;
                }, 2000);
                
                if (players.size === 0) {
                    alert('Няма намерени играчи в тази група.');
                }
            } catch (error) {
                console.error('[Load Group] Error:', error);
                alert('Грешка при зареждане на групата: ' + error.message);
                globalLoadBtn.innerHTML = '📥 Зареди';
                globalLoadBtn.disabled = false;
            }
        });
    }
    
    // Setup global share button
    const globalShareBtn = document.getElementById('globalShareGroupBtn');
    if (globalShareBtn) {
        globalShareBtn.addEventListener('click', async () => {
            let groupId = globalGroupIdInput.value.trim().toLowerCase();
            
            // If empty, generate one first
            if (!groupId) {
                groupId = groupManager.getGroupId();
                globalGroupIdInput.value = groupId;
            } else {
                groupManager.setGroupId(groupId);
            }
            
            const result = await groupManager.shareGroup(groupId);
            
            if (result.success) {
                globalShareBtn.textContent = '✅ Копирано!';
                setTimeout(() => {
                    globalShareBtn.innerHTML = '🔗 Сподели';
                }, 2000);
            } else {
                alert('Грешка при копиране: ' + (result.error || 'Непозната грешка'));
            }
        });
    }
});
