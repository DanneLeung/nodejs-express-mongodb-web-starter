/**
 * Created by danne on 2016-05-12.
 */

var gm = require('gm').subClass({imageMagick: true});
var async = require('async');
var fs = require('fs');

exports.thumbnail = function (files, defaultSize, callback) {
  if (!files || files.length <= 0) {
    return callback(files);
  }
  // default size.
  var width = height = 150; //thumbnail
  if (defaultSize) {
    if (defaultSize instanceof Array && defaultSize.length == 2) {
      width = defaultSize[0];
      height = defaultSize[1];
    } else {
      width = height = defaultSize;
    }
  }

  async.map(files, function (file, c) {
    if (!file || !file.size)
      return c(null, file);
    var input = file.path;
    var out = file.path;
    var filename = file.filename;
    var newFilename = filename;

    // 使用文件中设定的大小
    if (file.hasOwnProperty('width')) width = file.width;
    if (file.hasOwnProperty('height')) height = file.height;

    if (width <= 0 || height <= 0) {
      return c(null, file);
    }

    // rename file
    var idx = filename.indexOf('.');
    if (idx >= 0) {
      newFilename = filename.substr(0, idx) + '_' + width + '_' + height + filename.substr(idx);
    }
    out = out.replace(filename, newFilename);

    // 压缩图片，
    gm(input).resize(width, height).crop(width, height).autoOrient().write(out, function (err) {
      if (err) console.error(err);
      if (!fs.existsSync(out)) {
        console.error('thumbnailed image file %s not exists, fail.');
      }
      //file.filename = newFilename;
      //file.path = input;
      file.thumb = out;
      file.thumbFilename = newFilename;
      c(null, file);
    });
  }, function (err, result) {
    console.log("*********** file thumb: " + JSON.stringify(result));
    callback(result);
  });
}
