/**
 * Created by xingjie201 on 2016/1/5.
 * 渠道会员积分配置
 */

"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var MemberActionSchema = mongoose.Schema({
  id: ObjectId,
  channel: {type: ObjectId, ref: 'Channel'},//渠道，渠道为NULL时为系统全局配置
  group: {type: String, required: false, default: ''},//积分行为分组
  code: {type: String, required: true, default: ''},//积分行为标识
  name: {type: String, required: false, default: ''},//积分行为名称
  score: {type: Number, required: false, default: 0},//积分值，可正负
  description: {type: String, required: true}
}, {timestamps: {}});

/**
 * Methods
 */

MemberActionSchema.methods = {};

var Member = mongoose.model('MemberAction', MemberActionSchema, 'memberactions');
