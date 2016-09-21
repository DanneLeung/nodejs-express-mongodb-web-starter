/**
 * 活动管理
 */
'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');
var config = require('../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

var moment = require('moment');

var Activities = mongoose.model('Activities');
var Award = mongoose.model('Award');

/**
 * 活动列表
 * @param req
 * @param res
 */
exports.list = function (req, res) {
  res.render('activities/list');
};
/**
 * 获取活动列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  Activities.dataTable(req.query, {
    conditions: {
      channel: req.session.channelId,
      wechat: req.session.wechat._id
    }
  }, function (err, data) {
    res.send(data);
  });
}


/**
 * 新建活动
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  console.log(new Activities());
  Award.find({
    'enabled': true,
    'channel': req.session.channelId,
    wechat: req.session.wechat._id
  }, {description: 0}, function (err, award) {
    res.render('activities/form', {activity: new Activities(), awards: award, award: JSON.stringify(award)});
  });
};


/*role list table json datasource*/
exports.get_award_select = function (req, res) {
  var q = req.body.q || req.param("q");

  var query = {};
  if (q) {
    query.$or = [{name: {$regex: q}}, {mark: {$regex: q}}]
  }
  query.enabled = true;
  query.channel = req.session.channelId;
  query.wechat = req.session.wechat._id;

  Award.find(query, function (err, award) {
    var datas = [];
    if (award) {
      award.forEach(function (e) {
        var data = {};
        data.id = e._id;
        data.text = e.mark + "-" + e.name;
        datas.push(data);
      });
    }
    res.send(datas);
  });
};

/**
 * 修改活动信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  async.waterfall([
    function (callback) {
      Award.find({
        'enabled': true,
        'channel': req.session.channelId,
        wechat: req.session.wechat._id
      }, {description: 0}, function (err, award) {
        callback(err, award);
      });
    }, function (awards, callback) {
      Activities.findById(id, function (err, activity) {
        var result = {};
        result.awards = awards;
        result.award = JSON.stringify(awards);
        result.activity = activity;
        callback(err, result);
      })
    }
  ], function (err, result) {
    if (err) {
      req.flash('error', err);
      res.redirect('/activities');
    } else {
      res.render('activities/form', result);
    }
  })
};


/**
 * 复制活动信息
 * @param req
 * @param res
 */
exports.copy = function (req, res) {
  var id = req.params.id;
  Activities.findById(id, function (err, activity) {
    if (!err) {
      var activis = new Activities({
        channel: activity.channel, //所属渠道
        wechat: activity.wechat, //使用的微信号
        type: activity.type,//活动类型
        code: activity.code,//代号
        name: activity.name + "副本",//名称
        description: activity.description,//说明
        logo: activity.logo,//活动logo，分享时使用
        url: activity.url,//活动入口URL
        qrcode: activity.qrcode,//活动入口URL二维码
        keywords: activity.keywords,//关键字
        startTime: activity.startTime,//开始时间
        endTime: activity.endTime,//结束时间
        limit: activity.limit,//限制人数
        ratio: activity.ratio,//中奖率
        timesPerUser: activity.timesPerUser,//每人共可参与次数
        timesPerDay: activity.timesPerDay,//每日每人可参与次数
        sharedAddTimes: activity.sharedAddTimes,//分享后可获得次数
        awards: activity.awards,//活动奖项
        whitelist: activity.whitelist,//白名单
        whitelistCount: activity.whitelistCount,//白名单人数
        enabled: activity.enabled//激活
      });
      activis.save(function (err, activis) {
        if (!err) {
          req.flash('success', '数据复制成功!');
        } else {
          req.flash('error', "请先修改已复制活动的名称再复制！");
        }
        res.redirect('/activities/index');
      });
    }
  })
};

/**
 * 删除活动信息
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  Activities.remove({'_id': {$in: ids}}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/activities/index');
    }
  });
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
  req.body.channel = req.session.channelId;
  // handle checkbox unchecked.Å
  if (!req.body.enabled) req.body.enabled = false;
  if (req.body.whitelist == '' || req.body.whitelist == undefined) {
    req.body.whitelist = null;
  }
  //处理时间范围
  var time = req.body.time;
  if (time) {
    var times = time.split(' - ');
    console.log("$$$$$$$$$$$$ 活动时间：" + times);
    if (times.length > 1) {
      req.body.startTime = moment(times[0]);
      req.body.endTime = moment(times[1]);
    }
  }
  setAwards(req, function (req) {
    if (!id) {
      req.body.wechat = req.session.wechat;
      var activities = new Activities(req.body);
      activities.save(function (err, newActivities) {
        handleSaved(req, res, err, activities, 'add');
      });
    } else {
      // update
      console.log("******************* activity to be saved.", (req.body));
      Activities.findByIdAndUpdate(id, req.body, {new: true}, function (err, act) {
        handleSaved(req, res, err, (err ? req.body : act), 'edit');
      });
    }
  });
};

/**
 * 处理错误，如果没有错误返回true，可以进行下一步，否则返回false
 * @param req
 * @param res
 * @param err
 * @param msg
 */
function handleErr(req, err, msg) {
  if (err) {
    console.log(err);
    req.flash('error', msg ? msg : err);
    return false;
  }
  return true;
}

// handle object saved
function handleSaved(req, res, err, activities, type) {
  if (err) {
    console.log(err);
    req.flash('error', '活动保存失败!' + err);
    res.render('activities/form', {
      viewType: type,
      activity: activities
    });
  } else {
    var roleId = req.body.roles;
    req.flash('success', '活动保存成功!');
    res.redirect('/activities/index');
  }
}

/**
 * 验证活动名称是否唯一
 * @param req
 * @param res
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    Activities.count({'name': newName, channel: req.session.channelId}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 是否激活供应商
 * @param req
 * @param res
 */
exports.online = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Activities.findById(id, function (err, info) {
    if (!err) {
      if (info.online == true) {
        updata.online = false;
        msg = "已下线"
      } else {
        updata.online = true;
        msg = "已上线"
      }
      Activities.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/activities/index');
        }
      });
    }
  });
};

