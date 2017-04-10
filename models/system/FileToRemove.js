/**
 * 需要被删除的文件，专门用于处理上传文件
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var async = require('async');

var FileToRemoveSchema = mongoose.Schema({
  file: {
    type: ObjectId,
    ref: 'File'
  },
  done: Boolean
});

FileToRemoveSchema.statics.queue = function (files, callback) {
  if(!files || files.length <= 0) {
    callback(null, null);
  } else {
    var removeFiles = [];
    for(var i = 0; i < files.length; i++) {
      var f = files[i]; //{filename: newFileName, path: path, destination: uploadDir, size: file.size}
      var fobj = new FileToRemove({
        file: f,
        done: false
      });
      removeFiles.push(fobj);
    }
    console.log('******** remove files:', files);
    if(removeFiles.length > 0) {
      async.map(removeFiles, function (f, cb) {
        f.save(function (err, file) {
          cb(null, file);
        });
      }, function (err, results) {
        callback(err, results);
      });
    } else {
      cb(null, null);
    }
  }
};
var FileToRemove = mongoose.model('FileToRemove', FileToRemoveSchema, 'filetoremoves');
module.exports = FileToRemove;