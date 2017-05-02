/**
 * Created by xingjie201 on 2016/2/19.
 * 帖子的Controller
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var config = require('../../../../config/config');
var moment = require('moment');
var async = require('async');

var Node = mongoose.model('Node');
var Topic = mongoose.model('Topic');
var Comment = mongoose.model('Comment');
var WechatFans = mongoose.model('WechatFans');

exports.nodes = function (req, res, next) {
  Node.enabledNodes((nodes) => {
    if(!nodes) nodes = [];
    res.locals.nodes = nodes;
    return next();
  });
}

exports.fans = function (req, res) {
  var q = req.body.q || req.query.q || req.params.q;
  WechatFans.forSelect2(q, (datas) => {
    res.status(200).send(datas);
  });
};
/*
 * list
 */
exports.list = function (req, res) {
  var node = req.params.node || req.query.node;
  var offset = parseInt(req.params.offset || req.query.offset);
  var limit = parseInt(req.params.limit || req.query.limit);
  var dateStart = req.query.dateStart || req.body.dateStart;
  var dateEnd = req.query.dateEnd || req.body.dateEnd;
  var fans = req.query.fans || req.body.fans;
  var query = {
    blocked: false,
  };

  if(node) query.node = node;
  if(fans) query.fans = fans;

  if(dateStart) {
    if(!query.createdAt) query.createdAt = {};
    var d = moment(dateStart, 'YYYY-MM-DD HH:mm');
    var start = d.startOf('day').toDate();
    query.createdAt.$gte = start;
  }
  if(dateEnd) {
    if(!query.createdAt) query.createdAt = {};
    var d = moment(dateEnd, 'YYYY-MM-DD HH:mm');
    var end = d.endOf('day').toDate();
    query.createdAt.$lte = end;
  }
  if(!offset) offset = 0;
  if(!limit) limit = 10;
  console.log(" >>>>>>>>>>>>>>>>>>>> query ", query);
  Topic.topicsWithNodeWithTop(query, offset, limit, (total, topics) => {
    res.render('admin/bbs/topic/topicList', { topics: topics, node: node, dateStart: dateStart, dateEnd: dateEnd, total: total, offset: offset, limit: limit });
  });
};

exports.list2 = function (req, res) {
  res.render('admin/bbs/topic/topicList2');
};

/*role list table json datasource*/
exports.datatable = function (req, res) {
  Topic.dataTable(req.query, {
    conditions: {}
  }, function (err, data) {
    res.send(data);
  });
};

/**
 * 修改帖子信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;
  Topic.findOne({
    '_id': id
  }, function (err, topic) {
    if(err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/admin/bbs/topic');
    } else {
      res.render('admin/bbs/topic/topicForm', {
        topic: topic
      });
    }
  });
};

/**
 * 添加帖子信息
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('admin/bbs/topic/topicForm', {
    topic: new Topic()
  });
};

/**
 * 回复帖子
 */
exports.newComment = function (req, res) {
  var topicid = req.body.topicid || req.params.topicid;
  var user = req.user || req.session.user;
  Comment.newComment(topicid, user, user ? user.fans : null, req.body.content, [], (err, comment) => {
    if(err) {
      console.error(err);
      res.status(200).json({ err: 1, msg: "评论回复帖子不成功，发生错误!" });
    } else {
      res.status(200).json({ err: 0, msg: "评论回复帖子成功!", comment: comment });
    }
  });
};

/**
 * 是否激活帖子
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Topic.findOne({
    '_id': id
  }, function (err, info) {
    if(!err) {
      if(info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用";
      } else {
        updata.enabled = true;
        msg = "已激活";
      }
      Topic.update({
        '_id': id
      }, updata, options, function (err, info) {
        if(!err) {
          req.flash('success', msg);
          res.redirect('/admin/bbs/topic');
        }
      });
    }
  });
};
/**
 * 删除帖子
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var id = req.body.id || req.params.id || req.query.id;
  Topic.remove({
    '_id': id
  }, function (err, result) {
    if(err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/admin/bbs/topic');
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
  req.body.user = req.user;
  if(!id) {
    var user = new Topic(req.body);
    console.log("user======================>>>>>>>>>>>>>>>>", user);
    user.save(function (err, result) {
      console.log("err======================>>>>>>>>>>>>>>>>", err);
      if(err) {
        req.flash('error', err);
      } else {
        req.flash('success', '数据保存成功!');
      }
      res.redirect('/admin/bbs/topic');
    });
  } else {
    // update
    Topic.update({
      '_id': id
    }, req.body, function (err, result) {
      if(err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      res.redirect('/admin/bbs/topic');
    });
  }
};

/**
 * 帖子置顶
 * @param req
 * @param res
 */
exports.top = function (req, res) {
  var id = req.params.id;
  Topic.toggleBoolField(id, 'top', (err, topic) => {
    if(err) console.error(err);
    if(err || !topic) {
      req.flash('error', '数据更新时发生错误，请确认后重试!');
    } else {
      req.flash('success', topic.top ? '置顶' : '取消置顶' + '操作成功!');
    }
    res.redirect('/admin/bbs/topic');
  });
};
/**
 * 帖子屏蔽
 * @param req
 * @param res
 */
exports.block = function (req, res) {
  var id = req.params.id;
  Topic.toggleBoolField(id, 'blocked', (err, topic) => {
    if(err) console.error(err);
    if(err || !topic) {
      req.flash('error', '数据更新时发生错误，请确认后重试!');
    } else {
      req.flash('success', (topic.blocked ? '屏蔽' : '取消屏蔽') + '操作成功!');
    }
    res.redirect('/admin/bbs/topic');
  });
};
/**
 * 设置为热门帖子
 * @param req
 * @param res
 */
exports.hot = function (req, res) {
  var id = req.params.id;
  Topic.toggleBoolField(id, 'hot', (err, topic) => {
    if(err) console.error(err);
    if(err || !topic) {
      req.flash('error', '数据更新时发生错误，请确认后重试!');
    } else {
      req.flash('success', topic.hot ? '设置热帖' : '取消热帖' + '操作成功!');
    }
    res.redirect('/admin/bbs/topic');
  });
};

exports.comments = function (req, res) {
  var topicid = req.params.topicid || req.query.topicid;
  var offset = req.params.offset || req.query.offset;
  var limit = req.params.limit || req.query.limit;
  Comment.commentsByTopicId(topicid, offset, limit, (err, comments) => {
    if(err) console.error(err);
    res.render('admin/bbs/topic/comments', { offset: offset + limit, limit: limit, comments: comments ? comments : [] });
  });
};