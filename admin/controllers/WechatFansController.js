/**
 * Created by ZhangXiao on 2015/6/11.
 */
var mongoose = require('mongoose'),
  WechatFans = mongoose.model('WechatFans'),
  QrCode = mongoose.model('QrCode'),
  WechatGroup = mongoose.model('WechatGroup'),
  ChannelWechat = mongoose.model('ChannelWechat'),
  config = require('../../config/config');
var wechatFansUtil = require('../../util/wechat/wechatFansUtil');
var WechatAPI = require('wechat-api');

var WechatToken = mongoose.model('WechatToken'),
  WechatAuthToken = mongoose.model('WechatAuthToken'),
  WechatJsTicket = mongoose.model('WechatJsTicket');
var async = require('async');

exports.list = function (req, res) {
  //渠道下的公众号ID
  res.render('wechat/fans/fansList', {id: req.params.wechatId || req.session.wechat._id})
}

exports.datatable = function (req, res) {
  WechatGroup.find({"channelWechat": req.session.wechat._id}, (err, wgs)=>{
    WechatFans.dataTable(req.query, {
      conditions: {
        "channelWechat": req.params.wechatId || req.session.wechat._id,
        flag: true
      }
    }, function (err, data) {
      async.map(data.data, (wf, cb)=>{
        wf.groupId = getGroupNames(wf.groupId, wgs);
        cb(null, wf);
      },(err, objs)=>{
        data.data = objs;
        res.send(data);
      })
    });
  })
}

function getGroupNames(ids, wgs){
  if(!ids || !wgs){
    return "";
  }
  ids = ids.split(',')
  var groupNames = "";
  ids.forEach(function(id){
    wgs.forEach(function(data){
      if(id == data.groupId){
        groupNames += "," + data.name
      }
    })
  })
  if (groupNames.length > 0) groupNames = groupNames.substr(1)
  return groupNames;
}

//同步粉丝信息
exports.syncWechatFans = function (req, res) {
  var channelWechat = req.session.wechat._id;
  //1.修改公众号下的粉丝关注标记为 未关注
  //WechatFans.update({ "channelWechat": channelWechat }, { "flag": false }, { multi: true, upsert: false }, function (e, o) {
  //  if (!e) {
  ChannelWechat.findOne({"_id": channelWechat}, function (err, wechat) {
    if (!err && wechat != null) {
      var api = new WechatAPI(wechat.appid, wechat.appsecret, WechatToken.readToken, WechatToken.saveToken);
      api.registerTicketHandle(WechatJsTicket.getTicketToken, WechatJsTicket.saveTicketToken);
      console.log('get user info start');
      //获取关注列表
      //api.getFollowers(function (err, obj) {
      //  if (err) {
      //    console.log(err);
      //  } else {
      //    //总数
      //    var total = obj.total;
      //    console.log('total:', total);
      //    //单次取出数量
      //    var count = obj.count;
      //    //下一个起始的openid
      //    var next_openid = obj.next_openid;
      //    var data = obj.data.openid;
      //
      //    if (data) {
      //      //循环取用户openid，存入db
      //      //判断openid是否存过，存过之后不再存储
      //      for (var i in data) {
      //        //取最后一条的openid
      //        next_openid = obj.next_openid;
      //        var openid = data[i];
      //        api.getUser(openid, function (err, result) {
      //          if (!err) {
      //            result.flag = true; //关注公众号的粉丝
      //            result.channelWechat = channelWechat; //渠道公众号
      //            WechatFans.findAndSave(result);
      //          }
      //        });
      //      }
      //    }
      //
      //    //如果total大于10000，则取后面的数据时需要加上next_openid，一次循环直到取完为止
      //    while (total > count) {
      //      api.getFollowers(next_openid, function (err, result) {
      //        if (!err) {
      //          count += result.count;
      //          next_openid = result.next_openid;
      //          //循环存入db
      //          data = result.data.openid;
      //          if (data) {
      //            for (var i in data) {
      //              var openid = data[i];
      //              api.getUser(openid, function (err, result) {
      //                if (!err) {
      //                  result.flag = true; //关注公众号的粉丝
      //                  result.channelWechat = channelWechat; //渠道公众号
      //                  WechatFans.findAndSave(result);
      //                }
      //              });
      //            }
      //          }
      //        }
      //      });
      //    }
      //  }
      //  //req.flash('success', '同步成功!');
      //  res.send(channelWechat);
      //});

      api.getFollowers(function (err, obj) {
        if (err) {
          console.log(err);
        } else {
          //总数
          var total = obj.total;
          //单次取出数量
          var count = obj.count;
          console.log('total:', total, "count:", count);
          //下一个起始的openid
          var next_openid = obj.next_openid;
          var data = obj.data.openid;

          if (data) {
            //循环取用户openid，存入db
            //判断openid是否存过，存过之后不再存储
            for (var i in data) {
              //取最后一条的openid
              next_openid = obj.next_openid;
              var openid = data[i];
              api.getUser(openid, function (err, result) {
                if (!err) {
                  result.flag = true;//关注公众号的粉丝
                  result.channelWechat = wechat._id;//渠道公众号
                  WechatFans.findAndSave(result, function (data) {
                    console.log('************* 粉丝已更新 ', openid);
                  });
                }
              });
            }
          }
          if (total <= count) return;
          //如果total大于10000，则取后面的数据时需要加上next_openid，一次循环直到取完为止
          async.whilst(() =>  total > count,
            (callback) => {
              console.log("**************** 读取下一批openid ", next_openid);
              api.getFollowers(next_openid, function (err, result) {
                if (!err) {
                  console.error("*********************** api.getFollowers 错误 ", next_openid);
                  return;
                }
                count += result.count;
                next_openid = result.next_openid;
                //循环存入db
                data = result.data.openid;
                async.map(data, (openid, cb)=> {
                  api.getUser(openid, function (err, result) {
                    if (err) {
                      console.error(err);
                      return cb(null, null);
                    }
                    result.flag = true;//关注公众号的粉丝
                    result.channelWechat = wechat._id;//渠道公众号
                    WechatFans.findAndSave(result, function (data) {
                      console.log('************* 粉丝已更新 ', openid);
                      cb(null, data);
                    });
                  });
                }, (err, result)=> {
                  callback(null, count);
                });
              });
            }, (err, n)=> {
              console.log("$$$$$$$$$$$$$$$ 读取下一批openid完成! ", next_openid);
            }
          );
        }
      });
      console.log('get user info end');
    } else {
      console.log('同步失败,未找到公众号信息');
    }
  });
  //} else {
  //  console.log('同步失败，更新粉丝标记失败');
  //}
  //});
}

