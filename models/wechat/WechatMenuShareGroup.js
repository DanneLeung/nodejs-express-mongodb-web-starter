/**
 * Module dependencies.
 *  微信页面访问统计(汇总数据)
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
var moment = require('moment')
var WechatMenuShare = mongoose.model('WechatMenuShare')
var MongoClient = require('mongodb').MongoClient;
var config = require( '../../config/config');

/**
 * User Schema
 */
var WechatMenuShareGroupSchema = new Schema({
  wechat: {type: ObjectId, index: true, ref: 'Wechat'}, //渠道下的公众号
  wechatFans: {type: ObjectId, ref: 'WechatFans'}, //粉丝
  nickname: {type: String}, //粉丝昵称
  shareDateRange: {type: String, default: ''}, //分享日期范围 YYYY-MM-DD
  count: {type: Number, default: 0}, //分享次数
}, {timestamps: {}})

/**
 * 保存分享朋友圈信息
 */
WechatMenuShareGroupSchema.statics.groupData = function (query, wid, cb) {
  if(!cb){
    cb = function(){}
  }
  //MongoClient.connect(config.database.url, function (err, db) {
  //  if (err || db == null) {
  //    console.log('get db error...')
  //    cb('get db error', null)
  //    return;
  //  }
    mongoose.connection.collections['wechatmenushares'].aggregate(
      {$match: {"shareDate": {$gte: query.startDate, $lte: query.endDate}}},
      {$group: {"_id": {"nickname":"$nickname","wechat":"$wechat", "wechatFans": "$wechatFans"}, "count": {"$sum": 1}}},
      {$match: {wechat: ObjectId(wid)}},
      function (err, obj) {
        console.log("group data==============>", err, obj)
        if (obj) {
          WechatMenuShareGroup.remove({"wechat": wid}, (e, o)=> {
            if (!e) {
              obj.forEach(function (data) {
                var group = new WechatMenuShareGroup({
                  wechat: wid,
                  wechatFans: data._id.wechatFans,
                  nickname: data._id.nickname,
                  shareDateRange: query.startDate + " - " + query.endDate,
                  count: data.count
                });
                group.save(function (e, o) {
                  console.log(e, o)
                })
              })
            }
          })
          //db.close();
          cb(null, null)
        }
      }
    )
  //});
};

var WechatMenuShareGroup = mongoose.model('WechatMenuShareGroup', WechatMenuShareGroupSchema);
