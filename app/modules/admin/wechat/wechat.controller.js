/**
 * 渠道微信公众号绑定
 */
var mongoose = require('mongoose');
var _ = require('lodash');
var xml2js = require("xml2js");
var moment = require('moment');
var async = require('async')

var config = require('../../../../config/config');
var Wechat = mongoose.model('Wechat');
var WechatToken = mongoose.model('WechatToken');
var WechatMedia = mongoose.model('WechatMedia');
var WechatAutonToken = mongoose.model('WechatAuthToken');
var WechatFans = mongoose.model('WechatFans');

var menuUtil = require(config.root + '/util/wechat/menuUtil');
var mediaUtil = require(config.root + '/util/wechat/mediaUtil');
var fileUtl = require(config.root + '/util/file');
var imgUtil = require(config.root + '/util/imgutil');
var errcode = require(config.root + '/public/errcode.json');
var WechatAPI = require('wechat-api');

exports.index = function (req, res) {
  var query = {};
  Wechat.find(query).populate('qrcode').exec(function (err, wechatList) {
    res.render('admin/wechat/wechatList', {
      wechatList: wechatList
    })
  })
}

exports.datatable = function (req, res) {
  Wechat.dataTable(req.query, {
    conditions: {}
  }, function (err, data) {
    res.send(data);
  });
}

exports.add = function (req, res) {
  Wechat.getAuthWechat(function (err, wechats) {
    if(err) console.error(err);
    console.log("***************** getAuthWechat", wechats);

    res.render('admin/wechat/wechatForm', {
      info: new Wechat(),
      wechats: wechats ? wechats : []
    })
  });
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Wechat.remove({
    '_id': ids
  }, function (err, result) {
    if(err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/admin/wechat');
    }
  });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  Wechat.findById(id).populate('logo qrcode').exec(function (err, result) {
    if(err) {
      console.log(err);
      req.flash('error', '公众号不存在，可能已被删除!');
      res.redirect('/admin/wechat');
    } else {
      Wechat.getAuthWechat(function (err, wechats) {
        if(err) console.error(err);
        console.log("***************** getAuthWechat", wechats);
        _.remove(wechats, (el) => { return id == el.id });
        res.render('admin/wechat/wechatForm', {
          info: result,
          wechats: wechats ? wechats : []
        })
      });
    }
  });
};

/**
 * 保存数据
 */
