  /**
 * 线下活动及报名
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var EventUserSchema = mongoose.Schema({
  eventId: {type: String, required: true, ref: "Event"},
  channel: {type: ObjectId, required: true, ref: "Channel"},
  openid: {type: String, default: ''},
  unionid: {type: String, default: ''},
  uniques:[],
  wechatNickname: {type: String, default: '匿名'},
  dateTime: {type: Date, default: Date.now},
  form: []
}, {timestamps: {}});


EventUserSchema.pre('save', function (done) {
  var that = this;
  mongoose.model('EventUser').find({eventId: that.eventId,'form': {$all: that.uniques}}, function (err, eventUsers) {
    if (err) {
      done(err);
    } else if (eventUsers && eventUsers.length > 0) {
      done(new Error('not only'));
    } else {
      done();
    }
  });
});

/*EventUserSchema.pre('save', function (done) {
  var that = this;
  mongoose.model('Event').findOne({ _id: that.eventId, channel: that.channel }, function (err, site) {
    if (err || site == null) {
      done(err);
    }
    console.log('================',site)
    var len = site.length;
    var limit = site.limit;
    console.log(len,limit);
    if(len > limit) {
      done(new Error('人数已达上限'));
    }else {
      done();
    }
  });
});*/

module.exports = mongoose.model('EventUser', EventUserSchema);
