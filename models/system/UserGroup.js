/**
 * 渠道用户组
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var _ = require("lodash");

/**
 * 渠道用户分组
 * @type {Schema}
 * @param {name:分组名称}
 * @param {menus:内联文档}
 */
var UserGroupSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: ''
  }, //名称
  description: {
    type: String,
    default: ''
  }, //说明
  enabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {}
});


UserGroupSchema.statics = {
  all: function (channel, done) {
    mongoose.model('UserGroup').find({
      'channel': channel
    }, function (err, groups) {
      if (err) {
        console.log(err);
      }
      done(groups);
    });
  }
};

module.exports = mongoose.model('UserGroup', UserGroupSchema, 'Usergroups');