exports.save = function (req, res) {
  var id = req.body.id;
  // 除了数据
  if(!req.body.oauthWechat) {
    req.body.oauthWechat = null;
  }
  //新增或者更新
  var saveOrUpdate = function (id, req, callback) {
    if(!id) {
      var wechat = new Wechat(req.body);

      wechat.checked = true;
      wechat.save(function (err, result) {
        callback(err, result);
      });
    } else {
      // update
      var json = req.body;
      json.checked = true;
      Wechat.findOneAndUpdate({
        '_id': id
      }, json, {
        new: true
      }, function (err, result) {
        callback(err, result);
      });
    }
  };
  var handleResult = function (err, result) {
    if(err) {
      req.flash('error', err.message);
      res.redirect('/admin/wechat');
      return;
    }
    req.flash('success', '数据保存成功!');
    res.redirect('/admin/wechat');
  };

  async.waterfall([(cb) => {
    //检查公众号是否合格
    var api = new WechatAPI(req.body.appid, req.body.appsecret, WechatToken.readToken, WechatToken.saveToken);
    // api.getAccessToken((e, o) => {
    //   if(e) {
    //     cb('不合法的AppID，请开发者检查AppID的正确性，避免异常字符，注意大小写', null)
    //   } else {
    //     cb(null, null)
    //   }
    // });

    cb(null, null);
  }], (err, result) => {
    if(err) {
      console.log('has err==================>', err.message)
      req.flash('error', err.message);
      res.redirect('/admin/wechat');
      return;
    }
    //如果没有上传文件，则直接保存
    if(!req.files || req.files.length <= 0) {
      saveOrUpdate(id, req, handleResult);
    } else {
      // 先存储文件
      fileUtl.saveUploadFiles(req.files, 'wechat', false, function (fs) {
        // 生成缩略图
        console.log("********** files uploaded: " + JSON.stringify(fs));
        imgUtil.thumbnail(fs, 150, function (ffs) {
          console.log("********** files thumbnailed: " + JSON.stringify(ffs));
          fileUtl.saveFiles(ffs, function (err, files) {
            if(err) req.flash('warning', '文件保存时发生错误');
            console.log("********** files saved: " + JSON.stringify(files));
            // 返回的文件path为URL路径
            if(files && files.length > 0) {
              for(var i = 0; i < files.length; i++) {
                var fieldname = files[i].fieldname;
                console.log("********** setting  body %s - %s : ", fieldname, files[i].path);
                req.body[fieldname] = files[i];
              }
            }
            if(!req.body.qrcode) {
              delete req.body.qrcode
            }
            if(!req.body.logo) {
              delete req.body.logo
            }
            // console.log("********** save wechat body: " + JSON.stringify(req.body));
            saveOrUpdate(id, req, (e, o) => {
              if(e) {
                req.flash('error', e.message);
                res.redirect('/admin/wechat');
                return;
              }
              // 更新时处理替换文件情况，新文件保存后旧文件删除
              Wechat.findById(o._id, function (err, wechat) {
                console.log('******** wechat should be updated:', wechat);
                // queue files that should be removed.
                var filesShouldRemove = [];
                if(req.body.logo && wechat.logo) {
                  //文件替换
                  filesShouldRemove.push(wechat.logo);
                }
                if(req.body.qrcode && wechat.qrcode) {
                  //文件替换
                  filesShouldRemove.push(wechat.qrcode);
                }
                fileUtl.removeFiles(filesShouldRemove, function (err, results) {
                  console.log('******** remove files:', filesShouldRemove);
                  //saveOrUpdate(id, req, handleResult);
                });
              });
              handleResult(e, o);
            });
          })
        });
      });
    }
  })

};
/***************************************
 * 微信公众号管理功能
 ***************************************/

/**
 * 获取微信公众号列表和当前公众号，存放到res.locals中
 * @param next
 */
var context = function (req, res) {
  var id = req.params.wechatId || req.query.wechatId;
  if(id) {
    console.log("************* wechat context id: " + id);
    Wechat.findById(id)
      .populate('logo qrcode')
      .exec(function (err, wechat) {
        if(err) {
          console.error(err);
          req.flash("error", "读取公众号信息时发生错误");
          res.redirect('admin/wechat')
          //return next();
        }
        req.session.wechat = wechat;
        req.session.wechatId = wechat._id;
        console.log("************* wechat context wechat ", req.session.wechatId, req.session.wechat.name);
        res.redirect('/wechat/mgmt');
      });
  } else {
    res.redirect('/wechat/mgmt')
  }
};
exports.context = context;
/**
 *
 * @param req
 * @param res
 */
exports.mgmt = function (req, res) {
  res.render('admin/wechat/index', {
    wechat: req.session.wechat
  });
};

/**
 * 清除
 * @param req
 * @param res
 */
exports.clearToken = function (req, res) {
  var id = req.params.id || req.query.id;
  if(id) {
    Wechat.findById(id, function (err, wechat) {
      if(err) {
        console.error(err);
        return res.send({ error: err });
      }
      if(wechat && wechat.appid) {
        WechatToken.remove({ appid: wechat.appid }, function (err) {
          return res.send({ error: err });
        });
      }
    });
  }
};

/**
 *
 * @param req
 * @param res
 */
exports.menu = function (req, res) {
  res.render('admin/wechat/menu/menu', {
    wechatId: req.session.wechat.id
  });
};

