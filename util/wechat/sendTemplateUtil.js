/**
 * Created by xiao3612736 on 2016/8/29.
 * 微信模板消息管理
 */
"use strict";
let mongoose = require('mongoose');
let WechatApi = require('./wechatApiUtil');

module.exports = function (appid, appsecret) {
  var api = new WechatApi(appid, appsecret).getWechatApi();

  /**
   * 获取模板列表
   * @param req
   * @param res
   */
  this.getAllPrivateTemplate = function(cb){
    if(!cb){
      cb = function(){}
    }
    api.getAllPrivateTemplate((err, obj)=>{
      cb(err, obj);
    })
  }

  /**
   * 删除模板
   * @param templateId
   * @param cb
   */
  this.delPrivateTemplate = function(templateId, cb){
    if(!templateId){
      console.error('delete template, but templateId is not exists')
      cb('delete template, but templateId is not exists', null);
      return;
    }
    if(!cb){
      cb = function(){}
    }
    api.delPrivateTemplate(templateId, (err, obj)=>{
      cb(err, obj);
    })
  }

  /**
   * 发送模板消息
   * @param openid
   * @param templateId
   * @param url
   * @param data
   * @param callback
   * @param callback2
   */
  this.sendTemplate = function(openid, templateId, url, data, callback, callback2){
    api.sendTemplate(openid, templateId, url, data, (err, obj)=>{
      callback(err, obj);
    })
  }
}
