/**
 * 渠道支付方式配置
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var ChannelPaymentSchema = mongoose.Schema({
  channelId: { type: ObjectId, required: true, ref: "Channel" },
  name: { type: String, required: true, default: "" }, //名称
  params: [
    {
      paramsId: ObjectId
      , paramName: { type: String, trim: true, default: '' }         //参数名称
      , paramValue: { type: String, trim: true, default: '' }       //参数值
      , paramDesc: { type: String, trim: true, default: '' }        //参数备注
      , isChecked: { type: String, trim: true, default: '' }        //是否可让渠道进行值设定 00不可 01 可以
      , isRequired: { type: String, trim: true, default: '' }        //是否必须开关 00不是 01 是
    }
  ],     //参数
  certificate: { type: ObjectId, ref: "File" },  // 证书地址
  description: { type: String, default: "" },  // 备注
  default: { type: String, default: false }, // 是否可用, 00,不可用,01,可用
  enable: { type: Boolean, default: true }// 是否可用, 00,不可用,01,可用
}, { timestamps: {} });

module.exports = mongoose.model('ChannelPayment', ChannelPaymentSchema, 'channelpayments');
