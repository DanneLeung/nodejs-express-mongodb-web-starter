/**
 * Created by ZhangXiao on 2015/6/11.
 */
var async = require('async');
var mongoose = require('mongoose');
var config = require('../../../../config/config');

var WechatFans = mongoose.model('WechatFans');
// QrCode = mongoose.model('QrCode'),
var WechatGroup = mongoose.model('WechatGroup');
var Wechat = mongoose.model('Wechat');
var wechatFansUtil = require(config.root + '/util/wechat/wechatFansUtil');
var WechatAPI = require('wechat-api');

var WechatToken = mongoose.model('WechatToken');
var WechatAuthToken = mongoose.model('WechatAuthToken');
var WechatJsTicket = mongoose.model('WechatJsTicket');
var WechatFansSync = require(config.root + '/util/wechat/wechat.fans.sync');

exports.list = function (req, res) {
  //渠道下的公众号ID
  var wechatId = req.params.wechatId || req.query.wechatId;
  if(!wechatId) {
    Wechat.findOne({}).sort("default").exec((err, wechat) => {
      if(err) console.error(err);
      if(wechat) {
        wechatId = wechat._id;
      }
      res.render('admin/wechat/fans/fansList', { wechatId: wechatId })
    });
  } else {
    res.render('admin/wechat/fans/fansList', { wechatId: wechatId });
  }
}

exports.datatable = function (req, res) {
  WechatGroup.find({ "wechat": req.params.wechatId || req.query.wechatId }, (err, wgs) => {
    WechatFans.dataTable(req.query, {
      conditions: {
        "wechat": req.params.wechatId || req.query.wechatId
      }
    }, function (err, data) {
      async.map(data.data, (wf, cb) => {
        wf.groupId = getGroupNames(wf.groupId, wgs);
        cb(null, wf);
      }, (err, objs) => {
        data.data = objs;
        res.send(data);
      })
    });
  })
}

function getGroupNames(ids, wgs) {
  if(!ids || !wgs) {
    return "";
  }
  ids = ids.split(',')
  var groupNames = "";
  ids.forEach(function (id) {
    wgs.forEach(function (data) {
      if(id == data.groupId) {
        groupNames += "," + data.name
      }
    })
  })
  if(groupNames.length > 0) groupNames = groupNames.substr(1)
  return groupNames;
}

//同步粉丝信息
exports.syncWechatFans = function (req, res) {
  var wechatId = req.params.wechatId || req.query.wechatId;
  WechatFansSync(wechatId, (err, result) => {
    var ret = {};
    if(err) ret.err = err;
    else ret.reuslt = result;
    res.status(200).send(ret);
  });
}

function createFans(user, cb) {
  WechatFans.count({ openid: user.openid }, (err, count) => {
    if(!count) {
      user.subscribeTimes = 2; //既存用户
    }
    WechatFans.findOneAndUpdate({
      openid: user.openid
    }, user, {
      new: true,
      upsert: true
    }, function (err, fan) {
      if(err) console.error(err);
      return cb(err, fan);
    });
  });
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
  WechatFans.findOne({ '_id': ids }, function (err, fan) { //查询该粉丝
    if(!err) {
      var updata = {};
      updata.remark = req.body.remark;
      WechatFans.update({ '_id': fan._id }, updata, function (err, fans) { //为该粉丝备注
        if(!err) {
          var fans = new wechatFansUtil(appid, appsecret);
          fans.updateRemark(fan.openid, req.body.remark, function (err, result) { //与微信接口对接
            if(!err) {
              res.send({ code: "1", meg: "已完成备注的设置" });
            } else {
              res.send({ code: "0", meg: err });
            }
          })
        } else {
          res.send({ code: "0", meg: err });
        }
      });
    } else {
      res.send({ code: "0", meg: err });
    }
  });
};

/**
 * 新增分组
 */
