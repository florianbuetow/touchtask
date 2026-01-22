# TouchTask

A minimalist productivity app that helps you structure your day with time blocks, habits, and focused work sessions. TouchTask combines time blocking, habit tracking, pomodoro timing, and kanban task management into a single, elegant interface.

![TouchTask Main Interface](docs/gfx/main-interface.jpg)
*The TouchTask dashboard showing the habits section on the left and project tracking on the right*

## About

TouchTask is a client-side web application that runs entirely in your browser. All your data is stored locally using localStorage—no account required, no server needed, your data stays on your machine.

**Key Features:**
- **Time Blocks:** Schedule recurring daily habits and routines
- **Pomodoro Timer:** Focus sessions with automatic time tracking
- **Kanban Board:** Manage projects through backlog, week, progress, and done columns
- **Daily Schedule:** Appointments and meetings for today
- **Reminders:** Quick sticky notes for things you need to remember

## Setup

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/touchtask.git
cd touchtask

# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

The built files will be in the `dist` folder. These are static files that can be hosted anywhere or opened directly in a browser.

---

## Folder Structure

```
touchtask/
├── dist/                  # Production build output
│   ├── assets/            # Compiled JS/CSS bundles
│   └── index.html         # Entry point
├── docs/                  # Documentation
│   └── gfx/               # Screenshots and images
├── frontend/              # React application source
│   ├── public/            # Static assets
│   └── src/               # Source code
│       ├── assets/        # Images, fonts, etc.
│       ├── App.jsx        # Main app component
│       └── main.jsx       # Entry point
├── .gitignore
├── .nvmrc                 # Node version
├── justfile               # Task runner commands
└── README.md
```

---

## Documentation

A video overview of the TouchTask UI and how to use its features:

[![TouchTask UI Overview](https://img.youtube.com/vi/Bihlr5uGq8g/0.jpg)](https://www.youtube.com/watch?v=Bihlr5uGq8g)

For a text based user guide and tutorial, see [docs/TUTORIAL.md](docs/TUTORIAL.md).

---

## Troubleshooting

### Data disappeared after clearing browser data
TouchTask stores everything in localStorage. Clearing browser data, cookies, or site data will erase your TouchTask data. Use the Save feature regularly to create backups.

### Timer sound not playing
- Check that your browser tab isn't muted
- Ensure the bell icon in the pomodoro section is enabled (not crossed out)
- Some browsers block audio until you've interacted with the page

### Time blocks not showing
- Check if Focus Mode is enabled (eye icon in header)—it only shows blocks scheduled for today's day of week
- Check if Time Blocks visibility is toggled off (layout icon in header)

### Tasks not saving
- Ensure you have localStorage enabled in your browser
- Check if you're in private/incognito mode (localStorage may not persist)

### App looks broken or unstyled
- Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache and reload
- Ensure JavaScript is enabled

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** for your feature: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit** with clear messages: `git commit -m "Add amazing feature"`
5. **Push** to your branch: `git push origin feature/amazing-feature`
6. **Open a Pull Request** with a description of your changes

### Development Guidelines

- Keep the minimalist aesthetic—avoid feature bloat
- Test in multiple browsers (Chrome, Firefox, Safari)
- Maintain the existing code style
- Update documentation for new features

### Reporting Issues

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information

---

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
