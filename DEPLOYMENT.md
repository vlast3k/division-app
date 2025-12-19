# Deployment Setup

## GitHub Pages Deployment

Това приложение използва GitHub Actions за автоматично deployment на GitHub Pages. 

### Първоначална настройка

1. **Активирай GitHub Pages:**
   - Отиди в Settings > Pages
   - Source: GitHub Actions

2. **Добави Firebase Secrets:**
   - Отиди в Settings > Secrets and variables > Actions
   - Кликни "New repository secret" за всеки от следните:
     - `FIREBASE_API_KEY` - твоят Firebase API ключ
     - `FIREBASE_AUTH_DOMAIN` - maths-game-11703.firebaseapp.com
     - `FIREBASE_PROJECT_ID` - maths-game-11703
     - `FIREBASE_STORAGE_BUCKET` - maths-game-11703.firebasestorage.app
     - `FIREBASE_MESSAGING_SENDER_ID` - 441500691248
     - `FIREBASE_APP_ID` - 1:441500691248:web:45fd792f889473269776f5
     - `FIREBASE_MEASUREMENT_ID` - G-JC42VJ4BPZ

3. **Push промените:**
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   git push
   ```

### Локална разработка

За локална разработка продължавай да използваш `firebase-config.js` (който е в .gitignore):

```bash
cp firebase-config.example.js firebase-config.js
# Редактирай firebase-config.js с твоите credentials
```

### Как работи

- Локално: използва `firebase-config.js`
- GitHub Pages: автоматично създава `firebase-config.js` от secrets по време на deployment
- Firebase ключовете никога не са в кода на repository

### Автоматично deployment

Всеки push към `main` branch автоматично тригерва deployment към GitHub Pages.
