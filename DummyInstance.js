"use strict";

var Promise = require('bluebird');
var program = require('commander');
var DummyAgent = require('./agents/DummyAgent');

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
var DummyInstance = new DummyAgent(agentOptions);

Promise.all([DummyInstance.ready]).then(function () {
  // Register skill
  DummyInstance.execute();

  process.on('SIGINT', takeDown);
  process.on('uncaughtException', takeDown);
}).catch(function(err){console.log('exe',err)});

// extra function is needed for closure on event
function takeDown(){
  DummyInstance.takeDown();
}