"use strict";

var _ = require('underscore');
var Promise = require('bluebird');
var co = require('co');
var eve = require('evejs');

function BottleAgent(agent) {
  // execute super constructor and set agent-id
  eve.Agent.call(this, agent.id);

  // Setup transports
  eve.system.init({
    transports: agent.transports
  });

  // set Directory Facilitator
  this.DF = agent.DF;
  this.skills = ['getBottlePosition', 'getBottleStatus'];
  this.status = {
    status: 'ready',
    position: undefined,
    orderId: agent.orderId
  };

  // load the RPC module
  this.rpc = this.loadModule('rpc', this.rpcFunctions);

  // connect to all transports provided by the system
  this.connect(eve.system.transports.getAll());
}
BottleAgent.prototype = Object.create(eve.Agent.prototype);
BottleAgent.prototype.constructor = BottleAgent; // not needed?

BottleAgent.prototype.execute = function(){
  var self = this;
  this.beFilled();
};

// ==============================================================================
// Services =====================================================================
BottleAgent.prototype.rpcFunctions = {};
BottleAgent.prototype.rpcFunctions.getBottlePosition = function(params, from) {
  console.log('#getFillerLevel - RPC from:', from);
  return {err: 'not yet implemented'};
};
BottleAgent.prototype.rpcFunctions.getBottleStatus = function(params, from) {
  console.log('#getFillerLevel - RPC from:', from);
  return {err: 'not yet implemented'};
};
// Services End =================================================================
// ==============================================================================


// ==============================================================================
// Behaviour ====================================================================
BottleAgent.prototype.beFilled = function(){
  var self = this;

  co(function* () {
    var agents = yield self._searchSkill('fill');
    agents = yield Promise.all(_.map(agents, (agent) => self._addStatus(agent)));
    console.log('agents', agents);
  })
  .catch(function(err){
    console.log('coCatch err',err);
  });
};
// Behaviour End ================================================================
// ==============================================================================

BottleAgent.prototype._searchSkill = function(skill){
  return this.rpc.request(this.DF,{method: 'search', params: {skill: skill}})
    .then(function(reply){
      if(reply.err) throw new Error('#getAgents could not be performed' + err);
      if(_.isEmpty(reply)) throw new Error('no skill was found');
      console.log('#searchSkill',skill,':',reply);
      return reply;
    })
    .catch(function(err){
      console.log('_searchSkill err',err);
    });
};

BottleAgent.prototype._addStatus = function(agentObj){
  return this.rpc.request(agentObj.agent, { method: 'getFillerStatus', params: {}})
    .then(function(status){
      console.log(agentObj.agent, 'says it has status', status);
      agentObj.status = status;
      return agentObj;
    })
    .catch(function(err){
      console.log('_getStatus err',err);
    });
};

module.exports = BottleAgent;