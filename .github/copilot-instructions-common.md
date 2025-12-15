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
- **Firebase Firestore**: Cloud leaderboards с multi-tenant групи
- **History API**: Browser back button support

## Group Manager

Multi-tenant система за групи, която позволява на различни групи хора да имат отделни leaderboards.

```javascript
class GroupManager {
    generateGroupId()        // Генерира 'word1-word2-number' (напр. 'alpha-beta-42')
    getGroupId()             // Връща текущия groupId или генерира нов
    setGroupId(id)           // Задава groupId и го записва в localStorage
    clearGroupId()           // Изтрива groupId (за testing)
    getGroupIdFromUrl()      // Чете ?group=xxx от URL параметър
    initFromUrl()            // Инициализира група от URL при зареждане
    getShareUrl(groupId)     // Генерира споделим URL с ?group= параметър
    shareGroup(groupId)      // Копира линк в clipboard (работи на компютър и телефон)
}
```

### Как работи групирането

1. **Автоматично генериране**: Ако полето "Група" е празно, системата генерира уникален ID от 2 случайни думи + тире + число 0-100
   - Примери: `fire-moon-67`, `tech-wave-23`, `blue-star-91`

2. **Споделяне чрез линк**: 
   - Бутон "🔗 Сподели" копира URL с `?group=xxx` параметър в clipboard
   - Работи на всички устройства (компютър, телефон, таблет)
   - Visual feedback: "✅ Копирано!" съобщение за 2 секунди
   - Fallback за стари браузъри

3. **Автоматична инициализация от URL**:
   - При отваряне на `?group=alpha-beta-42`, групата автоматично се задава
   - Групата се запазва в localStorage за следващи посещения

4. **Персистентност**: Избраната група се запазва в localStorage и се зарежда автоматично при следващо влизане

5. **Firebase структура**: 
   ```
   groups/{groupId}/leaderboards/{configKey}/scores/{scoreDoc}
   ```

### Group ID в UI

Всеки setup екран има поле за група с бутон за споделяне:

```html
<div class="input-group">
    <label>Група (или остави празно):</label>
    <div style="display: flex; gap: 8px;">
        <input type="text" id="groupId" placeholder="напр: alpha-beta-42" style="flex: 1;">
        <button id="shareGroupBtn" class="config-btn">🔗 Сподели</button>
    </div>
    <small>💡 Ако е празно, ще се създаде автоматично. Сподели кода с другите!</small>
</div>
```

#### Share функционалност:
- Кликване на "🔗 Сподели" копира URL в clipboard
- URL формат: `https://domain.com/index.html?group=alpha-beta-42`
- Visual feedback: бутонът показва "✅ Копирано!" за 2 секунди
- Работи с modern Clipboard API + fallback за стари браузъри
- Ако полето е празно, генерира група преди споделяне

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

### Достъп до Leaderboard от Setup

Всяка игра предлага два начина за достъп до leaderboard:

1. **След приключване на игра** - Стандартен flow (играеш → резултати с leaderboard)

2. **Директно от Setup екран** - Нова функционалност:
   - Бутон "🏆 Leaderboard" в setup екраните
   - Показва leaderboard-а за текущата избрана конфигурация
   - Не изисква играене
   - Бутон "← Назад към настройки" за връщане към setup

**Имплементация:**
```javascript
// В setup екраните има бутон:
<button id="viewDivisionLeaderboardBtn" class="big-btn secondary-btn">🏆 Leaderboard</button>
<button id="viewSubtractionLeaderboardBtn" class="big-btn secondary-btn">🏆 Leaderboard</button>

// Метод за показване на leaderboard без игра:
async viewLeaderboard() {
    // Скрива score/time display (понеже няма игра)
    this.finalScoreEl.parentElement.style.display = 'none';
    
    // Показва results screen с leaderboard
    this.setupScreen.classList.add('hidden');
    this.resultsScreen.classList.remove('hidden');
    
    // Рендира leaderboard за текущата конфигурация
    await this.renderLeaderboard();
}

// Метод за връщане към setup:
backToSetup() {
    this.resultsScreen.classList.add('hidden');
    this.setupScreen.classList.remove('hidden');
    
    // Възстановява score/time display
    this.finalScoreEl.parentElement.style.display = '';
}
```

