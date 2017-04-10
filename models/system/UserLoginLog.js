var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
/**
 * 登录日志
 */
var UserLogSchema = new Schema({
  username: String, //username
  mobile: String, //手机号
  loginAt: { type: Date, default: Date.now } //登录时间
});

mongoose.model('UserLog', UserLogSchema, "userlogs");