/**
 * Created by xingjie201 on 2016/1/5.
 */

"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var crypto = require('crypto');

var MemberSchema = mongoose.Schema({
  //TODO:会员可能对应多个微信用户id，需要使用unionid识别
  wechatId: {type: ObjectId, ref: 'WechatFans'},//微信用户ID
  branch: {type: ObjectId, ref: 'Branch'},//所属网点(支行)
  group: {type: ObjectId, ref: 'MemberGroup'},//分组
  wechatCheckFlag: {type: String, trim: true, default: '0'},//用户微信端验证手机号,关联粉丝，关联成功设置为1
  openid: {type: String, trim: true, default: ''},//微信公众号openid，有unionid时使用unionid
  unionid: {type: String, trim: true, default: ''},//微信unionid
  fullname: {type: String, default: ''},//姓名
  username: {type: String, required: true, default: ''},//用户名
  mobile: {type: String, required: true, default: ''},//手机号码
  email: {type: String, trim: true, default: '', lowercase: true},          //邮箱
  idCardNo: {type: String, required: false, default: '', uppercase: true},//身份证号码
  company: {type: String, required: false, default: ''},//所属公司
  score: {type: Number, required: false, default: 0},//当前会员积分
  scoreUpdatedAt: {type: Date, required: false},//会员积分更新时间
  smsCode: {type: String, default: ''},//短信验证码
  hashed_password: {type: String, require: true},
  salt: {type: String},
  enabled: {type: Boolean, trim: true, default: true},//是否启用
  addresses: [{type: ObjectId, ref: 'Address'}],//收货地址列表，第一个为默认
  invoice: [{//常用发票信息
    type: {type: String, default: ''}, title: {type: String, default: ''}
  }]
}, {timestamps: {}});

MemberSchema
  .virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password)
  })
  .get(function () {
    return this._password;
  });
/**
 * Validations
 */
var validatePresenceOf = function (value) {
  return value && value.length
};

// the below 5 validations only apply if you are signing up traditionally
MemberSchema.path('username').validate(function (username) {
  return username.length
}, '用户名不能为空!');

MemberSchema.path('username').validate(function (username, fn) {
  var Member = mongoose.model('Member');
  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('phone')) {
    Member.find({username: username}).exec(function (err, users) {
      fn(!err && users.length === 0)
    })
  } else fn(true)
}, '该用户已经存在!');

/**
 * Methods
 */

MemberSchema.methods = {

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */

  makeSalt: function () {
    return Math.round((new Date().valueOf() * Math.random())) + ''
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */

  encryptPassword: function (password) {
    if (!password) return '';
    var encrypred;
    try {
      encrypred = crypto.createHmac('sha1', this.salt).update(password).digest('hex');
      return encrypred;
    } catch (err) {
      return '';
    }
  },

  generateConfirmationToken: function (password) {
    if (!password) return '';
    var encrypred_confirm_code
    try {
      encrypred_confirm_code = crypto.createHmac('sha1', this.salt).update(password).digest('hex')
      return encrypred_confirm_code
    } catch (err) {
      return ''
    }
  },
  gravatar: function (size) {
    if (!size) size = 200;

    if (!this.email) {
      return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
    }

    var md5 = require('crypto').createHash('md5').update(this.email).digest('hex');
    return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
  }


};


var Member = mongoose.model('Member', MemberSchema, 'members');