/**
 *
 * @param req
 * @param res
 */
exports.media = function (req, res) {
  res.render('admin/wechat/media/media', {
    wechatId: req.session.wechat._id
  });
};

exports.mediaEditor = function (req, res) {
  res.render('admin/wechat/media/editor', {
    wechatId: req.session.wechat._id
  });
};

/**
 * 获取微信永久素材
 * @param req
 * @param res
 */
exports.getMaterial = function (req, res) {
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var media_id = req.param("mediaId");
  var mutil = new mediaUtil(appid, appsecret);
  mutil.getMaterial(media_id, function (err, media) {
    if(err) console.error(err);
    if(media && media.path && media.type != 'video')
      //发送本地文件
      res.sendFile(mutil.basePath() + media.path, { maxAge: 3 * 3600 * 1000 }); // cache in 1 days.
    else
      res.send(media);
  })
};

/**
 * 获取给公众号的菜单
 * @param req
 * @param res
 */
exports.getMenu = function (req, res) {

  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var menu = new menuUtil(appid, appsecret);
  menu.getMenu(function (err, menus) {
    console.log("menus==================>>>>>>>>>>>>>>>>>>>>>>>>>>>", menus)
    res.send(menus);
  })
};

/**
 * 新建自定义菜单
 * @param req
 * @param res
 */
exports.createMenu = function (req, res) {

  var menus = req.params.buttons || req.body.buttons;
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var menu = new menuUtil(appid, appsecret);
  menu.removeMenu(function (err, result) {
    if(!err) {
      menu.createMenu(menus, function (err, result) {
        console.error(err);
        if(err) {
          res.send({
            "code": 0,
            "meg": err
          });
        } else {
          res.send({
            "code": 1,
            "meg": "保存成功"
          });
        }
      });
    } else {
      console.error(err);
      res.send({
        "code": 0,
        "meg": err
      });
    }
  })
};

/**
 * 获取菜单中素材的信息（媒体文件）
 * @param req
 * @param res
 */
exports.getMedia = function (req, res) {
  var type = req.query.type || req.params.type || req.body.type;
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var mutil = new mediaUtil(appid, appsecret);
  var page = req.query.page || req.body.page;
  var limit = 50;
  var skip = 0;
  if(page > 0) skip = parseInt(page - 1) * limit;
  WechatMedia.count({ appid: appid, type: type }).exec((err, total) => {
    if(err) console.error(err);
    //计算总页数
    var totalPages = total <= limit ? 1 : (total % limit == 0 ? total / limit : total / limit + 1);
    WechatMedia.find({ appid: appid, type: type }).sort({ "update_time": -1 }).skip(skip).limit(limit).exec((err, result) => {
      if(!err) {
        res.send({ "code": 1, "meg": result, page: page, totalPages: totalPages, total: total, size: limit });
      } else {
        res.send({ "code": 0, "meg": err });
      }
    });
  });
};

/**
 * 删除素材的信息
 * @param req
 * @param res
 */
exports.removeMedia = function (req, res) {
  var mediaId = req.query.mediaId || req.params.mediaId || req.body.mediaId;
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var mutil = new mediaUtil(appid, appsecret);

  mutil.removeMaterial(mediaId, function (err, result) {
    if(result.errcode == 0) {
      WechatMedia.remove({ media_id: mediaId }, function (err, wm) {
        res.send({ code: 1, msg: "素材删除成功！" });
      });
    } else {
      res.send({ code: 0, msg: errcode[result.errcode] });
    }
  });
};

/**
 * 同步信息到本地
 * @param req
 * @param res
 */
exports.syncMedia = function (req, res) {
  var type = req.query.type || req.params.type || req.body.type;
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var mutil = new mediaUtil(appid, appsecret);
  mutil.syncMedia(appid, type, function (err, result) {
    if(!err) {
      res.send({ "code": 1, "meg": result });
    } else {
      res.send({ "code": 0, "meg": err });
    }
  });

};

