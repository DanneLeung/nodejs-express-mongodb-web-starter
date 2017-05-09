/**
 * Created by yu869 on 2015/12/18.
 */
'use strict';
let async = require('async');
let mongoose = require('mongoose');
let WechatFans = mongoose.model('WechatFans');
let Wechat = mongoose.model('Wechat');
let ObjectId = mongoose.Types.ObjectId;
let config = require(__dirname + '/../../config/config');
let WechatAPI = require(config.root + '/util/wechat/wechatApi');

/**
 * 刷新粉丝列表
 * merge user info list
 */
let updateUsers = function (wechatId, api, openids, callback) {
  if(!openids.length) return callback();
  let i = 0,
    len = openids.length;
  async.whilst(() => i < len, (cb) => {
    //每百个粉丝更新一次
    let end = (i + 100 > len) ? len : (i + 100);
    let ids = openids.slice(i, end);
    i = end;
    WechatFans.update({ openid: { $in: ids } }, { $set: { Wechat: wechatId, flag: true, subscribe: "1" } }, { multi: true }, (err, result) => {
      if(err) {
        console.error(err)
        return cb(null, i);
      };
      console.log("****************** 更新粉丝为已关注 ", i, len, result.nModified);
      // 增量更新
      if(ids.length == result.nModified) {
        console.log("****************** 没有需要更新的粉丝信息! ");
        return cb(null, i);
      }
      //数量有差异
      batchUpdateUsers(wechatId, api, ids, (err, o) => {
        if(err) console.error(err);
        cb(null, i);
      });
    });
  }, (err, n) => {
    console.log("*************** 更新db中粉丝已关注!", n);
    return callback(n);
  })
};

let batchUpdateUsers = function (wechatId, api, openids, callback) {
  api.batchGetUsers(openids, (err, result) => {
    if(err || !result.user_info_list) {
      if(err) console.error(err);
      return callback("没有获取到粉丝信息列表!", null);
    }
    let userInfoList = result.user_info_list;
    async.map(userInfoList, (user, cb) => {
      //result.flag = true;//关注公众号的粉丝
      user.Wechat = wechatId; //渠道公众号
      user.flag = (user.subscribe == "1" || user.subscribe == 1); //是否订阅了公众号

      WechatFans.findOne({ openid: user.openid }, (err, of) => {
        if(!of || !of.unsubscribe_time) {
          // 没有记录，或者没有取消过关注的时间，则不是新粉丝
          user.subscribeTimes = 1; // 默认关注次数
        }
        WechatFans.findOneAndUpdate({
          openid: user.openid
        }, user, {
          new: true,
          upsert: true
        }, function (err, fan) {
          if(err) console.error(err);
          if(fan) console.log("*********** 取得粉丝数据: ", fan.openid);
          cb(null, fan);
        });
      });
      // WechatFans.findAndSave(user, function (fan) {
      // console.log('************* 粉丝信息已更新 ', fan);
      //不返回更新后结果，避免占用太多内存
      // cb(null, fan);
      // });
    }, (err, fans) => {
      callback(null, fans);
    });
  });
}

let syncWechatFans = function (wechatId, cb) {
  var q = {};
  if(wechatId) q._id = wechatId;
  //1.查渠道公共号配置信息
  Wechat.find(q, function (err, wechats) {
    if(err) {
      console.error(err);
      console.error('************* 找不到指定id: %s的公众号配置! ', wechatId);
    }
    if(wechats) {
      async.map(wechats, (wechat, done) => {
        console.log("************ 同步公众号(微信号：%s, 名称：%s，appid：%s)粉丝信息!", wechat.wechatNo, wechat.name, wechat.appid);
        let api = new WechatAPI(wechat.appid, wechat.appsecret).getWechatApi();
        //获取关注列表
        //参数  说明
        //total 关注该公众账号的总用户数
        //count 拉取的OPENID个数，最大值为10000
        //data 列表数据，OPENID的列表
        //next_openid  拉取列表的最后一个用户的OPENID
        //第一次读取粉丝信息
        let next_openid;
        api.getFollowers(function (err, obj) {
          if(err) {
            console.error(">>>>>" + err);
            return done(null, null);
          } else {
            //总数
            let total = obj.total;
            //单次取出数量
            let count = obj.count;
            console.log('************ 同步公众号：%s的粉丝信息，总数:', wechat.name, total, "本次:", count);
            //下一个起始的openid
            next_openid = obj.next_openid;
            let openids = obj.data.openid;

            if(openids && openids.length) {
              updateUsers(wechat._id, api, openids, (err, n) => {
                //循环取用户openid，存入db
                //判断openid是否存过，存过之后不再存储
                if(total <= count) return done(null, total);
                //如果total大于10000，则取后面的数据时需要加上next_openid，一次循环直到取完为止
                console.log('************ 同步粉丝信息，需要多次抓取粉丝信息，total:', total, "count:", count);
                async.whilst(() => total > count,
                  (callback) => {
                    console.log("**************** 读取下一批openid ", next_openid, count, total);
                    api.getFollowers(next_openid, function (err, result) {
                      if(err) {
                        console.error(err);
                        console.error("****************** api.getFollowers 错误 ", next_openid);
                        return callback(null, count);
                      }
                      count += result.count;
                      next_openid = result.next_openid;
                      console.log('****************** api.getFollowers，数量：', count, "，总：", total, "下一个openid", next_openid);
                      //循环存入db
                      if(result.data) {
                        openids = result.data.openid;
                        if(openids && openids.length) {
                          updateUsers(wechat._id, api, openids, (err, result) => {
                            callback(null, count);
                          });
                        } else {
                          callback(null, count);
                        }
                      } else {
                        callback(null, count);
                      }
                    });
                  }, (err, n) => {
                    console.log("$$$$$$$$$$$$$$$ 读取下一批openid完成! ", n, next_openid);
                    done(err, n);
                  }
                );
              });
            }
          }
        });
      }, (err, result) => {
        if(err) console.error(err);
        return cb(err, result);
      });
    }
  });
}
module.exports = syncWechatFans;