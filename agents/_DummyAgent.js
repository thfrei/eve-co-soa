"use strict";

var _ = require('underscore');
var Promise = require('bluebird');
var co = require('co');
var eve = require('evejs');

function Agent(agent) {
  // execute super constructor and set agent-id
  eve.Agent.call(this, agent.id);

  // Setup transports
  eve.system.init({
    transports: agent.transports
  });

  // set Directory Facilitator
  this.DF = agent.DF;
  this.skills = ['dummy'];
  this.status = {
    fillerLevel: agent.initial.fillerLevel,
    status: 'ready',
    position: agent.initial.position
  };

  // load the RPC module
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout: 5*1000});

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());
}
Agent.prototype = Object.create(eve.Agent.prototype);
Agent.prototype.constructor = Agent; // not needed?

Agent.prototype.execute = function(){
  return this.oneShot();
};

// ==============================================================================
// Services =====================================================================
Agent.prototype.rpcFunctions = {};
Agent.prototype.rpcFunctions.dummy = function(params, from) {
  console.log('#dummy - RPC from:', from);
  return {err: 'not yet implemented'};
};
// Services End =================================================================
// ==============================================================================


// ==============================================================================
// Behaviour ====================================================================
Agent.prototype.oneShot = function(){
  return Promise.resolve().bind(this) // bluebird Promise required for Promise.bind()
    .then(this.register);
};

Agent.prototype.register = function(){
  // Register skills
  return this.rpc.request(this.DF,{method: 'register', params: {skills: this.skills}})
    .then(function(reply){
      if(reply.err) throw new Error('#register could not be performed: ' + reply.err);
      else console.log('#register successfull');
    });
};
Agent.prototype.takeDown = function(){
  // Deregister skills
  this.rpc.request(this.DF, {method: 'deRegister'})
    .then(function(reply){
      if(reply.err) throw new Error('#deregister could not be performed' + err);
      else console.log('#deregister successfull');
      process.exit();
    });
};
// Behaviour End ================================================================
// ==============================================================================

module.exports = Agent;