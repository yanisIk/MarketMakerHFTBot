
const bittrex = require('../node.bittrex.api');

console.log('Connecting ....');
bittrex.websockets.listen(function(data, client) {
  if (data.M === 'updateSummaryState') {
    data.A.forEach(function(data_for) {
      data_for.Deltas.forEach(function(marketsDelta) {
        console.log('Ticker Update for '+ marketsDelta.MarketName, marketsDelta);
      });
    });
  }
});