/**
 * 是否激活供应商
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Activities.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已下线"
      } else {
        updata.enabled = true;
        msg = "已上线"
      }
      Activities.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/activities/index');
        }
      });

    }
  });
};

/**
 * 查找活动中的奖项信息
 * @param req
 * @param res
 */
exports.getAwards = function (req, res) {
  var id = req.params.id || req.body.id;
  Activities.findById({_id: id}).exec(function (err, activity) {
    if (activity) {
      res.send(_.sortBy(activity.awards, ['level']));
    } else {
      res.send([]);
    }
  });
};

/**
 * 根据活动Id获取奖项
 * @param req
 * @param res
 */
exports.getByActivityAwards = function (req, res) {
  var id = req.params.id || req.body.id;
  Activities.findOne({_id: id}, function (err, activity) {
    if (activity) {
      var award = getByIdAward(activity.awards)
      if (award) {
        res.send(award);
      } else {
        res.send([]);
      }
    } else {
      res.send([]);
    }
  });
};

/**
 * 获取活动中的奖项
 * @param awards
 * @returns {Array}
 */
function getByIdAward(awards) {
  var award = [];
  awards.forEach(function (e) {
    award.push(e.award);
  });
  return award;
}

/**
 * 查找活动中的奖项信息
 * @param req
 * @param res
 */
exports.getActivities = function (req, res) {
  var channelId = req.session.channelId;
  var wechatId = req.session.wechat._id;
  Activities.find({channel: channelId, wechat: wechatId}, function (err, activity) {
    if (activity) {
      res.send(activity);
    } else {
      res.send([]);
    }
  });
};
/**
 * 奖项设置中数据的合并
 * @param req
 * @param callback
 */
function setAwards(req, callback) {
  var awards = req.body.award;
  var sorts = req.body.sort;
  var isEmpty = req.body.isEmptys;
  var levels = req.body.level;
  var notes = req.body.note;
  var awardNames = req.body.awardName;
  var counts = req.body.counts;
  var ratios = req.body.ratios;
  var nickname = req.body.nickname;
  var mobile = req.body.mobile;
  var prize = req.body.prize;
  req.body.awards = [];
  req.body.presetWinners = [];
  var empty = isEmpty.split(',');
  if (counts && counts instanceof Array) {
    //数组形式的合并
    //合并成对象
    for (var i = 0; i < counts.length; i++) {
      var a = {};
      a.award = awards[i];// award id.
      a.sort = sorts[i] ? sorts[i] : 0;
      a.level = levels[i] ? levels[i] : 0;
      a.awardName = awardNames[i] ? awardNames[i] : "";
      a.count = counts[i] ? counts[i] : 0;
      a.isEmpty = empty[i] ? empty[i] : 0;
      try {
        a.ratio = ratios[i] && ratios[i] != 'null' ? ratios[i] : 0;
      } catch (e) {
        if (e) console.error(e);
        a.ratio = 0;
      }
      req.body.awards.push(a)
    }
  } else if (counts) { //只有一个奖项的时候
    var a = {};
    a.award = awards;
    a.level = levels;
    a.sort = sorts ? sorts : 0;
    a.awardName = awardNames;
    a.count = counts;
    a.isEmpty = isEmpty;
    try {
      a.ratio = parseInt(ratios && ratios != 'null' ? ratios : 0);
    } catch (e) {
      if (e) console.error(e);
      a.ratio = 0;
    }
    req.body.awards.push(a)
  }

  //预设中奖信息的数据
  if (nickname && nickname instanceof Array) {
    //数组形式的合并
    //合并成对象
    for (var i = 0; i < nickname.length; i++) {
      var b = {};
      b.nickname = nickname[i];
      b.mobile = mobile[i];
      b.prize = prize[i];
      b.time = new Date();
      req.body.presetWinners.push(b)
    }
  } else if (nickname) { //只有一个中奖信息的时候
    var b = {};
    b.nickname = nickname;
    b.mobile = mobile;
    b.prize = prize;
    b.time = new Date();
    req.body.presetWinners.push(b)
  }

  if (req.body.awards && req.body.awards.length) {
    async.map(req.body.awards, (item, callback) => {
      Award.findById(item.award, function (err, aw) { //获取奖品的对象
        if (err) console.error(err);
        if (!aw) console.error("************* 奖品%s不存在了，可能已经被删除.", item.award);
        item.award = aw;// award object
        callback(null, item);
      });
    }, (e, result) => {
      req.body.awards = _.sortBy(req.body.awards, ['level']);
      return callback(req);
    });
  } else {
    return callback(req);
  }
}