### Общ формат на entry
```javascript
{
    name: string,           // Име на играч
    score: number,          // Финални точки
    time: number,           // Време в секунди
    scorePerMinute: number, // Точки/минута
    date: string,          // Локализирана дата
    timestamp: number      // Date.now() за времеви маркери
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

### Leaderboard времеви маркери

Всеки резултат показва кога е постигнат:

```javascript
formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'днес';
    if (days === 1) return 'преди 1 ден';
    return `преди ${days} дни`;
}
```

**Показване в UI:**
```html
<div class="leaderboard-name">
    Ivan <span style="color: #999; font-size: 0.85em;"> (днес)</span>
</div>
```

**Timestamp се записва:**
- В localStorage: `Date.now()` (милисекунди)
- В Firebase: `serverTimestamp()` (автоматична синхронизация)
- Стари записи без timestamp: не показват времето (graceful fallback)

### localStorage debugging
```javascript
// Изтрий всички leaderboards
Object.keys(localStorage)
    .filter(key => key.startsWith('leaderboard_'))
    .forEach(key => localStorage.removeItem(key));

// Изтрий текуща група
localStorage.removeItem('currentGroupId');
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

## Firebase Integration (Cloud Leaderboards with Groups)

### Архитектура
```
localStorage (локален):
  ├─ currentGroupId (текуща група)
  ├─ playerName (име на играч)
  ├─ game settings (настройки на игра)
  └─ leaderboard backup (резервни копия)

Firebase Firestore (облачен - multi-tenant):
  └─ groups/{groupId}/leaderboards/{config_key}/scores/{docId}
```

**Multi-tenant модел**: Всяка група има собствени leaderboards, независими от другите групи.

### Firebase Setup (еднократно)

