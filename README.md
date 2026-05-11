# typoo ⌨️

A minimal monkeytype-style typing test that runs entirely in your terminal.

## Features

- Word mode with easy, medium, and hard difficulty
- Code mode for JavaScript and Python snippets
- Zen mode for free typing
- Flicker-free rendering with ANSI cursor jumps
- Personal bests saved to `~/.typoo_pb.json`
- Dynamic layout that adapts to terminal size

## Install

### Windows

```bash
npm install -g typoo
```

### macOS / Linux

```bash
sudo npm install -g typoo
```

### From source

```bash
git clone https://github.com/Anshit-Gupta/typoo.git
cd typoo
npm install
npm link
```

## Screenshots

<video src="assets/typoo%20demo.mp4" controls muted playsinline></video>

<p>
	<img src="assets/screenshot-game.png" alt="typoo game screen" width="700" />
	<br/><br/>
	<img src="assets/screenshot-results.png" alt="typoo results screen" width="700" />
</p>

## Usage

### Word mode

```bash
typoo                     # 30s medium test (default)
typoo 60                  # 60-second test
typoo easy                # easy difficulty, 30s
typoo hard 60             # hard difficulty, 60 seconds
typoo easy 15             # easy difficulty, 15 seconds
```

### Code mode

```bash
typoo code                # random language, 30s
typoo code js             # JavaScript snippets
typoo code py             # Python snippets
typoo code js 60          # JavaScript, 60 seconds
```

### Zen mode

```bash
typoo zen                 # free typing, no targets, no timer
```

Press Enter or stop typing for 3 seconds to see your stats.

### Other commands

```bash
typoo scores              # view personal bests
typoo help                # show all commands
typoo --version           # print version
```

## Controls

| Key | Action |
|-----|--------|
| any key | start timer + begin typing |
| space | submit current word (word mode) |
| enter | submit current line (code mode) |
| backspace | delete last character (or undo last word) |
| esc | quit |
| ctrl+c | quit |

Results screen:

| Key | Action |
|-----|--------|
| space | play again with same settings |
| esc | quit |

## Results

- WPM: correct characters ÷ 5 ÷ minutes
- Raw WPM: total characters ÷ 5 ÷ minutes
- Accuracy: percentage of correctly typed characters
- Personal best tracking with delta from your previous best

## Difficulty levels

| Level | Description |
|-------|-------------|
| easy | Short, common words (2-4 letters) |
| medium | Mixed length everyday words (default) |
| hard | Longer, uncommon words (7-10 letters) |

## Personal bests

Scores are saved to `~/.typoo_pb.json`. Each combination of mode, difficulty, and duration has its own record.

```bash
typoo scores
```

## Requirements

- Node.js 14.0.0 or newer
- Interactive terminal (TTY)
- Windows, macOS, or Linux

## Uninstall

```bash
npm uninstall -g typoo
```

Remove personal bests:

```bash
# macOS / Linux
rm ~/.typoo_pb.json

# Windows (PowerShell)
Remove-Item "$env:USERPROFILE\.typoo_pb.json"
```

## License

MIT
