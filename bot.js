'use strict';

const Discord = require('discord.js');
const { Client, Intents, Collection, MessageEmbed, MessageButton, MessageActionRow, MessageSelectMenu } = require("discord.js");
const fetchTimeout = require('fetch-timeout');
const chalk = require('chalk');
// ---------------------------------------------------------------------
const USER_AGENT = `FSS bot ${require('./package.json').version} , Node ${process.version} (${process.platform}${process.arch})`;

exports.start = function(SETUP) {
  /////////////////////////////////////////////////////
  const URL_SERVER = SETUP.URL_SERVER;
  const SERVER_NAME = SETUP.SERVER_NAME;
  const SERVER_LOGO = SETUP.SERVER_LOGO;
  const EMBED_COLOR = SETUP.EMBED_COLOR;
  const RESTART_TIMES = SETUP.RESTART_TIMES;
  const PERMISSION = SETUP.PERMISSION;
  const DEBUG = SETUP.DEBUG;
  const SHOW_PLAYERS = SETUP.SHOW_PLAYERS;
  const WEBSITE_URL = SETUP.WEBSITE_URL;
  const BOT_TOKEN = SETUP.BOT_TOKEN;
  const CHANNEL_ID = SETUP.CHANNEL_ID;
  const MESSAGE_ID = SETUP.MESSAGE_ID;
  const SUGGESTION_CHANNEL = SETUP.SUGGESTION_CHANNEL;
  const BUG_CHANNEL = SETUP.BUG_CHANNEL;
  const BUG_LOG_CHANNEL = SETUP.BUG_LOG_CHANNEL;
  const LOG_CHANNEL = SETUP.LOG_CHANNEL;
  const URL_PLAYERS = new URL('/players.json', SETUP.URL_SERVER).toString();
  const URL_INFO = new URL('/info.json', SETUP.URL_SERVER).toString();
  /////////////////////////////////////////////////////
  const SERVER_OFFLINE_ERROR = `Server offline ${URL_SERVER} (${URL_PLAYERS} ${URL_INFO})
  \nBilgileri dogru yazdiginiza lutfen emin olun.
  \nMesaj geldikten sonra ilgili yerleri editleyebilirsiniz.`
  /////////////////////////////////////////////////////
  const MAX_PLAYERS = 128;
  const TICK_MAX = 1 << 9;
  const FETCH_TIMEOUT = 2000;
  const FETCH_OPS = {
    'cache': 'no-cache',
    'method': 'GET',
    'headers': { 'User-Agent': USER_AGENT }
  };

  const UPDATE_TIME = 10000; // in ms

  var TICK_N = 0;
  var MESSAGE;
  var LAST_COUNT;
  var STATUS;

  var loop_callbacks = [];

  const getPlayers = function() {
    return new Promise((resolve,reject) => {
      fetchTimeout(URL_PLAYERS, FETCH_TIMEOUT).then((res) => {
        res.json().then((players) => {
          resolve(players);
        }).catch((e) => { 
          if(DEBUG != false) {
          console.log(`${chalk.bgRed(`[HATA]`)} ${chalk.red(`❌ oyuncu bilgileri alinamadi.\nHata: ${e.stack}`)}`)
        } else {
          offline();
        }
            });
      }).catch((e) => { 
        if(DEBUG != false) {
          console.log(`${chalk.bgRed(`[HATA]`)} ${chalk.red(`❌ oyuncu bilgileri alinamadi.\nHata: ${e.stack}`)}`)
        } else {
          offline();
        }
        });
    })
  };

  const getVars = function() {
    return new Promise((resolve,reject) => {
      fetchTimeout(URL_INFO, FETCH_OPS, FETCH_TIMEOUT).then((res) => {
        res.json().then((info) => {
          resolve(info.vars);
        }).catch((e) => {
          if(DEBUG != false) {
      console.log(`${chalk.bgRed(`[HATA]`)} ${chalk.red(`❌ Server bilgileri alinamadi.\nHATA: ${e.stack}`)}`)
          } else {
            offline();
          }
        });
      }).catch((e) => {
        if(DEBUG != false) {
          console.log(`${chalk.bgRed(`[HATA]`)} ${chalk.red(`❌ Server bilgileri alinamadi.\nHATA: ${e.stack}`)}`)
              } else {
                offline();
              }
        });
    });
  };

  const bot = new Discord.Client({
    allowedMentions: {
      parse: ["roles", "users", "everyone"],
      repliedUser: false
    },
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_MEMBERS, 
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_BANS
    ]
  });

  const sendOrUpdate = function(embed, row) {
    if (MESSAGE !== undefined) {
      MESSAGE.edit({ embeds: [embed] }).then(() => {
        console.log(`${chalk.bgMagenta(`[BASARILI]`)} ${chalk.magenta(`Yukleme basarili.`)}`)
      }).catch((e) => {
        console.log(`${chalk.bgRed(`[HATA]`)} ${chalk.red(`❌ Yukleme basarisiz.\nHata: ${e}`)}`)
      })
    } else {
     
      let channel = bot.channels.cache.get(CHANNEL_ID);
      
      if (channel !== undefined) {
        channel.messages.fetch(MESSAGE_ID).then((message) => {
          MESSAGE = message;
          message.edit({ embeds: [embed] }).then(() => {
            console.log(`${chalk.bgMagenta(`[BASARILI]`)} ${chalk.magenta('Embed yukleme basarili.')}`)
            
          }).catch((e) => {
            console.log(`${chalk.bgRed(`[HATA]`)} ${chalk.red(`❌ Yukleme basarisiz.\nHATA: ${e}`)}`)
          });
        }).catch(() => {
          if(!row) {
            channel.send({ embeds: [embed] }).then((message) => {
              MESSAGE = message;
              console.log(`${chalk.bgGreen('[STATUS]')} ${chalk.green('Durum mesaji yollandi | Sunucu Aktif')} \n${chalk.bgBlue('[BILGI]')} ${chalk.blue(`${chalk.underline.yellow(message.id)} değeri ile config dosyasında güncelleyin:)}`);
            }).catch(console.error);
          } else {
          channel.send({ embeds: [embed], components: [row]  }).then((message) => {
            MESSAGE = message;
            console.log(`${chalk.bgGreen('[DURUM]')} ${chalk.green('Durum mesaji yollandi | Sunucu Aktif')} \n${chalk.bgBlue('[BILGI]')} ${chalk.blue(`${chalk.underline.yellow(message.id)} değeri ile config dosyasında güncelleyin:)}`);
          }).catch(console.error);
        }
        })
      } else {
        console.log(`${chalk.bgRed(`[HATA]`)} ${chalk.red(`❌ Yukleme kanali ayarlanmadi`)}`)
      }
    }
  };
