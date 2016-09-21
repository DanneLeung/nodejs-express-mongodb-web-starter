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

var Event = require('./event.model');
var EventApply = require('./event.apply.model');
var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');


/**
 * 线下活动列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  res.render('activities/event/eventList', {});
};

/**
 * 获取活动列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  Event.dataTable(req.query, {conditions: {'channel': req.session.channelId}}, function (err, data) {
    res.send(data);
  });
}

/**
 * 新建站点
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('activities/event/eventForm', {event: new Event()});
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  if (typeof req.body.label === 'undefined' || req.body.label.length === 0) {
    req.flash('error', '表单字段为必须条件');
    res.redirect('/activities/event/add');
    return;
  }
  var id = req.body.id;
  var saveOrUpdate = function (id, req, callback) {
    if (!id) {
      var event = new Event(req.body);
      event.save(function (err, result) {
        if (callback) return callback(err, result);
      });
    } else {
      // update
      Event.findByIdAndUpdate(id, req.body, function (err, result) {
        if (callback) return callback(err, result);
      });
    }
  };

  var handleResult = function (err, result) {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/activities/event/add');
    }
    req.flash('success', '数据保存成功!');
    return res.redirect('/activities/event');
  };

  var formNum = req.body.label.length;
  var id = req.body.id;
  req.body.channel = req.session.channelId;
  // handle checkbox unchecked.Å
  if (!req.body.enabled) req.body.enabled = false;
  //处理时间范围
  var time = req.body.time;
  if (time) {
    var times = time.split(' - ');
    console.log("$$$$$$$$$$$$ 活动时间：" + times);
    if (times.length > 1) {
      req.body.startTime = moment(times[0]);
      req.body.endTime = moment(times[1]);
    }
  } else {
    req.body.startTime = null;
    req.body.endTime = null;
  }
  var formfield = [];
  for (var i = 0; i < formNum; i++) {
    var range = [], other = 1;
    if (req.body.range[i].length > 0 && req.body.range[i].indexOf('-') >= 0) {
      range = req.body.range[i].split('-');
    }
    if (req.body.range[i].length > 0 && req.body.range[i].indexOf(' ') >= 0) {
      range = req.body.range[i].split(' ');
      other = 0;
    }
    for (var j = 0; j < range.length; j++) {
      if (range[j].length === 0 && other === 0) {
        range.splice(j, 1);
      }
    }
    formfield.push({
      label: validator.trim(req.body.label[i]),
      name: validator.trim(req.body.fieldname[i]),
      type: req.body.type[i],
      required: req.body['required' + req.body.fieldname[i]] === 'on' ? 1 : 0,
      unique: req.body['unique' + req.body.fieldname[i]] === 'on' ? 1 : 0,
      range: range,
      other: other
    });
  }

  delete req.body.label;
  delete req.body.fieldname;
  delete req.body.type;
  delete req.body.range;
  req.body.formfield = formfield;

  req.body.wechat = req.session.wechat._id;
  if (!req.files || req.files.length <= 0) {
    saveOrUpdate(id, req, handleResult);
  } else {
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'event', false, function (fs) {
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
          Event.findById(id, function (err, event) {
            console.log('******** event should be updated:', event);
            // queue files that should be removed.
            var filesShouldRemove = [];
            if (!event) {
              saveOrUpdate(id, req, handleResult);
            } else {
              if (req.body.logo && event.logo) {
                //文件替换
                filesShouldRemove.push(event.logo);
              }
              console.log('******** remove files:', filesShouldRemove);
              fileUtl.removeFiles(filesShouldRemove, function (err, results) {
                saveOrUpdate(id, req, handleResult);
              });
            }
          });
        })
      });
    });
  }

};

/**
 * 修改活动信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  Event.findById(id).populate('logo bgimg').exec(function (err, event) {
    console.log(event);
    if (event == null) {
      req.flash('error', '此条记录已被删除');
      res.redirect('/activities/event');
      return;
    }
    if (handleErr(req, err))
      res.render('activities/event/eventForm', {event: event});
    else
      res.redirect('/activities/event');
  })
};

/**
 * 复制活动信息
 * @param req
 * @param res
 */
exports.copy = function (req, res) {
  var id = req.params.id;
  Event.findById(id, function (err, event) {
    if (!err) {
      var copyEvent = new Event({
        channel: event.channel, //所属渠道
        wechat: event.wechat, //使用的微信号
        type: event.type,//活动类型
        code: event.code,//代号
        name: event.name + " 副本",//名称
        description: event.description,//说明
        text: event.text,//文案
        backgroup: event.backgroup,//
        logo: event.logo,//活动logo，分享时使用
        url: event.url,//活动入口URL
        qrcode: event.qrcode,//活动入口URL二维码
        keywords: event.keywords,//关键字
        formfield: event.formfield,//表单字段
        location: event.location,//地址
        startTime: event.startTime,//开始时间
        endTime: event.endTime,//结束时间
        limit: event.limit,//限制人数
        appliedCount: event.appliedCount,//已经报名人数
        signedCount: event.signedCount,//签到人数
        readCount: event.readCount,//阅读数
        shareCount: event.shareCount,//分享数
        enabled: event.enabled//激活
      });
      copyEvent.save(function (err, newEvent) {
        if (!err) {
          req.flash('success', '数据复制成功!');
        } else {
          req.flash('error', err);
        }
        res.redirect('/activities/event');
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
  Event.remove({'_id': {$in: ids}}, function (err, result) {
    if (err) {
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/activities/event');
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
  var updata = {};
  var options = {};
  var msg = "";
  Event.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已下线"
      } else {
        updata.enabled = true;
        msg = "已上线"
      }
      Event.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/activities/event');
        }
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
function handleSaved(req, res, err, event) {
  if (err) {
    console.log(err);
    req.flash('error', '活动保存失败!' + err);
    res.render('activities/event/eventForm', {
      event: event == null ? new Event : event
    });
  } else {
    var roleId = req.body.roles;
    req.flash('success', '站点保存成功!');
    res.redirect('/activities/event');
  }
}
