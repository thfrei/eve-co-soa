var exec = require('mz/child_process').exec;


exec('node').then(function (stdout) {
  console.log('stdout:',stdout);
}).catch(console.log);

console.log('never finishes the spawning');