bot.on('ready', () => {
var checkMe = ['ADMINISTRATOR','CREATE_INSTANT_INVITE','KICK_MEMBERS','BAN_MEMBERS','MANAGE_GUILD','ADD_REACTIONS','VIEW_AUDIT_LOG','PRIORITY_SPEAKER' ,'VIEW_CHANNEL','SEND_MESSAGES','SEND_TTS_MESSAGES','MANAGE_MESSAGES','READ_MESSAGE_HISTORY','MENTION_EVERYONE','USE_EXTERNAL_EMOJIS' ,'VIEW_GUILD_INSIGHTS','CONNECT','SPEAK','MUTE_MEMBERS','DEAFEN_MEMBERS','MOVE_MEMBERS','USE_VAD','CHANGE_NICKNAME','MANAGE_NICKNAMES','MANAGE_ROLES','MANAGE_WEBHOOKS','MANAGE_EMOJIS','STREAM','EMBED_LINKS','ATTACH_FILES','MANAGE_CHANNELS']  
  if(!checkMe.includes(PERMISSION)) {

  console.log(`${chalk.bgRed("[HATA]")} ${chalk.red(`⚠ DİKKAT: 'PERMISSION' değişkeniniz (${chalk.underline.yellow(PERMISSION)}) yanlış, lütfen izin listesini kontrol edin... kapatiliyor..`)}`);
 process.exit(0);          
  }

})
  const UpdateEmbed = function() {
    let embed = new Discord.MessageEmbed()
    .setAuthor({ name: `${SERVER_NAME} | Sunucu Durumu`, iconURL: SERVER_LOGO })
    .setColor(EMBED_COLOR)
    .setThumbnail(SERVER_LOGO)
    .setFooter({ text: TICK_N % 2 === 0 ? `${SERVER_NAME}` : `${SERVER_NAME}` })
    .setTimestamp(new Date())
    .addFields(
        { name: '\n\u200b\nSunucu Adı',  value: `\`\`\`${SERVER_NAME}\`\`\``, inline: false} 
    )
    if (STATUS !== undefined)
    {
      embed.addFields(
        { name: '📬 Server Notice:',   value: `\`\`\`${STATUS}\`\`\`\n\u200b\n`, inline: false }
      );
      embed.setColor('#00f931')
    }
    return embed;
  };

  const offline = function() {
    console.log(`${chalk.bgBlue(`[INFO]`)} ${chalk.blue(Array.from(arguments))}`)
    if (LAST_COUNT !== null) console.log(`${chalk.bgBlue(`[Info]`)} ${chalk.blue(`${SERVER_OFFLINE_ERROR}`)}`);
    let embed = UpdateEmbed()
    .setColor(0xff0000)
    .setThumbnail(SERVER_LOGO)
    .addFields(
      { name: "Sunucu Durumu:",          value: "```❌ De-Aktif```",    inline: true },
      { name: "Aktif Oyuncular:",         value: "```--```\n\u200b\n",  inline: true },
      { name: "TeamSpeak Adresi:",   value: "```agcommunity```",           inline: true }
    )
    sendOrUpdate(embed);
    console.log(`${chalk.bgRed(`[Error]`)} ${chalk.red(`Sunucu şu an kapalı.`)}`)
    LAST_COUNT = null;
  };

  const updateMessage = function() {
    getVars().then((vars) => {
      getPlayers().then((players) => {
        if (players.length !== LAST_COUNT) console.log(`${chalk.bgBlue('[INFO]')} ${chalk.blue(`${players.length} players`)}`);
        let embed = UpdateEmbed()
        .addFields(
          { name: "Sunucu Durumu",            value: "```✅ Aktif```",                                                                                    inline: true },
          { name: "Aktif Oyuncular",           value: `\`\`\`${players.length}/${MAX_PLAYERS}\`\`\`\n\u200b\n`,                                              inline: true },
          { name: "TeamSpeak Adresi:",    value: `\`\`\`${RESTART_TIMES}\`\`\``,                                                                        inline: true }
          )
        .setThumbnail(SERVER_LOGO)
        if (players.length > 0 && SHOW_PLAYERS == true && players.length < 4080) {
          let playersOnline = [];
          for (var i=0; i < players.length; i++) {
            playersOnline.push(`**${players[i].name.substr(0,12)}** - \`${players[i].ping}ms\``) // first 12 characters of players name
          }  
            embed.setDescription(`__**Aktif Oyuncular**__:\n${playersOnline.toString().replace(/\,\)/g,', ')}`)
            playersOnline = [];
        }
        if(WEBSITE_URL.startsWith("https://") || WEBSITE_URL.startsWith("http://")) {
          const row = new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setLabel('Website')
                .setURL(WEBSITE_URL)
                .setStyle('LINK')
            );
          sendOrUpdate(embed, row);
          
        } else {
          sendOrUpdate(embed);
        }
       
        LAST_COUNT = players.length;
      }).catch(offline);
    }).catch(offline);
    TICK_N++;
    if (TICK_N >= TICK_MAX) {
      TICK_N = 0;
    }
    for (var i=0;i<loop_callbacks.length;i++) {
      let callback = loop_callbacks.pop(0);
      callback();
    }
  };

  bot.on('ready',() => {
    console.log(`${chalk.blue(`
   /////////////////////////////////////////////////////
   ///            XAYIBOGANTR                        ///
   /////////////////////////////////////////////////////

   ➼ Bot başlatıldı, komutlar yüklenecek, sunucuya bağlanılmaya çalışılacak...`)}
    `)
    setInterval(() => {
      getPlayers().then((players) => {
    bot.user.setPresence({
      activities: [{
          name: `${SERVER_NAME}`,
          type: "LISTENING"
      }], status: "online"
    })
  })
  }, 15000);
    setInterval(updateMessage, UPDATE_TIME);
  });

  function checkLoop() {
    return new Promise((resolve,reject) => {
      var resolved = false;
      let id = loop_callbacks.push(() => {
        if (!resolved) {
          resolved = true;
          resolve(true);
        } else {
          console.log(`${chalk.bgRed(`[HATA]`)} ${chalk.red(`Zaman aşımından sonra döngü geri çağrısı çağrıldı`)}`);
          reject(null);
        }
      })
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      },3000);
    })
  }

