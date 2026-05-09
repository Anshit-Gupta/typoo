'use strict';

const chalk    = require('chalk');
const readline = require('readline');
const fs       = require('fs');
const os       = require('os');
const path     = require('path');

// ─── Safety net — always restore cursor on exit ──────────────────────────────
process.on('exit', () => {
  try { process.stdout.write('\x1b[?25h'); } catch {}
});
process.on('SIGINT',  () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

// ─── Palette (monkeytype-inspired) ──────────────────────────────────────────
const C = {
  bg:        '#323437',   // terminal bg (reference only)
  text:      '#646669',   // untyped words
  correct:   '#d1d0c5',   // correctly typed
  wrong:     '#ca4754',   // mistake
  cursor:    '#e2b714',   // current character highlight
  yellow:    '#e2b714',   // accents / title
  sub:       '#646669',   // dim labels
  white:     '#d1d0c5',
};

const dim    = s => chalk.hex(C.text)(s);
const good   = s => chalk.hex(C.correct)(s);
const bad    = s => chalk.hex(C.wrong)(s);
const cur    = s => chalk.bgHex(C.cursor).hex('#323437')(s);
const yellow = s => chalk.hex(C.yellow)(s);
const sub    = s => chalk.hex(C.sub)(s);
const white  = s => chalk.hex(C.white)(s);

// ─── Word banks ──────────────────────────────────────────────────────────────
const WORDS_EASY = [
  'the','be','to','of','and','a','in','it','for','not','on','he','as','you','do',
  'at','but','his','by','we','say','her','she','or','an','my','one','all','so',
  'up','out','if','who','get','go','me','can','no','him','was','had','has','its',
  'let','may','new','now','old','our','put','see','set','too','try','two','use',
  'way','why','did','end','few','got','how','man','men','own','run','top','big',
  'day','eye','far','ask','boy','cut','dog','eat','red','sit','ten','yes','add',
  'age','ago','air','arm','art','bad','bag','bed','bit','box','bus','buy','car',
  'cup','die','dry','due','ear','egg','fit','fly','fun','gas','hat','hit','hot',
  'ice','ill','job','key','kid','lay','leg','lie','lip','lot','low','map','mix',
  'net','nor','nor','odd','oil','pay','per','pie','pin','pop','pot','raw','rid',
  'row','sad','sea','sir','sky','son','sum','sun','tax','tea','tie','tip','toe',
  'toy','van','war','win','yet','aid','aim','bar','bat','bet','bid','bit','bow',
];

const WORDS_MEDIUM = [
  'the','be','to','of','and','a','in','that','have','it','for','not','on','with',
  'he','as','you','do','at','this','but','his','by','from','they','we','say','her',
  'she','or','an','will','my','one','all','would','there','their','what','so','up',
  'out','if','about','who','get','which','go','me','when','make','can','like','time',
  'no','just','him','know','take','people','into','year','your','good','some','could',
  'them','see','other','than','then','now','look','only','come','its','over','think',
  'also','back','after','use','two','how','our','work','first','well','way','even',
  'new','want','because','any','these','give','day','most','us','large','often','help',
  'hand','high','place','hold','turn','here','long','find','point','small','number',
  'off','always','move','right','show','every','between','need','feel','those','play',
  'live','far','hard','keep','let','seem','next','open','never','still','last','call',
  'try','ask','need','too','few','where','much','before','many','through','same','old',
];

const WORDS_HARD = [
  'because','between','through','another','thought','without','something','anything',
  'together','important','different','language','mountain','question','shoulder',
  'possible','tomorrow','children','complete','consider','continue','describe',
  'distance','electric','evening','example','finally','forward','general','however',
  'include','instead','kitchen','learned','machine','morning','nothing','numbers',
  'perhaps','picture','problem','process','program','quickly','reached','respond',
  'several','similar','special','started','strange','student','subject','suppose',
  'surface','thought','usually','village','whether','written','already','against',
  'brought','country','feeling','fingers','garden','herself','himself','hundred',
  'imagine','industry','kingdom','library','million','natural','obvious','patient',
  'perfect','quality','railway','receive','regular','release','require','respect',
  'science','serious','silence','society','someone','strange','success','support',
  'surprise','teacher','terrible','thousand','trouble','various','weather','welcome',
  'wonderful','yesterday','absolute','accident','actually','advanced','although',
  'announce','approach','arranged','assembly','attached','attorney','audience',
  'backward','balanced','bathroom','becoming','behavior','believed','belonged',
];

const WORD_BANKS = {
  easy:   WORDS_EASY,
  medium: WORDS_MEDIUM,
  hard:   WORDS_HARD,
};

// ─── Personal best storage ───────────────────────────────────────────────────
const PB_FILE = path.join(os.homedir(), '.typoo_pb.json');

function loadPB() {
  try {
    return JSON.parse(fs.readFileSync(PB_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function savePB(difficulty, duration, wpm, acc) {
  const pb = loadPB();
  const key = difficulty + '_' + duration;
  const prev = pb[key];
  const isNew = !prev || wpm > prev.wpm;
  if (isNew) {
    pb[key] = { wpm, acc, difficulty, duration, date: new Date().toISOString() };
    try { fs.writeFileSync(PB_FILE, JSON.stringify(pb, null, 2)); } catch {}
  }
  return { prev: prev || null, isNew };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sample(arr, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let word, tries = 0;
    do {
      word = arr[Math.floor(Math.random() * arr.length)];
      tries++;
    } while (out.length > 0 && word === out[out.length - 1] && tries < 10);
    out.push(word);
  }
  return out;
}

const CURSOR_TOP = '\x1b[H';
const CLEAR_DOWN = '\x1b[J';
const CLEAR_LINE = '\x1b[K';
const CLEAR_ALL  = '\x1b[2J\x1b[H';

function fullClear()   { process.stdout.write(CLEAR_ALL); }
function hideCursor()  { process.stdout.write('\x1b[?25l'); }
function showCursor()  { process.stdout.write('\x1b[?25h'); }
// ─── CONFIG — tweak these to change the look ────────────────────────────────
// TEXT_RATIO    : how much of the terminal width to use (0.0 – 1.0)
// MAX_WIDTH     : hard cap on text width in columns
// WORD_GAP      : spaces between words (1 = tight, 2 = normal, 3 = roomy)
// VERT_CENTER   : vertical position of content (0.0 = top, 0.5 = center)
//                 the test uses ~10 lines, so 0.35 puts it nicely above center
const TEXT_RATIO  = 0.47;
const MAX_WIDTH   = 80;
const WORD_GAP    = 1;
const VERT_CENTER = 0.35;     // ← 0.0 = top, 0.5 = middle, lower = higher on screen
// ─────────────────────────────────────────────────────────────────────────────

// Dynamic layout — recalculated every draw so it adapts to terminal resizes
const CONTENT_LINES = 10; // approx lines our UI takes (header + 3 word rows + timer + hint)
function getLayout() {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows    || 24;
  const textWidth = Math.max(20, Math.min(Math.floor(cols * TEXT_RATIO), MAX_WIDTH));
  const leftPad   = Math.max(0, Math.floor((cols - textWidth) / 2));
  const topMargin = Math.max(1, Math.floor((rows - CONTENT_LINES) * VERT_CENTER));
  return { cols, rows, textWidth, leftPad, topMargin, lineChars: textWidth };
}

// ─── Word layout ─────────────────────────────────────────────────────────────
// Returns array of lines, each line = array of word indices
function buildLines(words) {
  const { lineChars } = getLayout();
  const lines = [];
  let line = [], len = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const need = line.length === 0 ? w.length : w.length + 1;
    if (len + need > lineChars && line.length > 0) {
      lines.push(line);
      line = [i];
      len = w.length;
    } else {
      line.push(i);
      len += need;
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

// ─── Render words ─────────────────────────────────────────────────────────────
function renderLine(words, typed, currentInput, lineWordIdxs, currentWordIdx) {
  const { leftPad } = getLayout();
  let out = ' '.repeat(leftPad);
  for (let j = 0; j < lineWordIdxs.length; j++) {
    const wi = lineWordIdxs[j];
    const word = words[wi];
    if (j > 0) out += dim(' '.repeat(WORD_GAP));

    if (wi < typed.length) {
      // already submitted
      const got = typed[wi];
      if (got === word) {
        out += good(word);
      } else {
        let wOut = '';
        for (let k = 0; k < Math.max(word.length, got.length); k++) {
          if (k >= word.length) {
            wOut += bad(got[k]); // extra chars typed
          } else if (k >= got.length) {
            wOut += bad(word[k]); // missed chars
          } else if (got[k] === word[k]) {
            wOut += good(word[k]);
          } else {
            wOut += bad(word[k]);
          }
        }
        out += wOut;
      }
    } else if (wi === currentWordIdx) {
      // active word
      let wOut = '';
      const inp = currentInput;
      for (let k = 0; k < Math.max(word.length, inp.length); k++) {
        if (k >= word.length) {
          // over-typed
          wOut += bad(inp[k]);
        } else if (k === inp.length) {
          // cursor position
          wOut += cur(word[k]);
          wOut += dim(word.slice(k + 1));
          break;
        } else if (inp[k] === word[k]) {
          wOut += good(word[k]);
        } else {
          wOut += bad(word[k]);
        }
      }
      // if cursor is past the end of the word
      if (inp.length >= word.length && word.length > 0) {
        let wOut2 = '';
        for (let k = 0; k < Math.max(word.length, inp.length); k++) {
          if (k >= word.length) wOut2 += bad(inp[k]);
          else if (inp[k] === word[k]) wOut2 += good(word[k]);
          else wOut2 += bad(word[k]);
        }
        out += wOut2;
      } else {
        out += wOut;
      }
    } else {
      out += dim(word);
    }
  }
  return out;
}

// ─── Timer bar ───────────────────────────────────────────────────────────────
function renderTimer(secondsLeft, total) {
  const { lineChars } = getLayout();
  const pct = secondsLeft / total;
  const barLen = Math.min(lineChars, 40);
  const filled = Math.round(pct * barLen);
  const bar = yellow('▓'.repeat(filled)) + dim('░'.repeat(barLen - filled));
  const label = secondsLeft <= 5
    ? chalk.hex(C.wrong).bold(String(secondsLeft))
    : yellow(String(secondsLeft));
  return '  ' + bar + '  ' + label;
}

// ─── Stats ───────────────────────────────────────────────────────────────────
function calcStats(words, typed, elapsedSecs) {
  let correctWords = 0, wrongWords = 0, correctChars = 0, wrongChars = 0, totalCharsTyped = 0;
  for (let i = 0; i < typed.length; i++) {
    const word = words[i];
    const got  = typed[i];
    totalCharsTyped += got.length;
    if (got === word) {
      correctWords++;
      correctChars += got.length;
    } else {
      wrongWords++;
      // count per-character matches even in wrong words
      for (let c = 0; c < Math.max(word.length, got.length); c++) {
        if (c < word.length && c < got.length && word[c] === got[c]) correctChars++;
        else wrongChars++;
      }
    }
  }
  const mins   = elapsedSecs / 60;
  const wpm    = mins > 0 ? Math.round((correctChars / 5) / mins) : 0;
  const rawWpm = mins > 0 ? Math.round((totalCharsTyped / 5) / mins) : 0;
  const totalWords = correctWords + wrongWords;
  const acc    = totalCharsTyped > 0 ? Math.round((correctChars / totalCharsTyped) * 100) : 100;
  return { wpm, rawWpm, acc, correctWords, totalWords, correctChars, wrongChars };
}

// ─── Results screen ───────────────────────────────────────────────────────────
function showResults(words, typed, elapsed, duration, difficulty, onRestart) {
  fullClear();
  const stats = calcStats(words, typed, elapsed);
  const { wpm, rawWpm, acc, correctWords, totalWords, correctChars, wrongChars } = stats;
  const { prev, isNew } = savePB(difficulty, duration, wpm, acc);

  const { leftPad, topMargin } = getLayout();
  const pad = ' '.repeat(leftPad);
  let out = '\n'.repeat(topMargin);

  // Header
  out += pad + yellow('typoo') + sub('  ·  results') + '\n\n';

  // Mode label
  out += pad + sub(difficulty + ' · ' + duration + 's') + '\n\n';

  // Big numbers
  out += pad + chalk.hex(C.correct).bold(String(wpm).padEnd(8)) + sub('wpm') + '\n';
  out += pad + sub(String(rawWpm).padEnd(8)) + sub('raw wpm') + '\n';
  out += pad + chalk.hex(C.correct).bold((acc + '%').padEnd(8)) + sub('accuracy') + '\n\n';

  // Accuracy bar
  const barWidth = 24;
  const filled = Math.round((acc / 100) * barWidth);
  const accBar = chalk.hex(C.correct)('█'.repeat(filled)) + dim('░'.repeat(barWidth - filled));
  out += pad + accBar + '\n\n';

  // Breakdown
  out += pad + sub('words    ') + white(correctWords + ' / ' + totalWords) + '\n';
  out += pad + sub('chars    ') + white(correctChars + ' correct') + '  ' + bad(wrongChars + ' wrong') + '\n';
  out += pad + sub('duration ') + white(duration + 's') + '\n\n';

  // Personal best
  if (isNew) {
    out += pad + yellow('★  new personal best!') + '\n';
  } else if (prev) {
    const diff = wpm - prev.wpm;
    const diffStr = diff >= 0
      ? chalk.hex(C.correct)('+' + diff)
      : chalk.hex(C.wrong)(String(diff));
    out += pad + sub('personal best  ') + white(String(prev.wpm)) + sub(' wpm  ') + diffStr + sub(' wpm from best') + '\n';
  }

  out += '\n' + pad + sub('space') + white(' play again') + sub('  ·  ') + sub('esc') + white(' quit') + '\n\n';

  out = out.replace(/\n/g, CLEAR_LINE + '\n');
  process.stdout.write(CURSOR_TOP + out + CLEAR_DOWN);

  // space = play again, esc = quit
  process.stdin.removeAllListeners('keypress');
  process.stdin.on('keypress', (str, key) => {
    if (!key) return;
    if (str === ' ') {
      process.stdin.removeAllListeners('keypress');
      onRestart();
    } else if (key.name === 'escape') {
      showCursor();
      process.exit(0);
    }
  });
}

// ─── Main game ────────────────────────────────────────────────────────────────
function startGame(duration, difficulty) {
  difficulty = difficulty || 'medium';
  const wordBank  = WORD_BANKS[difficulty] || WORDS_MEDIUM;
  const wordCount = Math.max(60, duration * 4); // generous initial batch
  const words     = sample(wordBank, wordCount);
  let lines       = buildLines(words);

  // find which line each word is on
  function rebuildWordLines() {
    const wl = new Array(words.length);
    lines.forEach((l, li) => l.forEach(wi => { wl[wi] = li; }));
    return wl;
  }
  let wordLine = rebuildWordLines();

  // dynamically add more words when running low
  function ensureWords() {
    const remaining = words.length - typed.length;
    if (remaining < 20) {
      words.push(...sample(wordBank, 40));
      lines = buildLines(words);
      wordLine = rebuildWordLines();
    }
  }

  let typed        = [];
  let currentInput = '';
  let started      = false;
  let finished     = false;
  let startTime    = null;
  let secondsLeft  = duration;
  let timerInterval = null;

  // which lines to show (3-line window: previous, current, next)
  let viewOffset = 0; // first visible line index

  hideCursor();
  fullClear();

  function currentWordIdx() { return typed.length; }

  function updateViewOffset() {
    const curLine = wordLine[currentWordIdx()] ?? 0;
    // keep current word in the 2nd visible row (index 1)
    viewOffset = Math.max(0, curLine - 1);
  }

  function draw() {
    const { leftPad, topMargin } = getLayout();
    let out = '\n'.repeat(topMargin);

    const pad = ' '.repeat(leftPad);
    // header
    const status = started
      ? ''
      : sub('  start typing...');
    out += pad + yellow('typoo') + '  ' + sub(difficulty + ' · ' + duration + 's') + status + '\n\n';

    // word lines — show a 3-line window
    updateViewOffset();
    const visibleLines = lines.slice(viewOffset, viewOffset + 3);
    for (let i = 0; i < 3; i++) {
      const lineIdxs = visibleLines[i];
      if (!lineIdxs) {
        out += '\n';
      } else {
        out += renderLine(words, typed, currentInput, lineIdxs, currentWordIdx()) + '\n';
      }
    }

    out += '\n' + pad + renderTimer(secondsLeft, duration).trimStart() + '\n\n';
    out += pad + sub('esc → quit') + '\n';

    out = out.replace(/\n/g, CLEAR_LINE + '\n');
    process.stdout.write(CURSOR_TOP + out + CLEAR_DOWN);
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(timerInterval);
    const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : duration;
    showCursor();
    showResults(words, typed, elapsed, duration, difficulty, () => startGame(duration, difficulty));
  }

  function handleKey(str, key) {
    if (!key) return;

    if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
      clearInterval(timerInterval);
      showCursor();
      fullClear();
      process.exit(0);
    }

    if (finished) return;

    // ── Start on any printable key (like Monkeytype) ──
    if (!started) {
      const isPrintable = str && str.length === 1 && !key.ctrl && !key.meta;
      if (isPrintable) {
        started   = true;
        startTime = Date.now();
        timerInterval = setInterval(() => {
          secondsLeft--;
          if (secondsLeft <= 0) { secondsLeft = 0; draw(); finish(); }
          else draw();
        }, 1000);
        // include the first keystroke in input
        currentInput += str;
      }
      draw();
      return;
    }

    // ── Typing ──
    if (key.name === 'backspace') {
      if (currentInput.length > 0) {
        currentInput = currentInput.slice(0, -1);
      } else if (typed.length > 0) {
        currentInput = typed.pop();
      }
    } else if (str === ' ') {
      if (currentInput.length > 0) {
        typed.push(currentInput);
        currentInput = '';
        ensureWords(); // add more words if running low
        if (typed.length >= words.length) finish();
      }
    } else if (str && str.length === 1 && !key.ctrl && !key.meta) {
      currentInput += str;
    }

    if (!finished) draw();
  }

  readline.emitKeypressEvents(process.stdin);
  if (!process.stdin.isTTY) {
    console.error('typoo requires an interactive terminal (TTY).');
    process.exit(1);
  }
  process.stdin.setRawMode(true);

  process.stdin.removeAllListeners('keypress');
  process.stdin.on('keypress', handleKey);

  draw();
}

// ─── Entry ────────────────────────────────────────────────────────────────────
module.exports = function(duration, difficulty) {
  startGame(duration, difficulty || 'medium');
};

module.exports.showScores = function() {
  const pb = loadPB();
  const keys = Object.keys(pb).sort();
  
  console.log('\n  ' + yellow('typoo') + sub('  ·  personal bests\n'));
  
  if (keys.length === 0) {
    console.log('  ' + sub('no scores yet. run: typoo play\n'));
    return;
  }
  
  console.log('  ' + sub('mode'.padEnd(14) + 'wpm'.padEnd(8) + 'accuracy'.padEnd(10) + 'date'));
  console.log('  ' + sub('─'.repeat(50)));
  
  keys.forEach(k => {
    const s = pb[k];
    const d = new Date(s.date).toLocaleDateString();
    console.log(
      '  ' + 
      white(k.padEnd(14)) + 
      white(String(s.wpm).padEnd(8)) + 
      white((s.acc + '%').padEnd(10)) + 
      sub(d)
    );
  });
  console.log('');
};

// ─── Code Snippet Lines ──────────────────────────────────────────────────────
const SNIPPETS_JS = [
  'const sum = arr.reduce((a, b) => a + b, 0);',
  'const pairs = arr.map((v, i) => [i, v]);',
  'const unique = [...new Set(arr)];',
  'const max = Math.max(...arr);',
  'const clone = JSON.parse(JSON.stringify(obj));',
  'const sleep = ms => new Promise(r => setTimeout(r, ms));',
  'const flat = arr.flat(Infinity);',
  'const range = (n) => [...Array(n).keys()];',
  'const cap = s => s.charAt(0).toUpperCase() + s.slice(1);',
  'const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };',
  'const groupBy = (arr, key) => arr.reduce((g, v) => ({ ...g, [v[key]]: [...(g[v[key]] || []), v] }), {});',
  'const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));',
];

const SNIPPETS_PY = [
  'result = [x for x in range(10) if x % 2 == 0]',
  'is_palindrome = lambda s: s == s[::-1]',
  'flat = [x for row in matrix for x in row]',
  'counts = {k: lst.count(k) for k in set(lst)}',
  'pairs = list(zip(keys, values))',
  'merged = {**dict1, **dict2}',
  'squared = list(map(lambda x: x**2, nums))',
  'total = sum(v for v in data.values())',
  'words = sentence.strip().lower().split()',
  'unique = list(dict.fromkeys(items))',
  'evens = list(filter(lambda x: x % 2 == 0, nums))',
  'matrix = [[0] * cols for _ in range(rows)]',
];

const CODE_BANKS = { js: SNIPPETS_JS, py: SNIPPETS_PY };
const CODE_LANGS = Object.keys(CODE_BANKS);

function shuffleCodeLines(bank, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let pick, tries = 0;
    do {
      pick = bank[Math.floor(Math.random() * bank.length)];
      tries++;
    } while (out.length > 0 && pick === out[out.length - 1] && tries < 10);
    out.push(pick);
  }
  return out;
}

function renderCodeLine(target, typedStr, isCurrent, leftPad) {
  let out = ' '.repeat(leftPad);

  if (!isCurrent && typedStr !== undefined) {
    for (let c = 0; c < Math.max(target.length, typedStr.length); c++) {
      if (c >= target.length) out += bad(typedStr[c]);
      else if (c >= typedStr.length) out += bad(target[c]);
      else if (typedStr[c] === target[c]) out += good(target[c]);
      else out += bad(target[c]);
    }
  } else if (isCurrent && typedStr !== undefined) {
    let rendered = '';
    for (let c = 0; c < Math.max(target.length, typedStr.length); c++) {
      if (c >= target.length) {
        rendered += bad(typedStr[c]);
      } else if (c === typedStr.length) {
        rendered += cur(target[c]) + dim(target.slice(c + 1));
        break;
      } else if (typedStr[c] === target[c]) {
        rendered += good(target[c]);
      } else {
        rendered += bad(target[c]);
      }
    }
    if (typedStr.length >= target.length && target.length > 0) {
      rendered = '';
      for (let c = 0; c < Math.max(target.length, typedStr.length); c++) {
        if (c >= target.length) rendered += bad(typedStr[c]);
        else if (typedStr[c] === target[c]) rendered += good(target[c]);
        else rendered += bad(target[c]);
      }
    }
    out += rendered;
  } else {
    out += dim(target);
  }

  return out;
}

// ─── Code mode game ──────────────────────────────────────────────────────────
function startCodeGame(duration, language) {
  language = language || CODE_LANGS[Math.floor(Math.random() * CODE_LANGS.length)];
  const bank = CODE_BANKS[language];
  if (!bank) {
    console.log('  unknown language: ' + language + '. available: ' + CODE_LANGS.join(', '));
    process.exit(1);
  }

  duration = duration || 30;
  const codeLines   = shuffleCodeLines(bank, Math.max(30, duration * 2));
  const typedLines  = [];
  let currentInput  = '';
  let started       = false;
  let finished      = false;
  let startTime     = null;
  let secondsLeft   = duration;
  let timerInterval = null;

  hideCursor();
  fullClear();

  function currentLineIdx() { return typedLines.length; }

  function ensureLines() {
    if (codeLines.length - currentLineIdx() < 10) {
      codeLines.push(...shuffleCodeLines(bank, 20));
    }
  }

  function getViewOffset() {
    return Math.max(0, currentLineIdx() - 1);
  }

  function draw() {
    const { leftPad, topMargin } = getLayout();
    const pad = ' '.repeat(leftPad);
    let out = '\n'.repeat(topMargin);

    const status = started ? '' : sub('  start typing...');
    out += pad + yellow('typoo') + '  ' + sub('code · ' + language + ' · ' + duration + 's') + status + '\n\n';

    const offset = getViewOffset();
    for (let i = 0; i < 3; i++) {
      const li = offset + i;
      if (li >= codeLines.length) {
        out += '\n';
      } else if (li < typedLines.length) {
        out += renderCodeLine(codeLines[li], typedLines[li], false, leftPad) + '\n';
      } else if (li === currentLineIdx()) {
        out += renderCodeLine(codeLines[li], currentInput, true, leftPad) + '\n';
      } else {
        out += renderCodeLine(codeLines[li], undefined, false, leftPad) + '\n';
      }
    }

    out += '\n' + pad + renderTimer(secondsLeft, duration).trimStart() + '\n\n';
    out += pad + sub('esc → quit') + '\n';

    out = out.replace(/\n/g, CLEAR_LINE + '\n');
    process.stdout.write(CURSOR_TOP + out + CLEAR_DOWN);
  }

  function submitLine() {
    typedLines.push(currentInput);
    currentInput = '';
    ensureLines();
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(timerInterval);
    const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : duration;
    showCursor();
    showCodeResults(codeLines, typedLines, elapsed, duration, language, () => startCodeGame(duration, language));
  }

  function handleKey(str, key) {
    if (!key) return;

    if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
      clearInterval(timerInterval);
      showCursor();
      fullClear();
      process.exit(0);
    }

    if (finished) return;

    if (!started) {
      const isPrintable = str && str.length === 1 && !key.ctrl && !key.meta;
      if (isPrintable) {
        started   = true;
        startTime = Date.now();
        timerInterval = setInterval(() => {
          secondsLeft--;
          if (secondsLeft <= 0) { secondsLeft = 0; draw(); finish(); }
          else draw();
        }, 1000);
        currentInput += str;
      }
      draw();
      return;
    }

    if (key.name === 'backspace') {
      if (currentInput.length > 0) currentInput = currentInput.slice(0, -1);
    } else if (key.name === 'return' || str === '\r') {
      submitLine();
    } else if (str && str.length === 1 && !key.ctrl && !key.meta) {
      currentInput += str;
    }

    if (!finished) draw();
  }

  readline.emitKeypressEvents(process.stdin);
  if (!process.stdin.isTTY) {
    console.error('typoo requires an interactive terminal (TTY).');
    process.exit(1);
  }
  process.stdin.setRawMode(true);

  process.stdin.removeAllListeners('keypress');
  process.stdin.on('keypress', handleKey);

  draw();
}

// ─── Code results screen ─────────────────────────────────────────────────────
function showCodeResults(codeLines, typedLines, elapsed, duration, language, onRestart) {
  fullClear();

  let correctChars = 0, wrongChars = 0, totalTyped = 0, correctLines = 0;
  for (let i = 0; i < typedLines.length; i++) {
    const target = codeLines[i];
    const got    = typedLines[i];
    totalTyped  += got.length;
    let lineOk   = true;
    for (let c = 0; c < Math.max(target.length, got.length); c++) {
      if (c < target.length && c < got.length && target[c] === got[c]) correctChars++;
      else { wrongChars++; lineOk = false; }
    }
    if (lineOk && got.length === target.length) correctLines++;
  }

  const mins   = elapsed / 60;
  const wpm    = mins > 0 ? Math.round((correctChars / 5) / mins) : 0;
  const rawWpm = mins > 0 ? Math.round((totalTyped / 5) / mins) : 0;
  const acc    = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;

  const { prev, isNew } = savePB('code_' + language, duration, wpm, acc);

  const { leftPad, topMargin } = getLayout();
  const pad = ' '.repeat(leftPad);
  let out = '\n'.repeat(topMargin);

  out += pad + yellow('typoo') + sub('  ·  code results') + '\n\n';
  out += pad + sub('code · ' + language + ' · ' + duration + 's') + '\n\n';

  out += pad + chalk.hex(C.correct).bold(String(wpm).padEnd(8)) + sub('wpm') + '\n';
  out += pad + sub(String(rawWpm).padEnd(8)) + sub('raw wpm') + '\n';
  out += pad + chalk.hex(C.correct).bold((acc + '%').padEnd(8)) + sub('accuracy') + '\n\n';

  const barWidth = 24;
  const filled = Math.round((acc / 100) * barWidth);
  out += pad + chalk.hex(C.correct)('█'.repeat(filled)) + dim('░'.repeat(barWidth - filled)) + '\n\n';

  out += pad + sub('lines    ') + white(correctLines + ' / ' + typedLines.length) + '\n';
  out += pad + sub('chars    ') + white(correctChars + ' correct') + '  ' + bad(wrongChars + ' wrong') + '\n';
  out += pad + sub('duration ') + white(duration + 's') + '\n\n';

  if (isNew) {
    out += pad + yellow('★  new personal best!') + '\n';
  } else if (prev) {
    const diff = wpm - prev.wpm;
    const diffStr = diff >= 0
      ? chalk.hex(C.correct)('+' + diff)
      : chalk.hex(C.wrong)(String(diff));
    out += pad + sub('personal best  ') + white(String(prev.wpm)) + sub(' wpm  ') + diffStr + sub(' wpm from best') + '\n';
  }

  out += '\n' + pad + sub('space') + white(' play again') + sub('  ·  ') + sub('esc') + white(' quit') + '\n\n';

  out = out.replace(/\n/g, CLEAR_LINE + '\n');
  process.stdout.write(CURSOR_TOP + out + CLEAR_DOWN);

  process.stdin.removeAllListeners('keypress');
  process.stdin.on('keypress', (str, key) => {
    if (!key) return;
    if (str === ' ') {
      process.stdin.removeAllListeners('keypress');
      onRestart();
    } else if (key.name === 'escape') {
      showCursor();
      process.exit(0);
    }
  });
}

module.exports.code = function(duration, language) {
  startCodeGame(duration, language);
};

