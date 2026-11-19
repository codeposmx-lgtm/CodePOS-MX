'use strict';

const crypto = require('node:crypto');

function base64URL(buffer) {
  return Buffer.from(buffer).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomURLSafe(byteCount = 32) {
  return base64URL(crypto.randomBytes(byteCount));
}

function sha256URL(text) {
  return base64URL(crypto.createHash('sha256').update(text, 'utf8').digest());
}

function hmacHex(key, message) {
  return crypto.createHmac('sha256', Buffer.from(key, 'utf8')).update(message, 'utf8').digest('hex');
}

module.exports = { base64URL, randomURLSafe, sha256URL, hmacHex };