exports.addGroup = function (req, res) {
  Wechat.findById({ "_id": req.params.wechatId || req.query.wechatId }, (err, wechat) => {
    //检查标签是否已存在
    WechatGroup.findOne({ "name": req.body.group }, (ee, wg) => {
      if(wg != null) {
        req.flash('error', '该标签名字已存在，请重新输入');
        res.redirect('/admin/wechat/fans');
      } else {
        var fans = new wechatFansUtil(wechat.appid, wechat.appsecret);
        //console.log(req.body.group);
        //创建微信分组
        fans.createGroup(req.body.group, (e, o) => {
          console.log(e, o);
          if(!e && o != null) {
            //保存分组数据
            var wechatGroup = new WechatGroup({
              "wechat": req.params.wechatId || req.query.wechatId,
              "name": o.group.name,
              "groupId": o.group.id,
            });
            wechatGroup.save();
          }
          req.flash('success', '创建成功');
          res.redirect('/admin/wechat/fans');
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
exports.checkGroup = function (req, res) {
  WechatGroup.findOne({ "name": req.body.group }, (ee, wg) => {
    if(wg == null) {
      res.send('ok')
    } else {
      res.send('fail')
    }
  });
}

/**
 * 同步微信分组数据
 */
exports.syncGroup = (req, res) => {
  async.waterfall([(cb) => {
    Wechat.findById({ "_id": req.params.wechatId || req.query.wechatId }, (err, wechat) => {
      cb(null, wechat);
    });
  }, (wechat, cb) => {
    var fans = new wechatFansUtil(wechat.appid, wechat.appsecret);
    fans.getGroups((e, groups) => {
      if(e) {
        cb(e, null);
      } else {
        cb(null, groups);
      }
    });
  }, (groups, cb) => {
    WechatGroup.remove({}, (e, o) => {
      if(e) {
        cb(e, null);
      } else {
        cb(null, groups);
      }
    })
  }, (groups, cb) => {
    groups.groups.forEach((data) => {
      var wechatGroup = new WechatGroup({
        "wechat": req.params.wechatId || req.query.wechatId,
        "name": data.name,
        "groupId": data.id,
        "count": data.count,
      });
      wechatGroup.save((e, o) => {
        console.log('save group', e, o);
      });
    });
    cb(null, groups);
  }], (err, result) => {
    if(err) {
      req.flash('error', err);
      res.redirect('/admin/wechat/fans');
      return;
    }
    req.flash('success', '同步成功');
    res.redirect('/admin/wechat/fans');
  });
}

/**
 * 查询所有分组
 * @param req
 * @param res
 */
exports.getAllGroup = (req, res) => {
  var wechatId = req.params.wechatId || req.query.wechatId;
  if(!wechatId) res.send([]);
  WechatGroup.find({ "wechat": wechatId }, (e, groups) => {
    res.send(groups)
  });
}

/**
 * 删除
 * @param req
 * @param res
 */
exports.del = (req, res) => {
  var groupId = req.params.groupId;
  Wechat.findById({ "_id": req.params.wechatId || req.query.wechatId }, (err, wechat) => {
    var fans = new wechatFansUtil(wechat.appid, wechat.appsecret);
    console.log('groupId=======>', groupId);
    fans.removeGroup(groupId, (err, obj) => {
      console.log(err, obj);
      if(!err) {
        WechatGroup.remove({ "wechat": req.params.wechatId || req.query.wechatId, "groupId": groupId }, (e, o) => {
          //删除标签的同时，需要删除永久二维码下关联的标签
          // QrCode.removeRefTag(req.session.wechat.appid, groupId);
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
exports.update = (req, res) => {
  var groupId = req.body.updateGroupId;
  var name = req.body.updateGroupName;
  Wechat.findById({ "_id": req.params.wechatId || req.query.wechatId }, (err, wechat) => {
    var fans = new wechatFansUtil(wechat.appid, wechat.appsecret);
    fans.updateGroup(groupId, name, (err, obj) => {
      console.log(err, obj, groupId, name);
      if(!err) {
        WechatGroup.findOneAndUpdate({ "wechat": req.params.wechatId || req.query.wechatId, "groupId": groupId }, { "name": name }, (e, o) => {
          req.flash('success', '修改成功');
          res.redirect('/admin/wechat/fans');
          return;
        })
      } else {
        req.flash('error', err);
        res.redirect('/admin/wechat/fans');
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
exports.moveUserToGroup = (req, res) => {
  var ids = req.body.Ids;
  if(ids) ids = ids.split(',');
  var groupIds = req.body.groupIds;
  var tmpGroupIds = "0";
  if(!groupIds) {
    groupIds = ["0"]; //未分组
  } else {
    groupIds = groupIds.split(",");
    tmpGroupIds = req.body.groupIds;
  }
  if(!ids) {
    req.flash('success', '请选择粉丝');
    res.redirect('/admin/wechat/fans');
    return;
  } else if(ids.length > 50) {
    req.flash('success', '粉丝数不能超过50个');
    res.redirect('/admin/wechat/fans');
    return;
  }
  var fans = new wechatFansUtil(req.session.wechat.appid, req.session.wechat.appsecret);
  var tasks = [function (callback) {
    callback(null, null);
  }];
  var index = 0;
  groupIds.forEach((groupId) => {
    var task = function (tagId, callback) {
      //if (typeof tagId === 'function') {
      //  callback = tagId;
      //}
      if(index == 0) tagId = groupId;
      console.log('set tags ===========>', tagId, ids)
      fans.membersBatchtagging(tagId, ids, (e, o) => {
        console.log(e, o)
        index++;
        callback(e, groupIds[index]);
      })
    }
    tasks.push(task);
  })
  if(tasks.length > 0) {
    async.waterfall(tasks, function (err, obj) {
      if(err) {
        req.flash('error', err.message);
        res.redirect('/admin/wechat/fans');
        return;
      }
      console.log('update wechat fans:', ids, tmpGroupIds)
      WechatFans.update({ "openid": { $in: ids } }, { $set: { "groupId": tmpGroupIds } }, { "upsert": false, "multi": true }, (err, obj) => {
        console.log(err, obj)
      })
      //WechatFans.find({"openid": {$in: ids}}, (err, obj)=>{
      //  console.log(err, obj)
      //})
      req.flash('success', '设置成功');
      res.redirect('/admin/wechat/fans');
    })
  }
}