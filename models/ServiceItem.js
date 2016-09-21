/**
 * Created by xingjie201 on 2016/1/5.
 * 服务项的model
 */

"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ServiceItemSchema = mongoose.Schema({
  id: ObjectId,
  channel: {type: ObjectId, ref: "Channel"}, //所属渠道，渠道内部公众号间共享
  serverName: {type: String, required: true, default: ''},
  serviceImg: {type: String, required: true, default: ''},
  addTime: {type: Date, default: new Date}
  , bespeak: {type: Boolean, default: true} //是否可预订
}, {timestamps: {}});

module.exports = mongoose.model('ServiceItem', ServiceItemSchema, 'serviceItems');
