/**
 * H5游戏幸运大转盘数据模型
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');

var SpinWinSchema = mongoose.Schema({
  _id: { type: String, default: ShortId.generate },
  channel: { type: ObjectId, ref: "Channel" }, //所属渠道
  wechat: { type: ObjectId, ref: "ChannelWechat" }, //使用的微信号
  activity: { type: ObjectId, ref: "Activities" }, //使用的活动控制
  name: { type: String, required: true, default: '' }, //名称
  title: { type: String, required: false, default: '' }, //标题，图文推送和分享也使用
  subTitle: { type: String, required: false, default: '' }, //副标题，图文推送和分享也使用
  text: { type: String, required: true }, //文案，规则说明等，支持HTML
  params: {
    //页面主题模板设置
    spinIndicator: { type: Boolean, default: true }, //旋转指针还是旋转转盘，默认旋转中间指针
    startAngle: { type: Number, default: 0 }, //转盘奖项开始角度，一般是0
    split: { type: Number, default: 8 }, //转盘分割数，大于分割数的奖项忽略
    /**
     * 中奖编号：index，从1开始，随机产生
     * 每片圆角度：angle = 360 / split;
     * 每个奖项旋转停止中间角度计算公式 angle * (index - 1) + (startAngle + angle / 2)
     */
    template: String, //页面模板，JADE模板，预先编码
    showWinners: { type: Boolean, default: true }, //滚动显示获奖者
    showMyWins: { type: Boolean, default: true }, //显示我的奖品按钮
    css: String, //CSS定义
    background: {
      //背景CSS参数
      image: { type: String, required: false },
      color: { type: String, default: 'ffffff' },
      size: { type: String, defualt: 'contain' }
    },
    header: {
      showTitle: Boolean,
      image: { type: String, required: false }, //使用图片，而不是背景图
      height: { type: Number, default: 50 }, //高度
      background: {
        //背景CSS参数
        image: { type: String, required: false },
        color: { type: String, default: 'ffffff' },
        size: { type: String, defualt: 'contain' }
      },
    },
    body: {
      image: { type: String, required: false }, //使用图片，而不是背景图
      height: { type: Number, default: 50 }, //高度
      background: {
        //背景CSS参数
        image: { type: String, required: false },
        color: { type: String, default: 'ffffff' },
        size: { type: String, defualt: 'contain' }
      }
    },
    footer: {
      image: { type: String, required: false }, //使用图片，而不是背景图
      height: { type: Number, default: 50 }, //高度
      background: {
        //背景CSS参数
        image: { type: String, required: false },
        color: { type: String, default: 'ffffff' },
        size: { type: String, defualt: 'contain' }
      }
    }
  },
  share: {
    //分享设置
    title: { type: String, required: false, default: '' }, //标题，图文推送和分享也使用
    keywords: { type: String, required: false, default: '' }, //关键字，出发图文推送关键字
    logo: { type: ObjectId, required: false, ref: "File" }, //活动logo，分享时使用
    description: { type: String, required: false }, //图文描述，推送和分享使用
  },
  online: { type: Boolean, default: false }, //上线
  enabled: { type: Boolean, default: true } //激活使用
}, { timestamps: {} });

/**
 * 取得当前时间活动中的幸运九宫格游戏，本方法不判断enabled和online值，调用者应该检查并提示错误。
 * @param id
 * @param channel
 * @param wechat
 * @param done
 */
SpinWinSchema.statics.getCurrent = function (id, channel, wechat, done) {
  var q = { wechat: wechat };
  if(id) {
    q._id = id;
  } else {
    q.channel = channel;
  }
  console.log("*********** 幸运九宫格查询条件 ", q);
  SpinWin.findOne(q).populate('activity logo').exec(function (err, spinwin) {
    var now = Date.now();
    if(spinwin && spinwin.activity) {
      //是否下线
      if(!spinwin.activity.enabled || !spinwin.activity.online) {
        return done('当前幸运九宫格活动已下线.', spinwin);
      }
      if(!spinwin.online) {
        return done('当前幸运九宫格活动已下线.', spinwin);
      }
      //时间比较
      var aSstartTime = spinwin.activity.startTime;
      var aEndTime = spinwin.activity.endTime;
      if(aSstartTime > now || aEndTime < now) {
        return done('抱歉，活动已经结束了!', spinwin);
      }
      if(now < spinwin.startTime || now > spinwin.endTime) {
        return done("抱歉，活动已经结束了!", spinwin);
      }
    }
    return done(err, spinwin);
  });
};

var SpinWin = mongoose.model('SpinWin', SpinWinSchema, 'spinwins');
module.exports = SpinWin;