/**
 * 设置粉丝的备注
 * @param req
 * @param res
 */
exports.setRemark = function (req, res) {
  var ids = req.body.fansId || req.params.fansId;
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  WechatFans.findOne({'_id': ids}, function (err, fan) { //查询该粉丝
    if (!err) {
      var updata = {};
      updata.remark = req.body.remark;
      WechatFans.update({'_id': fan._id}, updata, function (err, fans) { //为该粉丝备注
        if (!err) {
          var fans = new wechatFansUtil(appid, appsecret);
          fans.updateRemark(fan.openid, req.body.remark, function (err, result) { //与微信接口对接
            if (!err) {
              res.send({code: "1", meg: "已完成备注的设置"});
            } else {
              res.send({code: "0", meg: err});
            }
          })
        } else {
          res.send({code: "0", meg: err});
        }
      });
    } else {
      res.send({code: "0", meg: err});
    }
  });
};

/**
 * 新增分组
 */
exports.addGroup = function(req, res){
  ChannelWechat.findById({"_id": req.session.wechat._id}, (err, wechat)=>{
    //检查标签是否已存在
    WechatGroup.findOne({"name": req.body.group}, (ee, wg)=>{
      if(wg != null){
        req.flash('error', '该标签名字已存在，请重新输入');
        res.redirect('/wechat/fans');
      }else{
        var fans = new wechatFansUtil(wechat.appid, wechat.appsecret);
        //console.log(req.body.group);
        //创建微信分组
        fans.createGroup(req.body.group, (e, o)=>{
          console.log(e, o);
          if(!e && o != null){
            //保存分组数据
            var wechatGroup = new WechatGroup({
              "channelWechat": req.session.wechat._id,
              "name": o.group.name,
              "groupId": o.group.id,
            });
            wechatGroup.save();
          }
          req.flash('success', '创建成功');
          res.redirect('/wechat/fans');
        });
      }
    })
  });
}

/**
 * 检查标签是否重复
 * @param req
 * @param res
 */
exports.checkGroup = function(req, res){
  WechatGroup.findOne({"name": req.body.group}, (ee, wg)=> {
    if (wg == null) {
      res.send('ok')
    }else{
      res.send('fail')
    }
  });
}

/**
 * 同步微信分组数据
 */
