/**
 * Created by danne on 2016-04-28.
 */
/**
 * 线下活动报名
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');
var validator = require('validator');
var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');
var Sign = require('./sign.model');
var SignList = require('./sign.list.model');


/**
 * 线下活动列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  res.render('activities/sign/signList', {});
};

/**
 * 获取活动列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  Sign.dataTable(req.query, {conditions: {'wechat': req.session.wechat._id}}, function (err, data) {
    res.send(data);
  });
}

/**
 * 新建站点
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('activities/sign/signForm', {sign: new Sign()});
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
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

  if (!req.files || req.files.length <= 0) {
    saveOrUpdate(id, req, res);
  } else {
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'sign', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
      for (i in fs) {
        if ('logo' == fs[i].fieldname) {
          fs[i].width = fs[i].height = 200;
        }//200
        if ('bgimg' == fs[i].fieldname) {
          fs[i].width = fs[i].height = 800;
        }//800
      }
      imgUtil.thumbnail(fs, 200, function (ffs) {
        console.log("********** files thumbnailed: " + JSON.stringify(ffs));

        fileUtl.saveFiles(ffs, function (err, files) {
          if (err) req.flash('warning', '文件保存时发生错误');
          console.log("********** files saved: " + JSON.stringify(files));
          // 返回的文件path为URL路径
          if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
              var fieldname = files[i].fieldname;
              console.log("********** setting  body %s - %s : ", fieldname, files[i].path);
              req.body[fieldname] = files[i];
            }
          }
          if (!req.body.logo) {
            delete req.body.logo
          }
          if (!req.body.bgimg) {
            delete req.body.bgimg
          }
          console.log("********** save wechat body: " + JSON.stringify(req.body));
          // 更新时处理替换文件情况，新文件保存后旧文件删除
          Sign.findById(id, function (err, event) {
            console.log('******** event should be updated:', event);
            // queue files that should be removed.
            var filesShouldRemove = [];
            if (!event) {
              saveOrUpdate(id, req, res);
            } else {
              if (req.body.logo && event.logo) {
                //文件替换
                filesShouldRemove.push(event.logo);
              }
              if (req.body.bgimg && event.bgimg) {
                //文件替换
                filesShouldRemove.push(event.bgimg);
              }
              console.log('******** remove files:', filesShouldRemove);
              fileUtl.removeFiles(filesShouldRemove, function (err, results) {
                saveOrUpdate(id, req, res);
              });
            }
          });
        })
      });
    });
  }

};
/**
 * 保存方法
 * @param id
 * @param req
 * @param res
 */
function saveOrUpdate(id, req, res) {
  if (!id) {
    req.body.channel = req.session.channelId;
    req.body.wechat = req.session.wechat._id || req.session.wechatId;
    var sign = new Sign(req.body);
    sign.save(function (err, result) {
      handleSaved(req, res, err, sign);
    });
  } else {
    // update
    Sign.findByIdAndUpdate(id, req.body, function (err, result) {
      handleSaved(req, res, err, sign);
    });
  }
}

/**
 * 修改活动信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  Sign.findById(id).populate('logo bgimg').exec(function (err, sign) {
    console.log(sign);
    if (sign == null) {
      req.flash('error', '此条记录已被删除');
      res.redirect('/activities/sign');
      return;
    }
    if (handleErr(req, err))
      res.render('activities/sign/signForm', {sign: sign});
    else
      res.redirect('/activities/sign');
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
  Sign.remove({'_id': {$in: ids}}, function (err, result) {
    if (err) {
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/activities/sign');
    }
  });
};

/**
 * 是否上线
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  var wechatId = req.session.wechat._id;
  var updata = {};
  Sign.find({'wechat': wechatId}, function (err, sign) {
    if (!err) {
      var ids = [];
      sign.forEach(function (e) {
        if (e._id != id && e.enabled) {
          ids.push(e._id);
        }
        if (e._id == id && e.enabled) {
          updata.enabled = false;
        } else {
          updata.enabled = true;
        }
      })
      Sign.update({'_id': {'$in': ids}}, {'enabled': false}, {}, function (err, info) {
        if (!err) {
          Sign.update({'_id': id}, updata, {}, function (err, info) {
            if (!err) {
              req.flash('success', '设置上线/下线成功！');
              res.redirect('/activities/sign');
            } else {
              req.flash('error', err);
              res.redirect('/activities/sign');
            }
          });
        } else {
          req.flash('error', err);
          res.redirect('/activities/sign');
        }
      });
    } else {
      req.flash('error', err);
      res.redirect('/activities/sign');
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
function handleSaved(req, res, err, sign) {
  if (err) {
    console.log(err);
    req.flash('error', '活动保存失败!' + err);
    res.render('activities/sign/signForm', {
      sign: sign == null ? new Sign() : sign
    });
  } else {
    req.flash('success', '站点保存成功!');
    res.redirect('/activities/sign');
  }
}

/**
 * 验证名称是否唯一
 * @param req
 * @param res
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  var wechatId = req.session.wechat._id;
  if (newName === oldName) {
    res.send('true');
  } else {
    Sign.count({'name': newName, 'wechat': wechatId}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};


/**
 * 列表
 * @param req
 * @param res
 */
