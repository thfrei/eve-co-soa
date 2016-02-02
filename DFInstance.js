var Promise = require('bluebird');
var DFAgent = require('./agents/DFAgent');

var options = {
  id: 'DF',
  transports: [
    {
      type: 'amqp',
      url: 'amqp://localhost'
    }
  ]
};

var DF = new DFAgent(options);

Promise.all([DF.ready]).then(function () {
  console.log('agent ', 'DF', ' ready');
}).catch(console.log);