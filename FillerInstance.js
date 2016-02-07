"use strict";

var Promise = require('bluebird');
var program = require('commander');
var FillerAgent = require('./agents/FillerAgent');

program
  .version('0.0.2')
  .option('-a, --agent-name <name>', 'Agent name: e.g. BottleAgent5', /^(\w*)$/i, 'FillerInstance')
  .option('-l, --filler-level <float>', 'Filler level', parseFloat, 100)
  .option('-f, --filler-liquid <liquid>', 'Liquid type', /^(\w*)$/i, 'beer')
  .option('-p, --position <float>', 'Filler Position', parseFloat, 40)
  .option('-d, --directory-facilitator <df>', 'Agent name of the Directory Facilitator', /^(\w*)$/i, 'DF')
  .parse(process.argv);

var agentOptions = {
  id: program.agentName,
  DF: program.directoryFacilitator,
  initial: {
    fillerLevel: program.fillerLevel,
    position: program.position,
    liquid: program.fillerLiquid
  },
  transports: [
    {
      type: 'amqp',
      url: 'amqp://localhost'
    }
  ]
};

// create two agents
var FillerInstance = new FillerAgent(agentOptions);

Promise.all([FillerInstance.ready]).then(function () {
  // Register skill
  FillerInstance.execute();

  process.on('SIGINT', takeDown);
  process.on('uncaughtException', takeDown);
}).catch(function(err){console.log('exe',err)});

// extra function is needed for closure on event
function takeDown(){
  FillerInstance.takeDown();
}