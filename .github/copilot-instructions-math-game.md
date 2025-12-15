# Игра за събиране и изваждане - Инструкции

## Общ преглед
Образователна игра за деца, която учи вертикално събиране и изваждане на числа с носене/заемане. Играчът трябва да попълни правилните цифри и да отбележи дали има пренасяне/заем.

## Конфигурация

### Брой цифри
- **Опции**: 2, 3, 4, 5 цифри
- **Default**: 2 цифри
- **UI**: Бутони в setup екрана (`.digits-btn`)
- **localStorage ключ**: `numDigits_subtraction`
- **Важно**: В момента UI показва само последните 2 цифри (десетици и единици), независимо от избора

### Брой задачи
- **Опции**: 10, 20, 30, 50 задачи
- **Default**: 20 задачи
- **UI**: Бутони в setup екрана (`.questions-btn`)
- **localStorage ключ**: `numQuestions_subtraction`

### Операции
Възможност за избор на операции:

| Операция | Символ | localStorage |
|----------|--------|--------------|
| Събиране | ➕ + | `operations_subtraction` |
| Изваждане | ➖ − | (масив JSON) |

**Важно**: 
- Трябва да е избрана поне 1 операция
- Може да са избрани и двете едновременно
- UI: `.operation-btn` с data-operation="addition|subtraction"

### Сложност и време

Базово време + допълнително време за всяка цифра над 2:

| Сложност | Базово | За цифра 3 | За цифра 4 | За цифра 5 |
|----------|--------|------------|------------|------------|
| Лесно    | 18s    | +8s = 26s  | +16s = 34s | +24s = 42s |
| Средно   | 12s    | +4s = 16s  | +8s = 20s  | +12s = 24s |
| Трудно   | 6s     | +2s = 8s   | +4s = 10s  | +6s = 12s  |

```javascript
getTimeForDifficulty() {
    const settings = this.difficultySettings[this.difficulty];
    return settings.baseTime + (this.numDigits - 2) * settings.extraTimePerDigit;
}
```

**localStorage ключ**: `difficulty_subtraction`

## Генериране на задачи

### Пропорция carry/borrow
- **1/4 без носене/заемане** (easy)
- **3/4 с носене/заемане** (hard)

```javascript
const withoutCarry = Math.floor(this.totalQuestions / 4);
const withCarry = this.totalQuestions - withoutCarry;
```

### Алгоритъм за събиране

#### Без носене (no carry)
```javascript
// Всяка позиция: d1 + d2 < 10
const d1 = Math.floor(Math.random() * 10);
const d2 = Math.floor(Math.random() * (10 - d1));
```

#### С носене (with carry)
```javascript
// Принуждава носене в първата позиция (единиците)
const d1 = Math.floor(Math.random() * 5) + 5; // 5-9
const d2 = ... // така че d1 + d2 >= 10
```

### Алгоритъм за изваждане

#### Без заемане (no borrow)
```javascript
// Всяка позиция: d1 >= d2
const d1 = Math.floor(Math.random() * 10);
const d2 = Math.floor(Math.random() * (d1 + 1));
```

#### Със заемане (with borrow)
```javascript
// Принуждава заемане в първата позиция
const d1 = Math.floor(Math.random() * 5); // 0-4
const d2 = Math.floor(Math.random() * (10 - d1 - 1)) + d1 + 1; // d2 > d1
```

## UI и потребителско взаимодействие

### Вертикален формат

```
    [ ]         <- Carry toggle (над десетиците)
     5  5       <- Първо число
       −        <- Оператор (центриран между редовете)
     3  7       <- Второ число
  -------
    [ ] [ ]     <- Полета за отговор
    
  0  1  2  3  4   <- Клавиатура ред 1
  5  6  7  8  9   <- Клавиатура ред 2
  
  [Продължи]
```

### Carry/Borrow Toggle
- **Елемент**: `#carryToggle` (`.carry-toggle`)
- **Състояния**: 
  - Неактивно: празен кръг
  - Активно: запълнен с "1"
