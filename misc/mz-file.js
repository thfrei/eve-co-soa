var fs = require('mz/fs');

var counter = 1;


fs.writeFile("./test", counter++)
  .then(function(){
    console.log('file was saved');
    setTimeout(()=>{},1000);
  })