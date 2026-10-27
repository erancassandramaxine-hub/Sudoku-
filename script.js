(() => {
  "use strict";

  // 1. Puzzle rules and generation. These functions do not access the page.
  const BOARD_SIZE = 9;
  const BOX_SIZE = 3;
  const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
  const DIGITS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const DEFAULT_SETTINGS = Object.freeze({
    darkMode: false,
    sound: true,
    highlightMatches: true,
    showMistakes: true
  });

  // Prototype categories, rather than formal ratings of solving techniques.
  const PUZZLE_SEEDS = Object.freeze({
    easy: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    medium: "000000010400000000020000000000050407008000300001090000300400200050100000000806000",
    hard: "800000000003600000070090200050007000000045700000100030001000068008500010090000400"
  });

  function getRow(index) {
    return Math.floor(index / BOARD_SIZE);
  }

  function getColumn(index) {
    return index % BOARD_SIZE;
  }

  function getBox(index) {
    const boxRow = Math.floor(getRow(index) / BOX_SIZE);
    const boxColumn = Math.floor(getColumn(index) / BOX_SIZE);
    return boxRow * BOX_SIZE + boxColumn;
  }

  function shuffle(items) {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
  }

  function canPlaceNumber(board, index, number) {
    const row = getRow(index);
    const column = getColumn(index);
    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const boxColumn = Math.floor(column / BOX_SIZE) * BOX_SIZE;

    for (let offset = 0; offset < BOARD_SIZE; offset++) {
      const rowIndex = row * BOARD_SIZE + offset;
      const columnIndex = offset * BOARD_SIZE + column;
      const boxIndex = (boxRow + Math.floor(offset / BOX_SIZE)) * BOARD_SIZE
        + boxColumn + offset % BOX_SIZE;

      if (board[rowIndex] === number || board[columnIndex] === number || board[boxIndex] === number) {
        return false;
      }
    }

    return true;
  }

  function findNextEmptyCell(board) {
    let bestCell = null;

    for (let index = 0; index < CELL_COUNT; index++) {
      if (board[index] !== 0) continue;

      const candidates = DIGITS.filter(number => canPlaceNumber(board, index, number));

      // Prefer the most constrained square to reduce backtracking.
      if (!bestCell || candidates.length < bestCell.candidates.length) {
        bestCell = { index, candidates };
      }

      if (candidates.length <= 1) break;
    }

    return bestCell;
  }

  function solvePuzzle(board) {
    const emptyCell = findNextEmptyCell(board);
    if (!emptyCell) return true;

    for (const number of emptyCell.candidates) {
      board[emptyCell.index] = number;
      if (solvePuzzle(board)) return true;
    }

    board[emptyCell.index] = 0;
    return false;
  }

  function shuffledAxis() {
    // Keep rows within bands, and columns within stacks, to preserve Sudoku rules.
    return shuffle([0, 1, 2]).flatMap(group =>
      shuffle([0, 1, 2]).map(offset => group * BOX_SIZE + offset)
    );
  }

  function createPuzzle(difficulty) {
    const seed = [...PUZZLE_SEEDS[difficulty]].map(Number);
    const digits = shuffle(DIGITS);
    const rows = shuffledAxis();
    const columns = shuffledAxis();
    const transpose = Math.random() < 0.5;

    const clues = Array.from({ length: CELL_COUNT }, (_, index) => {
      const row = rows[getRow(index)];
      const column = columns[getColumn(index)];
      const sourceIndex = transpose ? column * BOARD_SIZE + row : row * BOARD_SIZE + column;
      const value = seed[sourceIndex];
      return value === 0 ? 0 : digits[value - 1];
    });

    const solution = [...clues];
    if (!solvePuzzle(solution)) {
      throw new Error("This puzzle could not load. Please try a new game.");
    }

    return { clues, solution };
  }

  // 2. Game model. Owns progress and enforces rules without touching the DOM.
  class SudokuGame {
    constructor(difficulty) {
      this.reset(difficulty);
    }

    reset(difficulty) {
      const puzzle = createPuzzle(difficulty);

      this.difficulty = difficulty;
      this.clues = puzzle.clues;
      this.solution = puzzle.solution;
      this.values = [...puzzle.clues];
      this.hintedCells = new Set();
      this.selectedIndex = puzzle.clues.indexOf(0);
      this.mistakes = 0;
      this.hints = 0;
      this.paused = false;
      this.completed = false;
    }

    get isLocked() {
      return this.paused || this.completed;
    }

    get hasProgress() {
      return this.hints > 0 || this.mistakes > 0 ||
        this.values.some((value, index) => value !== this.clues[index]);
    }

    isIncorrect(index) {
      return this.values[index] !== 0 && this.values[index] !== this.solution[index];
    }

    selectCell(index) {
      if (this.isLocked || index < 0 || index >= CELL_COUNT) return false;
      this.selectedIndex = index;
      return true;
    }

    enterNumber(number) {
      if (this.isLocked) return "locked";
      if (this.selectedIndex < 0) return "unselected";
      if (this.clues[this.selectedIndex]) return "clue";
      if (this.values[this.selectedIndex] === number) return "unchanged";

      this.values[this.selectedIndex] = number;
      this.hintedCells.delete(this.selectedIndex);

      if (this.isIncorrect(this.selectedIndex)) {
        this.mistakes++;
        return "incorrect";
      }

      this.checkCompletion();
      return number === 0 ? "erased" : "correct";
    }

    revealHint() {
      if (this.isLocked) return -1;

      let index = this.selectedIndex;
      if (index < 0 || this.clues[index] || this.values[index] === this.solution[index]) {
        index = this.values.findIndex((value, position) => value !== this.solution[position]);
      }
      if (index < 0) return -1;

      this.selectedIndex = index;
      this.values[index] = this.solution[index];
      this.hintedCells.add(index);
      this.hints++;
      this.checkCompletion();
      return index;
    }

    checkCompletion() {
      this.completed = this.values.every((value, index) => value === this.solution[index]);
    }
  }

  // 3. Timer. The controller decides when time should advance.
  class GameTimer {
    constructor() {
      this.reset();
    }

    reset() {
      this.elapsed = 0;
      this.lastUpdated = performance.now();
    }

    update(running) {
      const now = performance.now();
      if (running) this.elapsed += now - this.lastUpdated;
      this.lastUpdated = now;
    }

    resetAnchor() {
      this.lastUpdated = performance.now();
    }
  }

  function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  // Sounds are synthesized locally and only initialized after a user action.
  // Each note is [frequency, start delay, duration, volume].
  const SOUND_PATTERNS = Object.freeze({
    select: [[440, 0, 0.035, 0.018]],
    correct: [[523.25, 0, 0.09, 0.04]],
    incorrect: [[196, 0, 0.12, 0.035], [164.81, 0.09, 0.12, 0.03]],
    erased: [[349.23, 0, 0.065, 0.025]],
    hint: [[523.25, 0, 0.12, 0.035], [659.25, 0.1, 0.15, 0.035]],
    complete: [[523.25, 0, 0.18, 0.04], [659.25, 0.15, 0.18, 0.04], [783.99, 0.3, 0.28, 0.04]]
  });

  class GameSounds {
    constructor() {
      this.enabled = true;
      this.context = null;
      this.activeNotes = new Set();
    }

    setEnabled(enabled) {
      this.enabled = enabled;
      if (enabled) return;

      for (const oscillator of this.activeNotes) oscillator.stop();
      this.activeNotes.clear();
    }

    async play(name) {
      if (!this.enabled || !SOUND_PATTERNS[name]) return;

      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        if (!this.context) this.context = new AudioContext();
        if (this.context.state === "suspended") await this.context.resume();
        if (!this.enabled || this.context.state !== "running") return;

        const startTime = this.context.currentTime;
        for (const [frequency, delay, duration, volume] of SOUND_PATTERNS[name]) {
          this.playNote(frequency, startTime + delay, duration, volume);
        }
      } catch {
        // Audio support or browser playback restrictions must never block a move.
      }
    }

    playNote(frequency, startTime, duration, volume) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      this.activeNotes.add(oscillator);
      oscillator.onended = () => {
        this.activeNotes.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.02);
    }
  }

  // 4. View. Creates controls and renders state; it does not change game rules.
  class SudokuView {
    constructor(settings) {
      const byId = id => document.getElementById(id);
      this.settings = settings;

      this.elements = {
        board: byId("board"),
        numberPad: byId("numbers"),
        difficulty: byId("difficulty"),
        newGame: byId("new"),
        timer: byId("timer"),
        mistakes: byId("mistakes"),
        hints: byId("hints"),
        overlay: byId("overlay"),
        erase: byId("erase"),
        hint: byId("hint"),
        pause: byId("pause"),
        resume: byId("resume"),
        theme: byId("theme"),
        status: byId("status"),
        welcomeScreen: byId("welcome-screen"),
        gameScreen: byId("game-screen"),
        preview: byId("puzzle-preview"),
        continueGame: byId("continue-game"),
        startGame: byId("start-game"),
        goHome: byId("go-home"),
        totalPlayed: byId("total-played"),
        totalCompleted: byId("total-completed"),
        bestTime: byId("best-time"),
        openInstructions: byId("open-instructions"),
        closeInstructions: byId("close-instructions"),
        instructionsDialog: byId("instructions-dialog"),
        openSettings: byId("open-settings"),
        closeSettings: byId("close-settings"),
        settingsDialog: byId("settings-dialog"),
        settingsTheme: byId("settings-theme"),
        gameSettings: byId("game-settings"),
        soundSetting: byId("settings-sound"),
        matchesSetting: byId("settings-matches"),
        mistakesSetting: byId("settings-mistakes"),
        mistakeStat: byId("mistake-stat"),
        settingsMistakeCount: byId("settings-mistake-count"),
        resetSettings: byId("reset-settings"),
        settingsStatus: byId("settings-status"),
        themeColor: document.querySelector('meta[name="theme-color"]')
      };
      this.cells = [];
      this.numberButtons = [];
    }

    createControls(onSelect, onKeyDown, onNumber) {
      for (let index = 0; index < CELL_COUNT; index++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cell";
        cell.addEventListener("click", () => onSelect(index));
        cell.addEventListener("keydown", onKeyDown);
        this.cells.push(cell);
        this.elements.board.appendChild(cell);
      }

      for (const number of DIGITS) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = number;
        button.setAttribute("aria-label", `Enter ${number}`);
        button.addEventListener("click", () => onNumber(number));
        this.numberButtons.push(button);
        this.elements.numberPad.appendChild(button);
      }
    }

    render(game, timer) {
      this.cells.forEach((cell, index) => this.renderCell(cell, index, game));
      this.elements.difficulty.value = game.difficulty;
      this.elements.mistakes.textContent = game.mistakes;
      this.elements.hints.textContent = game.hints;
      this.elements.mistakeStat.hidden = !this.settings.showMistakes;
      this.renderSettings(game);
      this.renderTimer(timer);
      this.renderControls(game);
    }

    renderCell(cell, index, game) {
      const selected = game.selectedIndex;
      const value = game.values[index];
      const related = selected >= 0 && (
        getRow(index) === getRow(selected) ||
        getColumn(index) === getColumn(selected) ||
        getBox(index) === getBox(selected)
      );
      const sameNumber = this.settings.highlightMatches && selected >= 0 &&
        value !== 0 && value === game.values[selected];
      const incorrect = this.settings.showMistakes && game.isIncorrect(index);
      const hinted = game.hintedCells.has(index);

      const classes = ["cell"];
      if (game.clues[index]) classes.push("given");
      if (related) classes.push("related");
      if (sameNumber) classes.push("same");
      if (selected === index) classes.push("selected");
      if (incorrect) classes.push("error");
      if (hinted) classes.push("hinted");

      const label = [
        `Row ${getRow(index) + 1}`,
        `column ${getColumn(index) + 1}`,
        value || "empty"
      ];
      if (game.clues[index]) label.push("starting clue");
      if (incorrect) label.push("incorrect");
      if (hinted) label.push("revealed by hint");

      cell.textContent = value || "";
      cell.className = classes.join(" ");
      cell.tabIndex = selected === index ? 0 : -1;
      cell.disabled = game.isLocked;
      cell.setAttribute("aria-label", label.join(", "));
      cell.setAttribute("aria-invalid", String(incorrect));
    }

    renderTimer(timer) {
      this.elements.timer.textContent = formatTime(timer.elapsed);
    }

    renderControls(game) {
      this.elements.overlay.hidden = !game.paused;
      this.elements.board.inert = game.paused;
      this.elements.pause.textContent = game.paused ? "Resume" : "Pause";
      this.elements.pause.disabled = game.completed;
      this.elements.hint.disabled = game.isLocked;
      this.elements.erase.disabled = game.isLocked;
      this.numberButtons.forEach((button, index) => {
        button.disabled = game.isLocked;
        const matching = this.settings.highlightMatches &&
          game.values[game.selectedIndex] === index + 1;
        button.className = matching ? "number-active" : "";
        button.setAttribute("aria-pressed", String(matching));
      });
    }

    showMessage(message) {
      this.elements.status.textContent = message;
    }

    createPreview() {
      for (const value of PUZZLE_SEEDS.easy) {
        const square = document.createElement("span");
        square.className = "preview-cell";
        square.textContent = value === "0" ? "" : value;
        this.elements.preview.appendChild(square);
      }
    }

    showScreen(screen) {
      this.elements.welcomeScreen.hidden = screen !== "home";
      this.elements.gameScreen.hidden = screen !== "game";
    }

    renderWelcome(session, game) {
      const canContinue = session.started && !game.completed;
      this.elements.continueGame.disabled = !canContinue;
      this.elements.continueGame.title = canContinue
        ? "Return to your current puzzle"
        : "Start a new puzzle to begin";
      this.elements.totalPlayed.textContent = session.played;
      this.elements.totalCompleted.textContent = session.completed;
      this.elements.bestTime.textContent = session.bestTime === null
        ? "–"
        : formatTime(session.bestTime);
    }

    focusCell(index) {
      this.cells[index].focus();
    }

    renderSettings(game) {
      this.elements.soundSetting.checked = this.settings.sound;
      this.elements.matchesSetting.checked = this.settings.highlightMatches;
      this.elements.mistakesSetting.checked = this.settings.showMistakes;
      this.elements.settingsMistakeCount.textContent = this.settings.showMistakes
        ? `Current puzzle: ${game.mistakes} ${game.mistakes === 1 ? "mistake" : "mistakes"}`
        : "Mistake feedback is hidden. Your entries are still checked for completion.";
    }

    applyTheme(dark) {
      document.body.classList.toggle("dark", dark);
      this.elements.theme.textContent = dark ? "Light mode" : "Dark mode";
      this.elements.theme.setAttribute("aria-pressed", String(dark));
      this.elements.settingsTheme.textContent = dark ? "Use light mode" : "Use dark mode";
      this.elements.settingsTheme.setAttribute("aria-pressed", String(dark));
      this.elements.themeColor.setAttribute("content", dark ? "#141b22" : "#f6f8f9");
    }
  }

  // 5. Controller. Connects user actions, the model, the timer, and the view.
  const game = new SudokuGame("easy");
  const timer = new GameTimer();
  const settings = { ...DEFAULT_SETTINGS };
  const sounds = new GameSounds();
  const view = new SudokuView(settings);

  // Session statistics are intentionally kept in memory, like puzzle progress.
  const session = {
    screen: "home",
    started: false,
    played: 0,
    completed: 0,
    bestTime: null,
    completionRecorded: false
  };

  const INPUT_MESSAGES = Object.freeze({
    unselected: "Select an empty square first.",
    clue: "That is a starting clue. Choose an editable square.",
    incorrect: "That number is incorrect. Try another number or use Erase.",
    erased: "Entry erased.",
    correct: "Nice! Keep going."
  });

  function updateTimer() {
    const dialogOpen = view.elements.settingsDialog.open || view.elements.instructionsDialog.open;
    timer.update(session.screen === "game" && !game.isLocked && !document.hidden && !dialogOpen);
    view.renderTimer(timer);
  }

  function renderResult(message) {
    view.render(game, timer);

    if (game.completed) {
      recordCompletion();
      view.showMessage(
        `Puzzle complete! Time: ${formatTime(timer.elapsed)}. ` +
        (settings.showMistakes ? `Mistakes: ${game.mistakes}. ` : "") +
        `Hints: ${game.hints}. Ready for another?`
      );
      view.elements.newGame.focus();
    } else if (message) {
      view.showMessage(message);
    }
  }

  function recordCompletion() {
    if (session.completionRecorded) return;

    session.completionRecorded = true;
    sounds.play("complete");
    session.completed++;
    session.bestTime = session.bestTime === null
      ? timer.elapsed
      : Math.min(session.bestTime, timer.elapsed);
    view.renderWelcome(session, game);
  }

  function showGame() {
    if (!session.started || game.completed) return;

    session.screen = "game";
    timer.resetAnchor();
    view.showScreen(session.screen);
    view.render(game, timer);

    if (game.paused) view.elements.resume.focus();
    else view.focusCell(game.selectedIndex);
  }

  function showHome() {
    updateTimer();
    session.screen = "home";
    view.renderWelcome(session, game);
    view.showScreen(session.screen);

    if (game.completed) view.elements.startGame.focus();
    else view.elements.continueGame.focus();
  }

  function startFromWelcome() {
    if (requestNewGame()) showGame();
  }

  function selectCell(index, focus = false) {
    if (session.screen !== "game") return;
    if (!game.selectCell(index)) return;
    sounds.play("select");
    view.render(game, timer);
    if (focus) view.focusCell(index);
  }

  function enterNumber(number) {
    if (session.screen !== "game") return;
    updateTimer();
    const result = game.enterNumber(number);
    const showFeedback = settings.showMistakes || !["correct", "incorrect"].includes(result);
    const message = showFeedback ? INPUT_MESSAGES[result] : "Number entered.";
    if (!game.completed) {
      sounds.play(result === "incorrect" && !settings.showMistakes ? "correct" : result);
    }
    renderResult(message);
  }

  function revealHint() {
    if (session.screen !== "game") return;
    updateTimer();
    const index = game.revealHint();
    if (index < 0) return;
    if (!game.completed) sounds.play("hint");

    renderResult(
      `Hint: row ${getRow(index) + 1}, column ${getColumn(index) + 1} ` +
      `is ${game.solution[index]}.`
    );
  }

  function togglePause() {
    if (session.screen !== "game" || game.completed) return;
    updateTimer();
    game.paused = !game.paused;
    view.render(game, timer);
    view.showMessage(game.paused
      ? "Game paused. Your timer is stopped."
      : "Welcome back! Your timer is running."
    );

    if (game.paused) view.elements.resume.focus();
    else view.focusCell(game.selectedIndex);
  }

  function requestNewGame() {
    const difficulty = view.elements.difficulty.value;
    const needsConfirmation = !game.completed && game.hasProgress;

    if (needsConfirmation && !window.confirm("Start a new puzzle? Your current progress will be lost.")) {
      view.elements.difficulty.value = game.difficulty;
      return false;
    }

    try {
      game.reset(difficulty);
      timer.reset();
      session.started = true;
      session.played++;
      session.completionRecorded = false;
      view.render(game, timer);
      view.renderWelcome(session, game);
      view.showMessage("Select an empty square, then choose a number.");
      return true;
    } catch (error) {
      view.elements.difficulty.value = game.difficulty;
      view.showMessage(error.message);
      return false;
    }
  }

  function applySettings() {
    sounds.setEnabled(settings.sound);
    view.applyTheme(settings.darkMode);
    view.render(game, timer);
  }

  function toggleTheme() {
    settings.darkMode = !settings.darkMode;
    applySettings();
  }

  function changeSetting(key, enabled) {
    settings[key] = enabled;
    view.elements.settingsStatus.textContent = "Settings updated.";
    applySettings();
    if (key === "showMistakes") {
      view.showMessage(enabled ? "Mistake feedback is on." : "Mistake feedback is off. Keep exploring at your own pace.");
    }
    if (key === "sound" && enabled) sounds.play("correct");
  }

  function resetSettings() {
    Object.assign(settings, DEFAULT_SETTINGS);
    applySettings();
    view.elements.settingsStatus.textContent = "Default settings restored. Your puzzle progress is unchanged.";
    view.showMessage("Default settings restored. Select a square to keep going.");
  }

  function openDialog(dialog) {
    updateTimer();
    if (dialog === view.elements.settingsDialog) view.elements.settingsStatus.textContent = "";
    dialog.showModal();
  }

  function closeDialog(dialog) {
    dialog.close();
    timer.resetAnchor();
  }

  function handleBoardKeyDown(event) {
    if (session.screen !== "game" || game.isLocked) return;

    const movement = {
      ArrowUp: -BOARD_SIZE,
      ArrowDown: BOARD_SIZE,
      ArrowLeft: -1,
      ArrowRight: 1
    };

    if (Object.hasOwn(movement, event.key)) {
      event.preventDefault();
      const column = getColumn(game.selectedIndex);
      const wrapsRow = (event.key === "ArrowLeft" && column === 0) ||
        (event.key === "ArrowRight" && column === BOARD_SIZE - 1);

      if (!wrapsRow) selectCell(game.selectedIndex + movement[event.key], true);
    } else if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      enterNumber(Number(event.key));
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      enterNumber(0);
    }
  }

  // 6. Initialization. All event subscriptions live here.
  function initialize() {
    view.createControls(selectCell, handleBoardKeyDown, enterNumber);
    view.createPreview();

    const controls = view.elements;
    controls.erase.addEventListener("click", () => enterNumber(0));
    controls.hint.addEventListener("click", revealHint);
    controls.pause.addEventListener("click", togglePause);
    controls.resume.addEventListener("click", togglePause);
    controls.newGame.addEventListener("click", requestNewGame);
    controls.difficulty.addEventListener("change", requestNewGame);
    controls.theme.addEventListener("click", toggleTheme);
    controls.continueGame.addEventListener("click", showGame);
    controls.startGame.addEventListener("click", startFromWelcome);
    controls.goHome.addEventListener("click", showHome);
    controls.openInstructions.addEventListener("click", () => openDialog(controls.instructionsDialog));
    controls.closeInstructions.addEventListener("click", () => closeDialog(controls.instructionsDialog));
    controls.openSettings.addEventListener("click", () => openDialog(controls.settingsDialog));
    controls.gameSettings.addEventListener("click", () => openDialog(controls.settingsDialog));
    controls.closeSettings.addEventListener("click", () => closeDialog(controls.settingsDialog));
    controls.settingsTheme.addEventListener("click", toggleTheme);
    controls.soundSetting.addEventListener("change", () => changeSetting("sound", controls.soundSetting.checked));
    controls.matchesSetting.addEventListener("change", () => changeSetting("highlightMatches", controls.matchesSetting.checked));
    controls.mistakesSetting.addEventListener("change", () => changeSetting("showMistakes", controls.mistakesSetting.checked));
    controls.resetSettings.addEventListener("click", resetSettings);
    controls.settingsDialog.addEventListener("close", () => timer.resetAnchor());
    controls.instructionsDialog.addEventListener("close", () => timer.resetAnchor());

    // Exclude time spent on another tab when the page becomes visible again.
    document.addEventListener("visibilitychange", () => timer.resetAnchor());

    applySettings();
    view.renderWelcome(session, game);
    view.showScreen(session.screen);
    view.showMessage("Select an empty square, then choose a number.");
    setInterval(updateTimer, 250);
  }

  initialize();
})();
