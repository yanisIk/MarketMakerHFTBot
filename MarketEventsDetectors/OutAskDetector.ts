/**
 * - Subscribe to open sell orders
 * - Subscribe to ticks
 * 
 * on open sell order =>
 *  if tick.ask < order.ask
 *      emit order to OutAskOrdersStream
 */