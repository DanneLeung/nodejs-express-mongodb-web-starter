/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

/**
 * User Schema
 */
var WechatFansSchema = new Schema({
  channelWechat: {type: ObjectId, index: true, ref: 'ChannelWechat'}, //渠道下的公众号
  wechatGroup: {type: ObjectId, ref: 'WechatGroup'}, //分组
  member: {type: ObjectId, ref: 'Member'}, //关联的会员
  openid: {type: String, trim: true, index: true, default: ''},
  unionid: {type: String, trim: true, index: true, default: ''},
  nickname: {type: String, trim: true, index: true, default: ''},
  sex: {type: String, trim: true, default: ''},
  language: {type: String, trim: true, default: ''},
  city: {type: String, trim: true, default: ''},
  province: {type: String, trim: true, default: ''},
  country: {type: String, trim: true, default: ''},
  headimgurl: {type: String, trim: true, default: ''},
  remark: {type: String, trim: true, default: ''},
  groupId: {type: String, trim: true, default: ''},
  subscribe: {type: String, trim: true, default: ''}, //是否注册
  subscribe_time: {type: String, trim: true, default: '', index: true},
  flag: {type: Boolean, trim: true, default: false}, //是否关注过公众号
  identifyNo: {type: String, trim: true, index: true, default: ''}, //记录推广人员的标识码
  createdAt: {type: Date, default: Date.now},
  flowrateFlag: {type: Boolean}, //关注领取过流量
  shareFlowrateFlag: {type: Boolean}, //分享领取过流量
  phoneFareFlag: {type: String}, //抢话费标记 1:标记为有充值话费资格 2:已领取5元话费
  scanCount: {type: Number}, //关注次数
}, {timestamps: {}})
/**
 * 通过微信openid获取用户信息
 */
WechatFansSchema.statics.findByOpenId = function (openid, cb) {
  WechatFans.findOne({
    openid: openid
  }, function (err, fans) {
    if (err) console.error(err);
    cb(fans);
  });
};
/**
 * 通过微信openid获取用户信息
 */
WechatFansSchema.statics.findByUnionId = function (wid, unionid, cb) {
  WechatFans.findOne({
    channelWechat: wid,
    unionid: unionid
  }, function (err, fans) {
    if (err) console.error(err);
    cb(fans);
  });
};
/**
 * 通过微信id和unionid获取用户信息,信息不存在的话则创建
 */
WechatFansSchema.statics.findAndSaveByUnionId = function (wid, unionid, obj, cb) {
  var data = {
    unionid: unionid,
    channelWechat: wid,
    nickname: obj.nickname,
    sex: obj.sex,
    language: obj.language,
    city: obj.city,
    province: obj.province,
    country: obj.country,
    headimgurl: obj.headimgurl
  };
  WechatFans.findOneAndUpdate({
    channelWechat: wid,
    unionid: unionid
  }, data, {
    new: true,
    upsert: true
  }, function (err, fan) {
    if (err) console.error(err);
    if (fan) return cb(fan);
  });
};

/**
 * 传入粉丝数据，查找是否存在，存在则更新，不存在则新增数据。
 */
WechatFansSchema.statics.findAndSave = function (obj, cb) {
  var callback = cb || function () {
    };
  if (!obj) {
    //do nothing
    return callback();
  }
  //var _ = require('lodash');
  //obj = _.assign(obj, {$inc: {"scanCount": 1}});
  if(obj.scanCount){
    obj.scanCount += 1;
  }else{
    obj.scanCount = 1;
  }
  WechatFans.findOneAndUpdate({
    openid: obj.openid
  }, obj, {
    new: true,
    upsert: true
  }, function (err, fan) {
    if (err) console.error(err);
    if (fan) return callback(fan);
  });

};

var WechatFans = mongoose.model('WechatFans', WechatFansSchema);