/**
 * 保存媒体文件信息
 * @param req
 * @param res
 */
exports.saveMedia = function (req, res) {
  var type = req.param("type") || req.body.type;
  var content = req.param("content") || req.body.content;
  var mediaId = req.param("mediaId") || req.body.mediaId;
  var key = req.param("key") || req.body.key;

  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var mutil = new mediaUtil(appid, appsecret);
  var reply = new WechatReply();
  reply.originalId = req.session.wechat.originalId;
  reply.replyType = "3";
  reply.type = type;
  reply.mediaId = mediaId;
  reply.key = key;
  if(content != null && content != undefined) {
    reply.content = content;
  } else {
    reply.content = "";
  }
  if(type == "news" || type == "video") {
    mutil.getMaterial(mediaId, function (err, media) {
      if(err) console.error(err);
      if(!err) {
        if(type == "video") {
          reply.title = media.title;
          reply.description = media.description;
        } else if(type == "news") {
          var items = media.content.news_item;
          var len = items.length;
          var articles = [];
          items.forEach(function (e) {
            var a = {};
            a.title = e.title;
            a.description = e.digest;
            a.picUrl = e.thumb_url;
            a.url = e.url;
            articles.push(a);
          });
          reply.articles = articles;
          console.log("articles=====================>>>", articles);
        }
        reply.save(function (err, result) {
          if(err) {
            console.log("err=====================>>>", err);
            res.send({ code: '0', meg: "no" });
          } else {
            res.send({ code: '1', meg: "ok" });
          }
        })
      }
    })
  } else {
    reply.save(function (err, result) {
      if(err) {
        console.log("err=====================>>>", err);
        res.send({ code: '0', meg: "no" });
      } else {
        res.send({ code: '1', meg: "ok" });
      }
    })
  }
};

/**
 * 进入群发消息界面
 * @param req
 * @param res
 */
exports.sendmsg = function (req, res) {
  var wechat = req.session.wechat._id;
  Wechat.findOne({ "_id": wechat }, (err, cw) => {
    var type = cw.type;
    //认证订阅号
    if(type == '2') {
      //检查当天
      SendMsgCount.findOne({ "wechat": wechat, 'dateStr': moment().format('YYYYMMDD') }, (e, o) => {
        if(o) {
          if(o.dayCount == 0) {
            res.render('admin/wechat/sendmsg/index', { 'sendFlag': '0', 'msg': '你今天还能群发 1 条消息' });
          } else {
            res.render('admin/wechat/sendmsg/index', { 'sendFlag': '1', 'msg': '你今天还能群发 0 条消息' });
          }
        } else {
          SendMsgCount.initData(type, wechat, (err, obj) => {
            res.render('admin/wechat/sendmsg/index', { 'sendFlag': '1', 'msg': '你今天还能群发 1 条消息' });
          })
        }
      })
    } else if(type == '4') {
      SendMsgCount.findOne({ "wechat": wechat, 'yearMonth': moment().format('YYYYMM') }, (e, o) => {
        if(o) {
          if(o.count > 0) {
            res.render('admin/wechat/sendmsg/index', { 'sendFlag': '1', 'msg': '您本月还能群发 ' + o.count + ' 条消息' });
          } else {
            res.render('admin/wechat/sendmsg/index', { 'sendFlag': '0', 'msg': '您本月还能群发 0 条消息' });
          }
        } else {
          SendMsgCount.initData(type, wechat, (err, obj) => {
            res.render('admin/wechat/sendmsg/index', { 'sendFlag': '1', 'msg': '您本月还能群发 4 条消息' });
          })
        }
      });
    } else { //未认证的订阅号或服务号
      res.render('admin/wechat/sendmsg/index', { 'sendFlag': '0', 'msg': '未认证公众号不能群发消息' });
    }
  });
};

