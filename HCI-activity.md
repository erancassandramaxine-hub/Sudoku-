# Step 1: Modified Sudoku app

Open `index.html` to play locally, keeping `styles.css` and `script.js` in the same folder. Upload all three files together to a static web host; there are no packages to install or build commands to run.

Features: a shared cream, terracotta, and sage design with dark mode; unlimited hints with a counter; timer and mistake counter; Easy/Medium/Hard preset puzzle categories; randomized puzzle variations; mouse, touch, and keyboard controls; responsive layout; beginner instructions; pause/resume. Settings includes game sounds, matching-number highlights, mistake feedback, and a reset-to-defaults button that preserves your puzzle.

The reference provided for the activity was https://sudoku-game-gray.vercel.app/. It could not be inspected in this session, so this implementation is a standalone recreation of standard Sudoku gameplay, not a verified copy of the reference's layout or source. Difficulty labels are prototype categories rather than formal technique ratings. Progress is kept only while the page remains open. The app does not collect feedback automatically.

# Step 2: Game instructions

1. Choose **Easy, Medium, or Hard**. Changing difficulty starts a new puzzle.
2. Fill empty squares with **1–9**. Every row, column, and bold **3 × 3 box** must contain each number exactly once.
3. Tap a square, then tap a number. On desktop, you can also use **arrow keys** and number keys while a board square is focused.
4. Bold starting clues cannot be changed. Use **Erase**, Backspace, or Delete to remove your entries.
5. Incorrect entries show an **exclamation mark** and increase the mistake count. You can keep trying—there is no mistake limit.
6. **Get a hint** reveals the selected unfinished square, or another unfinished square if needed. Hints are unlimited and counted separately.
7. Watch your time, use **Pause** for a break, and switch between light mode and **Dark mode**. Open **Settings** to control sounds, matching-number highlights, or mistake feedback. **Reset settings to defaults** restores light mode and enables all three options without clearing your puzzle. Time spent on another tab or in the settings dialog is excluded.
8. Use **New game** for another puzzle. Refreshing or closing the page clears progress.

# Step 3: Facebook/Instagram post

Hey friends! 🧩💜 I'm working on an HCI activity, and I'd love your help testing **Sudoku Pro**, my modified Sudoku prototype!

It has a warm cream-and-sage theme with dark mode, a hint button, a timer, a mistake counter, and Easy/Medium/Hard puzzles. You can also adjust sounds, matching-number highlights, and mistake feedback in Settings. It's made for students, Sudoku beginners, and anyone who enjoys a little brain break.

🎮 **How to play:** Fill the empty squares with numbers 1–9. Each row, column, and 3 × 3 box needs every number once—no repeats! Tap a square, then choose a number. Use **Erase** to change an entry, **Get a hint** when you're stuck, and **Pause** whenever you need a break.

👉 **Try it here: [INSERT YOUR HOSTED GAME LINK]**

After playing for a few minutes, please answer these three questions using **1–5**, and add a short comment for each:

**Q1 — Ease of use:** How easy was it to select squares, enter numbers, and correct an entry?

1 = Very difficult · 2 = Difficult · 3 = Neither difficult nor easy · 4 = Easy · 5 = Very easy

**Rating: __/5 | Comment: __**

**Q2 — Design clarity:** How clear were the board, selected-square highlight, mistake indicator, and feature labels?

1 = Very unclear · 2 = Unclear · 3 = Neither unclear nor clear · 4 = Clear · 5 = Very clear

**Rating: __/5 | Comment: __**

**Q3 — Satisfaction:** Overall, how satisfied were you with playing Sudoku Pro?

1 = Very dissatisfied · 2 = Dissatisfied · 3 = Neither dissatisfied nor satisfied · 4 = Satisfied · 5 = Very satisfied

**Rating: __/5 | Comment: __**

Please reply with your answers or send them to me privately. Mention whether you used a **phone or computer**, too—it'll help me understand your experience. Honest suggestions are welcome! Thanks for helping me improve my project! 🙌

#ThisIsDNSCIT #HCI2 #Sudoku #UsabilityTesting #StudentProject

# Step 4: Feedback summary template

Record ratings from 1–5. Use respondent codes instead of names. Label comments Q1/Q2/Q3 as appropriate.

| Respondent | Q1 Answer | Q2 Answer | Q3 Answer | Comments/Suggestions |
|---|---|---|---|---|
| R01 | ___ | ___ | ___ | ___ |
| R02 | ___ | ___ | ___ | ___ |
| R03 | ___ | ___ | ___ | ___ |
| R04 | ___ | ___ | ___ | ___ |
| R05 | ___ | ___ | ___ | ___ |
| R06 | ___ | ___ | ___ | ___ |
| R07 | ___ | ___ | ___ | ___ |
| R08 | ___ | ___ | ___ | ___ |
| R09 | ___ | ___ | ___ | ___ |
| R10 | ___ | ___ | ___ | ___ |
| **Average** | **___ / 5** | **___ / 5** | **___ / 5** | **Recurring themes: ___** |

For each question, divide the total ratings by the number of valid responses. Divide by 10 if everyone answered; leave missing responses blank rather than entering zero.

**Key Findings — fill-in paragraph**

> I collected feedback from ___ respondents. The average ratings were ___/5 for ease of use, ___/5 for design clarity, and ___/5 for overall satisfaction. Participants most liked ___. The most frequently reported difficulty was ___, mentioned by ___ respondents. Based on this feedback, I will prioritize ___ because ___. After making that change, I will test ___ again to see whether the experience improves.
