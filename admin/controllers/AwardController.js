/**
 * 站点管理
 */
var mongoose = require('mongoose');
var config = require('../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

var moment = require('moment');

var Award = mongoose.model('Award');
var AwardItem = mongoose.model('AwardItem');
var fileUtl = require('../../util/file');
var excalUtil = require('../../util/excalUtil');
var imgUtil = require('../../util/imgutil');

var _ = require('lodash');

/**
 * 站点列表
 * @param req
 * @param res
 */
exports.list = function (req, res) {
  res.render('activities/award/list');
};
/**
 * 获取奖项列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  Award.dataTable(req.query, {
    conditions: {
      'channel': req.session.channelId,
      wechat: req.session.wechat._id
    }
  }, function (err, data) {
    res.send(data);
  });
}


/**
 * 新建站点
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('activities/award/form', {award: new Award()});
};

/**
 * 修改奖项信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  Award.findById(id, function (err, award) {
    if (handleErr(req, err))
      res.render('activities/award/form', {award: award});
    else
      res.redirect('/activities/award/list');
  })
};

/**
 * 删除奖项信息
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  AwardItem.remove({'award': {$in: ids}}, function (err, item) {  //先删除该奖品池的奖品明细，再删除奖品池
    if (!err) {
      Award.remove({'_id': {$in: ids}}, function (err, result) {
        if (err) {
          console.log(err);
          req.flash('error', err);
        } else {
          req.flash('success', '数据删除成功!');
        }
        res.redirect('/activities/award/list');
      });
    } else {
      req.flash('error', err);
      res.redirect('/activities/award/list');
    }
  })
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
  req.body.channel = req.session.channelId;
  // handle checkbox unchecked.

  if (!req.files || req.files.length <= 0) {
    if (!id) {
      req.body.wechat = req.session.wechat;
      var award = new Award(req.body);
      award.save(function (err, newAward) {
        handleSaved(req, res, err, award, 'add');
      });
    } else {
      // update
      Award.findByIdAndUpdate(id, req.body, function (err, award) {
        handleSaved(req, res, err, (err ? req.body : award), 'edit');
      });
    }
  } else {
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'award', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
      imgUtil.thumbnail(fs, 200, function (ffs) {
        console.log("********** files thumbnailed: " + JSON.stringify(ffs));
        fileUtl.normalize(ffs, function (err, files) {
          if (err) req.flash('warning', '文件保存时发生错误');
          if (files) {
            console.log('files------------------------->', files);
            req.body.pic = files[0].thumb;
          }
          if (!id) {
            req.body.wechat = req.session.wechat;
            var award = new Award(req.body);
            award.save(function (err, newAward) {
              handleSaved(req, res, err, award, 'add');
            });
          } else {
            // update
            Award.findByIdAndUpdate(id, req.body, function (err, award) {
              handleSaved(req, res, err, (err ? req.body : award), 'edit');
            });
          }
        })
      });
    });
  }
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
function handleSaved(req, res, err, award, type) {
  if (err) {
    console.log(err);
    if (err.code == '11000') {
      req.flash('error', '名称和标识不可同时重复');
      return res.redirect('/activities/award/list');
    } else {
      req.flash('error', '奖项保存失败!' + err);
      return res.render('activities/award/form', {
        viewType: type,
        award: award
      });
    }
  } else {
    req.flash('success', '奖项保存成功!');
    return res.redirect('/activities/award/list');
  }
}


/**
 * 是否使用该奖项
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Award.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已设置为可使用"
      } else {
        updata.enabled = true;
        msg = "已设置为不可使用"
      }
      Award.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/activities/award/list');
        }
      });
    } else {
      console.error(err);
    }
  });
};
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
    Award.count({'name': newName, channel: req.session.channelId}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 根据Id获取奖品池
 * @param req
 * @param res
 */
exports.returnAward = function (req, res) {
  var awardId = req.params.awardId;
  Award.findOne({'_id': awardId}, function (err, award) {
    if (award) {
      res.send(award);
    } else {
      res.send(null);
    }
  });
};

/**
 * 根据Id获取奖品池
 * @param req
 * @param res
 */
exports.itemLis = function (req, res) {
  res.render('activities/award/awardItemList', {awardId: req.params.awardId});
};

/**
 * 获取奖项列表
 * @param req
 * @param res
 */
exports.datatableItem = function (req, res) {
  var no = req.query.no || req.body.no;
  var query = {};
  query.award = req.params.awardId;
  if (no) {
    query.no = {$regex: no};
  }
  AwardItem.dataTable(req.query, {conditions: query}, function (err, data) {
    res.send(data);
  });
}


/**
 * 导入奖品的明细信息
 * @param req
 * @param res
 */
exports.importItem = function (req, res) {

  var awardId = req.body.awardId || req.params.awardId;
  var channel = req.user.channelId;
  fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'award', true, function (files) {
    if (files) {
      var data = excalUtil.readXlsx(files[0].path, 1);
      var obj = excalUtil.readXls(files[0].path, 1);
      if (!obj || !obj.length) {
        req.flash('error', "读入");
        return handel(res, couponId);
      }
      console.log("*************** read excel end ...");
      var data = obj[0].data;
      if (data == null) {
        req.flash('error', "导入文件格式不正确");
      } else {
        console.log("ddddddddddddddddddd==========",data);
        impordAwardItem(data, channel, awardId);
        req.flash('success', "数据导入成功！");
      }
      res.redirect('/activities/award/item/list/' + awardId);
    }
  })
}

