/**
 * Created by danne on 2016-05-11.
 */
var fs = require('fs');
var async = require('async');
var _ = require('lodash');

var mongoose = require('mongoose');
var Template = mongoose.model('Template');
var Setting = mongoose.model('Setting');

var config = require('../../config/config');

exports = module.exports = function () {
  //站点，商城模板
  var types = ['site', 'shop'];
  for (var i = 0; i++; i < types.length) {
    var type = types[i];
    var dir = config.template.path + type;
    var templates_path = config.root + dir;
    fs.readdirSync(templates_path).forEach(function (file) {
      var stat = fs.fstatSync(fs.openSync(templates_path + '/' + file, 'r'));
      if (!stat.isDirectory() || file == '.svn')
        return;
      console.log("************* template ", JSON.stringify(file));
      var json = require(templates_path + '/' + file + '/template.json');
      Template.findOneAndUpdate({
        name: json.name
      }, json, {
          new: true
        }, function (err, t) {
          if (err) console.error(err);
          if (!t) {
            var template = new Template(json);
            template.type = type;
            template.directory = dir + '/' + file
            template.save(function (err, temp) {
              console.log('*************** template loaded', temp);
            });
          }
        });
    });
  }
};
