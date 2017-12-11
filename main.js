var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as cluster from "cluster";
import * as dotenv from "dotenv-safe";
import * as CONFIG from "./Config/CONFIG";
import BittrexMarketMakerBot from "./Engines/BittrexMarketMakerBot";
dotenv.load();
const numWorkers = 1; // require('os').cpus().length;
// USE MULTIPLE CORES
if (cluster.isMaster) {
    console.log('Master cluster setting up ' + numWorkers + ' worker(s)...');
    function prepareWorkers() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < numWorkers; i++) {
                const worker = cluster.fork();
                worker.send({ workerId: i, marketName: CONFIG.BITTREX.MARKETS_TO_MONITOR[i] });
            }
        });
    }
    prepareWorkers();
}
else {
    process.on("message", (data) => __awaiter(this, void 0, void 0, function* () {
        global.WORKER_ID = data.workerId;
        global.CONFIG = CONFIG;
        console.log(`WORKER#${data.workerId} MONITORING ${data.marketName}`);
        const bittrexMarketMakerBot = new BittrexMarketMakerBot(data.marketName);
        bittrexMarketMakerBot.start();
    }));
}
