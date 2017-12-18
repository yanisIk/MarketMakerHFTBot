declare const global;

import * as cluster from "cluster";
import * as dotenv from "dotenv-safe";
dotenv.load();
import * as _ from "lodash";
import * as CONFIG from "./Config/CONFIG";
import BittrexMarketMakerBot from "./Engines/BittrexMarketMakerBot";
// import BittrexExchangeService from "./Services/BittrexExchangeService";

const numWorkers: number = 1; // require('os').cpus().length;
// USE MULTIPLE CORES
if (cluster.isMaster) {

    console.log('Master cluster setting up ' + numWorkers + ' worker(s)...');
    // const bittrexExchangeService = new BittrexExchangeService();

    async function prepareWorkers() {

        // get all markets
        // let allMarkets = await bittrexExchangeService.getMarketSummaries();
        // allMarkets = allMarkets.map((market) => {
        //     return {
        //         marketName: market.MarketName,
        //         spreadPercentage: ((market.Ask - market.Bid) / market.Ask) * 100,
        //         baseVolume: market.BaseVolume,
        //     };
        // });
        // // Keep BTC markets
        // allMarkets = allMarkets.filter((market) => market.marketName.split("-")[0] === "ETH");
        // // Keep spreads > 0.5%
        // allMarkets = allMarkets.filter((market) => market.spreadPercentage > 0.5);
        // // sort by volume
        // allMarkets = allMarkets.sort((a, b) => b.baseVolume - a.baseVolume);
        // // keep first ones
        // allMarkets = allMarkets.slice(0, 15);
        // // sort by spreadPercentage
        // allMarkets = allMarkets.sort((a, b) => b.spreadPercentage - a.spreadPercentage);

        // console.log(`Selected markets:\n${JSON.stringify(allMarkets)}\n`);

        for (let i = 0; i < numWorkers; i++) {
            const worker = cluster.fork();
            worker.send({workerId: i, marketName: CONFIG.BITTREX.MARKETS_TO_MONITOR[i]});
        }
    }

    prepareWorkers();

} else {
    process.on("message", (data) => {
        global.WORKER_ID = data.workerId;
        global.MARKET_NAME = data.marketName;
        global.CONFIG = CONFIG;

        console.log(`WORKER#${data.workerId} MONITORING ${data.marketName}`);

        try {
            const bittrexMarketMakerBot = new BittrexMarketMakerBot(data.marketName);
            bittrexMarketMakerBot.start();
        } catch (err) {
            console.error(err);
        }
    });
}

process.on("unhandledRejection", (err) => {
    // Will print "unhandledRejection err is not defined"
    console.error("!!!! Unhandled Rejection !!!!");
    console.error(err);
});

process.on("uncaughtException", (ex) => {
    console.error('!!!! Uncaught Exception thrown !!!!');
    console.error(ex);
});
