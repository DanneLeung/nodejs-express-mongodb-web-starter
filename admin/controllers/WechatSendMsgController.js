/**
 * Created by ZhangXiao on 2016/3/10.
 * 渠道微信公众号群发消息
 */
var mongoose = require('mongoose');
var _ = require('lodash');
var xml2js = require("xml2js");
var moment = require('moment');
var async = require('async');

var config = require('../../config/config');
var ChannelWechat = mongoose.model('ChannelWechat');
var WechatReply = mongoose.model('WechatReply');
var WechatToken = mongoose.model('WechatToken');
var WechatMedia = mongoose.model('WechatMedia');
var WechatAutonToken = mongoose.model('WechatAuthToken');
var WechatFans = mongoose.model('WechatFans');
var WechatGroup = mongoose.model('WechatGroup');
var SendMsgCount = mongoose.model('SendMsgCount');
var SendMsgLog = mongoose.model('SendMsgLog');
var sendMsgUtil = require('../../util/wechat/sendMsgUtil');
var fileUtl = require('../../util/file');
var imgUtil = require('../../util/imgutil');
var mediaUtil = require('../../util/wechat/mediaUtil');

/**
 * 查公众号下的分组
 * @param req
 * @param res
 */
exports.findWechatGroup = function(req, res){
  WechatGroup.find({"channelWechat": req.session.wechat._id}, (e, o)=>{
    res.send(o);
  });
}

/**
 * 群发消息
 */
exports.sendMsg = function(req, res){
  var filter = req.body.filter;//发送筛选范围
  var data = req.body.data;//发送数据
  if(!data){
    res.send({"success": "0", "msg": "请选择素材"});
    return;
  }
  if(!filter) filter = 'all';//默认发给所有人
  var recivers = "";//记录接收者
  var url = '';
  var thumbMediaId = '';
  if(filter == 'all') recivers = '全部用户';
  ChannelWechat.findOne({"_id": req.session.wechat._id},(err, cw)=>{
    if(err){
      res.send({"success": "0", "msg": "发送失败."});
      return;
    }
    var sendMsg = new sendMsgUtil(cw.appid, cw.appsecret);
    //检查公众号类型，认证订阅号每天只能发送一篇消息；认证服务号，每天可调用接口100次，每月只能群发4条消息
    async.series([(cb)=>{
      if(filter && filter != 'all'){
        WechatGroup.findOne({"channelWechat": req.session.wechat._id, "groupId": filter}, (e, o)=>{
          if(o){
            recivers = o.name;
          }
          cb(null, null)
        });
      }else{
        cb(null, null)
      }
    },(cb)=>{
      if(cw.type == '2'){
        SendMsgCount.findOne({"wechat": req.session.wechat._id, "dateStr": moment().format('YYYYMMDD')}, (e, o)=>{
          if(o && o.dayCount == 0){
            cb(null, null)
          }else{
            cb('你今天还能群发 0 条消息', null)
          }
        });
      }else{
        cb(null, null)
      }
    }, (cb)=>{
      if(cw.type == '4'){
        //服务号不限制群发次数
        //SendMsgCount.findOne({"wechat": req.session.wechat._id, "yearMonth": moment().format('YYYYMM')}, (e, o)=>{
        //  if(o && o.count > 0){
        //    cb(null, null)
        //  }else{
        //    cb('您本月还能群发 0 条消息', null)
        //  }
        //});
        cb(null, null)
      }else{
        cb(null, null)
      }
    }, (cb)=>{
      if(data.type == 'text'){
        if(!data.content){
          cb("文本必须为1到600个字", null)
        }else{
          cb(null, null)
        }
      }else if(!data.mediaId){
        cb("请选择素材", null)
      }else if(data.type == 'news'){
       //图文消息，获取 wechatMedia
        var appid = req.session.wechat.appid;
        var appsecret = req.session.wechat.appsecret;
        var mutil = new mediaUtil(appid, appsecret);
        mutil.getMaterial(data.mediaId, function (err, media) {
          if(media){
            url = media.content.news_item[0].url;
            thumbMediaId = media.content.news_item[0].thumb_media_id;
          }
          cb(null, null)
        });
      }else{
        cb(null, null)
      }
    }],(err, result)=>{
      if(err){
        res.send({"success": "0", "msg": err});
        return;
      }

      //opts发送消息
      //receivers：消息接收者
      var opts = getOpts(data);
      if(opts){
        console.log('send msg params==========>', getOpts(data), getReceivers(filter), recivers);
        //var sendMsgLog = new SendMsgLog({
        //  wechat: req.session.wechat._id,
        //  type: data.type,
        //  content: data.content,
        //  mediaId: data.mediaId,
        //  recivers: recivers,
        //  url: url,//图文URL
        //  thumbMediaId: thumbMediaId,//图文缩略图
        //  sendErr: err,
        //  sendResult: result
        //})
        //sendMsgLog.save((e, o)=>{
        //  console.log(e, o)
        //});
        ////统计发送次数
        //if(cw.type == '2'){
        //  SendMsgCount.findOneAndUpdate({"wechat": req.session.wechat._id, "dateStr": moment().format('YYYYMMDD')},{"dayCount": 1}, (e,o)=>{
        //    console.log('type 2 dayCount++', e, o);
        //  });
        //}else if(cw.type == '4'){
        //  SendMsgCount.findOneAndUpdate({"wechat": req.session.wechat._id, "yearMonth": moment().format('YYYYMM')},{$inc:{"count": -1}},(e,o)=>{
        //    console.log('type 4 count--', e, o);
        //  });
        //}
        //res.send({"success": "1", "msg": "发送成功."});
        //return;

        sendMsg.massSend(getOpts(data), getReceivers(filter), (err, result)=>{
          //记录发送记录
          var sendMsgLog = new SendMsgLog({
            wechat: req.session.wechat._id,
            type: data.type,
            content: data.content,
            mediaId: data.mediaId,
            recivers: recivers,
            url: url,//图文URL
            thumbMediaId: thumbMediaId,//图文缩略图
            sendErr: err,
            sendResult: result
          })
          sendMsgLog.save((e, o)=>{
            console.log(e, o)
          });

          if(err){
            console.log(err);
            res.send({"success": "0", "msg": "发送失败."});
            return;
          }
          if(cw.type == '2'){
            SendMsgCount.findOneAndUpdate({"wechat": req.session.wechat._id, "dateStr": moment().format('YYYYMMDD')},{"dayCount": 1}, (e,o)=>{
              console.log('type 2 dayCount++', e, o);
            });
          }else if(cw.type == '4'){
            SendMsgCount.findOneAndUpdate({"wechat": req.session.wechat._id, "yearMonth": moment().format('YYYYMM')},{$inc:{"count": -1}},(e,o)=>{
              console.log('type 4 count--', e, o);
            });
          }
          console.log('send msg =====>', err, result)
          //记录发送次数,服务号每月可以发送4片，订阅号每天可发一篇
          res.send({"success": "1", "msg": "发送成功."});
          return;
        });
      }else{
        res.send({"success": "0", "msg": "群发消息素材格式有误，发送失败"});
        return;
      }
    });
  })
}

