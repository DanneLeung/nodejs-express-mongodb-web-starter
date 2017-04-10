"use strict";
var mongoose = require('mongoose');

var SettingSchema = mongoose.Schema({
  key: { type: String, require: true, index: true }, //系统设定名称
  value: { type: String, require: true }, //系统设定值
  group: { type: String, require: false, default: '' }, //分组
  description: { type: String, default: '' } //描述
}, { timestamps: {} });

SettingSchema.statics.getByKey = function (key, done) {
  Setting.findOne({ key: key }, function (err, setting) {
    if(err) {
      console.error(err);
      return done(null);
    }
    return done(setting);
  });
};
/**
 * 读取所有系统参数配置
 * @param done
 */
SettingSchema.statics.getAllValues = function (done) {
  Setting.find({}, function (err, settings) {
    if(err) {
      console.error(err);
      return done(null);
    }
    var values = {};
    if(settings) {
      for(var i in settings) {
        var s = settings[i];
        values[s.key] = s.value;
      }
    }
    return done(values);
  });
};
/**
 * 读取指定keys的参数设置
 * @param keys
 * @param done
 */
SettingSchema.statics.getValuesByKeys = function (keys, done) {
  Setting.find({ key: { $in: keys } }, function (err, settings) {
    if(err) {
      console.error(err);
      return done(null);
    }
    var values = {};
    if(settings) {
      for(var i in settings) {
        var s = settings[i];
        values[s.key] = s.value;
      }
    }
    return done(values);
  });
};

var Setting = mongoose.model('Setting', SettingSchema, 'settings');
module.exports = Setting;