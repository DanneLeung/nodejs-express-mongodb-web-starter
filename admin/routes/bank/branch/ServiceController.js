/**
 * Created by xingj on 2016/8/22.
 */
/**
 * Created by danne on 2015/10/29.
 */
"use strict";

var mongoose = require('mongoose');
var ServiceItem = mongoose.model('ServiceItem');
var async = require('async');
var config = require('../../../../config/config');

var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');

/*
 * list
 */
exports.list = function (req, res) {
  ServiceItem.find({}, function (err, sitem) {
    res.render('bank/branch/serviceItemList', {
      sitem: sitem
    })
  })
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
  ServiceItem.dataTable(req.query, function (err, data) {
    res.send(data);
  });
};
exports.add = function (req, res) {
  res.render('bank/branch/serviceItemForm', {
    viewType: "add",
    sitem: new ServiceItem()
  })
};

exports.edit = function (req, res) {
  var id = req.param("id");
  ServiceItem.findOne({'_id': id}, function (err, sitem) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/bank/service/list');
    } else {
      res.render('bank/branch/serviceItemForm', {
        viewType: "edit",
        sitem: sitem
      })
    }
  });
};


exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ServiceItem.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/bank/service/list');
    }
  });

};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.serverName;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    ServiceItem.count({name: newName}, function (err, result) {
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
  req.body.channel = req.session.channelId;
  if (!req.body.bespeak) req.body.bespeak = false;

  var saveOrUpdate = function (id, req) {
    if (!id) {
      var sitem = new ServiceItem(req.body);
      sitem.save(function (err, result) {
        if(err){
          console.log("数据添加失败！",err);
          req.flash('error', '添加失败!');
        }else{
          req.flash('success', '添加成功!');
        }
        res.redirect('/bank/service/list');
      });
    } else {
      // update
      ServiceItem.update({'_id': id}, req.body, function (err, result) {
        if(err){
          console.log("数据修改失败！");
          req.flash('error', '保存失败!');
        }else{
          req.flash('success', '保存成功!');
        }
        res.redirect('/bank/service/list');
      });
    }
  };

  if (!req.files || req.files.length <= 0) {
    saveOrUpdate(id, req);
  } else {
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'item', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
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
              req.body[fieldname] = files[i].thumb;
            }
          }

          console.log("********** save wechat body: " + JSON.stringify(req.body));
          // 更新时处理替换文件情况，新文件保存后旧文件删除
          ServiceItem.findById(id, function (err, event) {
            console.log('******** event should be updated:', event);
            // queue files that should be removed.
            var filesShouldRemove = [];
            if (!event) {
              saveOrUpdate(id, req, res);
            } else {
              if (req.body.serviceImg && event.serviceImg) {
                //文件替换
                filesShouldRemove.push(event.serviceImg);
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
