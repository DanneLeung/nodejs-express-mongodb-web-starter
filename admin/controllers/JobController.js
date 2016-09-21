/**
 * Created by xingjie201 on 2016/2/19.
 * 供应商的Controller
 */

var mongoose = require('mongoose');
var config = require('../../config/config');
var Job = mongoose.model('Job');
var ObjectId = mongoose.Types.ObjectId;

/*
 * list
 */
exports.list = function (req, res) {
  res.render('system/job/jobList');
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
  Job.dataTable(req.query, function (err, data) {
    res.send(data);
  });
};
/**
 * 添加定时任务的配置
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('system/job/jobForm', {
    viewType: "add",
    job: new Job()
  })
};

/**
 * 修改定时任务的配置
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  Job.findById(id, function (err, job) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/system/job/list');
    } else {
      res.render('system/job/jobForm', {
        viewType: "edit",
        job: job
      })
    }
  });
};

/**
 * 删除定时任务的配置
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Job.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/system/job/list');
    }
  });

};

/**
 * 检查定时任务的配置名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    Job.count({name: newName}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  var id = req.body.id;
  req.body.configAt = Date.now();
  console.log("**************** job update ", req.body);
  Job.findByIdAndUpdate({'_id': id}, req.body, {new: true, upsert: true}, function (err, result) {
    //console.log("************** job updated ", result);
    if (err) {
      console.error(err);
      req.flash('error', err.message);
    } else {
      req.flash('success', '数据修改成功!');
    }
    res.redirect('/system/job/list');
  });

}

/**
 * 是否激活
 * @param req
 * @param res
 */
exports.enabled = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var msg = "";
  Job.findOne({'_id': id}, function (err, job) {
    if (!err) {
      if (job.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Job.update({'_id': id}, updata, {}, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/system/job/list');
        }
      });
    }
  });
};

/**
 * 修改任务的指令
 * @param req
 * @param res
 */
exports.control = function (req, res) {
  var id = req.params.id;
  var command = req.params.command;
  var updata = {};
  Job.findOne({'_id': id}, function (err, job) {
    if (!err) {
      if (command == "start") { //开始的时候需要修改运行时间 和状态
        updata.lastTime = new Date();
        updata.status = "running";
      } else { //修改状态
        updata.status = "stopped";
      }
      updata.control = command;
      Job.update({'_id': id}, updata, {}, function (err, info) {
        if (!err) {
          req.flash('success', command == "start" ? "任务开始运行" : "任务停止运行");
          res.redirect('/system/job/list');
        } else {
          req.flash('errors', err);
          res.redirect('/system/job/list');
        }
      });
    } else {
      req.flash('errors', err);
      res.redirect('/system/job/list');
    }
  });
};

