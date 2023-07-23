

const setup = require('./setup.js');
const { start } = require('./bot.js');
const chalk = require('chalk');

const printValues = function(values, text) {
  console.log(text ? text : 'Mevcut Degerler:');
  for (var key in values) {
    console.log(`  ${key} = \x1b[32m'${values[key]}'\x1b[0m`);
  }
}

const startBot = function(values) {
  console.log(`${chalk.bgBlue("[INFO]")} ${chalk.blue("Bot başlatılıyor. Birkaç saniye sürecektir.")}`);
  var bot = start(values);
  bot.on('restart',() => {
    console.log('\nBot yeniden baslatiliyor.');
    bot.destroy();
    bot = start(values);
  })
  var shutdown = function() {
    console.log(`${chalk.bgRed(`[DURUM]`)} ${chalk.red('Kapaniyor-kapandi.')}`);
    let destructor = bot.destroy();
    if (destructor) {
      destructor.then(() => {
        process.exit(0);
      }).catch(console.error);
    } else {
      process.exit(0);
    }
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (process.argv.includes('-c') || process.argv.includes('--config')) {
  setup.loadValues().then((values) => {
    printValues(values);
    process.exit(0);
  }).catch((error) => {
    console.log('Bir hata olustu. Veriler tekrar yükleniyor.');
    setup.createValues().then((values) => {
      setup.saveValues(values).then(() => {
        printValues(values, 'New values:');
        process.exit(0);
      }).catch(console.error);
    }).catch(console.error);
  })
} else {
  console.log(`${chalk.bold.bgYellow(`[YUKLEME]`)} ${chalk.bold.yellow('Bot hazırlanıyor. Birkaç saniye sürecektir.')}`);
  setup.loadValues().then((values) => {
    startBot(values);
  }).catch((error) => {
    console.error(error);
    setup.createValues().then((values) => {
      setup.saveValues(values).then(() => {
        startBot(values);
      }).catch(console.error);
    }).catch(console.error);
  })
}
