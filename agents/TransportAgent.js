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
  this.skills = ['transport', 'getTransportStatus', 'computeTime'];
  this.status = {
    status: 'ready',
    position: 0
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
Agent.prototype.rpcFunctions.transport = function(params, from) {
  console.log('#transport - RPC from:', from);

  // Move to position a   (alternatively: move to agent a)
  // Inform of arrival
  // Move to position b   (alternatively: move to agent b)
  // Inform of arrival

  return {ack: 'transport will be executed'};
};
Agent.prototype.rpcFunctions.getTransportStatus = function(params, from) {
  console.log('#getTransportStatus - RPC from:', from);
  return this.status;
};
Agent.prototype.rpcFunctions.computeTime = function(params, from) {
  console.log('#computeTime - RPC from:', from);
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

Agent.prototype._visualizePosition = function(){
  console.log(this.status.position);
};

module.exports = Agent;