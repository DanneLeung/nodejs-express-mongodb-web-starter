/**
 * Created by xingjie201 on 2016/1/5.
 */

"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var ChargeOrderSchema = mongoose.Schema({
    id: ObjectId,
    no: {type: String, required: true, default: ''}, //订单号
    channelWechat: {type: ObjectId, ref: 'ChannelWechat'},//渠道公众号
    wechat: {type: ObjectId, ref: 'WechatFans'},//粉丝
    openid: {type: String, require: true},//openid
    type: {type: String, require: true, default: '1'}, // 1:流量充值 2:话费充值
    status: {type: String, require: true}, //状态 1:待支付 2:失败 3:取消支付 4:成功
    mobile: {type: String, require: true}, //手机号码
    wxOrderNo: {type: String, trim: true}, //微信订单号
    amount: {type: Number, require: false, default: 0}, //金额
    packageSize: {type: Number, default: 0}, //流量大小
    operators: {type: String, default: '1'}, //运营商 1:移动 2:联通 3:电信
    desc: {type: String}, //描述
    day: {type: String}, //YYYYMMDD今日
    replyResult: {}, //充值反馈
}, {timestamps: {}});

module.exports = mongoose.model('ChargeOrder', ChargeOrderSchema, 'chargeOrders');
