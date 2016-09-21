/**
 * 线下关卡报名
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');
var Channel = mongoose.model('Channel');

var QuizRun = require('./quiz.run.model');
var Award = mongoose.model('Award');

var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');

/**
 * 线下关卡列表
 * @param req
 * @param res
 */
exports.list = function (req, res) {
  res.render('activities/quiz/runList');
};

/**
 * 获取关卡列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  QuizRun.dataTable(req.query, {
    conditions: {
      channel: req.session.channelId,
      wechat: req.session.wechatId
    }
  }, function (err, data) {
    res.send(data);
  });
}

/**
 * 新建关卡
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('activities/quiz/runForm', {quiz: new QuizRun()});
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {

  var id = req.body.id;
  req.body.channel = req.session.channelId;
  req.body.wechat = req.session.wechatId;
  var awardId = req.body.award;
  console.log(awardId);
  // handle checkbox unchecked.Å

  var saveOrUpdate = function (id, req) {
    Award.findOne({_id: awardId}, function (err, award) {
      console.log(award);
      req.body.award = award;
      if (!id) {
        var quiz = new QuizRun(req.body);
        quiz.save(function (err, quiz) {
          handleSaved(req, res, err, quiz);
        });
      } else {
        // update
        QuizRun.findByIdAndUpdate(id, req.body, function (err, quiz) {
          handleSaved(req, res, err, (err ? req.body : quiz));
        });
      }
    });
  };

  if (!req.files || req.files.length <= 0) {
    saveOrUpdate(id, req);
  } else {
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'logoPic', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
      imgUtil.thumbnail(fs, 200, function (ffs) {
        console.log("********** files thumbnailed: " + JSON.stringify(ffs));
        fileUtl.normalize(ffs, function (err, files) {
          if (err) req.flash('warning', '文件保存时发生错误');
          console.log("********** files saved: " + JSON.stringify(files));
          // 返回的文件path为URL路径
          if (files) {
            req.body.logoPic = files[0].thumb;
          }
          // 更新时处理替换文件情况，新文件保存后旧文件删除
          saveOrUpdate(id, req);
        })
      });
    });
  }

};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.levelSave = function (req, res) {

  var id = req.body.runId;
  var level = req.body.level;
  var view = req.body.view;

  getByIdRun(id, function (err, run) {
    // update
    if (run) {
      if (view == 'add') {
        mergeArray(req, run, -1, function (req) {
          QuizRun.findByIdAndUpdate(id, run, function (err, quiz) {
            if (err) {
              req.flash('error', '关卡保存失败!' + err);
            } else {
              req.flash('success', '关卡保存成功!');
            }
            res.redirect('/activities/quiz/run/searchLevel/' + id);
          });
        })
      } else {
        mergeArray(req, run, level, function (req) {
          QuizRun.findByIdAndUpdate(id, run, function (err, quiz) {
            if (err) {
              req.flash('error', '关卡保存失败!' + err);
            } else {
              req.flash('success', '关卡保存成功!');
            }
            res.redirect('/activities/quiz/run/searchLevel/' + id);
          });
        })
      }
    }

  })
};

function mergeArray(req, run, level, callback) {
  var awardId = req.body.award;
  Award.findOne({_id: awardId}, function (err, award) {
    if (award) {
      if (level == -1) {
        var b = {};
        level = req.body.level - 1;
        b.level = req.body.level;
        b.levelName = req.body.levelName;
        b.second = req.body.second;
        b.award = award;
        b.randNum = req.body.randNum;
        b.score = req.body.score;
        b.cancellable = req.body.cancellable ? req.body.cancellable : false;
        b.allPass = req.body.allPass ? req.body.allPass : false;
        b.minLevel = req.body.minLevel;
        b.maxLevel = req.body.maxLevel;
        b.awardDesc = req.body.awardDesc;
        run.levels.splice(level, 0, b);
      } else {
        level = level - 1;
        run.levels[level].level = req.body.level;
        run.levels[level].levelName = req.body.levelName;
        run.levels[level].second = req.body.second;
        run.levels[level].award = award;
        run.levels[level].randNum = req.body.randNum;
        run.levels[level].score = req.body.score;
        run.levels[level].cancellable = req.body.cancellable ? req.body.cancellable : false;
        run.levels[level].allPass = req.body.allPass ? req.body.allPass : false;
        run.levels[level].minLevel = req.body.minLevel;
        run.levels[level].maxLevel = req.body.maxLevel;
        run.levels[level].awardDesc = req.body.awardDesc;
      }
      callback(req)
    }
  })
}

/**
 * 修改关卡信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  QuizRun.findById(id, function (err, quiz) {
    if (quiz == null) {
      req.flash('error', '此条记录已被删除');
      console.log("id============================", id);
      res.redirect('/activities/quiz/run/list');
    } else {
      if (handleErr(req, err)) {
        console.log("quiz levels============", quiz.levels);
        res.render('activities/quiz/runForm', {quiz: quiz});
      }
      else {
        res.redirect('/activities/quiz/run/list');
      }
    }
  })
};

/**
 * 删除关卡信息
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  QuizRun.remove({'_id': {$in: ids}}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/activities/quiz/run/list/');
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
  QuizRun.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      QuizRun.update({'_id': id}, updata, options, function (err, re) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/activities/quiz/run/list');
        }
      });

    }
  });
};

/**
 * 获取闯关信息中的关卡
 * @param req
 * @param res
 */
