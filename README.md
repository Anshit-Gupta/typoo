# typoo ⌨️

A minimal, beautiful **monkeytype-style** typing test that runs entirely in your terminal. No browser, no dependencies beyond chalk — just you and the keyboard.

<p align="center">
  <img src="https://img.shields.io/npm/v/typoo?color=%23e2b714&style=flat-square" alt="npm version" />
  <img src="https://img.shields.io/npm/l/typoo?color=%23646669&style=flat-square" alt="license" />
  <img src="https://img.shields.io/node/v/typoo?color=%23d1d0c5&style=flat-square" alt="node version" />
</p>

---

## ✨ Features

- **Word mode** — classic typing test with easy / medium / hard difficulty
- **Code mode** — type real JavaScript or Python snippets
- **Flicker-free rendering** — ANSI cursor-jump technique, no screen clearing
- **Personal bests** — automatically saved to `~/.typoo_pb.json`
- **Monkeytype aesthetics** — dark theme with gold/cream/red colour palette
- **Dynamic layout** — adapts to your terminal size in real-time
- **Zero config** — just install and type

---

## 📦 Install

```bash
npm install -g typoo
```

Or clone and link locally:

```bash
git clone https://github.com/anshi/typoo.git
cd typoo
npm install
npm link
```

---

## 🚀 Usage

### Word mode

```bash
typoo                     # 30s medium test (default)
typoo play                # same as above
typoo play 60             # 60-second test
typoo play easy           # easy difficulty (short words)
typoo play hard 15        # hard difficulty, 15 seconds
typoo play 45 easy        # order doesn't matter
```

### Code mode

```bash
typoo code                # random language, 30s
typoo code js             # JavaScript snippets
typoo code py             # Python snippets
typoo code js 60          # JavaScript, 60 seconds
```

### Other commands

```bash
typoo scores              # view personal bests
typoo help                # show all commands
typoo --version           # print version
```

---

## ⌨️ Controls

| Key | Action |
|-----|--------|
| any key | start timer + begin typing |
| `space` | submit current word (word mode) |
| `enter` | submit current line (code mode) |
| `backspace` | delete last character (or undo last word) |
| `esc` | quit |
| `ctrl+c` | quit |

**On the results screen:**

| Key | Action |
|-----|--------|
| `space` | play again with same settings |
| `esc` | quit |

---

## 📊 Results

After each test you get:

- **WPM** — net words per minute (correct characters ÷ 5 ÷ minutes)
- **Raw WPM** — total characters typed ÷ 5 ÷ minutes (ignoring accuracy)
- **Accuracy** — percentage of correctly typed characters
- **Visual accuracy bar** — at-a-glance performance indicator
- **Personal best tracking** — with delta from your previous best

---

## 🎯 Difficulty levels

| Level | Description |
|-------|-------------|
| `easy` | Short, common words (2–4 letters) |
| `medium` | Mixed length everyday words (default) |
| `hard` | Longer, uncommon words (7–10 letters) |

---

## 💾 Personal bests

Scores are saved automatically to `~/.typoo_pb.json`. Each combination of mode + difficulty + duration has its own record.

```bash
typoo scores    # view all personal bests
```

---

## 🔧 How it works

- **Flicker-free rendering** — uses ANSI escape codes (`\x1b[H` cursor-home + `\x1b[J` clear-below) instead of full screen clears
- **Raw mode input** — `process.stdin.setRawMode(true)` for instant keypress handling
- **Event-driven** — no `while(true)` loops; runs entirely on Node.js event listeners
- **Dynamic word wrapping** — recalculates layout based on `process.stdout.columns` on every draw
- **Single write per frame** — entire screen composed in memory, written in one `process.stdout.write()` call

---

## 📋 Requirements

- **Node.js** ≥ 14.0.0
- An interactive terminal (TTY) — won't work in piped/non-interactive environments
- Works on **Windows**, **macOS**, and **Linux**

---

## 🗑️ Uninstall

```bash
npm uninstall -g typoo
```

To also remove your personal bests:

```bash
# macOS / Linux
rm ~/.typoo_pb.json

# Windows (PowerShell)
Remove-Item "$env:USERPROFILE\.typoo_pb.json"
```

---

## 📄 License

MIT

---

<p align="center">
  <sub>Built with ❤️ and too much caffeine</sub>
</p>