bot.on('debug', (info) => {
  if (DEBUG == true) {
    console.log(`${chalk.bold.bgCyan(`[HATA AYIKLAMA]`)} ${chalk.bold.cyan(info)}`);
  }
});

bot.on('error', (error, shard) => {
  console.log(`${chalk.bgRed(`[HATA]`)} ${chalk.red(error)}`);
});

bot.on('warn', (info) => {
  console.log(`${chalk.bgYellow(`[UYARI]`)} ${chalk.yellow(info)}`);
});

bot.on('disconnect', (devent, shard) => {
  console.log(`${chalk.bgBlue(`[BİLGİ]`)} ${chalk.blue(`Bağlantı Kesildi`)}`);
  checkLoop().then((running) => {
    console.log(`${chalk.bgBlue(`[BİLGİ]`)} ${chalk.blue(`Döngü hala çalışıyor: ${running}`)}`);
  }).catch(console.error);
});

bot.on('reconnecting', (shard) => {
  console.log(`${chalk.bgBlue(`[BİLGİ]`)} ${chalk.blue(`Yeniden Bağlanılıyor`)}`);
  checkLoop().then((running) => {
    console.log(`${chalk.bgBlue(`[BİLGİ]`)} ${chalk.blue(`Döngü hala çalışıyor: ${running}`)}`);
  }).catch(console.error);
});

