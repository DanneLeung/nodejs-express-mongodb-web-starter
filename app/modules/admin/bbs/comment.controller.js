/**
 * Created by danne on 2016/3/11.
 */
/**
 * Created by ZhangXiao on 2015/6/11.
 */
var mongoose = require('mongoose');
var config = require('../../../../config/config');

var Comment = mongoose.model('Comment');

exports.list = function (req, res) {
  res.render('admin/bbs/comment/commentList', {});
};

exports.datatable = function (req, res) {
  Comment.dataTable(req.query, function (err, data) {
    res.send(data);
  });
};

exports.view = function (req, res) {
  var id = req.body.id || req.params.id;
  Comment.findById(id, (err, comment) => {
    res.render('admin/bbs/comment/commentForm', {
      viewType: "view"
    });
  });
};

exports.block = function (req, res) {
  var id = req.params.id;
  Comment.toggleBoolField(id, 'blocked', (err, comment) => {
    if(err) console.error(err);
    if(err || !comment) {
      req.flash('error', '数据更新时发生错误，请确认后重试!');
    } else {
      req.flash('success', (comment.blocked ? '屏蔽' : '取消屏蔽') + '操作成功!');
    }
    res.redirect('/admin/bbs/comment');
  });
};

exports.hot = function (req, res) {
  var id = req.params.id;
  Comment.toggleBoolField(id, 'hot', (err, comment) => {
    if(err) console.error(err);
    if(err || !comment) {
      req.flash('error', '数据更新时发生错误，请确认后重试!');
    } else {
      req.flash('success', (comment.hot ? '设置热帖' : '取消热帖') + '操作成功!');
    }
    res.redirect('/admin/bbs/comment');
  });
};

exports.save = function (req, res) {
  var id = req.body.id;
  if(!id) {
    var setting = new Comment(req.body);
    setting.save(function (err, result) {
      if(err) {
        req.flash('error', '添加失败!');
      } else {
        req.flash('success', '添加成功!');
      }
      res.redirect('/admin/bbs/comment');
    });
  } else {
    // update
    Comment.update({ '_id': id }, req.body, function (err, result) {
      if(err) {
        req.flash('error', '保存失败!');
      } else {
        req.flash('success', '保存成功!');
      }
      res.redirect('/admin/bbs/comment');
    });
  }
};
exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  if(ids) {
    ids = ids.split(',');
    Comment.remove({ '_id': { $in: ids } }, function (err, result) {
      if(err) {
        console.log(err);
        req.flash('error', err);
      } else {
        req.flash('success', '数据删除成功!');
        res.redirect('/admin/bbs/comment');
      }
    });
  } else {
    req.flash('warning', '没有选中要删除的数据!');
    res.redirect('/admin/bbs/comment');
  }
};