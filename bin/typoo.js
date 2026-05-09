#!/usr/bin/env node
'use strict';

const chalk   = require('chalk');
const pkg     = require('../package.json');
const args    = process.argv.slice(2);
const cmd     = args[0] || 'play';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

switch (cmd) {
  case 'play': {
    // parse remaining args — difficulty and duration can be in either order
    let duration   = 30;
    let difficulty = 'medium';
    for (let i = 1; i < args.length; i++) {
      if (DIFFICULTIES.includes(args[i])) {
        difficulty = args[i];
      } else {
        const n = parseInt(args[i], 10);
        if (!isNaN(n) && n > 0) duration = n;
      }
    }
    require('../index.js')(duration, difficulty);
    break;
  }

  case 'code': {
    const CODE_LANGS = ['js', 'py'];
    let duration = 30;
    let language = null;
    for (let i = 1; i < args.length; i++) {
      if (CODE_LANGS.includes(args[i])) {
        language = args[i];
      } else {
        const n = parseInt(args[i], 10);
        if (!isNaN(n) && n > 0) duration = n;
      }
    }
    require('../index.js').code(duration, language);
    break;
  }

  case 'scores':
    require('../index.js').showScores();
    break;

  case 'help':
  case '--help':
  case '-h':
    console.log(`
  ${chalk.hex('#e2b714').bold('typoo')}  ${chalk.hex('#646669')('— minimal CLI typing test')}

  ${chalk.hex('#d1d0c5')('usage:')}
    ${chalk.hex('#e2b714')('typoo play')}                start a 30s medium test
    ${chalk.hex('#e2b714')('typoo play 60')}             60s medium test
    ${chalk.hex('#e2b714')('typoo play easy')}           30s easy test
    ${chalk.hex('#e2b714')('typoo play hard 60')}        60s hard test
    ${chalk.hex('#e2b714')('typoo play 15 easy')}        15s easy test
    ${chalk.hex('#e2b714')('typoo code')}                random code snippet, 30s
    ${chalk.hex('#e2b714')('typoo code js')}             JavaScript, 30s
    ${chalk.hex('#e2b714')('typoo code py')}             Python, 30s
    ${chalk.hex('#e2b714')('typoo code js 60')}          JavaScript, 60s
    ${chalk.hex('#e2b714')('typoo code 60')}             random language, 60s
    ${chalk.hex('#e2b714')('typoo scores')}              show personal bests
    ${chalk.hex('#e2b714')('typoo github')}              open GitHub repo in browser
    ${chalk.hex('#e2b714')('typoo help')}                show this help

  ${chalk.hex('#d1d0c5')('difficulties:')}
    ${chalk.hex('#646669')('easy')}         short common words (2-4 letters)
    ${chalk.hex('#646669')('medium')}       mixed length words (default)
    ${chalk.hex('#646669')('hard')}         longer uncommon words (7-10 letters)

  ${chalk.hex('#d1d0c5')('during test:')}
    ${chalk.hex('#646669')('any key')}      start typing (timer begins on first char)
    ${chalk.hex('#646669')('space')}        submit word (word mode) / type normally (code mode)
    ${chalk.hex('#646669')('backspace')}    delete last char
    ${chalk.hex('#646669')('esc')}          quit

  ${chalk.hex('#d1d0c5')('on results screen:')}
    ${chalk.hex('#646669')('space')}        play again
    ${chalk.hex('#646669')('esc')}          quit
`);
    break;

  case 'github':
  case 'repo': {
    const { exec } = require('child_process');
    const url = 'https://github.com/Anshit-Gupta/typoo';
    const openCmd = process.platform === 'win32' ? `start "" "${url}"`
                  : process.platform === 'darwin' ? `open "${url}"`
                  : `xdg-open "${url}"`;
    console.log(`  opening ${chalk.hex('#e2b714')(url)} ...`);
    exec(openCmd, (err) => {
      if (err) console.log(`  could not open browser. visit: ${chalk.hex('#e2b714')(url)}`);
    });
    break;
  }

  case 'version':
  case '--version':
  case '-v':
    console.log('typoo v' + pkg.version);
    break;

  default:
    console.log(`  unknown command: ${cmd}\n  try: typoo help`);
    process.exit(1);
}
