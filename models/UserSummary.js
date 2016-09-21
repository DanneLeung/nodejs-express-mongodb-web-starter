/**
 * Created by yu869 on 2015/11/26.
 * 每天增加或取消的粉丝数量
 */

"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var UserSummarySchema = mongoose.Schema({
    ref_date: {type: String, required: true}, //统计日期
    user_source: {type: Number, rrequired: true}, //用户来源
    new_user: {type: Number, required: true}, //新用户
    cancel_user: {type: Number, required: true}, //取消用户
    channelWechat: {type: ObjectId, ref: "ChannelWechat"} //关联公众号
});
/**
 * user_source
 * 0代表其他合计
 * 1代表公众号搜索
 * 17代表名片分享
 * 30代表扫描二维码
 * 43代表图文页右上角菜单
 * 51代表支付后关注（在支付完成页）
 * 57代表图文页内公众号名称
 * 75代表公众号文章广告
 * 78代表朋友圈广告
 */

module.exports = mongoose.model('UserSummary', UserSummarySchema, 'usersummarys');
