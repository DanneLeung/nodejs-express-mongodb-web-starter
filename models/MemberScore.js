/**
 * Created by xingjie201 on 2016/1/5.
 * 会员积分记录
 */

"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var MemberScoreSchema = mongoose.Schema({
  id: ObjectId,
  channel: {type: ObjectId, required: true, ref: 'Channel'},//渠道，冗余字段
  member: {type: ObjectId, ref: 'Member'},//会员
  score: {type: Number, required: false, default: 0},
  action: {type: ObjectId, required: true, ref: 'MemberAction'}
}, {timestamps: {}});

/**
 * Methods
 */

MemberScoreSchema.methods = {};

var Member = mongoose.model('MemberScore', MemberScoreSchema, 'memberscores');
