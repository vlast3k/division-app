// Firebase Service - Управление на leaderboards в cloud
class FirebaseService {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.initPromise = null;
    }

    // Инициализация на Firebase
    async init() {
        if (this.initialized) return true;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                // Check if firebase-config.js is loaded
                if (typeof firebaseConfig === 'undefined') {
                    console.warn('[Firebase] Configuration not found. Using localStorage only.');
                    return false;
                }

                // Initialize Firebase
                const app = firebase.initializeApp(firebaseConfig);
                this.db = firebase.firestore();
                
                console.log('[Firebase] Successfully initialized');
                this.initialized = true;
                return true;
            } catch (error) {
                console.error('[Firebase] Initialization failed:', error);
                return false;
            }
        })();

        return this.initPromise;
    }

    // Генерира уникален leaderboard key според игра и конфигурация
    getLeaderboardKey(gameType, config) {
        if (gameType === 'division') {
            return `division_${config.numQuestions}q_${config.difficulty}`;
        } else {
            // math game (subtraction/addition)
            const opsKey = config.operations.sort().join('_');
            return `math_${config.numQuestions}q_${config.numDigits}d_${opsKey}_${config.difficulty}`;
        }
    }

    // Запис на резултат в Firestore
    async saveScore(gameType, config, scoreData) {
        const isInitialized = await this.init();
        if (!isInitialized) {
            console.warn('[Firebase] Not initialized, skipping cloud save');
            return false;
        }

        try {
            const groupId = config.groupId || 'default';
            const leaderboardKey = this.getLeaderboardKey(gameType, config);
            const collection = this.db
                .collection('groups')
                .doc(groupId)
                .collection('leaderboards')
                .doc(leaderboardKey)
                .collection('scores');
            
            const entry = {
                name: scoreData.name,
                score: scoreData.score,
                time: scoreData.time,
                scorePerMinute: scoreData.scorePerMinute,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                date: scoreData.date
            };

            const docRef = await collection.add(entry);
            console.log(`[Firebase] ✅ Score saved to group/${groupId}/${leaderboardKey}/${docRef.id}`);
            console.log(`[Firebase] Score: ${scoreData.score}, Player: ${scoreData.name}`);
            return true;
        } catch (error) {
            console.error('[Firebase] ❌ Error saving score:', error);
            console.error('[Firebase] Group:', groupId, 'Key:', leaderboardKey);
            console.error('[Firebase] Error details:', error.message);
            return false;
        }
    }

    // Извличане на leaderboard от Firestore
    async getLeaderboard(gameType, config, limit = 10) {
        const isInitialized = await this.init();
        if (!isInitialized) {
            console.warn('[Firebase] Not initialized, returning empty array');
            return [];
        }

        try {
            const groupId = config.groupId || 'default';
            const leaderboardKey = this.getLeaderboardKey(gameType, config);
            const collection = this.db
                .collection('groups')
                .doc(groupId)
                .collection('leaderboards')
                .doc(leaderboardKey)
                .collection('scores');
            
            const snapshot = await collection
                .orderBy('score', 'desc')
                .limit(limit)
                .get();

            const leaderboard = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                leaderboard.push({
                    id: doc.id,
                    name: data.name,
                    score: data.score,
                    time: data.time,
                    scorePerMinute: data.scorePerMinute,
                    date: data.date,
                    timestamp: data.timestamp?.toMillis() || Date.now()
                });
            });

            console.log(`[Firebase] Retrieved ${leaderboard.length} entries from group/${groupId}/${leaderboardKey}`);
            return leaderboard;
        } catch (error) {
            console.error('[Firebase] Error getting leaderboard:', error);
            console.error('[Firebase] Group:', groupId, 'Key:', leaderboardKey);
            console.error('[Firebase] Error details:', error.message);
            return [];
        }
    }

    // Merge на локални и cloud leaderboards
    async mergeLeaderboards(localLeaderboard, cloudLeaderboard, limit = 10) {
        // Комбинира и сортира по score (desc)
        const combined = [...localLeaderboard, ...cloudLeaderboard];
        
        // Премахва дубликати (same name, score, time)
        const unique = [];
        const seen = new Set();
        
        for (const entry of combined) {
            const key = `${entry.name}_${entry.score}_${entry.time}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(entry);
            }
        }
        
        // Сортира и лимитира
        unique.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.time - b.time; // При равни точки, по-бързият е по-горе
        });
        
        return unique.slice(0, limit);
    }

    // Миграция на локални leaderboards към Firebase
    async migrateLocalLeaderboards() {
        const isInitialized = await this.init();
        if (!isInitialized) {
            console.warn('[Firebase] Cannot migrate - not initialized');
            return { migrated: 0, failed: 0 };
        }

        let migrated = 0;
        let failed = 0;

        try {
            // Намира всички leaderboard keys в localStorage
            const keys = Object.keys(localStorage).filter(key => key.startsWith('leaderboard_'));
            
            for (const key of keys) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (!Array.isArray(data) || data.length === 0) continue;

                    // Parse key to determine game type and config
                    // leaderboard_division_20q_medium или leaderboard_math_20q_2d_addition_medium
                    const parts = key.replace('leaderboard_', '').split('_');
                    
                    let gameType, config;
                    if (parts[0] === 'division') {
                        gameType = 'division';
                        config = {
                            numQuestions: parseInt(parts[1].replace('q', '')),
                            difficulty: parts[2]
                        };
                    } else if (parts[0] === 'math') {
                        gameType = 'math';
                        const numQuestions = parseInt(parts[1].replace('q', ''));
                        const numDigits = parseInt(parts[2].replace('d', ''));
                        const difficulty = parts[parts.length - 1];
                        const operations = parts.slice(3, -1);
                        
                        config = {
                            numQuestions,
                            numDigits,
                            operations,
                            difficulty
                        };
                    } else {
                        continue;
                    }

                    // Мигрира всеки entry
                    for (const entry of data) {
                        const success = await this.saveScore(gameType, config, entry);
                        if (success) migrated++;
                        else failed++;
                    }
                } catch (error) {
                    console.error(`[Firebase] Error migrating ${key}:`, error);
                    failed++;
                }
            }

            console.log(`[Firebase] Migration complete: ${migrated} migrated, ${failed} failed`);
        } catch (error) {
            console.error('[Firebase] Migration error:', error);
        }

        return { migrated, failed };
    }

    // Health check
    async isAvailable() {
        return await this.init();
    }
}

// Глобална инстанция
const firebaseService = new FirebaseService();
