var fs = require('fs');
var path = require('path');

function loadDir(dir) {
  console.log("*********** loading models from ", dir);
  fs.readdirSync(dir).forEach(function (file) {
    var mfile = path.normalize(dir + '/' + file);
    // console.log("*********** model file :", mfile);
    var stat = fs.statSync(mfile);
    if(stat.isFile()) {
      if(~file.indexOf('.js') && file != 'index.js') require(mfile);
      console.log("*********** model %s ", file.substr(0, file.indexOf('.js')));
    }
    if(stat.isDirectory()) {
      loadDir(mfile);
    }
  });
}
loadDir(__dirname);