/**
 *
 * @param req
 * @param res
 */
exports.autoreply = function (req, res) {
  WechatReply.findOne({
    originalId: req.session.wechat.originalId,
    replyType: "1"
  }, function (err, result) {
    res.render('admin/wechat/autoreply/autoreply', {
      wechatId: req.session.wechat._id,
      reply: result ? result : new WechatReply(),
      //viewType: result ? "edit" : "add"
    });
  });
};

/**
 *  获取关键字回复的信息
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
  WechatReply.dataTable(req.query, {
    conditions: {
      originalId: req.session.wechat.originalId,
      replyType: "2"
    }
  }, function (err, result) {
    if(err) {
      console.log("err=================>>>", err);
      res.send();
    } else {
      res.send(result);
    }
  });
};

/**
 * 保存关注时自动回复
 * @param req
 * @param res
 */
exports.saveOutoReply = function (req, res) {
  var reply = new WechatReply(req.body);
  var type = req.param("type") || req.body.type;
  var originalId = req.session.wechat.originalId;
  reply.originalId = originalId;
  reply.replyType = "1";
  WechatReply.remove({ //由于每个公众号只能有一个自动回复所以需将之前的删除，新建一条数据
    originalId: originalId,
    replyType: "1"
  }, function (err, result) {
    if(!err) {
      if(type == 'news') { //如果是图文信息时需要获取图文信息
        var mediaId = req.param("mediaId") || req.body.mediaId;
        var appid = req.session.wechat.appid;
        var appsecret = req.session.wechat.appsecret;
        var mutil = new mediaUtil(appid, appsecret);
        mutil.getMaterial(mediaId, function (err, media) {
          if(err) console.error(err);
          console.log("********************* auto replay", media);
          var items = media.content.news_item;
          var articles = [];
          var i = 0;
          var articleCount = 0;
          items.forEach(function (e) { //图文信息的循环获取
            var a = {};
            a.title = e.title;
            a.description = e.digest;
            a.picUrl = e.thumb_url;
            a.url = e.url;
            if(i < 10) { //最多只能设置图文10个子消息
              articleCount = items.length;
              articles.push(a);
            } else {
              articleCount = 10;
            }
            i += 1;
          });
          reply.articles = articles; //图文子信息的集合
          reply.articleCount = articleCount;
          reply.save(function (err, reply) {
            if(err) {
              res.send({ code: '0', meg: err });
            } else {
              res.send({ code: '1', meg: "ok" });
            }
          })
        });

      } else { //其他类型的信息
        reply.save(function (err) {
          if(err) {
            res.send({ code: '0', meg: err });
          } else {
            res.send({ code: '1', meg: "ok" });
          }
        });
      }
    }
  })
}

/**
 * 保存关键字回复信息
 * @param req
 * @param res
 */
