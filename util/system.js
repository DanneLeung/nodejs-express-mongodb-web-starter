/**
 * Created by Administrator on 2015/4/18.
 */

//文件操作对象
var fs = require('fs');
var url = require('url');
//时间格式化
var moment = require('moment');
//文件压缩
var child = require('child_process');
var formidable = require('formidable')

var system = {
  //获取文件真实类型
  getFileMimeType: function (filePath) {
    var buffer = new Buffer(8);
    var fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    var newBuf = buffer.slice(0, 4);
    var head_1 = newBuf[0].toString(16);
    var head_2 = newBuf[1].toString(16);
    var head_3 = newBuf[2].toString(16);
    var head_4 = newBuf[3].toString(16);
    var typeCode = head_1 + head_2 + head_3 + head_4;
    var filetype = '';
    var mimetype;
    switch (typeCode) {
      case 'ffd8ffe1':
        filetype = 'jpg';
        mimetype = ['image/jpeg', 'image/pjpeg'];
        break;
      case 'ffd8ffe0':
        filetype = 'jpg';
        mimetype = ['image/jpeg', 'image/pjpeg'];
        break;
      case '47494638':
        filetype = 'gif';
        mimetype = 'image/gif';
        break;
      case '89504e47':
        filetype = 'png';
        mimetype = ['image/png', 'image/x-png'];
        break;
      case '504b34':
        filetype = 'zip';
        mimetype = ['application/x-zip', 'application/zip', 'application/x-zip-compressed'];
        break;
      case '2f2aae5':
        filetype = 'js';
        mimetype = 'application/x-javascript';
        break;
      case '2f2ae585':
        filetype = 'css';
        mimetype = 'text/css';
        break;
      case '5b7bda':
        filetype = 'json';
        mimetype = ['application/json', 'text/json'];
        break;
      case '3c212d2d':
        filetype = 'ejs';
        mimetype = 'text/html';
        break;
      default:
        filetype = 'unknown';
        break;
    }

    fs.closeSync(fd);

    return {
      fileType: filetype,
      mimeType: mimetype
    };

  },

  uploadTemp: function (req, res, callBack) {
    var form = new formidable.IncomingForm(), files = [], fields = [], docs = [];
    //存放目录
    var forderName;
    form.uploadDir = 'views/web/temp/';

    form.parse(req, function (err, fields, files) {
      if (err) {
        res.end(err);
      } else {
        fs.rename(files.Filedata.path, 'views/web/temp/' + files.Filedata.name, function (err1) {
          if (err1) {
            res.end(err1);
          } else {

            forderName = files.Filedata.name.split('.')[0];
            console.log('parsing done');
            callBack(forderName);
          }
        });
      }

    });
  }
};


module.exports = system;