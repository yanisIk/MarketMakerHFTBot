/**
 * - Subscribe to open buy orders
 * - Subscribe to ticks
 * 
 * on open buy order =>
 *  if tick.bid > order.bid
 *      emit order to OutBidOrdersStream
 */