exports.saveKeyWord = function (req, res) {
  var mediaId = req.params.mediaId || req.body.mediaId;
  var id = req.params.id || req.body.id;
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var mutil = new mediaUtil(appid, appsecret);
  var reply;
  if(!id) {
    reply = new WechatReply(req.body);
    reply.originalId = req.session.wechat.originalId;
    reply.replyType = "2";
  } else {
    reply = req.body;
  }
  getRules(reply, req.body.keyWord);
  var type = req.body.type;

  if(type == "news" || type == "video") { //如果回复信息的类型为视频和图文时需要的处理
    mutil.getMaterial(mediaId, function (err, media) {
      if(!err) {
        if(type == "video") { //回复信息的类型为视频时需要的处理
          media = JSON.parse("" + media);
          reply.title = media.title;
          reply.description = media.description;
        } else { //回复信息的类型为图文时需要的处理
          //media = JSON.parse("" + media);
          var items = media.content.news_item;
          //var len = items.length;
          var articles = [];
          var i = 0;
          var articleCount = 0;
          var flag = req.body.diyUrlFlag;
          if(flag == 'on') {
            flag = true;
          } else {
            flag = false;
          }
          reply.diyUrlFlag = flag;
          items.forEach(function (e) {
            var a = {};
            a.title = e.title;
            a.description = e.digest;
            a.picUrl = e.thumb_url;
            if(flag) {
              if(i == 0) {
                a.url = req.body.diyUrl1 ? req.body.diyUrl1 : e.url;
              } else if(i == 1) {
                a.url = req.body.diyUrl2 ? req.body.diyUrl2 : e.url;
              } else if(i == 2) {
                a.url = req.body.diyUrl3 ? req.body.diyUrl3 : e.url;
              } else if(i == 3) {
                a.url = req.body.diyUrl4 ? req.body.diyUrl4 : e.url;
              } else if(i == 4) {
                a.url = req.body.diyUrl5 ? req.body.diyUrl5 : e.url;
              }
            } else {
              a.url = e.url;
            }
            if(i < 10) {
              articleCount = items.length;
              articles.push(a);
            } else {
              articleCount = 10;
            }
            i += 1;
          })
          reply.articles = articles;
          reply.articleCount = articleCount;
        }
        if(id) { //修改关键字回复时

          WechatReply.update({
            '_id': id
          }, reply, function (err, result) {
            if(!err) {
              res.send({
                code: '1',
                meg: "修改成功"
              });
            } else {
              res.send({
                code: '0',
                meg: err
              });
            }
          });
        } else { //新建关键字回复的时候保存
          reply.save(function (err, result) {
            if(err) {
              res.send({
                code: '0',
                meg: err
              });
            } else {
              res.send({
                code: '1',
                meg: "保存成功"
              });
            }
          })
        }
      }
    })
  } else { //如果回复信息的类型为其他时需要的处理
    if(id) {
      WechatReply.update({
        '_id': id
      }, reply, function (err, result) {
        if(!err) {
          res.send({
            code: '1',
            meg: "修改成功"
          });
        } else {
          res.send({
            code: '0',
            meg: err
          });
        }
      });
    } else {
      reply.save(function (err, result) {
        if(err) {
          res.send({
            code: '0',
            meg: err
          });
        } else {
          res.send({
            code: '1',
            meg: "保存成功"
          });
        }
      })
    }
  }
};

/**
 * 设置回复时匹配的方式
 * @param reply
 * @param keys
 */
function getRules(reply, keys) {

  reply.rules = [];
  if(keys instanceof Array) {
    keys.forEach(function (e) {
      var rule = {};
      rule.keyWord = e;
      rule.matchMode = "contain";
      reply.rules.push(rule)
    });
  } else {
    if(keys) {
      var rule = {};
      rule.keyWord = keys;
      rule.matchMode = "contain";
      reply.rules.push(rule)
    }
  }
}

/**
 * 删除关键字信息
 * @param req
 * @param res
 */
exports.delKyeWord = function (req, res) {
  var ids = req.body.id || req.params.id;
  WechatReply.remove({
    '_id': ids
  }, function (err, result) {
    if(err) {
      console.log(err);
      res.send({
        code: "0",
        meg: err
      });
    } else {
      res.send({
        code: "1",
        meg: '数据删除成功!'
      });
    }
  });

};

/**
 * 删除关键字信息
 * @param req
 * @param res
 */
exports.editKyeWord = function (req, res) {
  var ids = req.body.id || req.params.id;
  WechatReply.findOne({
    '_id': ids
  }, function (err, result) {
    if(!err) {
      console.log(err);
      res.send(result);
    }
  });
};

