/**
 * Created by danne on 2016/3/11.
 */
/**
 * Created by ZhangXiao on 2015/6/11.
 */
var mongoose = require('mongoose');
var config = require('../../../../config/config');

var Setting = mongoose.model('Setting');

exports.list = function (req, res) {
  res.render('admin/system/setting/settingList', {});
};

exports.dataTable = function (req, res) {
  Setting.dataTable(req.query, function (err, data) {
    res.send(data);
  });
};

exports.add = function (req, res) {
  res.render('admin/system/setting/settingForm', {
    viewType: "add"
  });
};

exports.checkName = function (req, res) {
  var newKey = req.query.key;
  var oldKey = req.query.oldKey;
  console.log("newKey ======================>" + newKey);
  console.log("oldKey ======================>" + oldKey);
  if(newKey === oldKey) {
    res.send('true');
  } else {
    Setting.count({ key: newKey }, function (err, result) {
      if(result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

exports.save = function (req, res) {
  var id = req.body.id;
  if(!id) {
    var setting = new Setting(req.body);
    setting.save(function (err, result) {
      if(err) {
        req.flash('error', '添加失败!');
      } else {
        req.flash('success', '添加成功!');
      }
      res.redirect(req.session.contextRoot + '/admin/system/setting');
    });
  } else {
    // update
    Setting.update({ '_id': id }, req.body, function (err, result) {
      if(err) {
        req.flash('error', '保存失败!');
      } else {
        req.flash('success', '保存成功!');
      }
      res.redirect(req.session.contextRoot + '/admin/system/setting');
    });
  }
};

exports.edit = function (req, res) {
  var id = req.params.id;
  Setting.findOne({ '_id': id }, function (err, setting) {
    if(err) {
      res.redirect(req.session.contextRoot + '/admin/system/setting');
    } else {
      res.render('admin/system/setting/settingForm', {
        viewType: "edit",
        setting: setting
      })
    }
  });
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Setting.remove({ '_id': ids }, function (err, result) {
    if(err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect(req.session.contextRoot + '/admin/system/setting');
    }
  });
};