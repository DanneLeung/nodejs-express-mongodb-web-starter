/**
 * 会员分组数据模型
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var MemberGroupSchema = new Schema({
  id: ObjectId
  , channel: {type: ObjectId, ref: 'Channel'}//渠道，渠道为NULL时为系统全局配置
  , name: {type: String, trim: true, default: ""}
  , description: {type: String, trim: true, default: ""}
}, {timestamps: {}});

MemberGroupSchema.methods = {};
var MemberGroup = mongoose.model('MemberGroup', MemberGroupSchema, 'membergroups');




