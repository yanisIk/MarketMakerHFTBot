// import { EventEmitter } from "events";
// import IBroker, { OPEN_ORDER_EVENTS } from "../Brokers/IBroker";
// import * as CONFIG from "../Config/CONFIG";
// import IOrderEventEmitter from "../MarketDataEventEmitters/IOrderEventEmitter";
// import ITickEventEmitter from "../MarketDataEventEmitters/ITickEventEmitter";
// import Order, { OrderSide } from "../Models/Order";
// import Tick from "../Models/Tick";
// import OpenOrdersStatusDetector from "./OpenOrdersStatusDetector";

// type TickListener = (tick: Tick) => void;
// type OrderListener = (buyOrder: Order) => void;

// /**
//  * - Subscribe to open buy buyOrders
//  * - Subscribe to ticks
//  *
//  * on open buy buyOrder =>
//  *  if tick.bid > buyOrder.rate
//  *      emit buyOrder
//  */
// export default class RisingBidDetector extends EventEmitter {

//     constructor(private ticksEmitter: ITickEventEmitter) {
//         super();
//         if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
//             this.logEvents();
//         }
//     }

//     public subscribe(marketName: string): void {
//         // If outask detected, emit it and remove listener
//         let firstBid: number;
//         let lastBid: number;
//         let numberOfHigherBids: number = 0;

//         const tickListener = (tick: Tick) =>  {
//             if (lastBid && lastBid > tick.bid) {
//                 numberOfHigherBids++;
//                 if (numberOfHigherBids === 5) {
//                     this.ticksEmitter.removeListener(marketName, tickListener);
//                     // Remove from monitored buyOrders
//                     OutAskDetector.monitoredOrders.delete(sellOrder.id);
//                     // Re outbid to still be near the bid
//                     this.emit(marketName, "RISING BID");
//                     if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
//                         console.log(`\n--- RISING BID, CANCELING SELL ORDER TO RISE ASK ${sellOrder.id} --- ` +
//                                     `\nREOUTASK WITH NEW HIGHER ASK \n`);
//                     }
//                 }
//             }
//             lastBid = tick.bid;
//     }

//     private logEvents(): void {
//         if (CONFIG.GLOBAL.IS_LOG_ACTIVE) {
//             this.on(OutBidDetector.OUTBID_ORDER_EVENT, (order: Order) => {
//                 console.log(`\n--- OUTBIDED ORDER [${order.marketName}] --- \nOrderID: ${order.id}\n` +
//                                 `Quantity:${order.quantity} @ Rate:${order.rate}\n`);
//             });
//         }
//     }

// }
