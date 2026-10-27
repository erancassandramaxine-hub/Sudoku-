# Sudoku Pro

## Open the game

Double-click `index.html`. It works without an internet connection.

The original homepage uses a cream, terracotta, and sage palette with an editorial layout. It includes a puzzle illustration, How to Play instructions, appearance settings, and statistics for the current visit. Choose **Let's play** to begin. Use **Home** to return to the homepage, then **Continue my puzzle** to resume your unfinished game. The timer stops while the homepage is visible. Continue becomes available after you start a puzzle.

## Upload the game

Upload `index.html`, `styles.css`, and `script.js` together to the same folder on any static website host. No installation or build step is required.

Keep all three files together when opening the game locally or uploading it.

After hosting, replace `[INSERT YOUR HOSTED GAME LINK]` in the social post with your actual public game URL. A local file path cannot be opened by your friends on their own devices.

## Activity materials

- `HCI-activity.md`: game instructions, social media post, and feedback table with a Key Findings paragraph template.

## Code organization

The application is split into three files:

- `index.html` defines the intro screen, dialogs, game page, and instructions.
- `styles.css` defines themes, components, and responsive layouts.
- `script.js` is organized into numbered sections: puzzle rules and generation, the `SudokuGame` model, the `GameTimer`, the `SudokuView`, controller functions, and initialization.

The model owns game state and rules. The view handles DOM updates. Controller functions connect user actions to the model and timer. Puzzle functions work without page elements. All application code runs inside a closure to avoid adding global variables.

The game does not send messages, post to social media, or collect responses. Players send their feedback to you. Closing or refreshing the game resets progress.

## Settings and sounds

Open Settings from the homepage or the game header to change:

- Appearance: light or dark mode, shared across both screens.
- Game sounds: gentle synthesized notes for selection, entries, erasing, hints, and completion. Audio starts after an interaction and needs no audio files or downloads.
- Highlight matching numbers: highlights every occurrence of the selected number and its number-pad button.
- Show mistakes: controls incorrect-entry markers, error announcements, and the visible mistake counter. Incorrect entries are still counted internally and must be corrected to finish.

All options start enabled, with light mode selected. **Reset settings to defaults** restores those preferences without changing puzzle progress, mistake totals, hints, statistics, or elapsed time. Preferences last for the current visit. The timer also stops while a settings or instructions dialog is open.
