const CryptoJS = require('crypto-js');
const KEY = process.env.CRYPTO_KEY || '0123456789abcdef0123456789abcdef';

module.exports = {
  encrypt: (txt) => CryptoJS.AES.encrypt(String(txt), KEY).toString(),
  decrypt: (enc) => CryptoJS.AES.decrypt(enc, KEY).toString(CryptoJS.enc.Utf8),
  hash: (txt) => CryptoJS.SHA256(String(txt)).toString()
};