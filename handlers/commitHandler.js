const { EmbedBuilder } = require("discord.js");
const { difference } = require("lodash");
const conf = require("ocore/conf.js");

const discordInstance = require("../discordInstance");
const toLocalString = require("../utils/toLocalString");
const sysVarDescriptions = require("../sysVarDescriptions");
const opListToString = require("../utils/opListToString");

module.exports = async ({ key, value, previousValue }) => {
    if (!(key in sysVarDescriptions)) {
        console.error(`log(${key}): unknown parameter key`);
        return;
    }


    console.error(`log(${key}): new commit has been received: ${value}`);

    const channel = await discordInstance.channels.fetch(process.env.CHANNEL_ID);

    if (channel) {
        const newVoteEmbed = new EmbedBuilder()
            .setTitle(`New commit for ${sysVarDescriptions[key].customName}`)
            .setDescription(sysVarDescriptions[key].description)
            .setThumbnail(conf.logoUrl)

        if (key === "op_list") {
            const newOPs = difference(value, previousValue);
            const removedOPs = difference(previousValue, value);
            const changes = removedOPs.map((old, index) => `~~${old}~~ -> ${newOPs[index]}`).join('\n')

            newVoteEmbed
                .addFields({ value: opListToString(previousValue), name: 'Previous value', inline: false })
                .addFields({ value: opListToString(value), name: 'New value', inline: false })
                .addFields({ value: changes, name: 'Changes', inline: false });
        } else {
            newVoteEmbed
                .addFields({ value: toLocalString(previousValue), name: 'Previous value', inline: true })
                .addFields({ value: toLocalString(value), name: 'New value', inline: true })
        }

        newVoteEmbed.addFields({ value: `You can vote at [governance.obyte.org](https://governance.obyte.org/sys/${key})`, name: ' ', inline: false });

        try {
            await channel.send({ embeds: [newVoteEmbed] });
        } catch (err) {
            console.error('error(send newVoteEmbed): ', err);
        }
    } else {
        console.error('error: channel not found');
    }
}