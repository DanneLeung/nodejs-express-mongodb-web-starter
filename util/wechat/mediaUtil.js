/**
 * Created by ZhangXiao on 2016/4/15.
 */
"use strict";
let async = require('async');
let fs = require('fs');
let path = require('path');

let config = require('../../config/config');
let fileUtil = require(config.root + '/util/file');
let WechatApi = require('./wechatApiUtil');
let mongoose = require('mongoose');
let WechatMedia = mongoose.model('WechatMedia');

const baseDir = '/wecaht/material';
const basePath = path.join(config.root, config.file.local, baseDir);
/**
 * 素材管理
 * @param appid
 * @param appsecret
 */
module.exports = function (appid, appsecret) {
  var api = new WechatApi(appid, appsecret).getWechatApi();
  /**
   * 素材存放根目录;
   * @returns {string}
   */
  this.basePath = () => {
    return basePath;
  }
  /**
   * 上传临时素材
   * @param filePath
   * @param type
   * @param callback
   */
  this.uploadMedia = function (filePath, type, callback) {
    api.uploadMedia(filePath, type, function (err, result) {
      callback(err, result);
    })
  }

  /**
   * 获取临时素材
   * @param mediaId
   * @param callback
   */
  this.getMedia = function (mediaId, callback) {
    WechatMedia.findOne({ 'media_id': mediaId, downloaded: true }).exec((err, media) => {
      if(err) {
        console.error(err);
      }
      // 本地不存在
      if(!media) {
        api.getMedia(mediaId, (err, data, res) => { handleSave(mediaId, err, data, res, callback) });
      } else {
        console.log("************* 本地读取 mediaId %s 文件.", mediaId);
        return callback(err, media);
      }
    });
  }

  /**
   * 上传永久素材
   * 上传永久素材，分别有图片（image）、语音（voice）、和缩略图（thumb）
   *{ media_id: '57gl1ZSb2Yoaq6p5l6G-zOgGiHxeda9kggLS_khESFw',
   *  url: 'https://mmbiz.qlogo.cn/mmbiz/XSP3FPZLy2eOCd2qm2I30JyHWkDEjUbe6cfWLHqT833YTXs4rrJWkNOeruzy3kpFxVichBAYeZlyGhYricHooVMA/0?wx_fmt=png' }
   * @param filePath
   * @param type
   * @param callback
   */
  this.uploadMaterial = function (filePath, type, callback) {
    api.uploadMaterial(filePath, type, function (err, result) {
      callback(err, result);
    })
  }

  /**
   * 获取永久素材
   * @param mediaId
   * @param callback
   */

  this.getMaterial = function (mediaId, callback) {
    WechatMedia.findOne({ 'media_id': mediaId, downloaded: true }).exec((err, media) => {
      if(err) {
        console.error(err);
      }
      // 本地不存在
      if(!media) {
        api.getMaterial(mediaId, (err, data, res) => { handleSave(mediaId, err, data, res, callback) });
      } else {
        console.log("************* 本地读取 mediaId %s 文件.", mediaId);
        return callback(err, media);
      }
    });
  };

  /**
   * 删除永久素材
   * @param mediaId
   */
  this.removeMaterial = function (mediaId, callback) {
    api.removeMaterial(mediaId, function (err, result) {
      callback(err, result);
    })
  }

  /**
   * 获取素材总数
   * @param callback
   */
  this.getMaterialCount = function (callback) {
    api.getMaterialCount(function (err, result) {
      callback(err, result);
    });
  }

  this.getMaterials = function (type, offset, count, callback) {
    api.getMaterials(type, offset, count, function (err, result) {
      callback(err, result);
    });
  }

  this.syncMedia = function (appid, type, done) {
    var results = [];
    getMaterialCount((err, result) => {
      if(err) console.error(err);
      console.log("公众号%s素材 ", type, results);
      var count = 50;
      var total = result[type + "_count"] ? result[type + "_count"] : 0;
      if(total <= 0) {
        return done(null, null);
      }
      //分页读取函数
      var tasks = [];
      for(var i = 0; i <= total; i = i + count) {
        //tasks.
        var func = function (offset, medias, callback) {
          if(typeof offset === 'function') {
            callback = offset;
            offset = 0;
          }
          if(!offset) offset = 0;
          console.log("同步 %s 开始位置 %s 的公众号素材的参数", type, offset, medias, callback);
          api.getMaterials(type, offset, count, function (err, results) {
            console.log("同步 %s 开始位置 %s 的公众号素材", type, offset, medias, results);
            if(err) {
              console.error(err);
              return callback(err, offset + count, medias);
            }
            if(results && results.item && results.item.length > 0) {
              var items = results.item;
              async.map(items, (item, cb) => {
                item.appid = appid;
                item.type = type;
                //if (typeof item.content !== 'undefined' && typeof item.content.news_item !== 'undefined') {
                //  item.news_item = item.content.news_item;
                //}
                WechatMedia.findOneAndUpdate({ 'media_id': item.media_id }, item, { new: true, upsert: true }, err => {
                  if(err) console.error(err);
                  return cb(null, err ? null : item);
                });
              }, (err, results) => {
                //if (!medias) medias = [];
                //medias.push(results);
                return callback(null, offset + count, results);
              });
            }
          });
        };
        tasks.push(func);
      }
      if(tasks.length > 0) {
        async.waterfall(tasks, (err, offset, results) => {
          if(err) console.error(err);
          return done(null, results);
        });
      } else {
        return done(null, null);
      }
    });
  }

  /**
   * 取所有的多媒体数据
   * @param type 分别有图片（image）、视频（video）、语音 （voice）、图文（news）
   * @param callback
   */
  this.getAllMaterials = function (type, callback) {
    //offset:从第几条开始取
    //count:一次取多少条
    var offset = 0,
      count = 20;
    //total:总条数
    //tempTotal:已经取了多少条
    var total = 0,
      tempTotal = 0;
    var results = [];

    async.waterfall([function (cb) {
      api.getMaterials(type, offset, count, function (err, result) {
        if(!err) {
          results = results.concat(result.item);
          if(results.length > 0) {
            total = result.total_count;
            offset = result.item_count;
            tempTotal += result.item_count;
          }
          cb(null, results);
        } else {
          cb(err, results);
        }
      });
    }, function (results, cb) {
      //继续取剩余数据
      if(total > tempTotal) {
        var sync = function () {
          console.log('已经取了' + tempTotal + '条数据');
          api.getMaterials(type, offset, count, function (err, result) {
            results = results.concat(result.item);
            offset += result.item_count;
            tempTotal += result.item_count;
            if(total > tempTotal) {
              sync();
            } else {
              cb(null, results);
            }
          });
        }

        sync();
      } else {
        cb(null, results);
      }
    }], function (err, result) {
      callback(err, result);
    });
  }

  function handleSave(mediaId, err, data, res, callback) {
    if(err) {
      console.error("**************** 微信接口读取mediaId %s 错误.", err);
      return callback(err);
    }
    var contentType = res.headers['content-type'];
    console.log("************* mediaId %s 素材不存在，微信远程获取.", mediaId, contentType);
    if(contentType === 'application/json' || contentType === 'text/plain') {
      // json，写入db
      data = JSON.parse(data);
      data.downloaded = true;
      WechatMedia.findOneAndUpdate({ 'media_id': mediaId, 'appid': api.appid }, data, { new: true, upsert: true }, (err, wm) => {
        if(err) console.error(err);
        return callback(err, err ? null : wm);
      });
    } else {
      // buffer data
      fileUtil.mkdirsSync(basePath);
      fs.writeFile(path.join(basePath, mediaId), data, (err) => {
        if(err) {
          console.error(err);
          return callback(err, null)
        }
        WechatMedia.findOneAndUpdate({ 'media_id': mediaId }, {
          'media_id': mediaId,
          path: path.join(baseDir, mediaId),
          downloaded: true
        }, {
          new: true,
          upsert: true
        }, (err, wm) => {
          if(err) {
            console.error(err);
            return callback(err, null);
          }
          return callback(null, wm);
        });
      });
    }

  }
}