- **CSS клас**: `.active`

### Полета за отговор

#### Избор на поле
- **Default**: Избрани са единиците (`selectedCell = 'ones'`)
- **Клик на поле**: Маркира го като `.selected`
- **Елементи**: `#answerTens`, `#answerOnes`

#### Попълване
1. Играчът избира поле (клик)
2. Натиска цифра от клавиатурата
3. Цифрата се записва в полето
4. **Автоматично** се превключва към десетиците

```javascript
handleNumberClick(num) {
    const cell = this.selectedCell === 'tens' ? this.answerTensEl : this.answerOnesEl;
    cell.innerHTML = `<span class="answer-value">${num}</span>`;
    cell.dataset.value = num;
    
    // Auto-switch to tens after ones is filled
    if (this.selectedCell === 'ones') {
        this.selectCell('tens');
    }
}
```

### Клавиатура
- **Layout**: 2 реда (0-4, 5-9)
- **Елементи**: `.num-btn` с data-num="0-9"
- **Hover/Active ефекти**

## Валидация на отговор

```javascript
checkAnswer() {
    // Изчисли правилен резултат
    let correctResult;
    let needsCarry;
    
    if (operation === 'addition') {
        correctResult = num1 + num2;
        needsCarry = (num1Ones + num2Ones) >= 10;
    } else {
        correctResult = num1 - num2;
        needsCarry = num1Ones < num2Ones; // borrow needed
    }
    
    // Извлечи цифри
    const correctTens = Math.floor(correctResult / 10);
    const correctOnes = correctResult % 10;
    
    // Провери отговор
    const tensCorrect = correctTens === 0 ? 
        (userTens === '' || userTens === '0') : 
        (userTens === String(correctTens));
    const onesCorrect = userOnes === String(correctOnes);
    const carryCorrect = this.carryChecked === needsCarry;
    
    const isCorrect = tensCorrect && onesCorrect && carryCorrect;
}
```

### Специален случай: Водеща нула
При еднозначен резултат (например 55-48=7):
- Десетиците могат да **липсват** или да са **"0"**
- И двата варианта се приемат за верни

## Точкуване

### Базова система
- **Максимум на задача**: 10 точки
- **Общ максимум**: `totalQuestions × 10`
  - 10 задачи = 100 точки
  - 20 задачи = 200 точки
  - 30 задачи = 300 точки
  - 50 задачи = 500 точки

### Времева система
Идентична с играта за делители (вижте `copilot-instructions-division-game.md`), но с динамично време според броя цифри.

## UI Елементи

### Setup Screen (`subtractionSetupScreen`)
- Поле за име: `#playerNameSubtraction`
- Бутони за цифри: `.digits-btn`
- Бутони за задачи: `.questions-btn`
- Бутони за операции: `.operation-btn`
- Бутони за сложност: `.difficulty-btn`
- Времеви лейбъли: `#easyTimeLabel`, `#mediumTimeLabel`, `#hardTimeLabel`
- Старт: `#startSubtractionBtn`
- Назад: `.back-btn`

### Game Screen (`subtractionGameScreen`)
#### Progress
```html
<span id="subQuestionNum">1</span>/<span id="subTotalQuestions">20</span>
<span id="subCurrentScore">0</span>/<span id="subMaxScore">200</span>
```

#### Progress Bars
- Tasks: `#subTasksBar`
- Points Earned: `#subPointsEarnedBar`
- Points Possible: `#subPointsPossibleBar`
- Question Timer: `#subQuestionProgressBar`

#### Problem Display
- Числа: `#num1Tens`, `#num1Ones`, `#num2Tens`, `#num2Ones`
- Оператор: `.operator` (динамично "+" или "−")
- Carry: `#carryToggle`
- Отговори: `#answerTens`, `#answerOnes`

#### Controls
- Клавиатура: `.num-btn`
- Продължи: `#subContinueBtn`

