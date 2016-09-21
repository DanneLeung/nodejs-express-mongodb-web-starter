/**
 * Created by xingjie201 on 2016/2/23.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ChannelTypeSchema = mongoose.Schema({
  id: ObjectId,
  typeName: {type: String, required: true, default: ""},     //渠道种类
  typeDesc: {type: String, required: true, default: ""}  //详情介绍
}, {timestamps: {}});

module.exports = mongoose.model('ChannelType', ChannelTypeSchema, 'channeltypes');