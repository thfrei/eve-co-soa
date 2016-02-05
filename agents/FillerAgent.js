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
  this.skills = ['fill', 'getFillerStatus', 'getFillerPosition'];
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
Agent.prototype.rpcFunctions.fill = function(params, from) {
  console.log('#fill - RPC from:', from);
  return {err: 'not yet implemented'};
};
Agent.prototype.rpcFunctions.getFillerStatus = function(params, from) {
  console.log('#getFillerLevel - RPC from:', from);
  return this.status;
};
Agent.prototype.rpcFunctions.getFillerPosition = function(params, from) {
  console.log('#getFillerPosition - RPC from:', from);
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
Agent.prototype.selfCheck = function(){
  //return co(function* (){
  //  var results = yield [this.rpc.request(this.DF, {method: 'search', params: {skill: 'fill'}})
  //                      , this.rpc.request(this.DF, {method: 'search', params: {skill: 'getFillerLevel'}})];
  //  console.log(results);
  //}.bind(this));

  return Promise.all([this.rpc.request(this.DF, {method: 'search', params: {skill: 'fill'}})
    , this.rpc.request(this.DF, {method: 'search', params: {skill: 'getFillerLevel'}})])
    .then(console.log);
};
// Behaviour End ================================================================
// ==============================================================================

module.exports = Agent;