/**
 * 处理发送消息
 * @param req
 */
function getOpts(data){
  var json = null;
  switch (data.type) {
    case "text":
      json = {"text":{"content": data.content},"msgtype":"text"};
      break;
    case "image":
      json = {"image":{"media_id": data.mediaId},"msgtype":"image"};
      break;
    case "news":
      json = {"mpnews":{"media_id": data.mediaId},"msgtype":"mpnews"};
      break;
    case "voice":
      json = {"voice":{"media_id": data.mediaId},"msgtype":"voice"};
      break;
    case "video":
      json = {"video":{"media_id": data.mediaId},"msgtype":"video"};
      break;
    default :
      break;
  }
  return json;
}

/**
 * 视频素材处理
 * 此处视频的media_id需通过POST请求到下述接口特别地得到
 */
function getVideoData(){

}

/**
 * 对所有人 all
 * 某个分组 groupid
 * 一批粉丝 openids
 * @param filter
 */
function getReceivers(filter){
  var receivers;
  if(filter == 'all'){
    receivers = true;
  }else{
    receivers = filter;//groupid | openids
  }
  return receivers;
}

/**
 * 查已发送消息
 * @param req
 * @param res
 */
exports.datatable = function(req, res){
  SendMsgLog.dataTable(req.query, {
    conditions: {
      "wechat": req.session.wechat._id, //"sendResult.errcode": 0
    }
  }, function (err, data) {
    res.send(data);
  });
}
