var assert = require('assert');
var bittrex = require('../node.bittrex.api.js');

describe('Bittrex websocket API', function() {

  it('Connect to the Websocket', function(done) {
    this.timeout(50000);
    bittrex.options({
      websockets: {
        onConnect: function() {
          bittrex.websockets.subscribe(['BTC-ETH'], function(data) {
            if (data.M === 'updateExchangeState') {
              data.A.forEach(function(data_for) {
                done();
                console.log('Market Update for '+ data_for.MarketName, data_for);
              });
            }
          });
        },
      },
    });
    bittrex.websockets.client();
  });

});