# Division App

A simple browser-based division calculator built with vanilla JavaScript.

## Features

- ➗ Divide two numbers
- 📊 View calculation history (last 10 operations)
- 💾 History persists in browser localStorage
- 🎨 Modern, responsive UI
- ⌨️ Keyboard support (Enter to calculate)

## Running Locally

Simply open `index.html` in your browser.

## Hosting on GitHub Pages

1. Create a new repository on GitHub (e.g., `division-app`)
2. Initialize git and push this code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/vlast3k/division-app.git
   git push -u origin main
   ```
3. Go to repository Settings → Pages
4. Under "Source", select "main" branch
5. Click "Save"
6. Your app will be live at: `https://vlast3k.github.io/division-app/`

## Project Structure

```
division-app/
├── index.html      # Main HTML structure
├── style.css       # Styling and layout
├── app.js          # Application logic
└── README.md       # This file
```

## Technology Stack

- Pure JavaScript (ES6+)
- HTML5
- CSS3 (with gradients and animations)
- localStorage API for data persistence

## Alternative Hosting Options

- **Netlify**: Drag & drop your folder at netlify.com
- **Vercel**: Connect GitHub repo at vercel.com
- **Cloudflare Pages**: Free hosting with GitHub integration
- **Surge.sh**: Simple CLI deployment
