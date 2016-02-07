"use strict";

var _ = require('underscore');
var Promise = require('bluebird');
var co = require('co');
var eve = require('evejs');

const EventEmitter = require('events');
const util = require('util');
function MyEmitter() {
  EventEmitter.call(this);
}
util.inherits(MyEmitter, EventEmitter);
const myEmitter = new MyEmitter();

function Agent(agent) {
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
Agent.prototype = Object.create(eve.Agent.prototype);
Agent.prototype.constructor = Agent; // not needed?

Agent.prototype.execute = function(){
  return Promise.resolve().bind(this) // bluebird Promise required for Promise.bind()
    .then(this.register)
    .then(this.prePlanning);
};
// ==============================================================================
// Services =====================================================================
Agent.prototype.rpcFunctions = {};
Agent.prototype.rpcFunctions.getBottlePosition = function(params, from) {
  console.log('#getFillerLevel - RPC from:', from);
  return {err: 'not yet implemented'};
};
Agent.prototype.rpcFunctions.getBottleStatus = function(params, from) {
  console.log('#getFillerLevel - RPC from:', from);
  return {err: 'not yet implemented'};
};
Agent.prototype.rpcFunctions.informOfArrival = function(params, from) {
  console.log('#informOfArrival - RPC from:', from);
  let orderId = params.orderId;

  myEmitter.emit('informOfArrival', orderId);

  return {ack: true, description: 'arrival recognised'};
};
// Services End =================================================================
// ==============================================================================


// ==============================================================================
// Behaviour ====================================================================
Agent.prototype.prePlanning = function(){
  var self = this;

  co(function* () {
    // Find all agents with skill 'fill'
    var agents = yield self._searchSkill('fill');
    // Ask the agents about their status (add it to the existing object)
    agents = yield Promise.all(_.map(agents, (agent) => self._addStatus(agent)));
    // Compute the closes agent
    var closestAgent = self.__computeClosestFiller(agents); // it might be nice to outsource the decision process?
    // Reserve a production in the agent
    if ( yield self._reserveSkill(closestAgent, 'fill') ) {
      console.log('reservation succesfull');
    }
    // Request transportation
    yield self._requestTransportation(closestAgent.status.position, 1337);
    let arrived = yield self._informOfArrival(1337); // total blocking the logic until arrival
    if ( arrived ){ // obsolete, since we will not continue until above function yielded
      console.log('ARRIVED !!!!');
      // fill
    } else {
      console.log('should never be in here, major business logic error');
    }
    // execute
    //console.log(closestAgent);
  })
  .catch(function(err){
    console.log('coCatch err',err);
  });
};
Agent.prototype.register = function(){
  // Register skills
  return this.rpc.request(this.DF,{method: 'register', params: {skills: this.skills}})
    .then(function(reply){
      if(reply.err) throw new Error('#register could not be performed: ' + reply.err);
      else console.log('#register successfull');
    })
    .catch(function(err){
      console.log('#register catched err:',err);
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

/**
 *
 * @param skill <string> 'fill'
 * @returns {*|Promise.<T>}
 * @private
 */
Agent.prototype._searchSkill = function(skill){
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

Agent.prototype._reserveSkill = function(agent, orderId, product){
  return this.rpc.request(agent.agent, {method: 'reserve', params: {orderId: orderId, product: product}})
    .then(function(reply){
      console.log(reply);
      return true;
    })
    .catch(function(err){
      console.log('_reserveSkill err:', err);
    });
};

Agent.prototype._requestTransportation = function(position, orderId){
  var self = this;

  return this.rpc.request(this.DF,{method: 'search', params: {skill: 'transport'}})
    .then(function(reply){
      var transportAgent = reply[0];
      return self.rpc.request(transportAgent.agent, {method: 'transport', params: {Position: 10, orderId: orderId }});
    });
};

Agent.prototype._informOfArrival = function(orderId){
  return new Promise(function(resolve, reject){
    myEmitter.on('informOfArrival', function(EventOrderId){
      if ( orderId == EventOrderId ){
        resolve(true);
      }
    });
  });
};

/**
 *
 * @param agentObj ojb={agent: 'FillerInstance', skills: [ 'fill', 'getFillerStatus', 'getFillerPosition' ]}
 * @returns {*|Promise.<T>} {agent: '..', skills: [..], status: {a: 1, b:2 ,..}
 * @private
 */
Agent.prototype._addStatus = function(agentObj){
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
Agent.prototype.__computeClosestFiller = function(agentsObj){
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

module.exports = Agent;