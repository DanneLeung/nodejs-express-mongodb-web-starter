/**
 * Created by xingjie201 on 2016/2/19.
 * 帖子的Controller
 */

var fs = require('fs');
var async = require('async');
var moment = require('moment');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var config = require('../../../../config/config');
var fileUtil = require(config.root + '/util/file');
var excalUtil = require(config.root + '/util/excelUtil');

var Notify = require(config.root + '/app/components/notify');

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
  var query = getQuery(req);
  req.session.query_topics = query;
  var offset = parseInt(req.params.offset || req.query.offset);
  var limit = parseInt(req.params.limit || req.query.limit);
  if(!offset) offset = 0;
  if(!limit) limit = 10;
  console.log(" >>>>>>>>>>>>>>>>>>>> query ", query);
  Topic.topicsWithNodeWithTop(query, offset, limit, (total, topics) => {
    res.render('admin/bbs/topic/topicList', { topics: topics, node: query.node, dateStart: query.dateStart, dateEnd: query.dateEnd, total: total, offset: offset, limit: limit });
  });
};
exports.export = function (req, res) {
  var sep = ",";
  var query = req.session.query_topics || getQuery(req);
  var path = "public/upload/tmp/bbs/" + moment().format("YYYYMMDD") + "/";
  fileUtil.mkdirsSync(path);
  var filename = "topic" + moment().format("YYYYMMDDhhmmss") + ".csv"; //生成文件名
  var filenPath = path + filename;
  var label = "时间,粉丝,帖子,评论1,评论2,评论3,评论4,评论5\n";
  label = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(label)]); //处理乱码的格式
  fs.appendFileSync(filenPath, label);
  var fn = function (query, page) {
    var limit = 100;
    var offset = page * limit;
    Topic.find(query).populate("node fans user").populate({ path: "comments", select: "content fans user updatedAt createdAt", sort: "-createdAt", populate: { path: "fans user" } }).sort("-createdAt").skip(offset).limit(limit).exec((err, topics) => {
      if(!topics || topics.length <= 0) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + filename);
        return res.download(filenPath);
      } else {
        var bufs = "";
        for(var i in topics) {
          var arr = [];
          var topic = topics[i];
          arr.push(moment(topic.createdAt).format("YYYY-MM-DD hh:mm"));
          arr.push(topic.fans ? topic.fans.nickname : "");
          arr.push(topic.content ? topic.content.replace(/\r\n/gm, '<br>') : "");
          var comments = topic.comments;
          if(comments && comments.length) {
            for(var j = 0; j < 5; j++) {
              if(j < comments.length) {
                var c = comments[j];
                arr.push((c.fans ? c.fans.nickname : (c.user ? c.user.fullname : "")) + moment(c.createdAt).format("YYYY-MM-DD hh:mm") + "<br/>" + "<br/>" + (c.content ? c.content.replace(/\r\n/gm, '<br>') : ""));
              } else {
                arr.push("");
              }
            }
          }
          bufs += arr.join(sep) + "\n";
        }
        var labels = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(bufs)]); //处理乱码的格式
        fs.appendFileSync(filenPath, labels);
        fn(query, ++page);
      }
    });
  };
  fn(query, 0);
};

function getQuery(req) {
  var node = req.params.node || req.query.node;
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
    var start = d.toDate();
    query.createdAt.$gte = start;
  }
  if(dateEnd) {
    if(!query.createdAt) query.createdAt = {};
    var d = moment(dateEnd, 'YYYY-MM-DD HH:mm');
    var end = d.toDate();
    query.createdAt.$lt = end;
  }
  return query;
}

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
  // 回复TO粉丝openid
  var toopenid = req.body.toopenid || req.query.toopenid;
  // 当前板块
  var node = req.body.node || req.query.node;
  var nickname = user.fullname || user.username;

  var appid = req.session.appid;

  Comment.newComment(topicid, user, user ? user.fans : null, req.body.content, [], (err, comment) => {
    if(err) {
      console.error(err);
      res.status(200).json({ err: 1, msg: "评论回复帖子不成功，发生错误!" });
    } else {
      Notify.notifyComment(appid, toopenid, nickname, node, topicid, (err, result) => {
        console.log(" >>>>>>>>>>>> notify commented ", result);
        // res.status(200).send({ result: 'success', message: '评论已发表!', locate: req.session.contextFront + '/topic/view/' + topicid });
        res.status(200).json({ err: 0, msg: "评论回复帖子成功!", comment: comment });
      });
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
  Comment.remove({ topic: id }, (err, result) => {
    if(err) {
      console.error(err);
      req.flash('error', '数据删除时发生错误!');
      return res.redirect('/admin/bbs/topic');
    }
    Topic.remove({
      '_id': id
    }, function (err, result) {
      // console.log(" >>>>>>>>>>>>>>>> delete result ", result);
      if(err) {
        console.log(err);
        req.flash('error', "数据删除时发生错误!");
        res.redirect('/admin/bbs/topic');
      } else {
        req.flash('success', '数据删除成功!');
        res.redirect('/admin/bbs/topic');
      }
    });
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