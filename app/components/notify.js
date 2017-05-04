'use strict';

let mongoose = require('mongoose');

let Wechat = mongoose.model("Wechat");
let WechatApi = require("../../util/wechat/wechatApi");
let Setting = mongoose.model('Setting');

exports.notifyComment = function (appid, openid, nickname, node, topicid, callback) {
  // let templateId = "mxObob98KCwHO4N4eGvfYavv1_sqIVv9_aofjQNhRKg";
  let templateId = "rKwHgJ0kyjlWkL5UCeh4_LY1KyruV-mo3cPdB_x4lLs";
  let title = "12节课情商提升";
  let data = { first: { value: nickname + "点评了你的功课啦" }, keyword1: { value: title }, keyword2: { value: node }, keyword3: { value: Date.now() }, remark: {} };
  Setting.getByKey('context.front', function (setting) {
    let contextFront = "";
    if(setting) {
      contextFront = setting.value;
    }
    let url = contextFront + "/topic/view/" + topicid;
    sendTemplate(appid, openid, templateId, url, data, callback);
  });
}

/**
 * 发送模板消息
 * @param openid 接收粉丝openid
 * @param templateId 模板消息id
 * @param url 跳转链接
 * @param data 模板数据
 * @param callback
 */
function sendTemplate(appid, openid, templateId, url, data, callback) {
  Wechat.findByAppid(appid, (err, wechat) => {
    if(err || !wechat) {
      console.error(err);
      return callback("Appid对应的公众号信息不存在，无法发送模板消息!", null);
    }
    let api = WechatApi(appid, wechat.appsecret);
    api.sendTemplate(openid, templateId, url, data, (err, result) => {
      if(err) {
        console.error(err);
      }
      console.log(" >>>>>>>>>>>>>>> 模板消息发送结果 ", openid, data, result);
      return callback(err, result);
    });
  });
}