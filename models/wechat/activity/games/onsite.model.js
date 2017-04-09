/**
 * H5在现场数据模型
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var OnSiteSchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},
  channel: {type: ObjectId, ref: "Channel"}, //所属渠道
  wechat: {type: ObjectId, ref: "ChannelWechat"}, //使用的微信号
  beginAt: {type: Date},
  endAt: {type: Date},
  name: {type: String, required: true, default: ''}, //名称
  title: {type: String, required: false, default: ''}, //标题，图文推送和分享也使用
  subTitle: {type: String, required: false, default: ''}, //副标题，图文推送和分享也使用
  text: {type: String, required: true}, //文案，规则说明等，支持HTML
  background: {
    //背景设置
    image: {type: String, default: ''}, //图片
    color: {type: String, default: 'FFF'} //背景色
  },
  maxDist: {type: Number, default: 300}, //允许最大离现场距离(单位：米)，考虑定位误差，大于距离用户无效
  address: {type: String, default: ''}, //中心点地址
  coordinate: [], //中心点经度,纬度  lat, lng
  mapTcLat: {type: String, default: ''}, //腾讯地图经纬度
  budget: {type: Number, default: 0}, //红包总预算，所有红包总额不能超过此数值`
  redpackNum: {type: Number, default: 0}, //红包总数量，保存时自动计算
  redpack: [{
    amount: {type: Number, default: 0}, //红包金额，保留两位小数
    text: {type: String, default: ''}, //领得红包后显示文字
    count: {type: Number, default: 0}, //该红包总数量
    rate: {type: Number, default: 0} //该红包机率
  }],
  share: {
    //分享设置
    title: {type: String, required: false, default: ''}, //标题，图文推送和分享也使用
    keywords: {type: String, required: false, default: ''}, //关键字，出发图文推送关键字
    logo: {type: String, required: false, default: ''}, //活动logo，分享时使用
    description: {type: String, required: false, default: ''}, //图文描述，推送和分享使用
  },
  online: {type: Boolean, default: false}, //上线
  enabled: {type: Boolean, default: true} //激活使用
}, {timestamps: {}});

/**
 * 取得当前活动，调用者应该检查并提示错误。
 * @param id
 * @param channel
 * @param wechat
 * @param done
 */
OnSiteSchema.statics.getCurrent = function (id, channel, wechat, done) {
  var q = {wechat: wechat};
  if (id) {
    q._id = id;
  } else {
    q.channel = channel;
  }
  OnSite.findOne(q).exec(function (err, onsite) {
    var now = Date.now();
    if (onsite) {
      //是否下线
      if (!onsite.enabled || !onsite.online) {
        return done('当前活动已下线.', onsite);
      }
      if(now < onsite.beginAt) {
        return done("抱歉，活动尚未开始!", onsite);
      }
      if (now > onsite.endAt) {
        return done("抱歉，活动已经结束了!", onsite);
      }
    }
    return done(err, onsite);
  });
};

var OnSite = mongoose.model('OnSite', OnSiteSchema, 'onsites');
module.exports = OnSite;
