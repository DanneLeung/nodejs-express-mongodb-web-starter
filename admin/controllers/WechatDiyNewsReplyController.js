/**
 * Created by ZhangXiao on 2016/6/22.
 * 自定义回复图文消息
 */
var mongoose = require('mongoose');
var WechatReply = mongoose.model('WechatReply')
var ChannelWechat = mongoose.model('ChannelWechat')

exports.list = function(req, res){
  res.render('wechat/autoreply/diyNewsReply', {wechatId: req.session.wechat._id});
}