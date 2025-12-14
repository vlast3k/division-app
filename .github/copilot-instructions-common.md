# Общи инструкции за Math Games App

## Архитектура на проекта

### Файлова структура
```
division-app/
├── index.html          - Пълна HTML структура за всички игри
├── style.css           - Общи и специфични стилове
├── app.js             - JavaScript с всички игрови класове
├── .github/
│   ├── copilot-instructions.md                  - (deprecated)
│   ├── copilot-instructions-common.md          - Общи инструкции
│   ├── copilot-instructions-division-game.md   - Игра за делители
│   └── copilot-instructions-math-game.md       - Игра за събиране/изваждане
└── README.md          - Документация за проекта
```

### Технологичен стек
- **HTML5**: Семантична структура
- **CSS3**: Flexbox/Grid, градиенти, анимации
- **Vanilla JavaScript (ES6+)**: Класове, модули, async
- **localStorage API**: Персистентност на данни
- **History API**: Browser back button support

## Game Manager

Централен контролер за навигация между игрите.

```javascript
class GameManager {
    constructor() {
        this.gameSelectionScreen = document.getElementById('gameSelectionScreen');
        this.selectDivisionBtn = document.getElementById('selectDivisionGame');
        this.selectSubtractionBtn = document.getElementById('selectSubtractionGame');
        this.backBtns = document.querySelectorAll('.back-btn');
    }
    
    showGameSelection() // Показва началния екран
    showDivisionSetup()  // Показва setup за делители
    showSubtractionSetup() // Показва setup за събиране/изваждане
}
```

### Екрани и навигация

```
gameSelectionScreen (начало)
    ├─→ divisionSetupScreen → divisionGameScreen → divisionResultsScreen
    └─→ subtractionSetupScreen → subtractionGameScreen → subtractionResultsScreen
```

#### Начален екран (`gameSelectionScreen`)
```html
<button id="selectDivisionGame">Делители 3, 6, 9</button>
<button id="selectSubtractionGame">Събиране и изваждане</button>
```

## Общи CSS класове и стилове

### Layout
```css
.screen - Базов контейнер за екран
.hidden - display: none !important
.container - Централизиран контейнер (max-width: 600px)
```

### Бутони
```css
.big-btn - Главен action бутон
.back-btn - Бутон "Назад"
.difficulty-btn - Бутони за сложност
.config-btn - Конфигурационни бутони
.selected - Избран бутон
```

### Progress indicators
```css
.progress-bar-wrapper - Контейнер за прогрес бар
.progress-bar - Базов прогрес бар
.tasks-bar - Прогрес на задачите (зелен)
.points-earned-bar - Спечелени точки (син)
.points-possible-bar - Възможни точки (сив)
.question-progress-bar - Таймер (green→yellow→orange→red)
```

### Feedback
```css
.feedback - Съобщение за feedback
.feedback.correct - Зелен (верен отговор)
.feedback.incorrect - Червен (грешен отговор)
```

### Cards and containers
```css
.question-card - Карта за въпрос
.game-container - Контейнер за игра
.stat-box - Статистика box
```

## localStorage Структура

### Игра за делители
- `playerName` - Име на играч (споделено)
- `difficulty_division` - Сложност
- `numQuestions_division` - Брой задачи
- `leaderboard_division_{questions}q_{difficulty}` - Класация

**Пример**: `leaderboard_division_20q_medium`

### Игра за събиране/изваждане
- `playerName` - Име на играч (споделено)
- `difficulty_subtraction` - Сложност
- `numDigits_subtraction` - Брой цифри
- `numQuestions_subtraction` - Брой задачи
- `operations_subtraction` - JSON масив ["addition", "subtraction"]
- `leaderboard_math_{questions}q_{digits}d_{operations}_{difficulty}` - Класация

**Пример**: `leaderboard_math_20q_2d_addition_subtraction_medium`

## Точкувателна система (Универсална)

### Максимални точки
```javascript
maxScore = totalQuestions × 10
```

### Времева формула
```javascript
function calculatePoints(elapsedSeconds, maxTime) {
    const halfTime = maxTime / 2;
    
    if (elapsedSeconds <= halfTime) {
        return 10; // Пълни точки
    } else if (elapsedSeconds <= maxTime) {
        // Линейно намаление 10 → 5
        return Math.round(10 - ((elapsedSeconds - halfTime) / halfTime * 5));
    } else {
        return 5; // Минимум
    }
}
```

### Статистики
При край на игра се изчисляват:
- **finalScore** - Общи точки
- **totalTime** - Общо време (секунди)
- **scorePerMinute** - Точки/минута (за класация)

## Progress Bars

### Три типа прогрес бари

#### 1. Tasks Progress (Задачи)
```javascript
const tasksProgress = (currentQuestion / totalQuestions) * 100;
tasksBar.style.width = tasksProgress + '%';
```
- Цвят: Зелен градиент
- Показва: Изпълнени задачи от общите

