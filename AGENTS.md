# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in this repository.

## Project Overview

This is a web-based game collection built with vanilla HTML, CSS, and JavaScript. The project consists of multiple game implementations:
- Snake game (貪吃蛇)
- Gomoku/Five in a Row (五子棋)
- 2048 puzzle game
- Various other HTML5 games
- Main game hub navigation page

## Development Commands

Since this is a static HTML/CSS/JavaScript project, there are no build commands or complex testing frameworks. Development involves:

### Running the Project
```bash
# Serve the project locally (using Python 3)
python -m http.server 8000

# Or using Node.js http-server (if available)
npx http-server .

# Open specific games directly in browser
# Use the VS Code launch configurations or open HTML files directly
```

### Testing Games
```bash
# Manual testing - open each game in browser:
open index.html    # Game hub
open snake.html    # Snake game
open move.html     # Gomoku game
open 2048.html     # 2048 puzzle
open boom.html     # Bubble shooter
open shape.html    # Shape matching game
open bouble.html   # Bubble game
```

### No Automated Tests
This project currently relies on manual testing. Games should be tested by:
1. Opening each game in multiple browsers (Chrome, Firefox, Edge, Safari)
2. Testing core game mechanics and win/loss conditions
3. Verifying responsive design on different screen sizes
4. Testing audio features if present

## Code Style Guidelines

### HTML Structure
- Use semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<nav>`, etc.)
- Include proper DOCTYPE: `<!DOCTYPE html>`
- Set language attribute: `<html lang="zh-TW">` (Traditional Chinese)
- Use consistent meta tags for viewport and charset
- Organize CSS in `<style>` tags within HTML files (no external CSS files)
- Place JavaScript in `<script>` tags at the end of `<body>`

### CSS Conventions
- Use BEM-like naming for classes: `.game-container`, `.game-board`, `.cell--active`
- Mobile-first responsive design with media queries
- CSS variables for consistent colors and spacing
- Use flexbox and grid for layouts
- Smooth transitions and animations for game elements
- Consistent color scheme across games

### JavaScript Guidelines
- Use modern ES6+ features: `const`/`let`, arrow functions, template literals
- Organize code with clear function separation
- Use descriptive function and variable names
- Event delegation for dynamic content
- Local storage for game state persistence when appropriate
- Error handling for game edge cases

### Game Implementation Patterns
- Canvas-based rendering for most games
- RequestAnimationFrame for smooth animations
- State management using objects (e.g., `gameState = { ... }`)
- Clear separation between game logic and rendering
- Keyboard and touch input support
- Score tracking and high score persistence
- Game loop pattern with update/render cycle

### Naming Conventions
- **Files**: kebab-case (e.g., `game-name.html`)
- **Variables**: camelCase (e.g., `currentPlayer`, `gameBoard`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `GRID_SIZE`, `WIN_COUNT`)
- **Functions**: camelCase with descriptive verbs (e.g., `initGame()`, `handleCellClick()`)
- **CSS Classes**: kebab-case with BEM modifiers (e.g., `.game-card`, `.game-card--active`)
- **HTML Elements**: lowercase with hyphens for custom elements

### Code Organization
```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <!-- Meta tags, title, external fonts -->
    <style>
        /* CSS Variables */
        :root { }
        
        /* Base styles */
        * { }
        body { }
        
        /* Component styles */
        .game-container { }
        .game-board { }
        
        /* Responsive styles */
        @media (max-width: 768px) { }
    </style>
</head>
<body>
    <!-- Game HTML structure -->
    
    <script>
        // Constants and configuration
        const GRID_SIZE = 15;
        
        // Game state
        let gameState = {};
        
        // DOM elements
        const gameBoard = document.getElementById('gameBoard');
        
        // Initialization
        function initGame() { }
        
        // Game logic functions
        function updateGame() { }
        
        // Rendering functions
        function render() { }
        
        // Event handlers
        function handleClick() { }
        
        // Start game
        initGame();
    </script>
</body>
</html>
```

### Performance Guidelines
- Use `requestAnimationFrame` for animations
- Optimize canvas rendering (clear only necessary areas)
- Debounce resize events
- Use CSS transforms instead of changing position properties
- Minimize DOM queries by caching elements
- Use object pooling for frequently created/destroyed game objects

### Accessibility Guidelines
- Include keyboard navigation support
- Add ARIA labels for game elements
- Ensure sufficient color contrast
- Provide visual and audio feedback for actions
- Make text readable at different zoom levels

### Browser Compatibility
- Target modern browsers (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Use feature detection for newer APIs
- Provide fallbacks for audio features
- Test on both desktop and mobile browsers
- Ensure touch events work alongside mouse events

### File Structure
- Each game in its own HTML file with embedded CSS/JS
- Shared assets (fonts, images) in root directory
- `.vscode/` directory for VS Code configuration
- Games can be opened independently or through main hub

### Localization
- All text content in Traditional Chinese (zh-TW)
- Use proper HTML lang attribute
- Consider Unicode characters for game elements
- Test Chinese font rendering across browsers

## Development Workflow

1. **Adding New Games**
   - Create new HTML file following naming convention
   - Copy boilerplate structure from existing games
   - Add to `index.html` game hub navigation
   - Add VS Code launch configuration in `.vscode/launch.json`
   - Test across browsers and devices

2. **Modifying Existing Games**
   - Test changes thoroughly on original game
   - Check for impacts on shared styles if any
   - Verify responsive design still works
   - Test game logic and win/loss conditions

3. **Code Review Checklist**
   - [ ] Game mechanics work correctly
   - [ ] Responsive design tested on mobile
   - [ ] Keyboard and mouse/touch inputs work
   - [ ] Performance is smooth (60fps target)
   - [ ] Error handling for edge cases
   - [ ] Accessible to keyboard navigation
   - [ ] Traditional Chinese text displays correctly

## Debugging Tips

- Use browser DevTools for JavaScript debugging
- Check console for errors during game initialization
- Use `console.log()` for game state debugging during development
- Test on different screen sizes using DevTools device emulation
- Use Performance tab to analyze animation frame rates