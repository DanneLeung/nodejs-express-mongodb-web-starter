/**
 * Created by yu869 on 2016/3/10.
 * 渠道短信通道配置
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var ChannelSMSSchema = mongoose.Schema({
  channelId: {type: ObjectId, ref: "Channel"}, //渠道
  name: {type: String, required: true, default: ""}, //名称
  type: {type: String, required: true, default: ""}, //类型 01: 短信 02: 邮件
  params: [
    {
      paramsId: ObjectId
      , paramName: {type: String, trim: true, default: ''}         //参数名称
      , paramValue: {type: String, trim: true, default: ''}       //参数值
      , paramDesc: {type: String, trim: true, default: ''}        //参数备注
      , isChecked: {type: Boolean, trim: true, default: true}        //是否可让渠道进行值设定
      , isRequired: {type: Boolean, trim: true, default: false}        //是否必须
    }
  ],     //参数
  description: {type: String, default: ""},  // 备注
  enabled: {type: Boolean, default: true}, // 是否可用
}, {timestamps: {}});

module.exports = mongoose.model('ChannelSMS', ChannelSMSSchema, 'channelsms');