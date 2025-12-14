# Multi-Tenant Групова Система

## Как работи

Приложението сега поддържа **групи с отделни leaderboards**. Всяка група има собствен уникален ID и независими резултати.

## Основни функции

### 1. Автоматично генериране на Group ID

Когато полето "Група" е празно, системата автоматично генерира уникален ID от:
- 2 случайни английски думи (от речник от 40 думи)
- Тире като разделител
- Случайно число от 0 до 100

**Примери**: `alpha-beta-42`, `fire-moon-67`, `tech-wave-23`, `blue-star-91`

### 2. Споделяне на групи

Играчи могат да:
1. Видят автоматично генерирания Group ID в полето "Група"
2. Споделят този код с други хора
3. Други въвеждат същия код за да играят към същия leaderboard

### 3. Персистентност

- Group ID се запазва в `localStorage` под ключ `currentGroupId`
- При следващо влизане, групата се зарежда автоматично
- Може да се промени по всяко време чрез въвеждане на нов код

## Използване

### За нови потребители:
1. Отворете играта
2. Оставете полето "Група" празно
3. Започнете игра → системата генерира код (напр. `alpha-beta-42`)
4. Споделете кода с приятели

### За присъединяване към съществуваща група:
1. Получете Group ID от приятел (напр. `alpha-beta-42`)
2. Въведете го в полето "Група"
3. Започнете игра → ще видите общия leaderboard

## Firebase структура

```
groups/
  ├─ alpha-beta-42/
  │   └─ leaderboards/
  │       ├─ division_20q_medium/scores/
  │       └─ math_20q_3d_subtraction_hard/scores/
  ├─ fire-moon-67/
  │   └─ leaderboards/
  │       └─ ... (независими резултати)
  └─ default/
      └─ leaderboards/ (fallback)
```

## API

### GroupManager

```javascript
// Глобален singleton
const groupManager = new GroupManager();

// Генерира нов group ID
const id = groupManager.generateGroupId(); // "alpha-beta-42"

// Връща текущия или генерира нов
const current = groupManager.getGroupId();

// Задава и записва group ID
groupManager.setGroupId('my-custom-group-123');

// Изтрива group ID (за testing)
groupManager.clearGroupId();
```

### Използване в игрите

```javascript
class DivisionGame {
  startGame() {
    // ...
    this.groupId = this.getGroupId(); // Взема от input или генерира
    // ...
  }
  
  async saveToLeaderboard(result) {
    const config = {
      numQuestions: this.numQuestions,
      difficulty: this.difficulty,
      groupId: this.groupId  // ВАЖНО!
    };
    await firebaseService.saveScore('division', config, result);
  }
}
```

## Security

⚠️ **Важно за production**:

Текущите Firestore rules са отворени за всички:
```javascript
match /groups/{groupId}/leaderboards/{configKey}/scores/{docId} {
  allow read: if true;
  allow write: if true;
}
```

За production environment:
1. Добавете Firebase Authentication
2. Ограничете write достъп до authenticated users
3. Добавете rate limiting
4. Валидирайте входните данни със server-side rules

## Debugging

```javascript
// Провери текущата група
console.log(groupManager.getGroupId());

// Смени група за тестване
groupManager.setGroupId('test-group-1');

// Изтрий и ресетни
groupManager.clearGroupId();
localStorage.clear();
```

## Речник с думи

Системата използва 40 кратки английски думи:
- alpha, beta, gamma, delta, echo, fox, golf, hotel
- india, jazz, kilo, lima, mike, nova, oscar, papa
- quick, red, star, tango, ultra, victor, wolf, xray
- yellow, zero, blue, fire, ice, moon, sun, wave
- rock, wind, sky, sea, code, data, tech, dev

## Миграция на стари данни

Стари локални leaderboards остават в `localStorage` за backward compatibility и като backup.

За миграция към Firebase с групи:
```javascript
// Ръчна миграция (еднократно)
await firebaseService.migrateLocalLeaderboards();
```

**Note**: Функцията `migrateLocalLeaderboards()` трябва да се адаптира за групи - сега е deprecated.
