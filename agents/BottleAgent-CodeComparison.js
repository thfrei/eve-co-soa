co(function* () {
  var agents = yield self._searchSkill('fill');
  var statuses = yield Promise.all(_.map(agents, (agent) => self._getStatus(agent.agent)));
  console.log('statuses', statuses);
})

self._searchSkill('fill')
  .then(function(agents){
    var statuses = [];
    _.each(agents, function(entry){
      self._getStatus(entry.agent)
        .then(statuses.push);
    });
    console.log(statuses);
  });