/**
 * Created by ZhangXiao on 2015/10/27.
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var crypto = require('crypto');


var status = [{"code": '01', "name": '待审核'}
  , {"code": '02', "name": '通过'}
  , {"code": '03', "name": '不通过'}];

/**
 * 加盟商
 * @type {Schema}
 */
var ChannelUserSchema = new Schema({
  fullname: {type: String, trim: true, default: ''}//管理员
  , channelId: {type: ObjectId, ref: "Channel"}    //渠道Id
  , branch: {type: ObjectId, ref: 'Branch'}//网店
  , group: {type: ObjectId, ref: 'ChannelUserGroup'}//分组
  , tel: {type: String, trim: true, default: ''}          //固定电话
  , mobile: {type: String, trim: true, default: ''}         //移动电话
  , email: {type: String, trim: true, default: '', lowercase: true}           //邮箱
  , username: {type: String, required: true, default: ''}//登录
  , hashed_password: {type: String, default: ''}
  , salt: {type: String, default: ''}
  , photo_profile: {type: String, default: ''}
  , numberID: {type: String, trim: true, default: ''}         //身份证号
  //, postCode: {type: String, trim: true, default: ''}          //邮政编码
  //, applyTime: {type: Date, default: Date.now}//申请时间
  //, updateTime: {type: Date, trim: true, default: ''}//更新时间
  , approvedStatus: {type: String, trim: true, default: ''}//审核状态 // 00:待提交 01:审核中 02:通过 03:不通过
  , approvedTime: {type: Date, trim: true, default: ''}//审核时间
  , approvedBy: {type: String, trim: true, default: ''}//审核人
  , enabled: {type: Boolean, trim: true, default: true}//是否启用
  , verification: {type: Boolean}//是否验证
  , isAdmin: {type: Boolean, trim: true, default: false}//是否是管理员
  , place: {type: String, default: ''}//职位
  , code: {type: String, default: ''}//人员标识
  , verifiTime: {type: Date, default: new Date}//验证时间
  , openid: {type: String, default: ''}//申请人微信openid
  , unionid: {type: String, default: ''}//申请人微信unionid
  , remark: {type: String, default: ''}//备注(审批不通过显示)
  , headImgs: {type: String, default: ''}//证件照
}, {timestamps: {}});

ChannelUserSchema
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
ChannelUserSchema.path('username').validate(function (username) {
  return username.length
}, '用户名不能为空!');

//ChannelUserSchema.path('username').validate(function (username, fn) {
//  var ChannelUser = mongoose.model('ChannelUser');
//  // Check only when it is a new user or when email field is modified
//  if (this.isNew || this.isModified('username')) {
//    var query = {};
//    query.username = username;
//    ChannelUserSchema.path('channelId').validate(function (channelId) {
//      query.channelId = channelId;
//      ChannelUser.find(query).exec(function (err, users) {
//        fn(!err && users.length === 0)
//      }, '')
//    });
//  } else fn(true)
//}, '该用户已经存在!');

//ChannelUserSchema.path('email').validate(function (email) {
//  return email.length
//}, '邮件不能为空!');

//ChannelUserSchema.path('email').validate(function (email, fn) {
//  var ChannelUser = mongoose.model('ChannelUser');
//
//  // Check only when it is a new user or when email field is modified
//  if (this.isNew || this.isModified('email')) {
//    ChannelUser.find({email: email}).exec(function (err, users) {
//      fn(!err && users.length === 0)
//    })
//  } else fn(true)
//}, '该Email已经被使用!');

ChannelUserSchema.path('hashed_password').validate(function (hashed_password) {
  return hashed_password.length
}, '密码不能为空!');

ChannelUserSchema.methods = {

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  authenticate: function (plainText) {
    //console.log("authenticate: hashed_password=" + this.hashed_password + ", plainText=" + this.encryptPassword(plainText));
    return this.encryptPassword(plainText) === this.hashed_password;
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
      return encrypred
    } catch (err) {
      console.log("err:" + err);
      return ''
    }
  },
  /**
   * 统计加盟商共有多少家
   * @param req
   * @param res
   * @param callback
   */
  count: function (req, res, callback) {
    ChannelUser.count({"approvedStatus": '02', 'enabled': true}, function (err, count) {
      if (err) {
        console.log(err);
      } else {
        callback(count);
      }
    });
  },

  //获取所有的状态
  getAllStatus: function (req, res) {
    res.send(status);
  },
  //根据Code获取设备类型的数据
  getStatusByCode: function (code, res) {
    for (i in status) {
      if (code == status[i].code) {
        res.send(status[i].name);
        break;
      }
    }
  }

};


var ChannelUser = mongoose.model('ChannelUser', ChannelUserSchema, 'channelusers');
