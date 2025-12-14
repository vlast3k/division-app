// Simulation to find optimal probabilities and scoring

class GameSimulator {
    constructor(config) {
        this.probabilities = config.probabilities; // { div9, div6, div3, other }
        this.points = config.points; // { 9: [correct, if6, if3, wrong], 6: [correct, if3, wrong], 3: [correct, wrong], other: [correct, wrong] }
        this.numGames = 1000;
    }

    generateNumber(probabilities) {
        const rand = Math.random();
        let cumulative = 0;
        
        // Check probabilities in order: 9, 6, 3, other
        cumulative += probabilities.div9;
        if (rand < cumulative) {
            // Find a number divisible by 9
            const base = Math.floor(Math.random() * 100) + 10; // 10-109
            return Math.floor(base / 9) * 9 || 9;
        }
        
        cumulative += probabilities.div6;
        if (rand < cumulative) {
            // Divisible by 6 but NOT by 9
            let num;
            do {
                const base = Math.floor(Math.random() * 150) + 10;
                num = Math.floor(base / 6) * 6 || 6;
            } while (num % 9 === 0);
            return num;
        }
        
        cumulative += probabilities.div3;
        if (rand < cumulative) {
            // Divisible by 3 but NOT by 6 or 9
            let num;
            do {
                const base = Math.floor(Math.random() * 300) + 10;
                num = Math.floor(base / 3) * 3 || 3;
            } while (num % 6 === 0);
            return num;
        }
        
        // Not divisible by 3, 6, or 9
        let num;
        do {
            num = Math.floor(Math.random() * 890) + 10; // 10-999
        } while (num % 3 === 0);
        return num;
    }

    getCorrectAnswer(number) {
        if (number % 9 === 0) return '9';
        if (number % 6 === 0) return '6';
        if (number % 3 === 0) return '3';
        return 'other';
    }

    calculatePoints(number, userAnswer, points) {
        const divisibleBy3 = number % 3 === 0;
        const divisibleBy6 = number % 6 === 0;
        const divisibleBy9 = number % 9 === 0;
        
        if (divisibleBy9) {
            if (userAnswer === '9') return points[9][0];
            if (userAnswer === '6') return points[9][1];
            if (userAnswer === '3') return points[9][2];
            if (userAnswer === 'other') return points[9][3];
            return 0;
        }
        
        if (divisibleBy6) {
            if (userAnswer === '6') return points[6][0];
            if (userAnswer === '3') return points[6][1];
            if (userAnswer === '9' || userAnswer === 'other') return points[6][2];
            return 0;
        }
        
        if (divisibleBy3) {
            if (userAnswer === '3') return points[3][0];
            if (userAnswer === '6' || userAnswer === '9' || userAnswer === 'other') return points[3][1];
            return 0;
        }
        
        // Not divisible by 3, 6, or 9
        if (userAnswer === 'other') return points.other[0];
        if (userAnswer === '3' || userAnswer === '6' || userAnswer === '9') return points.other[1];
        return 0;
    }

    simulateGame(numQuestions, strategy) {
        let score = 0;
        
        for (let i = 0; i < numQuestions; i++) {
            const number = this.generateNumber(this.probabilities);
            score += this.calculatePoints(number, strategy, this.points);
        }
        
        return score;
    }

    runSimulation(numQuestions) {
        const strategies = ['3', '6', '9', 'other'];
        const results = {};
        
        strategies.forEach(strategy => {
            const scores = [];
            for (let i = 0; i < this.numGames; i++) {
                scores.push(this.simulateGame(numQuestions, strategy));
            }
            
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            const min = Math.min(...scores);
            const max = Math.max(...scores);
            
            results[strategy] = {
                avg: avg.toFixed(2),
                min,
                max,
                variance: ((max - min) / avg * 100).toFixed(1) + '%'
            };
        });
        
        // Calculate balance score (lower is better)
        const avgs = strategies.map(s => parseFloat(results[s].avg));
        const maxAvg = Math.max(...avgs);
        const minAvg = Math.min(...avgs);
        const balance = ((maxAvg - minAvg) / ((maxAvg + minAvg) / 2) * 100).toFixed(1);
        
        return { results, balance };
    }
}

// Optimize automatically
console.log("=== АВТОМАТИЧНА ОПТИМИЗАЦИЯ ===\n");
console.log("Търся най-добрата комбинация от вероятности и точкуване...\n");

let bestConfig = null;
let bestBalance = 999;

// Generate probability combinations (must sum to 1.0)
const probCombinations = [];
for (let p9 = 10; p9 <= 35; p9 += 5) {
    for (let p6 = 10; p6 <= 40; p6 += 5) {
        for (let p3 = 10; p3 <= 45; p3 += 5) {
            const pOther = 100 - p9 - p6 - p3;
            if (pOther >= 5 && pOther <= 50) {
                probCombinations.push({
                    div9: p9/100,
                    div6: p6/100,
                    div3: p3/100,
                    other: pOther/100
                });
            }
        }
    }
}