#### 2. Points Progress (Точки)
```javascript
const maxTotalPoints = totalQuestions * 10;
const earnedProgress = (score / maxTotalPoints) * 100;
const possibleProgress = (maxPossiblePoints / maxTotalPoints) * 100;

pointsEarnedBar.style.width = earnedProgress + '%';
pointsPossibleBar.style.width = possibleProgress + '%';
```
- **Earned**: Син - спечелени точки
- **Possible**: Сив - възможни точки до момента

#### 3. Question Timer (Таймер)
```javascript
const progress = Math.min(elapsed / maxTime * 100, 100);
progressBar.style.width = (100 - progress) + '%';

// Цветове според време
const timePercent = elapsed / maxTime;
if (timePercent <= 0.5) backgroundColor = '#28a745'; // green
else if (timePercent <= 0.75) backgroundColor = '#ffc107'; // yellow
else if (timePercent <= 0.9) backgroundColor = '#fd7e14'; // orange
else backgroundColor = '#dc3545'; // red
```

## Browser Back Button Support

Всяка игра има собствен handler за back button:

```javascript
setupBackButtonHandler() {
    // Push state при старт на игра
    window.history.pushState({ gameIdentifier: true }, '');
    
    this.backButtonHandler = (e) => {
        if (this.gameInProgress) {
            e.preventDefault();
            const confirm = window.confirm('Искаш ли да приключиш играта?');
            if (confirm) {
                this.quitGame();
            } else {
                window.history.pushState({ gameIdentifier: true }, '');
            }
        }
    };
    
    window.addEventListener('popstate', this.backButtonHandler);
}

quitGame() {
    this.gameInProgress = false;
    clearInterval(this.timerInterval);
    stopQuestionTimer();
    window.removeEventListener('popstate', this.backButtonHandler);
    // Върни на setup екран
}
```

**Важно**: 
- Всяка игра използва уникален identifier в state
- Handler се премахва при край на игра
- Clean up на history state при reset

## Leaderboard система

### Общ формат на entry
```javascript
{
    name: string,           // Име на играч
    score: number,          // Финални точки
    time: number,           // Време в секунди
    scorePerMinute: number, // Точки/минута
    date: string           // Локализирана дата
}
```

### Сортиране и ограничение
```javascript
leaderboard.sort((a, b) => b.score - a.score); // Низходящо по точки
leaderboard = leaderboard.slice(0, 10);        // Топ 10
```

### Рендериране
```html
<div class="leaderboard-entry">
    <div class="leaderboard-rank">1</div>
    <div class="leaderboard-name">Име</div>
    <div class="leaderboard-stats">
        <div class="leaderboard-score">185т</div>
        <div>2:45 • 67т/мин</div>
    </div>
</div>
```

## Responsive Design

### Breakpoints
```css
@media (max-width: 600px) {
    /* Mobile adjustments */
    .game-select-btn { padding: 20px; }
    .game-title { font-size: 1.4em; }
    .num-btn { padding: 15px 10px; }
    .sub-cell { width: 50px; height: 50px; }
}
```

### Mobile-first подход
- Flex/Grid за layout
- Touch-friendly размери на бутони (min 44px)
- Readable font sizes (min 16px)

## Color Scheme

### Primary градиент
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Semantic colors
- **Success**: `#28a745` (зелен)
- **Warning**: `#ffc107` (жълт)
- **Error**: `#dc3545` (червен)
- **Info**: `#667eea` (син/лилав)

### Progress colors
- Tasks: `linear-gradient(to right, #28a745, #20c997)`
- Points Earned: `linear-gradient(to right, #667eea, #764ba2)`
- Points Possible: `#e0e0e0`

## Debugging and Development

### Console logging
За development може да се добавят:
```javascript
console.log('[DivisionGame] Starting game with config:', {
    numQuestions: this.numQuestions,
    difficulty: this.difficulty
});
```

### localStorage debugging
```javascript
// Изтрий всички leaderboards
Object.keys(localStorage)
    .filter(key => key.startsWith('leaderboard_'))
    .forEach(key => localStorage.removeItem(key));
```

### Testing generations
```javascript
// Провери разпределението на задачи
const distribution = {};
questions.forEach(q => {
    distribution[q.type] = (distribution[q.type] || 0) + 1;
});
console.table(distribution);
```

## Performance

### Таймери
- `setInterval` за общо време (100ms)
- `setInterval` за question timer (50ms за smooth animation)
- Винаги `clearInterval` при cleanup

### DOM операции
- Минимизирай reflows
- Batch DOM updates
- Използвай `classList` вместо директна промяна на style

## Бъдещи подобрения

### За игра делители
- [ ] Добавяне на 30 и 50 задачи опции
- [ ] Статистика за грешни отговори по тип
- [ ] Export на резултати

### За игра събиране/изваждане
- [ ] Визуална поддръжка за 3-5 цифри
- [ ] Умножение и деление като операции
- [ ] Смесени операции в една задача
- [ ] Анимация на носене/заемане

### Общи
- [ ] Firebase integration за cross-device leaderboards
- [ ] Звукови ефекти (toggle on/off)
- [ ] Dark mode
- [ ] Експорт на резултати (CSV/JSON)
- [ ] Printable results
- [ ] Профили с история