/**
 * 导入未获取的券信息
 * @param data 券信息的内容
 * @param channel 渠道
 */
function impordAwardItem(data, channel, awardId) {
  var i = 0;
  var no = -1;
  var code = -1;
  var type = -1;
  var start = -1;
  var end = -1;
  var status = -1;
  var price = -1;
  data.forEach(function (e) {
    if (i == 0) {
      var index = 0;
      for(var a in e){
        switch (e[a]) {
          case "卡号":
            no = index;
            break;
          case "卡密":
            code = index;
            break;
          case "卡类型":
            type = index;
            break;
          case "生效日期":
            start = index;
            break;
          case "失效日期":
            end = index;
            break;
          case "状态":
            status = index;
            break;
          case "面值":
            price = index;
            break;
          default:
            break;
        }
        index += 1;
      }
    } else {
      if (!e[no] && !e[code]) {
        AwardItem.count({award: awardId, taken: false}, function (err, result) {
          if (result > 0) {
            Award.update({_id: awardId}, {'stock': result}, function (err, award) {
              if (err) {
                console.log("err============", err, award);
              }
            });
          }
        });
        return false;
      }
      //过滤掉已经导入的券信息
      AwardItem.count({award: awardId, no: no == -1 ? "" : e[no]}, function (err, result) {
        if (result == 0) {
          //创建券的信息
          var item = new AwardItem({
            no: no == -1 ? "" : e[no],
            code: code == -1 ? "" : e[code],
            type: type == -1 ? "" : e[type],
            startTime: start == -1 ? new Date() : new Date(e[start]),
            endTime: end == -1 ? "" : new Date(e[end]),
            status: status == -1 ? "" : e[status],
            price: price == -1 ? "" : e[price],
            award: awardId,
            channel: channel
          });
          item.save(function (err, result) {
            if (err) {
              console.log("err===", err);
            }
          })
        } else {
          console.log("err===", err);
        }
      });
    }
    i += 1;
  })

}

/**
 * 获取所有可以使用的奖品项
 * @param req
 * @param res
 */
exports.getAwards = function (req, res) {
  Award.find({
    'enabled': true,
    'channel': req.session.channelId,
    wechat: req.session.wechat._id
  }, function (err, award) {
    if (!err) {
      res.send(award);
    } else {
      res.send(null);
    }
  });
};
/**
 * 获取关卡列表
 * @param req
 * @param res
 */
exports.export = function (req, res) {

  var awardId = req.params.awardId;
  var label = "卡号" + "," + "卡密" + "," + "卡类型" + "," + "生效日期" + "," + "失效日期" + "," + "状态" + "\n";
  var query = {};
  if (awardId) {
    query.award = awardId;
  }
  //query.toVoid = false;
  query.status = '未使用';
  query.taken = false;

  console.log("query=======================", query);

  label = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(label)]);//处理乱码的格式
  getData(query, function (err, data) {
    if (data) {
      label += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(data)]);//处理乱码的格式
    } else {
      console.log("err==========", err);
    }
    var filename = "awardItems" + moment().format("YYYYMMDDhhmmss") + ".csv";  //生成文件名
    res.setHeader("Content-Disposition", "attachment; filename=" + filename);
    res.writeHead(200, {"Content-Type": "text/csv"});
    res.end(label);
  })
}


/**
 * 获取未使用的奖品信息
 * @param query 查询数据的条件
 * @param callback
 */
function getData(query, callback) {
  //var
  AwardItem.find(query).sort({'no': -1}).exec(function (err, items) {
    if (items && items.length > 0) {
      var bufs = "";
      for (var i in items) {
        var e = items[i];
        AwardItem.update({_id: e._id}, {toVoid: true}).exec();
        var start = moment(e.startTime).format("YYYY-MM-DD HH:mm:ss");
        var end = moment(e.endTime).format("YYYY-MM-DD HH:mm:ss");
        var code = e.code + "";
        bufs += e.no + "\t," + code + "\t," + e.type + "," + start + "\t," + end + "\t," + e.status + "\n";
      }
      return callback(null, bufs);
    } else {
      return callback(err, null);
    }
  });
}