// Point schemes to test
const pointSchemes = [
    // Format: { 9: [9 correct, 6 chosen, 3 chosen, wrong], 6: [correct, 3 chosen, wrong], 3: [correct, wrong], other: [correct, wrong] }
    // Без наказания
    { name: "Всички=3т, частични 2/1т", points: { 9: [3, 2, 1, 0], 6: [3, 2, 0], 3: [3, 0], other: [3, 0] }},
    { name: "Градация 5/4/3т, без наказание", points: { 9: [5, 3, 2, 0], 6: [4, 2, 0], 3: [3, 0], other: [5, 0] }},
    { name: "Равномерно 4т всички правилни", points: { 9: [4, 2, 1, 0], 6: [4, 2, 0], 3: [4, 0], other: [4, 0] }},
    // С малки наказания
    { name: "Правилни=4т, -1 грешен", points: { 9: [4, 2, 1, -1], 6: [4, 2, -1], 3: [4, -1], other: [4, -1] }},
    { name: "Правилни=5т, -1 грешен", points: { 9: [5, 3, 2, -1], 6: [5, 3, -1], 3: [5, -1], other: [5, -1] }},
    { name: "Правилни=5т, -2 грешен", points: { 9: [5, 3, 2, -2], 6: [5, 3, -2], 3: [5, -2], other: [5, -2] }},
    { name: "Правилни=6т, -2 грешен", points: { 9: [6, 4, 2, -2], 6: [6, 3, -2], 3: [6, -2], other: [6, -2] }},
    // Високи награди за рядко срещани
    { name: "9→10т, 6→7т, 3→4т, др→10т", points: { 9: [10, 5, 3, -2], 6: [7, 4, -2], 3: [4, -2], other: [10, -2] }},
    { name: "9→8т, 6→6т, 3→4т, др→8т", points: { 9: [8, 5, 3, -1], 6: [6, 4, -1], 3: [4, -1], other: [8, -1] }},
];

let tested = 0;
const totalTests = probCombinations.length * pointSchemes.length;

probCombinations.forEach(probs => {
    pointSchemes.forEach(scheme => {
        tested++;
        
        const config = {
            probabilities: probs,
            points: scheme.points
        };
        
        const simulator = new GameSimulator(config);
        const { balance } = simulator.runSimulation(20);
        
        if (parseFloat(balance) < bestBalance) {
            bestBalance = parseFloat(balance);
            bestConfig = {
                name: scheme.name,
                probabilities: probs,
                points: scheme.points,
                balance: balance
            };
        }
    });
});

console.log(`✅ Тествани ${tested} комбинации\n`);
console.log("🏆 ТОП 1 НАЙ-БАЛАНСИРАН ВАРИАНТ:\n");

if (bestConfig) {
    console.log(`📊 ${bestConfig.name}`);
    console.log(`Вероятности: 9=${(bestConfig.probabilities.div9*100).toFixed(0)}%, 6=${(bestConfig.probabilities.div6*100).toFixed(0)}%, 3=${(bestConfig.probabilities.div3*100).toFixed(0)}%, друго=${(bestConfig.probabilities.other*100).toFixed(0)}%`);
    console.log(`Точки за дели се на 9: ${bestConfig.points[9].join('/')}т [9/6/3/грешен]`);
    console.log(`Точки за дели се на 6: ${bestConfig.points[6].join('/')}т [6/3/грешен]`);
    console.log(`Точки за дели се на 3: ${bestConfig.points[3].join('/')}т [3/грешен]`);
    console.log(`Точки за друго: ${bestConfig.points.other.join('/')}т [друго/грешен]`);
    console.log(`\n⭐ БАЛАНС: ${bestConfig.balance}%\n`);
    
    const simulator = new GameSimulator(bestConfig);
    
    [10, 20, 40].forEach(numQuestions => {
        const { results, balance } = simulator.runSimulation(numQuestions);
        console.log(`${numQuestions} задачи (баланс: ${balance}%):`);
        console.log(`  Натиска '3':     avg=${results['3'].avg}т  (${results['3'].min}-${results['3'].max})`);
        console.log(`  Натиска '6':     avg=${results['6'].avg}т  (${results['6'].min}-${results['6'].max})`);
        console.log(`  Натиска '9':     avg=${results['9'].avg}т  (${results['9'].min}-${results['9'].max})`);
        console.log(`  Натиска 'друго': avg=${results['other'].avg}т  (${results['other'].min}-${results['other'].max})`);
        console.log();
    });
    
    console.log("\n💡 ИНТЕРПРЕТАЦИЯ:");
    console.log("- Баланс под 30% е отличен (разлика ~6т при 20 задачи)");
    console.log("- Баланс под 50% е добър (разлика ~10т при 20 задачи)");
    console.log("- Отрицателни точки стимулират мислене вместо случайно натискане");
    
    // Test maximum possible score (perfect player)
    console.log("\n\n🎯 ТЕСТ: МАКСИМАЛЕН ВЪЗМОЖЕН РЕЗУЛТАТ (ДЕТЕТО ПОЗНАВА ВСЕКИ ПЪТ)\n");
    
    [10, 20, 40].forEach(numQuestions => {
        const maxScores = [];
        for (let i = 0; i < 1000; i++) {
            let score = 0;
            for (let q = 0; q < numQuestions; q++) {
                const number = simulator.generateNumber(bestConfig.probabilities);
                const correctAnswer = simulator.getCorrectAnswer(number);
                score += simulator.calculatePoints(number, correctAnswer, bestConfig.points);
            }
            maxScores.push(score);
        }
        
        const avg = (maxScores.reduce((a, b) => a + b, 0) / maxScores.length).toFixed(2);
        const min = Math.min(...maxScores);
        const max = Math.max(...maxScores);
        const variance = ((max - min) / parseFloat(avg) * 100).toFixed(1);
        
        console.log(`${numQuestions} задачи (перфектна игра):`);
        console.log(`  Средно:    ${avg}т`);
        console.log(`  Диапазон:  ${min}т - ${max}т`);
        console.log(`  Вариация:  ${variance}%`);
        console.log();
    });
    
    console.log("📊 ЗНАЧЕНИЕ:");
    console.log("- Високата вариация (>15%) означава, че максималният резултат силно зависи от късмета");
    console.log("- Ниската вариация (<10%) означава предсказуем максимум");
}
