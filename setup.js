const fs = require('fs');
const readline = require('readline');

const TEMPLATE = {
  'URL_SERVER': {
    'message': 'FiveM sunucunuzun temel URL\'si örneğin http://127.0.0.1:3501 (sonunda / ile bitirmeyin)',
    'required': true,
  },
  'SERVER_NAME': {
    'message': 'FiveM sunucunuzun adı',
    'required': true,
  },
  'SERVER_LOGO': {
    'message': 'FiveM sunucunuz için bir logo',
    'required': false,
  },
  'PERMISSION': {
    'message': '+status komutu için izin',
    'required': true,
  },
  'BOT_TOKEN': {
    'message': 'Discord bot tokenı',
    'required': true,
  },
  'CHANNEL_ID': {
    'message': 'Güncellemelerin gönderileceği Kanal Kimliği (Channel ID)',
    'required': true,
  },
  'MESSAGE_ID': {
    'message': 'Düzenlenecek önceki güncellemenin Mesaj Kimliği (Message ID) (gerekli değil)',
    'required': false,
    'default': null
  },
  'SUGGESTION_CHANNEL': {
    'message': 'Öneri gömleklerinin oluşturulacağı Kanal',
    'required': true,
  },
  'BUG_CHANNEL': {
    'message': 'Hata raporlarının alınacağı Kanal',
    'required': true
  },
  'BUG_LOG_CHANNEL': {
    'message': 'Hata raporlarının kaydedileceği Kanal',
    'required': true,
  },
  'LOG_CHANNEL': {
    'message': 'Durum değişikliklerinin kaydedileceği Kanal',
    'required': true,
  },
  'DEBUG': {
    'message': 'Hata ayıklama günlüklerini (spam) devre dışı bırakma/etkinleştirme',
    'required': true
  },
  'WEBSITE_URL': {
    'message': 'Durum gömleği için bir bağlantı düğmesi oluştururken https://[website] veya http://[website] kullanmanız gerekmektedir.',
    'required': false
  },
  'SHOW_PLAYERS': {
    'message': 'Çevrimiçi oyuncuları gizleme veya gösterme seçeneği',
    'required': true
  },
  'RESTART_TIMES': {
    'message': 'Sunucunuzun yeniden başlatma zamanlarını görüntüleme',
    'required': true
  }
};
const SAVE_FILE = './config.json';

function loadValue(key) {
  return new Promise((resolve, reject) => {
    const io = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    io.question(`Lütfen '${key}' için bir değer girin${TEMPLATE[key].required ? '' : ` (Gerekli değil, varsayılan değer '${TEMPLATE[key].default}')`}\n  ${TEMPLATE[key].message}\n> `, (value) => {
      io.close();
      resolve(value);
    });
  })
}

exports.createValues = function(keys) {
  return new Promise((resolve,reject) => {
    var data = {};
    if (keys === undefined) {
      keys = Object.keys(TEMPLATE);
    }
    const loop = function(i) {
      if (i < keys.length) {
        loadValue(keys[i]).then((value) => {
          let realValue = value.trim();
          if (TEMPLATE[keys[i]].required) {
            if (realValue.length > 0) {
              data[keys[i]] = realValue;
              loop(i + 1);
            } else {
              console.log('Invalid input');
              loop(i);
            }
          } else {
            if (realValue.length > 0) {
              data[keys[i]] = realValue;
              loop(i+1);
            } else {
              data[keys[i]] = TEMPLATE[keys[i]].default;
              loop(i + 1);
            }
          }
        })
      } else {
        resolve(data);
      }
    }
    loop(0);
  })
}

exports.saveValues = function(values) {
  return new Promise((resolve, reject) => {
    fs.writeFile(SAVE_FILE, JSON.stringify(values),(err) => {
      if (err) return reject(err);
      return resolve(true);
    })
  })
}

exports.loadValues = function() {
  return new Promise((resolve, reject) => {
    fs.readFile(SAVE_FILE, (err, data) => {
      if (err) return reject(err);
      var json;
      try {
        json = JSON.parse(data);
      } catch(e) {
        console.log('./config.json dosyanızda bir JSON hatası var!');
        return reject(e);
      }
      let notFound = new Array();
      for (var key in TEMPLATE) {
        if (!json.hasOwnProperty(key)) {
          notFound.push(key);
        }
      }
      if (notFound.length === 0) {
        return resolve(json);
      } else {
        console.log('Yeni yapılandırma değerleri bulundu ve eklenmiştir!');
        exports.createValues(notFound).then((data) => {
          for (var key in data) {
            json[key] = data[key];
          }
          exports.saveValues(json).then(() => {
            resolve(json);
          }).catch(reject);
        }).catch(reject);
      }
    })
  });
}