exports.designer = function (req, res) {
  var appid = req.session.wechat.appid;
  var appsecret = req.session.wechat.appsecret;
  var menu = new menuUtil(appid, appsecret);
  menu.getMenu(function (err, menus) {
    if(err) {
      console.error(err);
      if(46003 != err.code) {
        req.flash('error', '从接口读取微信菜单时出现错误!');
        //res.status(500).end();
        //return;
        return res.redirect('/wechat/mgmt');
      }
    }
    console.log('*************** menus :' + JSON.stringify(menus.menu));
    res.render('admin/wechat/menu/designer', { menus: JSON.stringify(menus.menu) });
  });
};
exports.designerSave = function (req, res) {
  console.log("************** body:" + JSON.stringify(req.body.group));
  var method = req.body.method;
  var data = req.body.group;
  var r = { message: { errno: 0 } };
  if('save' === method) {
    var appid = req.session.wechat.appid;
    var appsecret = req.session.wechat.appsecret;
    var menu = new menuUtil(appid, appsecret);
    menu.createMenu(data, function (err, result) {
      if(err) {
        console.error("************* error in create menu ", err);
        r.message.errno = 1;
        r.message.message = err;
      }
      console.log("************ create menu success.", JSON.stringify(result));
    });
  }
  res.send(r);
};

/**
 * 统计当天粉丝数量
 * @param req
 * @param res
 */
exports.wechatFansGroup = function (req, res) {
  var date = new Date();
  date.setDate(date.getDate() - 1);
  var dateStr = moment(date).format("YYYY-MM-DD");
  var wid = req.params.wechatId;
  var now = moment().format('YYYY-MM-DD');
  var startTime = new Date(now + " 00:00:00"); //当天从0点开始统计
  //昨日累计数量
  sumUserCumulate(dateStr, wid, function (uc) {
    var json = {};
    //总数 "cumulate_user": uc.cumulate_user
    WechatFans.count({ "Wechat": wid, "createdAt": { $gte: startTime } }, function (e, total) {
      json.cumulate_user = uc.cumulate_user + total; //当天累计关注
      json.addFans = total; //今日新关注
      WechatFans.count({ "Wechat": wid, "createdAt": { $gte: startTime }, "flag": true }, function (e, newFans) {
        json.newFans = newFans; //今日净增关注
        res.send(json);
        return;
      })
    });
  })
}

/**
 * 昨日用户数量统计
 * @param req
 * @param res
 */
exports.yesterdayGroup = function (req, res) {
  var date = new Date();
  date.setDate(date.getDate() - 1);
  var dateStr = moment(date).format("YYYY-MM-DD");
  sumUserSummary(dateStr, req.params.wechatId, function (us) {
    sumUserCumulate(dateStr, req.params.wechatId, function (uc) {
      var data = _.assign(us, uc);
      res.send(us);
    });
  });
};

/**
 * 统计昨日增减数据
 * @param dateStr
 * @param wechatId
 */
function sumUserSummary(dateStr, wechatId, cb) {
  var us = { "new_user": 0, "cancel_user": 0 };
  UserSummary.find({ "ref_date": dateStr, "Wechat": wechatId }, function (err, result) {
    if(err || result.length == 0) {
      return cb(us);
    } else {
      result.forEach(function (data) {
        us.new_user += data.new_user;
        us.cancel_user += data.cancel_user;
      });
      return cb(us);
    }
  });
}

/**
 * 统计昨日汇总数据
 * @param dateStr
 * @param wechatId
 */
function sumUserCumulate(dateStr, wechatId, cb) {
  var uc = { "cumulate_user": 0 };
  UserCumulate.find({ "ref_date": dateStr, "Wechat": wechatId }, function (err, result) {
    if(err || result.length == 0) {
      return cb(uc);
    } else {
      result.forEach(function (data) {
        uc.cumulate_user += data.cumulate_user;
      });
      return cb(uc);
    }
  });
}

/**
 * 统计粉丝数据
 * type
 * 1: 新增人数
 * 2：取消人数
 * 3：净增人数=新增人数-取消人数
 * 4：累积人数
 * nearDay: 最近N天
 */