bot.on('resume', (replayed, shard) => {
  console.log(`${chalk.bgBlue(`[BİLGİ]`)} ${chalk.blue(`Devam Ediliyor (${replayed} olay yeniden oynatıldı)`)}`);
  checkLoop().then((running) => {
    console.log(`${chalk.bgBlue(`[BİLGİ]`)} ${chalk.blue(`Döngü hala çalışıyor: ${running}`)}`);
  }).catch(console.error);
});

  bot.on('rateLimit',(info) => {
    console.log(`${chalk.bgBlue(`[INFO]`)} ${chalk.blue(`Rate limit hit ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout : 'Unknown timeout '}ms (${info.path} / ${info.requestLimit ? info.requestLimit : info.limit ? info.limit : 'Unkown limit'})`)}`)
    if (info.path.startsWith(`/channels/${CHANNEL_ID}/messages/${MESSAGE_ID ? MESSAGE_ID : MESSAGE ? MESSAGE.id : ''}`)) bot.emit('restart');
    checkLoop().then((running) => {
      console.log(`${chalk.bgBlue(`[INFO]`)} ${chalk.blue(`Döngü hala çalısıyor: ${running}`)}`)
    }).catch(console.error);
  })

bot.on('messageCreate', async function (msg) {
  if (msg.content === '+yardım') {
    if (msg.member.permissions.has(PERMISSION)) {
      let embed = new Discord.MessageEmbed()
        .setAuthor({ name: msg.member.nickname ? msg.member.nickname : msg.author.tag, iconURL: msg.author.displayAvatarURL() })
        .setColor(0x2894C2)
        .setTitle(`${SUNUCU_ADI} | Yardım`)
        .setDescription('+durum <Mesaj> - Sunucu durumu  bir uyarı mesajı ekler\n+durum temizle - Uyarı mesajını temizler\n+yardım - Botun komutlarını görüntüler')
        .setTimestamp(new Date());
      msg.channel.send({ embeds: [embed] });
    } else {
      let noPerms = new Discord.MessageEmbed()
        .setAuthor({ name: msg.member.nickname ? msg.member.nickname : msg.author.tag, iconURL: msg.author.displayAvatarURL() })
        .setColor(0x2894C2)
        .setTitle(`${SUNUCU_ADI} | Hata`)
        .setDescription(`❌ ${PERMISSION} iznine sahip değilsiniz, bu nedenle bu komutu çalıştıramazsınız!`)
        .setTimestamp(new Date());
      msg.channel.send({ embeds: [noPerms] });
    }
  }
});
  bot.on('messageCreate', (message) => {
  if (!message.author.bot) {
    if (message.member) {
      if (message.content.startsWith('+durum ')) {
        if (message.member.permissions.has(PERMISSION)) {
          let status = message.content.substr(7).trim();
          let embed = new Discord.MessageEmbed()
            .setAuthor({ name: message.member.nickname ? message.member.nickname : message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setColor(EMBED_COLOR)
            .setTitle('☑️ Durum mesajı güncellendi')
            .setTimestamp(new Date());

          if (durum === 'temizle') {
            STATUS = undefined;
            message.reply({ content: '☑️ Durum temizlendi!', allowedMentions: { repliedUser: false } });
            embed.setDescription('Durum mesajı temizlendi');
          } else {
            STATUS = status;
            embed.setDescription(`Yeni mesaj:\n\`\`\`${STATUS}\`\`\``);
          }

          bot.channels.cache.get(LOG_KANAL).send({ embeds: [embed] });
          return console.log(`${chalk.bgBlue(`[BİLGİ]`)} ${chalk.blue(`🔘 ${message.author.username} durumu güncellendi`)}`);
        } else {
          let noPerms = new Discord.MessageEmbed()
            .setAuthor({ name: message.member.nickname ? message.member.nickname : message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setColor(0x2894C2)
            .setTitle(`${SUNUCU_ADI} | Hata`)
            .setDescription(`❌ Bu komutu çalıştırmak için ${PERMISSION} izniniz yok!`)
            .setTimestamp(new Date());

          message.channel.send({ embeds: [noPerms] });
        }
      }

      if (message.channel.id === ONERI_KANAL) {
        let suggestionMap = message.attachments;
        let embed = new Discord.MessageEmbed()
          .setAuthor({ name: message.member.nickname ? message.member.nickname : message.author.tag, iconURL: message.author.displayAvatarURL() })
          .setColor(0x2894C2)
          .setTitle('Öneri')
          .setDescription(message.content)
          .setTimestamp(new Date());

        if (message.attachments.size != 0) {
          for (let [key, value] of suggestionMap) {
            if (!value.contentType.includes("image")) return;
            embed.setImage(value.proxyURL);
          }
        }

        message.channel.send({ embeds: [embed] }).then((message) => {
          const  sent = message;
          sent.react('👍').then(() => {
            sent.react('👎').then(() => {
              console.log(`${chalk.bgBlue(`[BİLGİ]`)} ${chalk.blue(`Öneri mesajı tamamlandı`)}`);
            }).catch(console.error);
          }).catch(console.error);
        }).catch(console.error);

        return message.delete();
      }

      if (message.channel.id === BUG_CHANNEL) {
        let bugMap  = message.attachments;
        let embedUser  = new Discord.MessageEmbed()
          .setAuthor({ name: message.member.nickname ? message.member.nickname : message.author.tag, iconURL: message.author.displayAvatarURL() })
          .setColor(0x2894C2)
          .setTitle('Hata Raporu')
          .setDescription('Raporunuz başarıyla personel ekibine gönderildi!')
          .setTimestamp(new Date());

        let embedStaff = new Discord.MessageEmbed()
          .setAuthor({ name: message.member.nickname ? message.member.nickname : message.author.tag, iconURL: message.author.displayAvatarURL() })
          .setColor(0x2894C2)
          .setTitle('Hata Raporu')
          .setDescription(message.content)
          .setTimestamp(new Date());

        if (message.attachments.size != 0) {
          for (let [key, value] of bugMap) {
            if (!value.contentType.includes("image")) return;
            embedPersonel.setImage(value.proxyURL);
          }
        }

        message.channel.send({ embeds: [embedStaff] }).then(null).catch(console.error);
        bot.channels.cache.get(BUG_LOG_CHANNEL).send({ embeds: [embedStaff] }).then(null).catch(console.error);

        return message.delete();
      }
    }
  }
});

try {
  bot.login(BOT_TOKEN);
  return bot;
} catch (error) {
  console.log(`${chalk.bgRed(`[HATA]`)} ${chalk.red('Sağladığınız token geçersiz. Lütfen doğru bir şekilde https://discord.com/developers/applications adresinden alıp kullanıyor olun!')}`);
  console.log(`${chalk.bgRed(`[HATA]`)} ${chalk.red(error)}`);
  process.exit(1);
}
