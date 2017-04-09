/**
 * 系统用户
 */
"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var crypto = require('crypto');
var oAuthTypes = ['twitter', 'facebook', 'google'];
var RBAC = require('../../middleware/rbac.js');

/**
 * User Schema
 */

var UserSchema = new Schema({
  username: {type: String, require: true, index: true, default: ""},
  roles: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}], /*关联角色ID*/
  email: {type: String, unique: true, require: true, lowercase: true, default: ""},
  mobile: {type: String, default: ""},
  fullname: {type: String, default: ""},
  photo_profile: String,
  tokens: [],
  provider: {type: String, default: 'local'},
  hashed_password: {type: String, require: true},
  salt: {type: String},
  reset_password_token: String,
  reset_password_expires: Date,
  lastLoginIp: String,//最后登录ip
  lastLoginTime: Date,//最后登录时间
  isAdmin: {type:Boolean},
  enabled: {type: Boolean, trim: true, default: true}//是否启用
}, {timestamps: {}});

RBAC.plugin(UserSchema);

/**
 * Virtuals
 */
UserSchema
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
UserSchema.path('username').validate(function (username) {
  if (this.doesNotRequireValidation()) return true;
  return username.length
}, '用户名不能为空!');

UserSchema.path('username').validate(function (username, fn) {
  var User = mongoose.model('User');
  if (this.doesNotRequireValidation()) fn(true);

  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('username')) {
    User.find({username: username}).exec(function (err, users) {
      fn(!err && users.length === 0)
    })
  } else fn(true)
}, '该用户已经存在!');


UserSchema.path('email').validate(function (email) {
  if (this.doesNotRequireValidation()) return true;
  return email.length
}, '邮件不能为空!');

UserSchema.path('email').validate(function (email, fn) {
  var User = mongoose.model('User');
  if (this.doesNotRequireValidation()) fn(true);

  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('email')) {
    User.find({email: email}).exec(function (err, users) {
      fn(!err && users.length === 0)
    })
  } else fn(true)
}, '该Email已经被使用!');

UserSchema.path('hashed_password').validate(function (hashed_password) {
  if (this.doesNotRequireValidation()) return true;
  return hashed_password.length
}, '密码不能为空!');


/**
 * Pre-save hook
 */
UserSchema.pre('save', function (next) {
  if (!this.isNew) return next();

  if (!validatePresenceOf(this.password)
    && oAuthTypes.indexOf(this.provider) === -1)
    next(new Error('未为用户设定密码!'));
  else
    next()
});

/**
 * Methods
 */

UserSchema.methods = {

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
  },

  /**
   * Validation is not required if using OAuth
   */
  doesNotRequireValidation: function () {
    return ~oAuthTypes.indexOf(this.provider);
  },

  findUserAndRole: function (req, res) {
    User.find().populate('roles').exec(function (err, result) {
      console.log(result);
      if (err)
        console.log(err);
      res.render('system/user/userList', {
        users: result
      })
    })
  }
};

function resolveRole(role, done) {
  if (typeof role === 'string') {
    mongoose.model('Role').findOne({name: role}, function (err, role) {
      if (err) return done(err);
      if (!role) return done(new Error("Unknown role"));
      done(null, role);
    });
  }
  else {
    done(null, role);
  }
}
var User = mongoose.model("User", UserSchema, "users");
