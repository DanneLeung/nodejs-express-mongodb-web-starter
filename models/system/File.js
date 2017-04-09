/**
 * 系统中上传文件记录
 */
var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var async = require('async');
var config = require('../../config/config');

var FileSchema = mongoose.Schema({
  mime: {type: String, default: ''}, //MIME
  fieldname: {type: String, default: ''}, //文件上传时field name
  filename: {type: String, default: ''}, //文件名
  thumbFilename: {type: String, default: ''}, //thumb文件名
  path: {type: String, default: ''}, //相对稳健存储目录的全相对路径，含文件名
  thumb: {type: String, default: ''}, //thumb相对稳健存储目录的全相对路径，含文件名
  destination: {type: String, default: ''}, //相对稳健存储目录的存储目录
  url: {type: String, default: ''}, //相对稳健存储目录的存储目录
  thumbUrl: {type: String, default: ''}, //thumb相对稳健存储目录的存储目录
  size: {type: Number, default: 0}, //文件大小
  width: {type: Number, default: 0}, //图片宽度
  height: {type: Number, default: 0}, //图片高度
}, {timestamps: {}});

/**
 * 更新文件确保与数据关联
 * @param ids
 * @param refId
 * @param callback
 */
FileSchema.statics.filesLinked = function (ids, refId, callback) {
  File.update({'_id': {$in: ids}}, {refid: refId}, {multi: true}, function (err, files) {
    if (err) console.error(err);
    callback(err, files);
  });

}

function mkdirsSync(dirname, mode) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname), mode)) {
      fs.mkdirSync(dirname, mode);
      return true;
    }
  }
}

function addSlash(str) {
  if (!str) return str;
  return str.indexOf('/') == 0 ? str : '/' + str;
}
var File = mongoose.model('File', FileSchema, 'files');
module.exports = File;
