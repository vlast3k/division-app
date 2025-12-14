# Игра за делители 3, 6, 9 - Инструкции

## Общ преглед
Образователна игра за деца, която учи делимост на числата 3, 6 и 9. Играчът трябва да избере **най-големия** делител за показаното число.

## Конфигурация

### Брой задачи
- **Опции**: 10 или 20 задачи
- **Default**: 20 задачи
- **UI**: Бутони в setup екрана (`.division-questions-btn`)
- **localStorage ключ**: `numQuestions_division`

### Сложност
Три нива на сложност с различно време за отговор:

| Сложност | Време | localStorage ключ |
|----------|-------|-------------------|
| Лесно    | 15 сек | `difficulty_division` |
| Средно   | 10 сек | |
| Трудно   | 6 сек  | |

**UI**: Бутони в setup екрана (`.difficulty-btn`)

### Генериране на задачи

#### Фиксирана композиция
При всяко стартиране на играта се генерира **равномерно разпределение** между 4-те типа:

```javascript
const questionsPerType = Math.floor(this.totalQuestions / 4);
const types = ['div9', 'div6', 'div3', 'other'];
```

**Примери:**
- 10 задачи: 2 от всеки тип + 2 допълнителни
- 20 задачи: 5 от всеки тип

#### Типове числа

1. **'div9'** - Числа делими на 9
   - Правилен отговор: "9"
   
2. **'div6'** - Числа делими на 6, но НЕ на 9
   - Правилен отговор: "6"
   
3. **'div3'** - Числа делими на 3, но НЕ на 6
   - Правилен отговор: "3"
   
4. **'other'** - Числа НЕ делими на 3
   - Правилен отговор: "Друго"

#### Размер на числата
- 40% двуцифрени (10-99)
- 60% трицифрени (100-999)

```javascript
const is2Digit = Math.random() < 0.4;
const min = is2Digit ? 10 : 100;
const max = is2Digit ? 99 : 999;
```

## Точкуване

### Базова система
- **Максимум на задача**: 10 точки
- **Общ максимум**: `totalQuestions × 10`
  - 10 задачи = 100 точки
  - 20 задачи = 200 точки

### Времева система
```javascript
const halfTime = maxTime / 2;

if (elapsedSeconds <= halfTime) {
    return 10; // Пълни точки
} else if (elapsedSeconds <= maxTime) {
    // Линейно намаление 10 → 5
    return Math.round(10 - ((elapsedSeconds - halfTime) / halfTime * 5));
} else {
    return 5; // Минимум
}
```

**Примери при средна сложност (10s):**
- 0-5s: 10 точки
- 5-10s: 10 → 5 точки (линейно)
- 10s+: 5 точки

## UI Елементи

### Setup Screen (`divisionSetupScreen`)
- Поле за име: `#playerName`
- Бутони за брой задачи: `.division-questions-btn`
- Бутони за сложност: `.difficulty-btn`
- Старт бутон: `#startDivisionBtn`
- Назад бутон: `.back-btn`

### Game Screen (`divisionGameScreen`)
#### Header Progress
```html
<div class="progress-label">Задачи: <span id="questionNum">1</span>/<span id="divTotalQuestions">20</span></div>
<div class="progress-label">Точки: <span id="currentScore">0</span>/<span id="divMaxScore">200</span></div>
```

#### Progress Bars
1. **Tasks Bar** (`#tasksBar`) - зелен, показва прогрес на задачите
2. **Points Earned Bar** (`#pointsEarnedBar`) - син, показва спечелени точки
3. **Points Possible Bar** (`#pointsPossibleBar`) - сив, показва възможни точки
4. **Question Timer Bar** (`.question-progress-bar`) - променя цвят green → yellow → orange → red

#### Game Elements
- Показване на число: `#numberDisplay`
- Бутони за отговор: `.answer-btn` с data-answer="3|6|9|other"
- Общо време: `#gameTime`
- Feedback съобщение: `#feedback`

### Results Screen (`divisionResultsScreen`)
- Финален резултат: `#finalScore`
- Време: `#finalTime`
- Точки/минута: `#scorePerMinute`
- Leaderboard: `#leaderboardList`
- Сложност лейбъл: `#leaderboardDifficulty`
- Играй отново: `#divisionPlayAgainBtn`
- Назад към игри: `.back-btn`

## Leaderboard

### Структура на ключа
```javascript
const key = `leaderboard_division_${this.numQuestions}q_${this.difficulty}`;
```

**Примери:**
- `leaderboard_division_10q_easy`
- `leaderboard_division_20q_medium`
- `leaderboard_division_20q_hard`

### Данни
```javascript
{
    name: "Име на играч",
    score: 185,
    time: 145, // секунди
    scorePerMinute: 76,
    date: "14.12.2025 г., 14:30:45 ч."
}
```

### Сортиране
- По `score` (низходящо)
- Запазва топ 10

## JavaScript Клас: DivisionGame

### Properties
```javascript
this.gameManager = gameManager;
this.totalQuestions = 20;
this.numQuestions = 20;
this.currentQuestion = 0;
this.score = 0;
this.startTime = null;
this.timerInterval = null;
this.questions = [];
this.difficulty = 'medium';
this.difficultySettings = {
    easy: { time: 15, name: 'Лесно' },
    medium: { time: 10, name: 'Средно' },
    hard: { time: 6, name: 'Трудно' }
};
this.gameInProgress = false;
```

### Методи

#### generateNumber(type)
Генерира число според типа

#### getCorrectAnswer(number)
Връща правилния отговор за дадено число

#### calculatePoints(elapsedSeconds)
Изчислява точки според изминало време

#### startGame()
1. Валидира име
2. Зарежда конфигурация
3. Генерира задачи (равномерно разпределение)
4. Разбърква задачите
5. Показва игра екран
6. Стартира таймери

#### showQuestion()
Показва текущата задача и стартира таймер

#### handleAnswer(userAnswer)
1. Спира таймер
2. Проверява отговор
3. Изчислява точки
4. Обновява прогрес барове
5. Показва feedback
6. Премива към следваща задача или край

#### updateProgressBars()
Синхронизира трите прогрес бара

#### startQuestionTimer()
Стартира таймер за текуща задача с цветови промени

#### endGame()
Показва резултати и записва в leaderboard

## Browser Back Button Support

```javascript
setupBackButtonHandler() {
    window.history.pushState({ divisionGame: true }, '');
    this.backButtonHandler = (e) => {
        if (this.gameInProgress) {
            e.preventDefault();
            const confirm = window.confirm('Искаш ли да приключиш играта...');
            if (confirm) this.quitGame();
            else window.history.pushState({ divisionGame: true }, '');
        }
    };
    window.addEventListener('popstate', this.backButtonHandler);
}
```

## Файлова структура

### HTML
- Setup: `#divisionSetupScreen`
- Game: `#divisionGameScreen`
- Results: `#divisionResultsScreen`

### CSS Класове
- `.difficulty-btn` - бутони за сложност
- `.division-questions-btn` - бутони за брой задачи
- `.answer-btn` - бутони за отговор
- `.progress-bar` - прогрес барове
- `.question-progress-bar` - таймер бар
- `.feedback` - съобщения (`.correct` / `.incorrect`)

### JavaScript
- Клас: `DivisionGame`
- Файл: `app.js` (линии ~40-460)
