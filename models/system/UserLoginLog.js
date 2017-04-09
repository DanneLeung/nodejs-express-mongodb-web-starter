/**
 * Created by ZhangXiao on 2015/6/11.
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
 * 登录日志
 */
var UserLoginLogSchema = new Schema({
  id: ObjectId
  , username: String//username
  , mobile: String//手机号
  , loginAt: {type: Date, default: Date.now}//登录时间
});

mongoose.model('UserLoginLog', UserLoginLogSchema, "userLoginLogs");
