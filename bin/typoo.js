#!/usr/bin/env node
'use strict';

const chalk   = require('chalk');
const pkg     = require('../package.json');
const args    = process.argv.slice(2);

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const SUBCOMMANDS  = ['code', 'zen', 'scores', 'help', '--help', '-h', 'github', 'repo', 'version', '--version', '-v'];

// Determine if first arg is a subcommand or a word-mode argument
const cmd = args.length === 0 ? 'word'
          : SUBCOMMANDS.includes(args[0]) ? args[0]
          : 'word';

// For word mode, parse ALL args (not slice from 1) since there's no "play" prefix
const wordArgs = cmd === 'word' ? args : args.slice(1);

switch (cmd) {
  case 'word': {
    let duration   = 30;
    let difficulty = 'medium';
    for (let i = 0; i < wordArgs.length; i++) {
      if (DIFFICULTIES.includes(wordArgs[i])) {
        difficulty = wordArgs[i];
      } else {
        const n = parseInt(wordArgs[i], 10);
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
    for (let i = 0; i < wordArgs.length; i++) {
      if (CODE_LANGS.includes(wordArgs[i])) {
        language = wordArgs[i];
      } else {
        const n = parseInt(wordArgs[i], 10);
        if (!isNaN(n) && n > 0) duration = n;
      }
    }
    require('../index.js').code(duration, language);
    break;
  }

  case 'scores':
    require('../index.js').showScores();
    break;

  case 'zen':
    require('../index.js').zen();
    break;

  case 'help':
  case '--help':
  case '-h':
    console.log(`
  ${chalk.hex('#e2b714').bold('typoo')}  ${chalk.hex('#646669')('— minimal CLI typing test')}

  ${chalk.hex('#d1d0c5')('usage:')}
    ${chalk.hex('#e2b714')('typoo')}                    30s medium test
    ${chalk.hex('#e2b714')('typoo 60')}                  60s medium test
    ${chalk.hex('#e2b714')('typoo easy')}                30s easy test
    ${chalk.hex('#e2b714')('typoo hard 60')}              60s hard test
    ${chalk.hex('#e2b714')('typoo easy 60')}              60s easy test

    ${chalk.hex('#e2b714')('typoo code')}                random code snippet · 30s
    ${chalk.hex('#e2b714')('typoo code js')}              javascript · 30s
    ${chalk.hex('#e2b714')('typoo code py')}              python · 30s
    ${chalk.hex('#e2b714')('typoo code js 60')}            javascript · 60s

    ${chalk.hex('#e2b714')('typoo zen')}                  free typing · no pressure

    ${chalk.hex('#e2b714')('typoo scores')}              show personal bests
    ${chalk.hex('#e2b714')('typoo github')}              open github repo in browser
    ${chalk.hex('#e2b714')('typoo help')}                show this help

  ${chalk.hex('#d1d0c5')('difficulties:')}
    ${chalk.hex('#646669')('easy')}         short common words (2-4 letters)
    ${chalk.hex('#646669')('medium')}       mixed length words (default)
    ${chalk.hex('#646669')('hard')}         longer uncommon words (7-10 letters)

  ${chalk.hex('#d1d0c5')('during test:')}
    ${chalk.hex('#646669')('any key')}      start typing (timer begins on first char)
    ${chalk.hex('#646669')('space')}        submit word (word mode)
    ${chalk.hex('#646669')('enter')}        submit line (code mode) / finish (zen mode)
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
}
