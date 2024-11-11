"use strict";

exports.bServeAsHub = false;
exports.bLight = true;
exports.bNoPassphrase = true;

exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';
exports.logoUrl = 'https://avatars.githubusercontent.com/u/20998761?s=200&v=4';

exports.CHANNEL_ID = process.env.CHANNEL_ID;
exports.BOT_TOKEN = process.env.BOT_TOKEN;

console.log('finished server conf');