#### 1. Създай Firebase проект
1. Отвори [Firebase Console](https://console.firebase.google.com/)
2. Кликни "Add project" → избери име (напр. "math-games-app")
3. (Optional) Изключи Google Analytics
4. Кликни "Create project"

#### 2. Добави Web App
1. В Project Overview → кликни Web icon (</>)
2. Регистрирай app с име (напр. "Math Games")
3. **НЕ** избирай "Firebase Hosting"
4. Копирай `firebaseConfig` обекта

#### 3. Enable Firestore Database
1. В левия панел → Build → Firestore Database
2. Кликни "Create database"
3. Избери локация (напр. europe-west3)
4. Старт в **Test mode** (за развойна среда)
   - Production mode изисква authentication
5. Кликни "Create"

#### 4. Конфигурирай Security Rules (за multi-tenant групи)
```javascript
// Firestore Rules за публичен достъп с групи (само за демо!)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Всяка група има собствени leaderboards
    match /groups/{groupId}/leaderboards/{configKey}/scores/{docId} {
      allow read: if true;  // Всеки може да чете leaderboards
      allow write: if true; // Всеки може да записва резултати
    }
  }
}
```

**⚠️ Важно**: Тези правила са САМО за демо! За production:
- Добави Firebase Authentication
- Ограничи write достъп (напр. само authenticated users)
- Добави rate limiting за защита от spam

#### 5. Създай `firebase-config.js`
```javascript
// Копирай този файл от firebase-config.example.js
const firebaseConfig = {
  apiKey: "AIzaSy...", // От Firebase Console
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**⚠️ Не commit-вай `firebase-config.js` в Git!**

#### 6. Добави `.gitignore`
```
firebase-config.js
```

### FirebaseService API

#### Инициализация (lazy loading)
```javascript
await firebaseService.init(); // Първо извикване
```

#### Запис на резултат
```javascript
await firebaseService.saveScore(gameType, config, scoreData);

// gameType: "division" | "math"
// config: { 
//   numQuestions: 20, 
//   difficulty: "normal", 
//   groupId: "alpha-beta-42"  // ВАЖНО: groupId определя към коя група се записва
// }
// scoreData: { name, score, time, scorePerMinute, date, timestamp }
```

#### Зареждане на leaderboard
```javascript
const scores = await firebaseService.getLeaderboard(gameType, config, limit);
// Връща масив от top {limit} резултата за конкретната група
// config.groupId определя от коя група да се четат резултатите
```

#### Merge на локални и облачни данни
```javascript
const merged = firebaseService.mergeLeaderboards(localScores, cloudScores, 10);
// Комбинира, премахва дубликати (по timestamp), сортира, взема top 10
```

#### Миграция на стари данни
```javascript
await firebaseService.migrateLocalLeaderboards();
// Еднократно: прехвърля всички localStorage leaderboards към Firebase
```

### Firestore структура (Multi-tenant)

```
groups (collection) - ROOT
  ├─ alpha-beta-42 (document) - Group ID
  │   └─ leaderboards (collection)
  │       ├─ division_20q_medium (document) - config key
  │       │   └─ scores (collection)
  │       │       ├─ doc_abc123 (auto-generated ID)
  │       │       │   ├─ name: "Ivan"
  │       │       │   ├─ score: 180
  │       │       │   ├─ time: 58
  │       │       │   ├─ scorePerMinute: 186
  │       │       │   ├─ date: "14.12.2025, 10:30"
  │       │       │   └─ timestamp: serverTimestamp()
  │       │       └─ doc_xyz789
  │       │           └─ ...
  │       └─ math_20q_3d_subtraction_hard (document)
  │           └─ scores (collection)
  │               └─ ...
  ├─ fire-moon-67 (document) - Друга група
  │   └─ leaderboards (collection)
  │       └─ ... (независими leaderboards)
  └─ default (document) - Fallback група ако няма groupId
      └─ leaderboards (collection)
```

**Важно**: Всяка група (`alpha-beta-42`, `fire-moon-67` и т.н.) има напълно отделни leaderboards!

#### Config Key генериране
```javascript
// Division game
`division_${numQuestions}q_${difficulty}`

// Math game (subtraction/addition)
`subtraction_${duration}_${difficulty}_${digits}_${operations.join('_')}`
```

### Graceful Fallback

Ако Firebase не е налична или има грешка:
1. `init()` връща `false`
2. `saveScore()` записва само в localStorage
3. `getLeaderboard()` връща localStorage данни
4. Приложението работи нормално без Firebase

### Debugging

```javascript
// Провери дали Firebase е налична
console.log(await firebaseService.isAvailable()); // true/false

// Провери credentials
console.log(firebase.app().options); // { apiKey, projectId, ... }

// Провери записи във Firestore за конкретна група
const groupId = 'alpha-beta-42';
const ref = firebase.firestore()
  .collection('groups')
  .doc(groupId)
  .collection('leaderboards')
  .doc('division_20q_medium')
  .collection('scores');
const snapshot = await ref.get();
console.log(`Записи за група ${groupId}: ${snapshot.size}`);

// Провери текущата група
console.log('Current groupId:', groupManager.getGroupId());

// Смени група (за testing)
groupManager.setGroupId('test-group-99');
```

### Troubleshooting

| Проблем | Причина | Решение |
|---------|---------|---------|
| `firebase-config.js not found` | Липсващ config файл | Копирай от `firebase-config.example.js` |
| `PERMISSION_DENIED` | Security rules блокират достъп | Промени Firestore rules за групи (виж по-горе) |
| `Failed to get document` | Няма интернет или грешен projectId | Провери network и credentials |
| Дубликати в leaderboard | Merge не работи | Провери timestamp уникалност |
| Leaderboard празен след смяна на група | Групите имат отделни данни | Нормално - всяка група има собствени резултати |
| Group ID не се запазва | localStorage проблем | Провери browser settings за cookies/storage |

### Performance оптимизации

#### Caching
```javascript
// Firebase SDK кешира данни автоматично
// За disable на cache:
firebase.firestore().disableNetwork();
```

#### Batch writes (бъдеща оптимизация)
```javascript
const batch = firebase.firestore().batch();
scores.forEach(score => {
  const ref = collection.doc();
  batch.set(ref, score);
});
await batch.commit();
```

#### Pagination (бъдеща оптимизация)
```javascript
// Зареди следващите 10
const query = collection
  .orderBy('score', 'desc')
  .startAfter(lastDoc)
  .limit(10);
```

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
- [x] Firebase integration за cross-device leaderboards ✅
- [x] Multi-tenant групи с отделни leaderboards ✅
- [x] URL споделяне на групи с ?group= параметър ✅
- [x] Clipboard копиране (компютър и мобилни) ✅
- [x] Времеви маркери в leaderboard (днес, преди X дни) ✅
- [ ] Firebase Authentication за secure leaderboards
- [ ] Звукови ефекти (toggle on/off)
- [ ] Dark mode
- [ ] Експорт на резултати (CSV/JSON)
- [ ] Printable results
- [ ] Профили с история
- [ ] Web Share API за native споделяне на мобилни
- [ ] QR код генериране за групи
