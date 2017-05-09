/**
 * Created by xiao3612736 on 2016/8/29.
 * 微信模板消息管理
 */
"use strict";
let mongoose = require('mongoose');
let WechatApi = require('./wechatApi');

module.exports = function (appid, appsecret) {
  var api = WechatApi(appid, appsecret);

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
   * @param openid 接收粉丝openid
   * @param templateId 模板消息id
   * @param url 跳转链接
   * @param data 模板数据
   * @param callback
   */
  this.sendTemplate = function(openid, templateId, url, data, callback){
    api.sendTemplate(openid, templateId, url, data, (err, obj)=>{
      callback(err, obj);
    })
  }
}
