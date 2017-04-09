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
  channelWechat: { type: ObjectId, index: true, ref: 'ChannelWechat' }, //渠道下的公众号
  wechatGroup: { type: ObjectId, ref: 'WechatGroup' }, //分组
  member: { type: ObjectId, ref: 'Member' }, //关联的会员
  openid: { type: String, trim: true, index: true, default: '' },
  unionid: { type: String, trim: true, index: true, default: '' },
  nickname: { type: String, trim: true, index: true, default: '' },
  sex: { type: String, trim: true, default: '' },
  language: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  province: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: '' },
  headimgurl: { type: String, trim: true, default: '' },
  remark: { type: String, trim: true, default: '' },
  groupId: { type: String, trim: true, default: '' },
  subscribe: { type: String, trim: true, default: '0' }, //是否订阅公众号
  subscribe_time: { type: String, trim: true, default: '', index: true }, //关注事件
  subscribeTimes: { type: Number, default: 0 }, //关注成为粉丝次数，>= 1表示取消后重复关注，非新粉丝
  unsubscribe_time: { type: Date }, //取消关注时间
  flag: { type: Boolean, trim: true, default: false }, //是否关注过公众号
  identifyNo: { type: String, trim: true, index: true, default: '' }, //记录推广人员的标识码，没特殊推广标识码，则记录openid
  // createdAt: { type: Date, default: Date.now },
  flowrateFlag: { type: Boolean }, //关注领取过流量
  shareFlowrateFlag: { type: Boolean }, //分享领取过流量
  phoneFareFlag: { type: String }, //抢话费标记 1:标记为有充值话费资格 2:已领取5元话费
  scanCount: { type: Number }, //推广二维码被扫描次数
  clear: { type: Number }, //清缓存数据
  note: String
}, { timestamps: {} });

/**
 * 是否为粉丝
 */
WechatFansSchema.statics.isFans = function (openid, wid, done) {
  if(typeof wid == 'function') {
    done = wid;
    wid = null;
  }
  var q = {
    openid: openid
  }
  if(wid) {
    q.channelWechat = wid;
  }
  WechatFans.findOne(q, function (err, fans) {
    console.log('===============fans###################',openid, wid, fans);
    if(err){
      console.error(err);
    }
    if(fans && fans.subscribe == '1') {
      return done(true)
    }
    done(false);
  });
};

/**
 * 判断粉丝是否从某个时间开始后关注的新粉丝
 */
WechatFansSchema.statics.isNewFansFrom = function (openid, fromDate, done) {
  WechatFans.findOne({ openid: openid }, (err, fans) => {
    if(err) console.error(err);
    if(fans) {
      var ret = false;
      if(fans.subscribe_time && fans.subscribe_time >= fromDate && (!fans.unsubscribe_time || fans.subscribeTimes == 1)) {
        ret = true;
      }
      return done(ret);
    } else {
      return done(false);
    }
  });
};

/**
 * 查询返回本openid推广获得粉丝数量，试试count
 */
WechatFansSchema.statics.countFansByOpenid = function (openid, done) {
  WechatFans.count({ openid: openid }, (err, count) => {
    return done(count);
  });
};
/**
 * 关注次数+1，subscribeTimes>1可以判定为多次取消后再次关注的粉丝
 */
WechatFansSchema.statics.incSubscribeTimes = function (openid, done) {
  WechatFans.update({ openid: openid }, { $inc: { subscribeTimes: 1 } }, { multi: true }, (err, result) => {
    if(err) console.error(err);
    done(result ? result.nModified : 0);
  });
};
/**
 * 更新粉丝的推广码
 */
WechatFansSchema.statics.updateIdentifyNo = function (openid, identifyNo, done) {
  if(!identifyNo) identifyNo = openid;
  //只有粉丝第一次关注时记录推广识别码
  WechatFans.findOneAndUpdate({ openid: openid, $or: [{ identifyNo: { $exists: false } }, { identifyNo: '' }] }, { identifyNo: identifyNo }, { multi: false, new: true }, (err, wf) => {
    done(err, wf);
  });
};
/**
 * 通过微信openid获取用户信息
 */
WechatFansSchema.statics.findByOpenId = function (openid, cb) {
  if(!openid) openid = "";
  WechatFans.findOne({
    openid: openid
  }).populate("channelWechat").select("channelWechat openid unionid nickname sex language city province country headimgurl subscribe subscribe_time flag subscribeTimes").exec(function (err, fans) {
    if(err) console.error(err);
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
    if(err) console.error(err);
    cb(fans);
  });
};

WechatFansSchema.statics.findByWechatAndUnionId = function (wid, unionid, cb) {
  WechatFans.findOne({
      channelWechat: wid,
      unionid: unionid
    })
    // .populate({ path: 'channelWechat', match: { appid: appid } })
    .select("channelWechat openid unionid nickname sex language city province country headimgurl subscribe subscribe_time flag subscribeTimes").exec(function (err, fan) {
      if(err) console.error(err);
      cb(fan);
    });
};
/**
 * 通过微信id和unionid获取用户信息,信息不存在的话则创建
 */
WechatFansSchema.statics.findAndSaveByUnionId = function (wid, unionid, obj, cb) {
  var data = {
    channelWechat: wid,
    // openid: obj.openid,
    unionid: unionid,
    nickname: obj.nickname,
    sex: obj.sex,
    language: obj.language,
    city: obj.city,
    province: obj.province,
    country: obj.country,
    headimgurl: obj.headimgurl,
    subscribe: obj.subscribe,
    subscribe_time: obj.subscribe_time,
    remark: obj.remark ? obj.remark : "",
    note: 'WechatFans findAndSaveByUnionId with wid: ' + wid + ', unionid: ' + unionid
  };
  data.flag = data.subscribe && (data.subscribe == "1" || data.subscribe == 1);

  WechatFans.findOneAndUpdate({
    channelWechat: wid,
    unionid: unionid
  }, data, {
    new: true,
    upsert: true
  }, function (err, fan) {
    if(err) console.error("****************** WechatFans findAndSaveByUnionId ERROR: \n" + err);
    if(fan) return cb(fan);
  });
};

/**
 * 传入粉丝数据，查找是否存在，存在则更新，不存在则新增数据。
 */
WechatFansSchema.statics.findAndSave = function (obj, cb) {
  var callback = cb || function () {};
  if(!obj) {
    //do nothing
    return callback();
  }

  obj.scanCount ? obj.scanCount += 1 : obj.scanCount = 1;
  obj.flag = obj.subscribe && (obj.subscribe == "1" || obj.subscribe == 1);
  var q = { openid: obj.openid };
  if(obj.channelWechat) q.channelWechat = obj.channelWechat;
  obj.note = 'WechatFans.findAndSave with subscribe: ' + obj.subscribe;

  WechatFans.findOneAndUpdate(q, obj, {
    new: true,
    upsert: true
  }, function (err, fan) {
    if(err) console.error(err);
    console.log("****************** WechatFans findAndSave", fan);
    if(fan) {
      fan.populate("channelWechat", (err, f) => {
        if(err) console.error(err);
        return callback(f);
      });
    }
  });

};

var WechatFans = mongoose.model('WechatFans', WechatFansSchema, "wechatfans");