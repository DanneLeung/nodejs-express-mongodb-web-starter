/**
 * Created by ZhangXiao on 2015/6/11.
 * 验证码
 */
"use strict";
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
var moment = require('moment');
/**
 * 验证码
 * @type {Schema}
 */
var CheckCodeSchema = new Schema({
  id: ObjectId
  , mobile: {type: String, trim: true, required: true, index: true}//手机号
  , type: {type: String, trim: true, required: true}//识别号
  , code: {type: String, trim: true, required: true}//验证码
  , ip: {type: String, trim: true, lowercase: true}//IP地址
  , expireAt: {type: Date, default: Date.now}//时效时间
  , used: {type: Boolean, default: false}//是否使用
  , usingAt: {type: Date}//使用时间
}, {timestamps: {}});

CheckCodeSchema.methods = {
  /**
   * 生成6位随机数验证码
   * @param len
   * @returns {string}
   */
  genCheckCode: function (len) {
    if (!len) {
      len = 6;
    }
    var code = '';
    for (var i = 0; i < len; i++) {
      code += parseInt(10 * Math.random());
    }
    return code;
  },

  /**
   * 发送验证码到手机
   * @param mobile
   * @param ip
   * @param now
   * @param len
   */
  sendToMobile: function (mobile, type, len, ip, callback) {
    var now = new Date();
    var len = arguments.length;
    if (len == 2) {
      type = "default";
      len = 6;
      ip = "127.0.0.1";
      callback = arguments[1];
    } else if (len == 3) {
      len = 6;
      ip = "127.0.0.1";
      callback = arguments[2];
    } else if (len == 4) {
      ip = "127.0.0.1";
      callback = arguments[3];
    }
    var nowStr = moment(new Date()).format('YYYY-MM-DD');
    var nowDate = new Date(nowStr + " 00:00:00");
    //检查手机号，当天不能发送超过10条短信
    CheckCode.count({"mobile": mobile, "type": type, "createdAt":{$gt: nowDate}},(e, o)=>{
      console.log('count============>', e, o);
      if(o && o >= 10){
        callback({"success": "0", "msg": "您今天使用的短信验证码已经超过10次"});
        return;
      }else{
        //发送验证码到手机
        //1:检查60秒内是否发送过，如果已发过，需要等待.
        CheckCode.findOne({mobile: mobile, expireAt: {$gt: now}, used: false, type: type}, function (err, obj) {
          if (err) {
            console.log(err);
            callback({"success": "0", "msg": "获取验证码失败"});
          } else if (obj) {
            //如果有数据，查看在60秒内发过没
            var diff = (now.getTime() - obj.createdAt.getTime()) / 1000;
            if (diff < 60) {
              //60秒内不允许重复发
              return callback({"success": "0", "msg": "距离上次发送不超过60秒，不能重复发送"});
            } else {
              obj.used = true;//如果在有效期内，超过60秒，可以再发，并设置该记录状态为已使用
              obj.save();

              var code = new CheckCode().genCheckCode(len);
              var dnow = new Date();
              //存手机号和验证码到数据库
              var checkCode = new CheckCode({
                mobile: mobile
                , type: type
                , code: code
                , ip: ip
                , createdAt: now
                , expireAt: new Date(dnow.setMinutes(dnow.getMinutes() + 3))//3分钟后失效
                , used: false
              });
              checkCode.save(function (err, result) {
                if (err) {
                  return callback({"success": "0", "msg": "获取验证码失败"});
                }
                callback({"success": "1", "data": result});
              });
            }
          } else {
            CheckCode.update({"mobile": mobile, "type": type, "used": false}, {"used": true}, {
              multi: true,
              upsert: false
            }, function (e, o) {
              console.log(e, o);
            })

            var code = new CheckCode().genCheckCode(len);
            var dnow = new Date();
            //存手机号和验证码到数据库
            var checkCode = new CheckCode({
              mobile: mobile
              , type: type
              , code: code
              , ip: ip
              , createdAt: now
              , expireAt: new Date(dnow.setMinutes(dnow.getMinutes() + 3))//3分钟后失效
              , used: false
            });
            checkCode.save(function (err, result) {
              if (err) {
                console.log(err);
                callback({"success": "0", "msg": "获取验证码失败"});
              }
              callback({"success": "1", "data": result});
            });
          }
        });
      }
    });
  },

  /**
   * 检查一个ip发送的次数
   * @returns {boolean}
   */
  checkIpCount: function () {
    return true;
  },

  /**
   * 修改验证码状态为已使用
   * @param mobile
   * @param type
   * @param callback
   */
  modifyUsed: function (mobile, type, code, callback) {
    CheckCode.findOneAndUpdate({mobile: mobile, used: false, type: type, code: code}, {"used": true}, function (e, o) {
        if (e) {
          setTimeout(function () {
            CheckCode.findOneAndUpdate({mobile: mobile, used: false, type: type, code: code}, {"used": true}, function (e, o) {
                console.log('update mobile check unUse again', mobile, e, o);
                callback(e, o);
              });
          }, 1000);
        }
        console.log('update mobile check unUse', mobile, e, o);
        callback(e, o);
      });
  },

  /**
   * 验证验证码是否过期
   * @param mobile
   * @param type
   * @param callback
   */
  checkExpireAt: function (mobile, type, callback) {
    CheckCode.count({mobile: mobile, expireAt: {$gt: new Date()}, used: false, type: type}, function (err, count) {
      if (err || count == 0) {
        return callback(false);
      } else {
        callback(true);
      }
    });
  }
}


var CheckCode = mongoose.model('CheckCode', CheckCodeSchema)