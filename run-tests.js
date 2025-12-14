// Simple test runner for the browser-based tests
const fs = require('fs');

console.log('🧪 Стартиране на тестове за Math Game...\n');

// Since we need a browser environment, let's create a simple Node-compatible version
// of the key tests that can run without DOM

class MockSubtractionGame {
    constructor() {
        this.numDigits = 2;
        this.difficulty = 'medium';
        this.operations = ['subtraction'];
        this.selectedCell = 0;
        this.carryStates = [];
        this.difficultySettings = {
            easy: { baseTime: 18, extraTimePerDigit: 8, name: 'Лесно' },
            medium: { baseTime: 12, extraTimePerDigit: 4, name: 'Средно' },
            hard: { baseTime: 6, extraTimePerDigit: 2, name: 'Трудно' }
        };
    }
    
    getTimeForDifficulty() {
        const settings = this.difficultySettings[this.difficulty];
        return settings.baseTime + (this.numDigits - 2) * settings.extraTimePerDigit;
    }
    
    generateProblem(operation, withCarry) {
        const min = Math.pow(10, this.numDigits - 1);
        const max = Math.pow(10, this.numDigits) - 1;
        
        let num1, num2;
        
        if (operation === 'addition') {
            if (withCarry) {
                const digits1 = [];
                const digits2 = [];
                
                digits1.push(Math.floor(Math.random() * 9) + 1);
                digits2.push(Math.floor(Math.random() * 9) + 1);
                
                for (let i = 1; i < this.numDigits - 1; i++) {
                    digits1.push(Math.floor(Math.random() * 10));
                    digits2.push(Math.floor(Math.random() * 10));
                }
                
                const d1 = Math.floor(Math.random() * 5) + 5;
                const d2 = Math.floor(Math.random() * 5) + 5;
                digits1.push(d1);
                digits2.push(d2);
                
                num1 = parseInt(digits1.join(''));
                num2 = parseInt(digits2.join(''));
                
                if (num1 + num2 > max) {
                    digits2[digits2.length - 1] = 5;
                    num2 = parseInt(digits2.join(''));
                }
            } else {
                const digits1 = [];
                const digits2 = [];
                
                const d1First = Math.floor(Math.random() * 9) + 1;
                const d2First = Math.floor(Math.random() * Math.min(9, 10 - d1First)) + 1;
                digits1.push(d1First);
                digits2.push(d2First);
                
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
            if (withCarry) {
                const digits1 = [];
                const digits2 = [];
                
                const d1First = Math.floor(Math.random() * 9) + 1;
                const d2First = Math.floor(Math.random() * d1First) + 1;
                digits1.push(d1First);
                digits2.push(d2First);
                
                for (let i = 1; i < this.numDigits - 1; i++) {
                    digits1.push(Math.floor(Math.random() * 10));
                    digits2.push(Math.floor(Math.random() * 10));
                }
                
                const d1Last = Math.floor(Math.random() * 5);
                const d2Last = Math.floor(Math.random() * (10 - d1Last - 1)) + d1Last + 1;
                digits1.push(d1Last);
                digits2.push(d2Last);
                
                num1 = parseInt(digits1.join(''));
                num2 = parseInt(digits2.join(''));
                
                if (num1 <= num2) {
                    digits1[0] = digits2[0] + 1;
                    num1 = parseInt(digits1.join(''));
                }
            } else {
                const digits1 = [];
                const digits2 = [];
                
                const d1First = Math.floor(Math.random() * 9) + 1;
                const d2First = Math.floor(Math.random() * (d1First + 1));
                digits1.push(d1First);
                digits2.push(d2First);
                
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
}

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log('✅', name);
        passed++;
    } catch (error) {
        console.log('❌', name);
        console.log('   Грешка:', error.message);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

// TEST 1: getTimeForDifficulty calculation
test('getTimeForDifficulty() изчислява правилно време за 2 цифри', () => {
    const game = new MockSubtractionGame();
    game.numDigits = 2;
    game.difficulty = 'easy';
    assert(game.getTimeForDifficulty() === 18, 'Easy 2 цифри трябва да е 18s');
    
    game.difficulty = 'medium';
    assert(game.getTimeForDifficulty() === 12, 'Medium 2 цифри трябва да е 12s');
    
    game.difficulty = 'hard';
    assert(game.getTimeForDifficulty() === 6, 'Hard 2 цифри трябва да е 6s');
});

test('getTimeForDifficulty() изчислява правилно време за 3 цифри', () => {
    const game = new MockSubtractionGame();
    game.numDigits = 3;
    game.difficulty = 'easy';
    assert(game.getTimeForDifficulty() === 26, 'Easy 3 цифри трябва да е 26s');
    
    game.difficulty = 'medium';
    assert(game.getTimeForDifficulty() === 16, 'Medium 3 цифри трябва да е 16s');
    
    game.difficulty = 'hard';
    assert(game.getTimeForDifficulty() === 8, 'Hard 3 цифри трябва да е 8s');
});

test('getTimeForDifficulty() изчислява правилно време за 5 цифри', () => {
    const game = new MockSubtractionGame();
    game.numDigits = 5;
    game.difficulty = 'easy';
    assert(game.getTimeForDifficulty() === 42, 'Easy 5 цифри трябва да е 42s');
});

// TEST 2: generateProblem for addition with carry
test('generateProblem() генерира събиране с носене', () => {
    const game = new MockSubtractionGame();
    game.numDigits = 2;
    
    for (let i = 0; i < 20; i++) {
        const problem = game.generateProblem('addition', true);
        
        assert(problem.operation === 'addition', 'Операцията трябва да е addition');
        assert(problem.num1 >= 10 && problem.num1 <= 99, `num1 (${problem.num1}) трябва да е двуцифрено`);
        assert(problem.num2 >= 10 && problem.num2 <= 99, `num2 (${problem.num2}) трябва да е двуцифрено`);
        
        const ones1 = problem.num1 % 10;
        const ones2 = problem.num2 % 10;
        assert(ones1 + ones2 >= 10, `С carry: ${problem.num1} + ${problem.num2} трябва да има носене (${ones1} + ${ones2} = ${ones1 + ones2})`);
    }
});

// TEST 3: generateProblem for addition without carry
test('generateProblem() генерира събиране без носене', () => {
    const game = new MockSubtractionGame();
    game.numDigits = 2;
    
    for (let i = 0; i < 20; i++) {
        const problem = game.generateProblem('addition', false);
        
        assert(problem.operation === 'addition', 'Операцията трябва да е addition');
        
        const ones1 = problem.num1 % 10;
        const ones2 = problem.num2 % 10;
        assert(ones1 + ones2 < 10, `Без carry: ${problem.num1} + ${problem.num2} не трябва да има носене (${ones1} + ${ones2} = ${ones1 + ones2})`);
    }
});

// TEST 4: generateProblem for subtraction with borrow
test('generateProblem() генерира изваждане със заемане', () => {
    const game = new MockSubtractionGame();
    game.numDigits = 2;
    
    for (let i = 0; i < 20; i++) {
        const problem = game.generateProblem('subtraction', true);
        
        assert(problem.operation === 'subtraction', 'Операцията трябва да е subtraction');
        assert(problem.num1 > problem.num2, `${problem.num1} трябва да е > ${problem.num2}`);
        
        const ones1 = problem.num1 % 10;
        const ones2 = problem.num2 % 10;
        assert(ones1 < ones2, `С borrow: ${problem.num1} - ${problem.num2} трябва да има заемане (${ones1} < ${ones2})`);
    }
});

// TEST 5: generateProblem for subtraction without borrow
test('generateProblem() генерира изваждане без заемане', () => {
    const game = new MockSubtractionGame();
    game.numDigits = 2;
    
    for (let i = 0; i < 20; i++) {
        const problem = game.generateProblem('subtraction', false);
        
        assert(problem.operation === 'subtraction', 'Операцията трябва да е subtraction');
        assert(problem.num1 >= problem.num2, `${problem.num1} трябва да е >= ${problem.num2}`);
        
        const ones1 = problem.num1 % 10;
        const ones2 = problem.num2 % 10;
        assert(ones1 >= ones2, `Без borrow: ${problem.num1} - ${problem.num2} не трябва да има заемане (${ones1} >= ${ones2})`);
    }
});

// TEST 6: generateProblem works for different digit counts
test('generateProblem() работи за различен брой цифри', () => {
    const game = new MockSubtractionGame();
    const digitCounts = [2, 3, 4, 5];
    
    for (const numDigits of digitCounts) {
        game.numDigits = numDigits;
        const min = Math.pow(10, numDigits - 1);
        const max = Math.pow(10, numDigits) - 1;
        
        const problem = game.generateProblem('addition', true);
        assert(problem.num1 >= min && problem.num1 <= max, 
            `За ${numDigits} цифри, num1 (${problem.num1}) трябва да е между ${min} и ${max}`);
        assert(problem.num2 >= min && problem.num2 <= max,
            `За ${numDigits} цифри, num2 (${problem.num2}) трябва да е между ${min} и ${max}`);
    }
});

// TEST 7: Leading zero validation logic
test('Логика за водеща нула работи правилно', () => {
    // Test case: 55 - 48 = 7
    const correctResult = 7;
    const correctStr = '07';
    
    // Case 1: Empty tens
    const userDigit0_empty = '';
    const userDigit1 = '7';
    
    const shouldAcceptEmpty = correctStr[0] === '0' && (userDigit0_empty === '' || userDigit0_empty === '0');
    assert(shouldAcceptEmpty, 'Трябва да приема празна водеща нула');
    
    // Case 2: Zero tens
    const userDigit0_zero = '0';
    const shouldAcceptZero = correctStr[0] === '0' && (userDigit0_zero === '' || userDigit0_zero === '0');
    assert(shouldAcceptZero, 'Трябва да приема "0" като водеща нула');
});

// TEST 8: Multi-digit carry detection
test('Детекция на носене в много позиции', () => {
    // Test: 456 + 789 = 1245
    const num1 = 456;
    const num2 = 789;
    const numDigits = 3;
    
    const num1Str = num1.toString().padStart(numDigits, '0');
    const num2Str = num2.toString().padStart(numDigits, '0');
    const needsCarry = new Array(numDigits - 1).fill(false);
    
    let carry = 0;
    for (let i = numDigits - 1; i > 0; i--) {
        const d1 = parseInt(num1Str[i]);
        const d2 = parseInt(num2Str[i]);
        const sum = d1 + d2 + carry;
        carry = sum >= 10 ? 1 : 0;
        if (carry === 1) {
            needsCarry[i - 1] = true;
        }
    }
    
    // Position 1: 5 + 8 + 1 = 14 (carry)
    // Position 0: 4 + 7 + 1 = 12 (carry)
    assert(needsCarry[0] === true && needsCarry[1] === true, 
        `И двете позиции трябва да имат carry: ${JSON.stringify(needsCarry)}`);
});

// TEST 9: Multi-digit borrow detection
test('Детекция на заемане в много позиции', () => {
    // Test: 502 - 348 = 154
    const num1 = 502;
    const num2 = 348;
    const numDigits = 3;
    
    const num1Str = num1.toString().padStart(numDigits, '0');
    const num2Str = num2.toString().padStart(numDigits, '0');
    const needsCarry = new Array(numDigits - 1).fill(false);
    
    let borrow = 0;
    for (let i = numDigits - 1; i > 0; i--) {
        const d1 = parseInt(num1Str[i]);
        const d2 = parseInt(num2Str[i]);
        if (d1 - borrow < d2) {
            needsCarry[i - 1] = true;
            borrow = 1;
        } else {
            borrow = 0;
        }
    }
    
    // Position 1 (ones): 2 < 8, needs borrow
    // Position 0 (tens): 0 - 1 < 4, needs borrow
    assert(needsCarry[0] === true && needsCarry[1] === true,
        `И двете позиции трябва да имат borrow: ${JSON.stringify(needsCarry)}`);
});

// TEST 10: GroupManager generates valid group IDs
test('GroupManager генерира валидни group ID (8 символа, alphanumeric)', () => {
    // Mock GroupManager.generateGroupId()
    const generateGroupId = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };
    
    const ids = new Set();
    for (let i = 0; i < 20; i++) {
        const id = generateGroupId();
        assert(typeof id === 'string', 'Group ID трябва да е string');
        assert(id.length === 8, `Group ID трябва да е 8 символа, получено: ${id.length}`);
        assert(/^[a-z0-9]+$/.test(id), `Group ID трябва да съдържа само букви и цифри: ${id}`);
        ids.add(id);
    }
    // With 20 generations, we expect high uniqueness
    assert(ids.size >= 18, `Очакваме поне 18 уникални ID от 20, получено: ${ids.size}`);
});

// TEST 11: URL parameter parsing
test('URL параметър ?group=xxx се парсва правилно', () => {
    const parseGroupFromUrl = (url) => {
        const match = url.match(/[?&]group=([^&]+)/);
        return match ? match[1] : null;
    };
    
    assert(parseGroupFromUrl('?group=abc12345') === 'abc12345', 'Трябва да извлече group ID от прост URL');
    assert(parseGroupFromUrl('?group=test1234&other=value') === 'test1234', 'Трябва да извлече group ID от URL с множество параметри');
    assert(parseGroupFromUrl('?other=value&group=xyz98765') === 'xyz98765', 'Трябва да извлече group ID когато не е първи параметър');
    assert(parseGroupFromUrl('?nogroup=test') === null, 'Трябва да върне null когато няма group параметър');
});

// TEST 12: Share URL generation
test('Share URL се генерира правилно с group параметър', () => {
    const getShareUrl = (groupId) => {
        const baseUrl = 'https://example.com/index.html';
        return `${baseUrl}?group=${groupId}`;
    };
    
    const shareUrl = getShareUrl('abc12345');
    assert(shareUrl.includes('?group='), 'Share URL трябва да съдържа ?group=');
    assert(shareUrl.includes('abc12345'), 'Share URL трябва да съдържа group ID');
    assert(shareUrl.startsWith('http'), 'Share URL трябва да започва с http');
});

// TEST 13: formatTimeAgo for today
test('formatTimeAgo() показва "днес" за резултати от последните 24 часа', () => {
    const formatTimeAgo = (timestamp) => {
        const now = Date.now();
        const diffMs = now - timestamp;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'днес';
        if (diffDays === 1) return 'преди 1 ден';
        return `преди ${diffDays} дни`;
    };
    
    const now = Date.now();
    assert(formatTimeAgo(now) === 'днес', 'Точно сега трябва да показва "днес"');
    
    const twoHoursAgo = now - (2 * 60 * 60 * 1000);
    assert(formatTimeAgo(twoHoursAgo) === 'днес', '2 часа назад трябва да показва "днес"');
    
    const twentyHoursAgo = now - (20 * 60 * 60 * 1000);
    assert(formatTimeAgo(twentyHoursAgo) === 'днес', '20 часа назад трябва да показва "днес"');
});

// TEST 14: formatTimeAgo for past days
test('formatTimeAgo() показва "преди X дни" правилно', () => {
    const formatTimeAgo = (timestamp) => {
        const now = Date.now();
        const diffMs = now - timestamp;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'днес';
        if (diffDays === 1) return 'преди 1 ден';
        return `преди ${diffDays} дни`;
    };
    
    const now = Date.now();
    
    const oneDayAgo = now - (25 * 60 * 60 * 1000);
    assert(formatTimeAgo(oneDayAgo) === 'преди 1 ден', '1 ден назад трябва да показва "преди 1 ден"');
    
    const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);
    assert(formatTimeAgo(threeDaysAgo) === 'преди 3 дни', '3 дни назад трябва да показва "преди 3 дни"');
    
    const tenDaysAgo = now - (10 * 24 * 60 * 60 * 1000);
    assert(formatTimeAgo(tenDaysAgo) === 'преди 10 дни', '10 дни назад трябва да показва "преди 10 дни"');
});

// TEST 15: Leaderboard entry structure with timestamp
test('Leaderboard entry включва timestamp поле', () => {
    const createLeaderboardEntry = (name, time) => {
        return {
            name: name,
            time: time,
            timestamp: Date.now()
        };
    };
    
    const entry = createLeaderboardEntry('Test Player', 120);
    
    assert(entry.name === 'Test Player', 'Entry трябва да има име');
    assert(entry.time === 120, 'Entry трябва да има време');
    assert(entry.timestamp !== undefined, 'Entry трябва да има timestamp');
    assert(typeof entry.timestamp === 'number', 'Timestamp трябва да е число');
    assert(entry.timestamp > 0, 'Timestamp трябва да е положително число');
    assert(entry.timestamp <= Date.now(), 'Timestamp трябва да е от миналото или сега');
});

console.log('\n' + '='.repeat(50));
console.log(`📊 РЕЗУЛТАТИ: ${passed} успешни, ${failed} неуспешни`);
console.log('='.repeat(50));

if (failed > 0) {
    process.exit(1);
}
