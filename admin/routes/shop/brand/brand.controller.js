/**
 * Created by danne on 2016-04-28.
 */
/**
 * 商城管理
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');
var fileUtl = require('../../../../util/file');
var imgUtil = require('../../../../util/imgutil');

var Brand = mongoose.model('Brand');
//
/**
 * 商城首页
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  res.render('shop/brand/list');
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
  Brand.dataTable(req.query, {
    conditions: {
      "channel": req.session.channelId || req.session.channel._id
    }
  }, function (err, data) {
    res.send(data);
  });
};
/**
 * 添加品牌的类别
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  res.render('shop/brand/form', {
    viewType: "add",
    brand: new Brand()
  });
};

/**
 * 修改品牌的信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
  var id = req.params.id;

  Brand.findOne({'_id': id}, function (err,brand) {
    if (err) {
      console.log("**** error ... " + err);
      req.flash('error', err);
      res.redirect('/shop/brand/');
    }else{
      res.render('shop/brand/form', {
        viewType: "edit",
        brand: brand ? brand : new Brand()
      });
    }
  });
};
/**
 * 是否激活品牌
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.param("id");
  var updata = {};
  var options = {};
  var msg = "";
  Brand.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Brand.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/shop/brand/');
        }
      });
    }
  });
};

/**
 * 删除品牌
 * @param req
 * @param res
 */
exports.del = function (req, res) {
  var ids = req.body.id || req.params.id;
  Brand.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/shop/brand/');
    }
  });

};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.nameCh;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    Brand.count({nameCh: newName, channel: req.session.channelId}, function (err, result) {
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

  if (!req.files || req.files.length <= 0) {
    saveOrUpdate(id, req, res);
  } else {
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'brand', false, function (fs) {
      // 生成缩略图
      console.log("********** files uploaded: " + JSON.stringify(fs));
      for (i in fs) {
        if ('logo' == fs[i].fieldname) {
          fs[i].width = fs[i].height = 200;
        }//200
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

          console.log("********** save wechat body: " + JSON.stringify(req.body));
          // 更新时处理替换文件情况，新文件保存后旧文件删除
          Brand.findById(id, function (err, event) {
            console.log('******** event should be updated:', event);
            // queue files that should be removed.
            var filesShouldRemove = [];
            if (!event) {
              saveOrUpdate(id, req, res);
            } else {
              if (req.body.logo && event.logo) {
                //文件替换
                filesShouldRemove.push(event.logo);
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
/**
 * 保存方法
 * @param id
 * @param req
 * @param res
 */
function saveOrUpdate(id, req, res) {
  if (!id) {
    req.body.channel = req.session.channelId;
    var brand = new Brand(req.body);
    brand.save(function (err, result) {
      handleSaved(req, res, err, brand);
    });
  } else {
    // update
    Brand.findByIdAndUpdate(id, req.body, function (err, result) {
      handleSaved(req, res, err, brand);
    });
  }
}

// handle object saved
function handleSaved(req, res, err, brand) {
  if (err) {
    console.log(err);
    req.flash('error', '品牌保存失败!' + err);
    res.render('shop/brand/form', {
      brand: brand == null ? new Brand() : brand
    });
  } else {
    req.flash('success', '品牌保存成功!');
    res.redirect('/shop/brand/');
  }
}


/**
 * 获取品牌填充列表框
 * @param req
 * @param res
 */
exports.getBrands = function (req, res) {
  Brand.find({}, function (err, category) {
    res.send(category);
  });
};
