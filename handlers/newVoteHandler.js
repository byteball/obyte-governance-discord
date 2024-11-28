const { EmbedBuilder } = require("discord.js");
const { difference } = require("lodash");
const conf = require("ocore/conf.js");

const discordInstance = require("../discordInstance");
const toLocalString = require("../utils/toLocalString");
const sysVarDescriptions = require("../sysVarDescriptions");
const ParamsStore = require("../store/ParamsStore");
const opListToString = require("../utils/opListToString");

module.exports = async ({ subject: parameterKey, value, author_addresses = [], unit, is_stable = 0 }) => {
    if (is_stable) {

        if (!(parameterKey in sysVarDescriptions)) {
            throw Error(`log(${parameterKey}): unknown parameter key`);
        }

        const authorsString = author_addresses.map((adr) => `[${author_addresses.length === 1 ? adr : `${adr.slice(0, 5)}...${adr.slice(-5)}`}](https://explorer.obyte.org/address/${adr})`).join('\n');

        console.log(`log(${parameterKey}): new vote has been received: ${value} by ${author_addresses.join(', ')}`);

        const channel = await discordInstance.channels.fetch(process.env.CHANNEL_ID);

        const sumBalances = author_addresses.reduce((acc, address) => acc + (ParamsStore.getVoterBalance(address) / 10 ** 9), 0);

        if (channel) {

            const newVoteEmbed = new EmbedBuilder()
                .setTitle(`New Vote for ${sysVarDescriptions[parameterKey].customName}`)
                .setDescription(sysVarDescriptions[parameterKey].description)
                .setURL(`https://explorer.obyte.org/${unit}`)
                .setThumbnail(conf.logoUrl)
                .addFields({ value: `Voter(s): ${authorsString}`, name: ' ', inline: false })
                .addFields({ value: `Balance(s): ${toLocalString(sumBalances)} GBYTE`, name: ' ', inline: false })


            if (parameterKey === "op_list") {
                const newOPs = difference(value, ParamsStore.store.get(parameterKey));
                const removedOPs = difference(ParamsStore.store.get(parameterKey), value);
                const changes = removedOPs.map((old, index) => `~~${old}~~ -> ${newOPs[index]}`).join('\n')

                newVoteEmbed
                    .addFields({ value: opListToString(value), name: 'Voted for value', inline: false })
                    .addFields({ value: opListToString(ParamsStore.getLeader(parameterKey)), name: 'Leader value', inline: false })
                    .addFields({ value: changes.length > 0 ? changes : 'No any changes', name: 'Changes', inline: false });
            } else {
                newVoteEmbed
                    .addFields({ value: toLocalString(value), name: 'Voted for value', inline: true })
                    .addFields({ value: toLocalString(ParamsStore.getLeader(parameterKey)), name: 'Leader value', inline: true })
            }

            newVoteEmbed.addFields({ value: `You can vote at [governance.obyte.org](https://governance.obyte.org/sys/${parameterKey})`, name: ' ', inline: false });

            try {
                await channel.send({ embeds: [newVoteEmbed] });
            } catch (err) {
                console.error('error(send newVoteEmbed): ', err);
                throw Error(err);
            }
        } else {
            throw Error('error: channel not found');
        }

        return;
    }
}