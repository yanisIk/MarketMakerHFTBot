// BuyOrdersWindow
// SellOrdersWindow
// FilledOrdersWindow
// CanceledOrdersWindow

/**
 * - Create BuyOrdersWindow & SellOrdersWindow (eep-js with eep.CountingClock())
 * - Subscribe to order book
 * - Each orderbook update
 *  - Do diff with previous one
 *  - Push new orders to respective windows
 * - Create interval of X s to tick windows so they can emit values
 * - Use count in window (will count orders in the window and emit the number of orders every X seconds)
 * - 
 */