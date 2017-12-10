declare const global;

import cluster from "cluster";
import dotenv from "dotenv-safe";
import _ from "lodash";
import CONFIG from "./Config/CONFIG";
import BittrexMarketMakerBot from "./Engines/BittrexMarketMakerBot";

dotenv.load();

const numWorkers: number = 1; // require('os').cpus().length;
// USE MULTIPLE CORES
if (cluster.isMaster) {

    console.log('Master cluster setting up ' + numWorkers + ' worker(s)...');

    async function prepareWorkers() {

        for (let i = 0; i < numWorkers; i++) {
            const worker = cluster.fork();
            worker.send({workerId: i, marketName: CONFIG.BITTREX.MARKETS_TO_MONITOR[i]});
        }
    }

    prepareWorkers();

} else {
    process.on("message", async (data) => {
        global.WORKER_ID = data.workerId;
        global.CONFIG = CONFIG;

        console.log(`WORKER#${data.workerId} MONITORING ${data.marketName}`);

        const bittrexMarketMakerBot = new BittrexMarketMakerBot(data.marketName);
        bittrexMarketMakerBot.start();
    });
}