exports.syncGroup = (req, res)=>{
  async.waterfall([(cb)=>{
    ChannelWechat.findById({"_id": req.session.wechat._id}, (err, wechat)=>{
      cb(null, wechat);
    });
  },(wechat, cb)=>{
    var fans = new wechatFansUtil(wechat.appid, wechat.appsecret);
    fans.getGroups((e, groups)=>{
      if(e){
        cb(e, null);
      }else{
        cb(null, groups);
      }
    });
  },(groups, cb)=>{
    WechatGroup.remove({}, (e, o)=>{
      if(e){
        cb(e, null);
      }else{
        cb(null, groups);
      }
    })
  },(groups, cb)=>{
    groups.groups.forEach((data)=>{
      var wechatGroup = new WechatGroup({
        "channelWechat": req.session.wechat._id,
        "name": data.name,
        "groupId": data.id,
        "count": data.count,
      });
      wechatGroup.save((e, o)=>{
        console.log('save group', e, o);
      });
    });
    cb(null, groups);
  }], (err, result)=>{
    if(err){
      req.flash('error', err);
      res.redirect('/wechat/fans');
      return;
    }
    req.flash('success', '同步成功');
    res.redirect('/wechat/fans');
  });
}

/**
 * 查询所有分组
 * @param req
 * @param res
 */
exports.getAllGroup = (req, res)=>{
  WechatGroup.find({"channelWechat": req.session.wechat._id}, (e, o)=>{
    res.send(o)
  })
}

/**
 * 删除
 * @param req
 * @param res
 */
exports.del = (req, res)=>{
  var groupId = req.params.groupId;
  ChannelWechat.findById({"_id": req.session.wechat._id}, (err, wechat)=>{
    var fans = new wechatFansUtil(wechat.appid, wechat.appsecret);
    console.log('groupId=======>', groupId);
    fans.removeGroup(groupId, (err, obj)=>{
      console.log(err, obj);
      if(!err){
        WechatGroup.remove({"channelWechat": req.session.wechat._id, "groupId": groupId}, (e, o)=>{
          //删除标签的同时，需要删除永久二维码下关联的标签
          QrCode.removeRefTag(req.session.wechat.appid, groupId);
          res.send('ok');
        })
      }
    });
  })
}

/**
 * 重命名
 * @param req
 * @param res
 */
exports.update = (req, res)=>{
  var groupId = req.body.updateGroupId;
  var name = req.body.updateGroupName;
  ChannelWechat.findById({"_id": req.session.wechat._id}, (err, wechat)=>{
    var fans = new wechatFansUtil(wechat.appid, wechat.appsecret);
    fans.updateGroup(groupId, name, (err, obj)=>{
      console.log(err, obj, groupId, name);
      if(!err){
        WechatGroup.findOneAndUpdate({"channelWechat": req.session.wechat._id, "groupId": groupId},{"name": name}, (e, o)=>{
          req.flash('success', '修改成功');
          res.redirect('/wechat/fans');
          return;
        })
      }else{
        req.flash('error', err);
        res.redirect('/wechat/fans');
        return;
      }
    });
  })
}
/**
 * 移动用户到分组
 * @param req
 * @param res
 */
exports.moveUserToGroup = (req, res)=>{
  var ids = req.body.Ids;
  if(ids) ids = ids.split(',');
  var groupIds = req.body.groupIds;
  var tmpGroupIds = "0";
  if(!groupIds){
    groupIds = ["0"];//未分组
  }else{
    groupIds = groupIds.split(",");
    tmpGroupIds = req.body.groupIds;
  }
  if(!ids){
    req.flash('success', '请选择粉丝');
    res.redirect('/wechat/fans');
    return;
  }else if(ids.length > 50){
    req.flash('success', '粉丝数不能超过50个');
    res.redirect('/wechat/fans');
    return;
  }
  var fans = new wechatFansUtil(req.session.wechat.appid, req.session.wechat.appsecret);
  var tasks = [function(callback){
    callback(null, null);
  }];
  var index = 0;
  groupIds.forEach((groupId)=>{
    var task = function(tagId, callback){
      //if (typeof tagId === 'function') {
      //  callback = tagId;
      //}
      if(index == 0) tagId = groupId;
      console.log('set tags ===========>', tagId, ids)
      fans.membersBatchtagging(tagId, ids, (e, o)=>{
        console.log(e, o)
        index++;
        callback(e, groupIds[index]);
      })
    }
    tasks.push(task);
  })
  if(tasks.length > 0){
    async.waterfall(tasks, function(err, obj){
      if(err){
        req.flash('error', err.message);
        res.redirect('/wechat/fans');
        return;
      }
      console.log('update wechat fans:', ids, tmpGroupIds)
      WechatFans.update({"openid": {$in: ids}}, {$set: {"groupId": tmpGroupIds}}, {"upsert": false, "multi": true}, (err, obj)=>{
        console.log(err, obj)
      })
      //WechatFans.find({"openid": {$in: ids}}, (err, obj)=>{
      //  console.log(err, obj)
      //})
      req.flash('success', '设置成功');
      res.redirect('/wechat/fans');
    })
  }
}
