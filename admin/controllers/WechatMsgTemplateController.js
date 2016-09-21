/**
 * Created by ZhangXiao on 2016/3/10.
 * 微信模板消息管理
 */
var mongoose = require('mongoose')
  , _ = require('lodash')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , WechatMsgTemplate = mongoose.model('WechatMsgTemplate')
  , config = require('../../config/config');
var sendTemplateUtil = require('../../util/wechat/sendTemplateUtil');

exports.list = function (req, res) {
  res.render("wechat/msgTemplate/list");
}

exports.dataTable = function (req, res) {
  WechatMsgTemplate.dataTable(req.query, {conditions: {"channelWechat": req.session.wechat._id}}, function (err, data) {
    res.send(data);
  });
}

/**
 * 同步微信模板
 * @param req
 * @param res
 */
exports.sync = function(req, res){
  var util = new sendTemplateUtil(req.session.wechat.appid, req.session.wechat.appsecret);
  util.getAllPrivateTemplate((err, obj)=>{
    console.log(err, obj)
    if(err){
      req.flash('error', '同步失败');
      res.redirect('/wechat/msgTemplate/list');
      return;
    }
    if(obj && obj.template_list && obj.template_list.length > 0){
      //删除原有模板
      WechatMsgTemplate.remove({"channelWechat": req.session.wechat._id}, (e, o)=>{})
      obj.template_list.forEach(function(data){
        var template = new WechatMsgTemplate({
          channelWechat: req.session.wechat._id,
          templateId: data.template_id,
          title: data.title,
          primaryIndustry: data.primary_industry,
          deputyIndustry: data.deputy_industry,
          content: data.content,
          example: data.example
        });
        template.save((e, o)=>{
          console.log(e, o)
        })
      })
      req.flash('success', '同步成功');
      res.redirect('/wechat/msgTemplate/list');
    }else{
      req.flash('success', '同步成功');
      res.redirect('/wechat/msgTemplate/list');
    }
  })
}

exports.del = function(req, res){
  var templateId = req.params.templateId;
  if(!templateId){
    req.flash('error', '模板ID不能为空');
    res.redirect('/wechat/msgTemplate/list');
    return;
  }
  var util = new sendTemplateUtil(req.session.wechat.appid, req.session.wechat.appsecret);
  util.delPrivateTemplate(templateId, (err, obj)=>{
    if(err){
      req.flash('error', '删除模板失败');
      res.redirect('/wechat/msgTemplate/list');
      return;
    }
    WechatMsgTemplate.remove({"templateId": templateId}, (e, o)=>{
      if(e){
        req.flash('error', '删除模板失败');
        res.redirect('/wechat/msgTemplate/list');
        return;
      }
      req.flash('success', '删除模板成功');
      res.redirect('/wechat/msgTemplate/list');
    })
  })
}

/**
 * 查看模板消息明细
 * @param req
 * @param res
 */
exports.detail = function(req, res){
  var templateId = req.params.templateId;
  if(!templateId){
    req.flash('error', '模板ID不能为空');
    res.redirect('/wechat/msgTemplate/detail');
    return;
  }
  WechatMsgTemplate.findOne({"templateId": templateId}, (err, obj)=>{
    res.render('wechat/msgTemplate/detail', obj);
  })
}
