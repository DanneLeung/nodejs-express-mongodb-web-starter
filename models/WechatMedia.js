/**
 * 微信公众号永久素材缓存列表
 */
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var fs = require('fs');

let config = require('../config/config');
let fileUtil = require(config.root + '/util/file');
const basePath = config.root + '/' + config.file.local + '/wecaht/meterial';

var WechatMediaSchema = new Schema({
  appid: {type: String, index: true, default: ""},
  media_id: {type: String, index: true, default: ""},
  type: {type: String, default: ""},//素材的类型，图片（image）、视频（video）、语音 （voice）、图文（news）
  content: {
    news_item: [{
      title: {type: String, default: ""},
      thumb_media_id: {type: String, default: ""},
      thumb_url: {type: String, default: ""},
      //thumb_path: {type: String, default: ""},
      show_cover_pic: {type: String, default: ""},
      author: {type: String, default: ""},
      digest: {type: String, default: ""},
      content: {type: String, default: ""},
      url: {type: String, default: ""},
      content_source_url: {type: String, default: ""}
    }]
  },
  name: {type: String, default: ""},//素材名称
  downloaded: {type: Boolean, default: false},//已下载？
  update_time: {type: String, default: ""},
  url: {type: String, default: ""},//URL
  path: {type: String, default: ""},//本地存储的路径
  title: {type: String, default: ""},//视频title
  description: {type: String, default: ""},//视频描述
  down_url: {type: String, default: ""}//视频下载链接
}, {timestamps: {}});


/**
 * 保存素材到数据库中
 * @param mediaId
 * @param data
 * @param done
 */

var WechatMedia = mongoose.model('WechatMedia', WechatMediaSchema, 'wechatmedias')
module.exports = WechatMedia;