exports.getLevel = function (req, res) {
  var id = req.params.id;
  getByIdRun(id, function (err, info) {
    if (!err) {
      res.send(info.levels);
    } else {
      res.send([]);
    }
  });
};


/**
 * 根据id获取关卡的信息
 * @param req
 * @param res
 */
exports.searchLevel = function (req, res) {
  var id = req.params.id;
  getByIdRun(id, function (err, run) {
    if (!err) {
      res.render('activities/quiz/levelList', {levels: run.levels, runId: id});
    } else {
      req.flash('error', err);
      res.redirect('/activities/quiz/run/list');
    }
  });
};

/**
 * 根据id获取关卡的信息
 * @param req
 * @param res
 */
exports.editLevel = function (req, res) {
  var id = req.params.id;
  var index = req.params.index;
  getByIdRun(id, function (err, run) {
    if (!err) {
      res.render('activities/quiz/levelForm', {
        level: run.levels[index - 1],
        runId: id,
        view: "edit",
        levelNum: index,
        activityId: run.activity
      });
    } else {
      req.flash('error', err);
      res.redirect('/activities/quiz/run/searchLevel/' + id);
    }
  });
};

/**
 * 根据id删除关卡的信息
 * @param req
 * @param res
 */
exports.delLevel = function (req, res) {
  var id = req.params.id;
  var index = req.params.index;
  getByIdRun(id, function (err, run) {
    if (!err) {
      run.levels.splice(index, 1);
      QuizRun.findByIdAndUpdate(id, run, function (err, quiz) {
        if (err) {
          req.flash('error', '关卡删除失败!' + err);
        } else {
          req.flash('success', '关卡删除成功!');
        }
        res.redirect('/activities/quiz/run/searchLevel/' + id);
      });
    } else {
      req.flash('error', err);
      res.redirect('/activities/quiz/run/searchLevel/' + id);
    }
  });
};

/**
 * 根据id删除关卡的信息
 * @param req
 * @param res
 */
exports.statList = function (req, res) {
  var id = req.params.id;
  var index = req.params.index;
  getByIdRun(id, function (err, run) {
    if (!err) {
      run.levels.splice(index, 1);
      QuizRun.findByIdAndUpdate(id, run, function (err, quiz) {
        if (err) {
          req.flash('error', '关卡删除失败!' + err);
        } else {
          req.flash('success', '关卡删除成功!');
        }
        res.redirect('/activities/quiz/run/searchLevel/' + id);
      });
    } else {
      req.flash('error', err);
      res.redirect('/activities/quiz/run/searchLevel/' + id);
    }
  });
};

/**
 * 根据id跳转到编辑框中
 * @param req
 * @param res
 */
exports.addLevel = function (req, res) {
  var id = req.params.id;
  getByIdRun(id, function (err, run) {
    if (!err) {
      if (run.levels.length < run.levelNum) {
        var levelNum = getIndex(run.levels);
        res.render('activities/quiz/levelForm', {
          level: {},
          runId: id,
          view: "add",
          levelNum: levelNum != false ? levelNum : (run.levels.length + 1),
          activityId: run.activity
        });
      } else {
        req.flash('error', "该闯关游戏的关卡已经建立完成！");
        res.redirect('/activities/quiz/run/searchLevel/' + id);
      }
    } else {
      req.flash('error', err);
      res.redirect('/activities/quiz/run/searchLevel/' + id);
    }
  });
};
function getIndex(arr) {
  var len = arr.length;
  var levels = [];
  for (var i = 0; i < len; i++) {
    levels.push(arr[i].level);
  }
  for (var i = 0; i < len; i++) {
    var a = i + 1;
    console.log("contains=========", a.levels)
    if (!contains(levels, a)) {
      return a;
    }
  }
  return false;
}

/**
 * 数组元素的验证是否存在
 * @param arr
 * @param obj
 * @returns {boolean}
 */
function contains(arr, obj) {
  var i = arr.length;
  while (i--) {
    if (arr[i] == obj) {
      return true;
    }
  }
  return false;
}

/**
 * 根据Id查询闯关信息
 * @param id
 * @param callback
 */
function getByIdRun(id, callback) {
  QuizRun.findOne({'_id': id}, function (err, run) {
    callback(err, run);
  });
}

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
function handleSaved(req, res, err, quiz) {
  console.log(quiz);
  if (err) {
    console.log(err);
    req.flash('error', '关卡保存失败!' + err);
    res.render('activities/quiz/runForm', {
      quiz: quiz == null ? new QuizRun() : quiz
    });
  } else {
    req.flash('success', '关卡保存成功!');
    res.redirect('/activities/quiz/run/list');
  }
}
