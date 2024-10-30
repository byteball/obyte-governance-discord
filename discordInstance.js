const { Client, GatewayIntentBits } = require('discord.js');

const discordInstance = new Client({ intents: [GatewayIntentBits.GuildMessages] });

module.exports = discordInstance;

