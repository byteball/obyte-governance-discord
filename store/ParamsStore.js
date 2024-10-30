const { maxBy, difference, groupBy } = require("lodash");
const network = require('ocore/network.js');

class ParamsStore {
    constructor() {
        this.store = new Map();
        this.votes = new Map();
        this.balances = new Map();

        this.updateVotes();
    }
    async updateVotes() {
        const { balances, votes } = await network.requestFromLightVendor('get_system_var_votes');
        this.balances = new Map(Object.entries(balances));

        Object.entries(votes).forEach(([key, votes]) => {
            const groupVotesByValue = groupBy(votes, (vote) => vote.value);
            this.votes.set(key, new Map(Object.entries(groupVotesByValue)));

            if (key === 'op_list') {
                let wholeList = new Map();

                votes.forEach(({ value = [], address: voter }) => {
                    value.forEach((op) => {
                        if (wholeList.has(op)) {
                            wholeList.set(op, wholeList.get(op) + (this.balances.get(voter) ?? 0));
                        } else {
                            wholeList.set(op, this.balances.get(voter) ?? 0);
                        }
                    });
                });

                const leaders = Array.from(wholeList).sort((a, b) => b[1] - a[1]).slice(0, 12).map(v => v[0]);
                this.votes.get(key).set('leader', leaders);
            } else {
                const leader = maxBy(votes, (v) => this.balances.get(v.address))?.value;
                this.votes.get(key).set('leader', leader);
            }
        });
    }

    getLatestVars(sysVars) {
        const latestVars = new Map();

        Object.entries(sysVars).forEach(([key, values]) => {
            const maxMciVote = maxBy(values, 'vote_count_mci')?.value;

            latestVars.set(key, maxMciVote);
        });

        return latestVars;
    }

    getVoterBalance(address) {
        return this.balances.get(address);
    }

    getLeader(key) {
        return this.votes.get(key).get('leader');
    }

    diff(sysVars) {
        const diff = new Map();

        if (this.store.size > 0) {
            const latestVars = this.getLatestVars(sysVars);

            latestVars.forEach((value, key) => {
                if (this.store.has(key) && !this.isEqual(key, this.store.get(key), value)) {
                    console.error('log: value changed', key, this.store.get(key), value);
                    diff.set(key, { value, previousValue: this.store.get(key) });
                    
                    this.store.set(key, value);
                }
            });

            return diff;
        } else {
            this.store = this.getLatestVars(sysVars);
            return new Map();
        }
    }

    isEqual(key, value1, value2) {
        if (key === 'op_list') {
            return difference(value1, value2).length === 0;
        } else {
            return value1 === value2;
        }
    }
}

module.exports = new ParamsStore();
