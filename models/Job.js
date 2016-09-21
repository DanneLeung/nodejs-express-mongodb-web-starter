/**
 * 定时任务注册和管理
 */

"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ShortId = require('shortid');

var JobSchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},
  name: {type: String, required: true, default: ""},//名称
  description: {type: String, required: false, default: ""},//job描述
  jobClass: {type: String, required: true, default: ""},//job脚本
  cron: {type: String, required: true, default: ""},//cron表达式
  lastTime: {type: Date},//上次运行时间
  lastTimeEnd: {type: Date},//上次运行时间结束时间
  configAt: {type: Date, default: Date.now()},//上次运行时间结束时间
  lastEllapse: {type: Number, default: 0},//上次耗时，秒
  control: {type: String, default: 'start'},// start , stop
  status: {type: String, default: 'stopped'},//waiting, running, stopped.
  message: {type: String, default: ''},//上次运行信息
  enabled: {type: Boolean, default: false}//激活
}, {timestamps: {}});


var Job = mongoose.model('Job', JobSchema, 'jobs');
module.exports = Job;
