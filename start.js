const conf = require("ocore/conf.js");
const headlessWallet = require('headless-obyte');

const eventBus = require('ocore/event_bus.js');
const lightWallet = require('ocore/light_wallet.js');
const network = require('ocore/network.js');

const discordInstance = require('./discordInstance');
const newVoteHandler = require("./handlers/newVoteHandler");
const commitHandler = require("./handlers/commitHandler");

const ParamsStore = require("./store/ParamsStore");

lightWallet.setLightVendorHost(conf.hub);

eventBus.on('connected', async function (ws) {
    console.log('log: connected to hub');

    await headlessWallet.waitTillReady();

    network.initWitnessesIfNecessary(ws, start);

    network.sendJustsaying(ws, 'watch_system_vars');
});

eventBus.on("message_for_light", async (_ws, subject, body) => {
    if (subject === "system_var_vote") {
        await ParamsStore.updateVotes();
        newVoteHandler(body);
    } else if (subject === 'system_vars') {
        await ParamsStore.updateVotes();
        const diff = ParamsStore.diff(body);

        if (diff.size > 0) {
            console.error('log: diff', diff);

            diff.forEach(({ value, previousValue }, key) => {
                console.error('log: value changed', key, value, previousValue);
                commitHandler({ key, value, previousValue });
            });
        }
    } else {
        console.error('log(message_for_light): another message', subject, body);
    }
});

async function start() {
    console.error('log: notification bot has been started');

    if (conf.BOT_TOKEN) {
        await discordInstance.login(conf.BOT_TOKEN);
    } else {
        throw new Error('error: BOT_TOKEN is required');
    }
}
