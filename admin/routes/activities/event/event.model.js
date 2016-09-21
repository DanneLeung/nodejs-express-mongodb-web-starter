/**
 * 线下活动及报名
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var EventSchema = mongoose.Schema({
  _id: { type: String, default: ShortId.generate },
  channel: { type: ObjectId, ref: "Channel" }, //所属渠道
  wechat: { type: ObjectId, ref: "ChannelWechat" }, //使用的微信号
  type: { type: String, required: false, default: '' }, //活动类型
  code: { type: String, required: false, default: '' }, //代号
  name: { type: String, required: true, default: '' }, //名称
  description: { type: String, required: false }, //说明
  remark: { type: String, required: false }, //备注
  remarkColor: { type: String, required: false, default: 'c7c6c4'}, //备注颜色
  views: {
    borderColor: { type: String, required: false, default: 'd2d6de'}, //边框颜色
    borderWidth: { type: Number, required: false , default: 1}, //边框粗细
    borderRadius: { type: Number, required: false , default: 5} //边框圆角
  },
  text: { type: String, required: false }, //文案，支持HTML
  submitText: { type: String, required: false }, //提交成功后问候语
  logo: { type: ObjectId, required: false, ref: "File" }, //活动logo，分享时使用
  bgimg: { type: ObjectId, required: false, ref: "File" }, //背景图片
  url: { type: String, required: false, default: '' }, //活动入口URL
  qrcode: { type: String, required: false, default: '' }, //活动入口URL二维码
  keywords: { type: String, required: false, default: '' }, //关键字
  formfield: {
    type: Array,
    required: true,
    default: [
      { name: 'realname', type: 'text', label: '真实姓名', required: 1, unique: 0,  range: ["2", ""], other: 1 }, //input中type
      { name: 'email', type: 'email', label: '邮箱', required: 1, unique: 0},
      { name: 'telphone', type: 'text', label: '手机号', required: 1,unique: 1 }
    ]
  },
  location: {
    address: String,
    geo: { lng: String, lat: String }
  }, //开始时间
  startTime: { type: Date, required: false, default: Date.now() }, //报名开始时间
  endTime: { type: Date, required: false, default: Date.now()}, //报名结束时间
  limit: { type: Number, required: false, default: 0 }, //限制人数上线，<=0表示不限制
  appliedCount: { type: Number, required: false, default: 0 }, //已经报名人数
  signedCount: { type: Number, required: false, default: 0 }, //签到人数
  readCount: { type: Number, required: false, default: 0 }, //阅读数
  shareCount: { type: Number, required: false, default: 0 }, //分享数
  enabled: { type: Boolean, default: false } //激活
}, { timestamps: {} });

EventSchema.pre('save', function (done) {
  var that = this;
  mongoose.model('Event').findOne({ name: that.name, channel: that.channel }, function (err, site) {
    if (err) {
      done(err);
    } else if (site) {
      that.invalidate('name', '活动名称必须唯一');
      done(new Error('活动名称必须唯一'));
    } else {
      done();
    }
  });
});

module.exports = mongoose.model('Event', EventSchema);
