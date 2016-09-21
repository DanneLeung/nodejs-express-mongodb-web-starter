/**
 * Created by xingjie201 on 2016/2/23.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var PaymentMethodSchema = mongoose.Schema({
  name: {type: String, required: true, default: ""}, //名称
  params: [
    {
      paramsId: ObjectId
      , paramName: {type: String, trim: true, default: ''}         //参数名称
      , paramValue: {type: String, trim: true, default: ''}       //参数值
      , paramDesc: {type: String, trim: true, default: ''}        //参数备注
      , isChecked: {type: String, trim: true, default: ''}        //是否可让渠道进行值设定 00不可 01 可以
      , isRequired: {type: String, trim: true, default: ''}        //是否必须开关 00不是 01 是
    }
  ],     //参数
  certificate: {type: String, required: true, default: ""},  // 证书地址
  description: {type: String, default: ""},  // 备注
  enable: {type: String, required: true, default: "00"} // 是否可用, 00,不可用,01,可用
}, {timestamps: {}});

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema, 'paymentMethods');