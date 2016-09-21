/**
 * Created by xingjie201 on 2016/2/23.
 * 渠道（SaaS租户）
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ChannelSchema = mongoose.Schema({
  channelName: {type: String, required: true, unique: true, default: ""},//渠道名称
  channelType: {type: ObjectId, ref: "ChannelType"},    //渠道分类
  sourceOfChannel: {type: String, default: ""}, // 渠道来源
  title: {type: String, required: false, default: ""}, // 显示标题
  level: {type: String, required: false, default: ""}, // 星级
  identity: {type: String, required: true, default: "", unique: true, index: true, lowercase: true},   // 渠道标识
  domain: {type: String, required: false, default: "", lowercase: true},   // 渠道绑定域名
  note: {type: String, default: ""},    //备注
  url: {type: String, default: ""},    //入口
  logo: {type: String, default: ""},    //logo
  analystScript: {type: String, default: ""},    //统计代码
  //entry: [{type: ObjectId, ref: "Entry"}],   // 渠道入口
  paymentMethod: [{type: ObjectId, ref: "PaymentMethod"}], //支付方式
  keyContact: {type: ObjectId, ref: "Contact"},   // 关键联系人
  companyInfo: {type: String, required: false, default: ""},   // 公司信息
  financial: {type: String, required: false, default: ""},   // 财务信息
  enabled: {type: Boolean, trim: true, default: true}, // 激活
  setting: [{type: ObjectId, ref: 'ChannelSetting'}],
  email: {//邮件设置参数
    smtp: {type: String, default: ""},
    port: {type: String, default: ""},
    username: {type: String, default: ""},
    password: {type: String, default: ""},
    from: {type: String, default: ""},
    ssl: {type: Boolean, default: false},
    check: {type: Boolean, default: false}
  },
  menus: [{type: ObjectId, ref: "Menu"}]
}, {timestamps: {}});

ChannelSchema.statics.getByIdentity = function (identity, done) {
  if (!identity) {
    done(null);
  } else {
    Channel.findOne({identity: identity, enabled: true}, function (err, channel) {
      if (err)
        console.log(err);
      done(channel);
    });
  }
};
var Channel = mongoose.model('Channel', ChannelSchema, 'channels');
module.exports = Channel;
