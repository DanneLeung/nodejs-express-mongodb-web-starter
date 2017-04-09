/**
 * 关注，扫码等领取电子券活动
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var GetCouponSchema = mongoose.Schema({
  _id: { type: String, default: ShortId.generate },
  channel: { type: ObjectId, ref: "Channel" }, //所属渠道
  wechat: { type: ObjectId, ref: "ChannelWechat" }, //使用的微信号
  award: { type: ObjectId, ref: 'Award' }, //使用奖品库，电子券券码等
  beginAt: { type: Date }, //活动时间开始
  endAt: { type: Date }, //活动时间结束
  name: { type: String, required: true, default: '' }, //名称
  title: { type: String, required: false, default: '' }, //标题，图文推送和分享也使用
  subTitle: { type: String, required: false, default: '' }, //副标题，图文推送和分享也使用
  text: { type: String, required: true }, //文案，规则说明等，支持HTML
  background: {
    //背景设置
    image: { type: String, default: '' }, //图片
    color: { type: String, default: 'FFF' } //背景色
  },
  limit: {
    //各种限制设定
    fansOnly: { type: Boolean, default: false } //只允许粉丝领取
  },
  share: {
    //分享设置
    title: { type: String, required: false, default: '' }, //标题，图文推送和分享也使用
    keywords: { type: String, required: false, default: '' }, //关键字，出发图文推送关键字
    logo: { type: ObjectId, required: false, ref: "File" }, //活动logo，分享时使用
    description: { type: String, required: false }, //图文描述，推送和分享使用
  },
  online: { type: Boolean, default: false }, //上线
  enabled: { type: Boolean, default: true } //激活使用
}, { timestamps: {} });

/**
 * 取得当前活动，调用者应该检查并提示错误。
 * @param id
 * @param channel
 * @param wechat
 * @param done
 */
GetCouponSchema.statics.getCurrent = function (id, channel, wechat, done) {
  var q = { wechat: wechat };
  if(id) {
    q._id = id;
  } else {
    q.channel = channel;
  }
  GetCoupon.findOne(q).populate('award share.logo').exec(function (err, onsite) {
    var now = Date.now();
    if(onsite) {
      //是否下线
      if(!onsite.enabled || !onsite.online) {
        return done('当前活动已下线.', onsite);
      }
      if(now < onsite.beginAt) {
        return done("抱歉，活动尚未开始!", onsite);
      }
      if(now > onsite.endAt) {
        return done("抱歉，活动已经结束了!", onsite);
      }
    }
    return done(err, onsite);
  });
};

var GetCoupon = mongoose.model('GetCoupon', GetCouponSchema, 'getcoupons');
module.exports = GetCoupon;