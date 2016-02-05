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
  this.prePlanning();
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
BottleAgent.prototype.prePlanning = function(){
  var self = this;

  co(function* () {
    var agents = yield self._searchSkill('fill');
    agents = yield Promise.all(_.map(agents, (agent) => self._addStatus(agent)));
    var closestAgent = self.__computeClosestFiller(agents); // it might be nice to outsource the decision process?
    // Now reserve filling

    // Request transportation

    // execute
    console.log(closestAgent);
  })
  .catch(function(err){
    console.log('coCatch err',err);
  });
};
// Behaviour End ================================================================
// ==============================================================================

/**
 *
 * @param skill <string> 'fill'
 * @returns {*|Promise.<T>}
 * @private
 */
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

/**
 *
 * @param agentObj ojb={agent: 'FillerInstance', skills: [ 'fill', 'getFillerStatus', 'getFillerPosition' ]}
 * @returns {*|Promise.<T>} {agent: '..', skills: [..], status: {a: 1, b:2 ,..}
 * @private
 */
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

/**
 *
 * @param agentsObj [{agent: '..', skills: [..], status: {position: x, b:2 ,..}]
 * @returns agentObj
 * @private
 */
BottleAgent.prototype.__computeClosestFiller = function(agentsObj){
  var currentPosition = 0;
  var closestDistance = 999999999; // max Distance on track (really big number)
  var closestAgent = undefined;

  _.each(agentsObj, (agent) => {
    let difference = Math.abs(agent.status.position - currentPosition);
    if( difference < closestDistance ){
      closestDistance = difference;
      closestAgent = agent;
    }
  });

  return closestAgent;
};

module.exports = BottleAgent;