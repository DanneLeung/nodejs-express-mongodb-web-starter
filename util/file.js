/**
 * Created by danne on 2016-04-19.
 */
var fs = require('fs');
var path = require("path");
var async = require('async');
var moment = require('moment');
var mongoose = require('mongoose');
var crypto = require('crypto');

var config = require('../config/config');
var mime = require('../util/mime')
  .types;

var File = mongoose.model('File');
var FileToRemove = mongoose.model('FileToRemove');

/**
 * 移动一批文件从零时目录到目标目录
 * @param files
 */
exports.moveTmpFiles = function (files, done) {
  if (!files && files.length < 0) {
    return done(null);
  }
  async.map(files, function (file, cb) {
    if (file && file.lastIndexOf('tmp/')) {
      console.log("############ origin file :" + file);
      var dir = file.lastIndexOf('/') > 0 ? file.substring(0, file.lastIndexOf('/')) : file.substring(0, file.lastIndexOf('\\'));
      dir = dir.replace('tmp/', '')
        .replace(config.file.url, config.file.local)
      file = file.replace(config.file.url, config.file.local);
      if (!dir || !file) {
        return cb();
      }
      console.log("############ dir :" + dir + ', file:' + file);
      mkdirsSync(dir);
      //变换到文件存储目录
      fs.rename(file, file.replace('tmp/', ''), function (err) {
        if (err)
          console.error(err);
        //console.log("################## file moved: " + file);
        return cb(err);
      });
    } else {
      return cb();
    }
  }, function (err) {
    done(err);
  });
};

/**
 * 创建新目录
 * @param dirname
 * @param mode
 * @returns {boolean}
 */
var mkdirsSync = function (dirname, mode) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname), mode)) {
      fs.mkdirSync(dirname, mode);
      return true;
    }
  }
}
exports.mkdirsSync = mkdirsSync;
/**
 * 保存用于删除的文件记录
 * @param files
 * @param calback
 */
exports.removeFiles = function (files, callback) {
  FileToRemove.queue(files, callback);
};


/**
 * 保存文件记录到数据库，则callback中参数为保存成功的文件
 * @param files
 * @param calback
 */
exports.saveFiles = function (files, callback) {
  normalize(files, function (err, fs) {
    async.map(fs, function (file, cb) {
      var f = new File(file);
      f.save(function (err, ff) {
        console.error("file save ", JSON.stringify(ff));
        cb(null, ff);
      });
    }, function (err, results) {
      callback(null, results);
    });
  });
};

/**
 * 处理文件路径等能用于数据保存
 * @param files
 * @param callback
 */
exports.normalize = normalize = function (files, callback) {
  if (files && files.length > 0) {
    async.map(files, function (f, cb) {
      //var f = new File(file);
      var tmp = 'tmp/';
      //移动文件到目标目录
      console.log('************* move file from %s to %s', f.path, f.path.replace('tmp/', ''));
      mkdirsSync(f.destination.replace(tmp, ''));
      fs.renameSync(f.path, f.path.replace(tmp, ''));
      if (f.thumb) {
        console.log('************* move file from %s to %s', f.thumb, f.thumb.replace('tmp/', ''));
        fs.renameSync(f.thumb, f.thumb.replace(tmp, ''));

        f.thumbUrl = f.thumb = addSlash(f.thumb.replace(tmp, '').replace(config.file.local, ''));
      }
      // 去除配置中文件存储根目录，临时目录
      f.url = f.path = addSlash(f.path.replace(tmp, '').replace(config.file.local, ''));
      f.destination = addSlash(f.destination.replace(tmp, '').replace(config.file.local, ''));
      // 替换存储目录前缀为URL前缀
      cb(null, f);
    }, function (err, results) {
      callback(null, results);
    });
  } else {
    callback(null, null);
  }

};

/**
 * 保存上传的临时文件到临时目录，文件在保存为文件记录前，都在临时目录中操作
 *
 **/
exports.saveUploadFiles = function (files, identity, module, temp, callback) {
  if (!identity) {
    identity = "common";
  }
  if (!module) {
    module = '';
  }
  //存放目录
  var urlPrefix = config.file.url;
  var storeDir = config.file.local;
  if (storeDir.lastIndexOf('/') < 0)
    storeDir += '/';
  console.log("########## Store dir %s, url prefix %s", storeDir, urlPrefix);
  //temp=true时上传保存的临时目录，只有数据真正保存后才会移动到目标目录，临时目录可以随时清除
  var uploadDir = storeDir + 'upload/' + 'tmp/' + identity + '/' + module + '/';

  // 新文件名
  var m = moment(new Date());
  var ms = m.format('YYYYMMDD').toString();
  //文件最终目录。
  uploadDir += ms + '/';
  mkdirsSync(uploadDir);

  if (files) {
    async.map(files, function (file, c) {
      var newFileName = "";
      if (!file || !file.size)
        return c(null, null);
      var name = file.fieldname;
      // console.log(" ########## uploading file: " + JSON.stringify(file) + ', name: ' + name);
      //校验文件的合法性
      //日期子目录
      var contentType = file.mimetype;
      var fileName = file.originalname;
      var ext = fileName.substr(fileName.lastIndexOf('.') + 1);
      //文件名时间戳
      var timestamp = moment(new Date()).format('YYYYMMDDHHmmssSSS').toString();

      // var hash = ShortId.generate(); // use shortid as file name.
      console.log('hash file start time=====>', moment().format('YYYY-MM-DD HH:MM:ss SSS'));
      fileHash(file.path, 'md5', function (hash) {
        console.log('hash file end time=====>', moment().format('YYYY-MM-DD HH:MM:ss SSS'));
        newFileName = name + "_" + (hash ? hash : timestamp) + "." + ext;
        var path = uploadDir + newFileName; // new file path
        // console.log("******** uploading file to dir %s with name %s", uploadDir, newFileName);
        fs.renameSync(file.path, path);
        c(null, {fieldname: name, filename: newFileName, path: path, destination: uploadDir, size: file.size});
      });
    }, function (err, result) {
      //console.log("********* file uploaded: " + JSON.stringify(result));
      callback(result);
    });
  } else {
    callback();
  }
}

exports.addSlash = addSlash = function (str) {
  if (!str) return str;
  return str.indexOf('/') == 0 ? str : '/' + str;
};
//
//var images = ['D:/MingTai/9cubic/main/source/admin/public/upload/tmp/ccb/images/20160419/img20160419175156470.jpg'
//  , 'D:/MingTai/9cubic/main/source/admin/public/upload/tmp/ccb/images/20160419/img20160419175156478.jpg'];
//moveTmpFiles(images, function (err) {
//});
//
var fileHash = function fileHash(filename, algorithm, cb) {
  var txt = fs.ReadStream(filename);

  var shasum = crypto.createHash(algorithm);
  txt.on('data', function (d) {
    shasum.update(d);
  });

  txt.on('end', function () {
    var d = shasum.digest('hex');
    var s2 = new Date();
    cb(d);
  });
};
exports.fileHash = fileHash;
