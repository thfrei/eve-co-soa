"use strict";

var Promise = require('bluebird');
var program = require('commander');
var TransportAgent = require('./agents/TransportAgent');

program
  .version('0.0.2')
  .option('-a, --agent-name <name>', 'Agent name: e.g. TransportAgent', /^(\w*)$/i, 'TransportInstance1')
  .option('-d, --directory-facilitator <df>', 'Agent name of the Directory Facilitator', /^(\w*)$/i, 'DF')
  .parse(process.argv);

var agentOptions = {
  id: program.agentName,
  DF: program.directoryFacilitator,
  initial: {
    fillerLevel: program.fillerLevel,
    position: program.position
  },
  transports: [
    {
      type: 'amqp',
      url: 'amqp://localhost'
    }
  ]
};

// create two agents
var TransportInstance = new TransportAgent(agentOptions);

Promise.all([TransportInstance.ready]).then(function () {
  // Register skill
  TransportInstance.execute();

  process.on('SIGINT', takeDown);
  process.on('uncaughtException', takeDown);
}).catch(function(err){console.log('exe',err)});

// extra function is needed for closure on event
function takeDown(){
  TransportInstance.takeDown();
}