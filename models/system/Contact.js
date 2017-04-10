/**
 * Created by xingjie201 on 2016/2/18.
 * 联系人model（渠道、供应商）
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ContactSchema = mongoose.Schema({
  name: { type: String, required: true, default: '' }, //姓名
  tel: { type: String, required: true, default: '' }, //电话
  title: { type: String, required: false, default: '' }, // 职称
  email: { type: String, required: false, default: '' }, // 邮箱
  note: { type: String, default: '' }, // 说明备注
  type: { type: String, required: false, default: '' }, // 联系人类别(1,渠道商;2,服务商)
  channelId: { type: ObjectId, ref: 'Channel' }, // 渠道商ID
  servicesId: { type: ObjectId, ref: 'Service' } // 服务商ID
}, { timestamps: {} });

module.exports = mongoose.model('Contact', ContactSchema, 'contacts');