/**
 * Created by ZhangXiao on 2016/4/15.
 */
"use strict";
let async = require('async');
let fs = require('fs');

let config = require('../../config/config');
let fileUtil = require(config.root + '/util/file');
let WechatApi = require('./wechatApi');
let mongoose = require('mongoose');
let WechatSendMessage = mongoose.model('WechatSendMessage');

const basePath = config.root + '/' + config.file.local + '/wechat/meterial';
/**
 * 发送消息
 * @param appid
 * @param appsecret
 */
module.exports = function (appid, appsecret) {
  var api = WechatApi(appid, appsecret);

  /**
   * 发送单个文本消息
   * @param filePath
   * @param type
   * @param callback
   */
  this.sendText = function (data, text, callback) {
    api.sendText(data.openid, text, function (err, result) {
      if(err){
        console.error('send text err>>>', err);
        callback(err, null);
        return;
      }
      var wsm = new WechatSendMessage(data);
      wsm.msgType = 'text';
      wsm.content = text;
      wsm.save(function(e, o){
        callback(e, o);
      });
    })
  }

  /**
   * 群发消息
   * @param opts
   * @param receivers
   * @param callback
   *
   *  opts:
   * ```
   * 图片
   * {
   *  "image":{
   *    "media_id":"123dsdajkasd231jhksad"
   *  },
   *  "msgtype":"image"
   * }
   * 图文
   * {
   *  "mpnews":{
   *    "media_id":"123dsdajkasd231jhksad"
   *  },
   *  "msgtype":"mpnews"
   * }
   * 文本
   * {
   *  "text":{
   *    "content":"CONTENT"
   *  },
   *  "msgtype":"text"
   * }
   * 声音
   * {
   *  "voice":{
   *    "media_id":"123dsdajkasd231jhksad"
   *  },
   *  "msgtype":"voice"
   * }
   * 视频
   * 请注意，此处视频的media_id需通过POST请求到下述接口特别地得到： https://file.api.weixin.qq.com/cgi-bin/media/uploadvideo?access_token=ACCESS_TOKEN POST数据如下（此处media_id需通过基础支持中的上传下载多媒体文件来得到）：
   {
     "media_id": "rF4UdIMfYK3efUfyoddYRMU50zMiRmmt_l0kszupYh_SzrcW5Gaheq05p_lHuOTQ",
     "title": "TITLE",
     "description": "Description"
   }
   返回将为

   {
     "type":"video",
     "media_id":"IhdaAQXuvJtGzwwc0abfXnzeezfO0NgPK6AQYShD8RQYMTtfzbLdBIQkQziv2XJc",
     "created_at":1398848981
   }
   * {
   *  "mpvideo":{
   *    "media_id":"IhdaAQXuvJtGzwwc0abfXnzeezfO0NgPK6AQYShD8RQYMTtfzbLdBIQkQziv2XJc"
   *  },
   *  "msgtype":"mpvideo"
   * }
   *
   * receivers:接收者.
   * 1.如果是发给多个人，receivers是openid集合
   * 2.receivers = true, 发送给所有人，is_to_all: true
   * 3.发给某一个分组, receivers = group_id,
   *  Result:
   * ```
   * {
   *  "errcode":0,
   *  "errmsg":"send job submission success",
   *  "msg_id":34182
   * }
   */
  this.massSend = function(opts, receivers, callback){
    api.massSend(opts, receivers, (err, result)=>{
      callback(err, result);
    });
  }
}