exports.groupWechatFans = function (req, res) {
  var type = req.body.type;
  var nearDay = req.body.nearDay;
  var fromDate = req.body.fromDate;
  var toDate = req.body.toDate;
  var userSource = req.body.userSource;
  // console.log('params is ========>', type, nearDay, userSource)
  var startDate, endDate;
  if(fromDate && toDate) {
    startDate = fromDate;
    endDate = toDate;
  } else {
    if(!nearDay) nearDay = 30; //默认30天
    endDate = moment().day(1).format('YYYY-MM-DD');
    startDate = moment().day(2 - nearDay).format('YYYY-MM-DD');
  }
  var query = { "ref_date": { $gte: startDate, $lte: endDate }, "Wechat": req.session.wechat._id };
  if(userSource) {
    query = _.assign(query, { "user_source": userSource })
  }

  if(type == '1' || type == '2') {
    UserSummary.find(query, (err, result) => {
      if(err) {
        res.send()
        return;
      }
      //没有选择类型的话，需要对同一天的数据做合并
      if(!userSource) {
        result = mergeResult(result);
      }
      var datas = [];
      result.forEach(function (data) {
        if(type == '1') {
          datas.push({ "refDate": data.ref_date, "count": data.new_user })
        } else {
          datas.push({ "refDate": data.ref_date, "count": data.cancel_user })
        }
      })
      res.send(datas);
      return;
    })
  } else if(type == '3') {
    UserSummary.find(query, (err, result) => {
      if(err) {
        res.send()
        return;
      }
      if(!userSource) {
        result = mergeResult(result);
      }
      var datas = [];
      result.forEach(function (data) {
        datas.push({ "refDate": data.ref_date, "count": data.new_user - data.cancel_user })
      })
      res.send(datas);
      return;
    });
  } else if(type == '4') {
    UserCumulate.find(query, (err, result) => {
      if(err) {
        res.send()
        return;
      }
      if(!userSource) {
        result = mergeResult(result);
      }
      var datas = [];
      result.forEach(function (data) {
        datas.push({ "refDate": data.ref_date, "count": data.cumulate_user })
      })
      res.send(datas);
      return;
    })
  } else {
    res.send()
    return;
  }
}

/**
 * 根据日期合并不同来源的数据
 * @param result
 */
function mergeResult(result) {
  var temp = []
  result.forEach(function (data) {
    if(contains(data.ref_date, temp)) {
      var obj = get(data.ref_date, temp)
      if(obj.new_user) {
        obj.new_user += data.new_user;
      } else if(obj.cancel_user) {
        obj.cancel_user += data.cancel_user;
      } else if(obj.cumulate_user) {
        obj.cumulate_user += data.cumulate_user;
      }
    } else {
      temp.push(data)
    }
  })
  return temp;
}

function contains(key, result) {
  var flag = false;
  result.forEach(function (data) {
    if(data.ref_date == key) {
      flag = true;
      return;
    }
  })
  return flag;
}

function get(key, result) {
  var obj = null;
  result.forEach(function (data) {
    if(data.ref_date == key)
      obj = data;
    return;
  })
  return obj;
}

/**
 * user_source
 * 0代表其他合计
 * 1代表公众号搜索
 * 17代表名片分享
 * 30代表扫描二维码
 * 43代表图文页右上角菜单
 * 51代表支付后关注（在支付完成页）
 * 57代表图文页内公众号名称
 * 75代表公众号文章广告
 * 78代表朋友圈广告
 */
exports.userSource = function (req, res) {
  res.send([
    { "value": "", "name": "全部来源" },
    { "value": "1", "name": "公众号搜索" },
    { "value": "30", "name": "扫描二维码" },
    { "value": "43", "name": "图文页右上角菜单" },
    { "value": "57", "name": "图文页内公众号名称" },
    { "value": "17", "name": "名片分享" },
    { "value": "51", "name": "支付后关注" },
    { "value": "0", "name": "其他合计" },
  ])
}