exports.statList = function (req, res) {
  res.render('activities/sign/statSignList', {signId: req.params.id});
};
/**
 * 获取关卡列表
 * @param req
 * @param res
 */
exports.listDatatable = function (req, res) {

  var signId = req.params.id;
  var startAt = req.query.startAt;
  var query = {};
  query.sign = signId;
  if (startAt) {
    var op = startAt.split(" - ");
    var op1 = new Date(moment(op[0]));
    var op2 = new Date(moment(op[1]));
    query.createdAt = {$gte: op1, $lt: op2};
  }
  SignList.dataTable(req.query, {
    conditions: query
  }, function (err, data) {
    res.send(data);
  });
}


/**
 * 获取活动统计的列表 当天
 * @param req
 * @param res
 */
exports.getDataByDay = function (req, res) {
  var signId = req.params.id;
  var start = new Date(moment().format("YYYY/MM/DD 00:00:00"));
  var newTime = new Date(moment().format("YYYY/MM/DD HH:mm:ss"));
  var datas = {};
  datas.signNums = [];
  datas.finishNums = [];
  datas.times = [];
  var fn = function (datas, start) {
    var a = Date.parse(start);
    var b = Date.parse(newTime);
    if (a <= b) {
      var end = new Date(moment(start).add('hour', +1).format("YYYY/MM/DD HH:mm:ss"));
      getSignListCount(signId, start, end, function (err, data) {
        datas.signNums.push(data);
        datas.finishNums.push(data.finishNum);
        datas.times.push(moment(start).format("YYYY/MM/DD HH:mm:ss"));
        fn(datas, end);
      });
    } else {
      res.send(getResult(datas));
    }
  }
  fn(datas, start);

}

/**
 * 获取活动统计的列表 近七天
 * @param req
 * @param res
 */
exports.getDataByWeek = function (req, res) {
  var signId = req.params.id;
  var start = new Date(moment().add('days', -6).format("YYYY/MM/DD 00:00:00"));
  var newTime = new Date(moment().format("YYYY/MM/DD HH:mm:ss"));
  var datas = {};
  datas.signNums = [];
  datas.times = [];
  var fn = function (datas, start) {
    var a = Date.parse(start);
    var b = Date.parse(newTime);
    if (a <= b) {
      var end = new Date(moment(start).add('days', +1).format("YYYY/MM/DD 00:00:00"));
      getSignListCount(signId, start, end, function (err, data) {
        console.log("data================", data);
        datas.signNums.push(data);
        datas.times.push(moment(start).format("YYYY/MM/DD"));
        fn(datas, end);
      });
    } else {
      res.send(getResult(datas));
    }
  }
  fn(datas, start);

}
/**
 * 获取活动统计的列表  近30天
 * @param req
 * @param res
 */
exports.getDataByMonth = function (req, res) {
  var signId = req.params.id;
  var start = new Date(moment().add('days', -30).format("YYYY/MM/DD 00:00:00"));//开始时间
  var newTime = new Date(moment().format("YYYY/MM/DD HH:mm:ss"));//现在的时间用于比较时间，结束当前查询
  var datas = {};
  datas.signNums = [];
  datas.times = [];
  var fn = function (datas, start) {
    var a = Date.parse(start);
    var b = Date.parse(newTime);
    if (a <= b) {
      var end = new Date(moment(start).add('days', +1).format("YYYY/MM/DD 00:00:00"));//分段查询时间
      getSignListCount(signId, start, end, function (err, data) {
        datas.signNums.push(data);
        datas.times.push(moment(start).format("YYYY/MM/DD"));
        fn(datas, end);
      });
    } else {
      res.send(getResult(datas));
    }
  }
  fn(datas, start);

}

/**
 * 根据时间段获取参与数和通关人数
 * @param signId 答题闯关的id
 * @param start 开始时间
 * @param end 结束时间
 * @param done 回调函数
 */
function getSignListCount(signId, start, end, done) {
  var query = {};
  query.createdAt = {$gte: start, $lt: end};
  query.sign = signId;
  SignList.count(query, function (err, result) {
    done(err, result);
  });
}
/**
 * 组合数据
 * @param data
 * @returns {{}}
 */
function getResult(data) {
  var result = {};
  result.series = [];
  result.xAxis = [];
  if (data) {
    var serie2 = {
      name: "签到人数",
      type: 'line',
      data: data.signNums
    };
    result.series.push(serie2);
    result.xAxis = data.times;

  }
  result.legend = ["签到人数"];

  return result;
}
