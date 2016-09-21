/**
 * Created by danne on 2016-04-28.
 */
/**
 * 幸运九宫格游戏
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');
var validator = require('validator');
var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');
var Lucky9 = require('./lucky9.model');
var Activities = mongoose.model('Activities');


/**
 * 线下活动列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  res.render('activities/lucky9/lucky9List', {});
};

/**
 * 获取活动列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  Lucky9.dataTable(req.query, {conditions: {'wechat': req.session.wechat._id}}, function (err, data) {
    res.send(data);
  });
}

/**
 * 新建站点
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('activities/lucky9/lucky9Form', {lucky9: new Lucky9(),activity:new Activities()});
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
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'lucky9', false, function (fs) {
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
          Lucky9.findById(id, function (err, event) {
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
    var lucky9 = new Lucky9(req.body);
    lucky9.save(function (err, result) {
      handleSaved(req, res, err, lucky9);
    });
  } else {
    // update
    Lucky9.findByIdAndUpdate(id, req.body, function (err, result) {
      handleSaved(req, res, err, lucky9);
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
  Lucky9.findById(id).populate('logo bgimg activity').exec(function (err, lucky9) {
    console.log(lucky9);
    if (lucky9 == null) {
      req.flash('error', '此条记录已被删除');
      res.redirect('/activities/lucky9');
      return;
    }
    if (handleErr(req, err))
      res.render('activities/lucky9/lucky9Form', {lucky9: lucky9,activity:lucky9.activity});
    else
      res.redirect('/activities/lucky9');
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
  Lucky9.remove({'_id': {$in: ids}}, function (err, result) {
    if (err) {
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/activities/lucky9');
    }
  });
};

/**
 * 是否上线
 * @param req
 * @param res
 */
exports.online = function (req, res) {
  var id = req.params.id;
  Lucky9.findById(id).exec(function (err, lucky9) {
    if (err) {
      console.error(err);
      req.flash('error', '更新id{' + id + '}数据出错了.');
      return res.redirect('/activities/lucky9');
    }
    if (lucky9) {
      lucky9.update({$set: {online: !lucky9.online}}, {new: true}, function (err, l) {
        return res.redirect('/activities/lucky9');
      });
    } else {
      return res.redirect('/activities/lucky9');
    }
    // 上线，则
    //if (!online){
    //  Lucky9.update({'wechat': wechatId, _id: {$not: {$in: [lucky9._id]}}}, {$set: {online: false}}, {
    //    multi: true,
    //    new: true
    //  }, function (err, lucky9s) {
    //    console.log("************* 上线状态修改", lucky9s);
    //    if (err) {
    //      console.error(err);
    //      req.flash('error', '更新id{' + id + '}数据出错了.');
    //    }
    //    return res.redirect('/activities/lucky9');
    //  });
  });
};
/**
 * 激活
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  Lucky9.findById(id).exec(function (err, lucky9) {
    if (err) {
      console.error(err);
      req.flash('error', '更新id{' + id + '}数据出错了.');
      return res.redirect('/activities/lucky9');
    }
    if (lucky9) {
      lucky9.update({$set: {enabled: !lucky9.enabled}}, {new: true}, function (err, l) {
        return res.redirect('/activities/lucky9');
      });
    } else {
      return res.redirect('/activities/lucky9');
    }
    // 上线，则
    //if (!online){
    //  Lucky9.update({'wechat': wechatId, _id: {$not: {$in: [lucky9._id]}}}, {$set: {online: false}}, {
    //    multi: true,
    //    new: true
    //  }, function (err, lucky9s) {
    //    console.log("************* 上线状态修改", lucky9s);
    //    if (err) {
    //      console.error(err);
    //      req.flash('error', '更新id{' + id + '}数据出错了.');
    //    }
    //    return res.redirect('/activities/lucky9');
    //  });
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
function handleSaved(req, res, err, lucky9) {
  if (err) {
    console.log(err);
    req.flash('error', '活动保存失败!' + err);
    res.render('activities/lucky9/lucky9Form', {
      lucky9: lucky9 == null ? new Lucky9() : lucky9
    });
  } else {
    req.flash('success', '站点保存成功!');
    res.redirect('/activities/lucky9');
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
    Lucky9.count({'name': newName, 'wechat': wechatId}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};
