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
  this.skills = ['fill', 'getFillerStatus', 'getFillerPosition', 'reserve'];
  this.status = {
    fillerLevel: agent.initial.fillerLevel,
    fillerLiquid: agent.initial.fillerLiquid,
    status: 'ready',
    position: agent.initial.position
  };
  this.queue = [];

  // load the RPC module
  this.rpc = this.loadModule('rpc', this.rpcFunctions, {timeout: 5*1000});

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());
}
Agent.prototype = Object.create(eve.Agent.prototype);
Agent.prototype.constructor = Agent; // not needed?

Agent.prototype.execute = function(){
  return this.register();
};

// ==============================================================================
// Services =====================================================================
Agent.prototype.rpcFunctions = {};
Agent.prototype.rpcFunctions.fill = function(params, from) {
  console.log('#fill - RPC from:', from);
  return {err: 'not yet implemented'};
};
Agent.prototype.rpcFunctions.getFillerStatus = function(params, from) {
  console.log('#getFillerStatus - RPC from:', from);
  return this.status;
};
Agent.prototype.rpcFunctions.getFillerPosition = function(params, from) {
  console.log('#getFillerPosition - RPC from:', from);
  return {err: 'not yet implemented'};
};
Agent.prototype.rpcFunctions.reserve = function(params, from){
  console.log('#reserve - RPC from:', from);
  var queueElement = {
    client: from,
    orderId: params.orderId,
    product: params.product
  };
  this.queue.push(queueElement);
  console.log('current queue:', this.queue);
  return {ack: true, description: 'slot was reserved'};
};
// Services End =================================================================
// ==============================================================================


// ==============================================================================
// Behaviour ====================================================================
Agent.prototype.register = function(){
  // Register skills
  return this.rpc.request(this.DF,{method: 'register', params: {skills: this.skills}})
    .then(function(reply){
      if(reply.err) throw new Error('#register could not be performed: ' + reply.err);
      else console.log('#register successfull');
    })
    .catch(function(err){
      console.log('#register err',err);
    });
};
Agent.prototype.takeDown = function(){
  // Deregister skills
  this.rpc.request(this.DF, {method: 'deRegister'})
    .then(function(reply){
      if(reply.err) throw new Error('#deregister could not be performed' + err);
      else console.log('#deregister successfull');
      process.exit();
    })
    .catch(function(err){
      console.log('#takeDown err:',err);
    });
};
// Behaviour End ================================================================
// ==============================================================================

module.exports = Agent;