### Results Screen (`subtractionResultsScreen`)
- Финален резултат: `#subFinalScore`
- Време: `#subFinalTime`
- Точки/минута: `#subScorePerMinute`
- Leaderboard: `#subLeaderboardList`
- Конфигурация: `#subLeaderboardDifficulty`
- Играй отново: `#subtractionPlayAgainBtn`

## Leaderboard

### Структура на ключа
```javascript
const opsKey = this.operations.sort().join('_');
const key = `leaderboard_math_${this.numQuestions}q_${this.numDigits}d_${opsKey}_${this.difficulty}`;
```

**Примери:**
- `leaderboard_math_20q_2d_subtraction_medium`
- `leaderboard_math_50q_3d_addition_subtraction_hard`
- `leaderboard_math_10q_2d_addition_easy`

### Структура на данните
Всеки запис в leaderboard включва:
```javascript
{
  name: string,      // Име на играча
  time: number,      // Време в секунди
  timestamp: number  // Date.now() когато е записан резултатът
}
```

**Firebase интеграция:**
- Резултатите се записват в: `groups/{groupId}/leaderboards/{configKey}/scores/`
- `groupId` се взима от `config.groupId` в `endGame()`
- `timestamp` се добавя автоматично с `Date.now()` преди запис
- Използва се `FirebaseService.saveScore()` за запис в облака

**Показване на времеви маркери:**
- При зареждане на leaderboard се показва времева информация
- "днес" - за резултати от последните 24 часа
- "преди X дни" - за по-стари резултати
- Времето се изчислява с `formatTimeAgo(timestamp)` функцията

### Показване
```
"20 задачи, 2 цифри, −, Средно"
"50 задачи, 3 цифри, +, −, Трудно"
```

## JavaScript Клас: SubtractionGame

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
this.numDigits = 2;
this.operations = ['subtraction'];
this.difficultySettings = {
    easy: { baseTime: 18, extraTimePerDigit: 8, name: 'Лесно' },
    medium: { baseTime: 12, extraTimePerDigit: 4, name: 'Средно' },
    hard: { baseTime: 6, extraTimePerDigit: 2, name: 'Трудно' }
};
this.selectedCell = 'ones';
this.gameInProgress = false;
```

### Методи

#### generateProblem(operation, withCarry)
Генерира задача (събиране или изваждане) с/без носене

#### getTimeForDifficulty()
Изчислява динамично време според цифри и сложност

#### updateTimeLabels()
Обновява показваните времена в setup екрана

#### selectCell(position)
Маркира поле като активно ('tens' или 'ones')

#### handleNumberClick(num)
Попълва избраното поле и превключва

#### toggleCarry()
Превключва carry checkbox

#### checkAnswer()
Валидира пълния отговор (цифри + carry)

## CSS Класове

### Математически проблем
- `.subtraction-problem` - контейнер
- `.sub-row` - ред
- `.sub-cell` - клетка
- `.operator-row` - ред за оператор (центриран)
- `.answer-cell` - поле за отговор
- `.selected` - избрано поле

### Carry Toggle
- `.carry-toggle` - бутон
- `.active` - активно състояние (с "1")

### Клавиатура
- `.number-pad` - grid контейнер (2x5)
- `.num-btn` - бутон за цифра

### Конфигурация
- `.config-group` - секция
- `.config-buttons` - контейнер за бутони
- `.config-btn` - бутон
- `.digits-btn` - бутони за цифри
- `.questions-btn` - бутони за задачи
- `.operation-btn` - бутони за операции

## Известни ограничения

⚠️ **UI поддържа само 2 цифри**: Въпреки че логиката генерира 3-5 цифрени числа, визуалният интерфейс показва само последните 2 цифри (десетици и единици). За пълна поддръжка е необходимо разширяване на HTML структурата.

## Файлова структура

### HTML
- Setup: `#subtractionSetupScreen`
- Game: `#subtractionGameScreen`
- Results: `#subtractionResultsScreen`

### JavaScript
- Клас: `SubtractionGame`
- Файл: `app.js` (линии ~550-1150)
