/**
 * Created by JiBingKun on 2015/7/14.
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
 * 微信用户分组
 * @type {Schema}
 */
var UserGroupSchema = new Schema({
  id: ObjectId
  , usergroup: {type: String, trim: true}//用户分组
});

var UserGroup = mongoose.model('UserGroup', UserGroupSchema, 'UserGroup')
