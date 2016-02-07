"use strict";

var Promise = require('bluebird');
var _ = require('underscore');
var program = require('commander');
var BottleAgent = require('./agents/BottleAgent');

program
  .version('0.0.2')
  .option('-a, --agent-name <name>', 'Agent name: e.g. BottleAgent5', /^(\w*)$/i, 'BottleAgent1') // agent-name becomes agentName
  .option('-o, --orderId <int>', 'Order Id', parseInt, 1)
  .option('-d, --directory-facilitator <df>', 'Agent name of the Directory Facilitator', /^(\w*)$/i, 'DF')

  .parse(process.argv);

var agentOptions = {
  id: program.agentName,
  DF: program.directoryFacilitator,
  initial: {
    fillerLevel: program.fillerLevel
  },
  transports: [
    {
      type: 'amqp',
      url: 'amqp://localhost'
    }
  ]
};

// create two agents
var BottleInstance = new BottleAgent(agentOptions);

Promise.all([BottleInstance.ready]).then(function () {
  // Register skill
  BottleInstance.execute();

  process.on('SIGINT', takeDown);
  process.on('uncaughtException', takeDown);
}).catch(function(err){console.log('exe',err)});

// extra function is needed for closure on event
function takeDown(){
  BottleInstance.takeDown();
};
