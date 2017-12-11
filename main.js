"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
var cluster_1 = require("cluster");
var dotenv_safe_1 = require("dotenv-safe");
var CONFIG_1 = require("./Config/CONFIG");
var BittrexMarketMakerBot_1 = require("./Engines/BittrexMarketMakerBot");
dotenv_safe_1["default"].load();
var numWorkers = 1; // require('os').cpus().length;
// USE MULTIPLE CORES
if (cluster_1["default"].isMaster) {
    console.log('Master cluster setting up ' + numWorkers + ' worker(s)...');
    function prepareWorkers() {
        return __awaiter(this, void 0, void 0, function () {
            var i, worker;
            return __generator(this, function (_a) {
                for (i = 0; i < numWorkers; i++) {
                    worker = cluster_1["default"].fork();
                    worker.send({ workerId: i, marketName: CONFIG_1["default"].BITTREX.MARKETS_TO_MONITOR[i] });
                }
                return [2 /*return*/];
            });
        });
    }
    prepareWorkers();
}
else {
    process.on("message", function (data) { return __awaiter(_this, void 0, void 0, function () {
        var bittrexMarketMakerBot;
        return __generator(this, function (_a) {
            global.WORKER_ID = data.workerId;
            global.CONFIG = CONFIG_1["default"];
            console.log("WORKER#" + data.workerId + " MONITORING " + data.marketName);
            bittrexMarketMakerBot = new BittrexMarketMakerBot_1["default"](data.marketName);
            bittrexMarketMakerBot.start();
            return [2 /*return*/];
        });
    }); });
}
