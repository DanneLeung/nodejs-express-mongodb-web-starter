/**
 * Created by ZhangXiao on 2016/3/10.
 * 渠道微信公众号绑定
 */
var mongoose = require('mongoose')
  , Branch = mongoose.model('Branch')
  , ServiceItem = mongoose.model('ServiceItem')
  , Province = mongoose.model('Province')
  , City = mongoose.model('City')
  , District = mongoose.model('District')
  , config = require('../../../../config/config')
  , fileUtil = require('../../../../util/file');

exports.list = function (req, res) {
  res.render('bank/branch/branchList');
}

exports.datatable = function (req, res) {
  Branch.dataTable(req.query, { conditions: { 'channel': req.user.channelId } }, function (err, data) {
    res.send(data);
  });
}

exports.add = function (req, res) {
  ServiceItem.find({ channel: req.session.channelId }, function (err, services) {
    res.render('bank/branch/branchForm', {
      branch: new Branch(),
      services: services
    })
  });
};

exports.checkNo = function (req, res) {
  var newName = req.query.no;
  var oldName = req.query.oldNo;
  if (newName === oldName) {
    res.send('true');
  } else {
    Branch.count({ 'no': newName }, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Branch.remove({ '_id': ids }, function (err, branch) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/bank/branch/list');
    }
  });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  Branch.findOne({ '_id': id }, function (err, branch) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/bank/branch/list');
    } else {
      ServiceItem.find({ channel: req.session.channelId }, function (err, services) {
        res.render('bank/branch/branchForm', {
          branch: branch,
          services: services
        })
      });
    }
  });
};

exports.save = function (req, res) {
  var id = req.body.id;
  var channelId = req.user.channelId;

  var province = req.body.province == undefined ? new Array("", "", "") : req.body.province.split("|");
  var city = req.body.city == undefined ? new Array("", "", "") : req.body.city.split("|");
  var district = req.body.district == undefined ? new Array("", "", "") : req.body.district.split("|");

  req.body.province = province[1] != "" ? province[1] : null;
  req.body.city = city[1] != "" ? city[1] : null;
  req.body.district = district[1] != "" ? district[1] : null;

  if (req.body.coordinate) {
    console.log(req.body.coordinate);
    var c = req.body.coordinate.split(',');
    if (c.length > 1) {
      req.body.coordinate = [parseFloat(c[0]), parseFloat(c[1])];
    }
  }

  //处理上传的文件
  var images = [];
  if (req.body.logo && req.body.logo.indexOf('/tmp/'))
    images.push(req.body.logo);

  // 去除临时目录tmp
  req.body.logo = req.body.logo.replace('tmp/', '');
  var imgs = [];
  var igs = req.body.images;
  if (igs instanceof Array) {
    for (var i in igs) {
      var f = igs[i];
      if (f && f.indexOf('/tmp/')) {
        images.push(f);
      }
      imgs.push(f.replace('tmp/', ''));
    }
  } else if (igs) {
    if (igs && igs.indexOf('/tmp/')) {
      images.push(igs);
    }
    imgs.push(igs.replace('tmp/', ''));
  }
  req.body.images = imgs;
  console.log("############# lightbox images: " + req.body.images);

  if (!id) {
    var branch = new Branch(req.body);
    if (branch.channel == null) {
      //TODO 渠道从上下文中取
      branch.channel = channelId;//渠道
    }
    branch.images = imgs;
    branch.save(function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据保存成功!');
      }
      fileUtil.moveTmpFiles(images, function (err) {
        if (err) {
          req.flash('warning', "数据保存成功，但移动上传文件时出错，上传文件丢失!");
        }
        res.redirect('/bank/branch/list');
      });
    });
  } else {
    // update
    Branch.update({ '_id': id }, req.body, function (err, result) {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', '数据修改成功!');
      }
      fileUtil.moveTmpFiles(images, function (err) {
        if (err) {
          req.flash('warning', "数据保存成功，但移动上传文件时出错，上传文件丢失!");
        }
        res.redirect('/bank/branch/list');
      });
    });
  }
};


exports.province = function (req, res) {
  Province.find({}, function (err, provinces) {
    res.send(provinces);
    return;
  });
};

exports.city = function (req, res) {
  var provinceCode = req.params.provinceCode || req.query.provinceCode;
  console.log(provinceCode);
  if (!provinceCode) {
    res.send();
    return;
  }
  var q = {};
  var pattern = new RegExp("^" + provinceCode.substring(0, 2) + '.*$');
  q.code = pattern;

  console.log(q);
  City.find(q, function (err, cities) {
    console.log(cities);
    res.send(cities);
    return;
  });
};

exports.district = function (req, res) {
  var cityCode = req.params.cityCode || req.query.cityCode;
  console.log(cityCode);
  if (!cityCode) {
    res.send();
    return;
  }
  var q = {};
  var pattern = new RegExp("^" + cityCode.substring(0, 4) + '.*$');
  q.code = pattern;

  console.log(q);
  District.find(q, function (err, districts) {
    console.log(districts);
    res.send(districts);
    return;
  });
};

/**
 * 是否激活供应商
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Branch.findOne({ '_id': id }, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Branch.update({ '_id': id }, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/bank/branch/list');
        }
      });
    }

  });
};

/**
 * 是否激活供应商
 * @param req
 * @param res
 */
exports.getData = function (req, res) {
  var q = req.body.q || req.param("q");
  var query = {};
  if (q) {
    query.name = { $regex: q }
  }
  query.enabled = true;
  query.channel = req.session.channelId;

  Branch.find(query, function (err, b) {
    var datas = [];
    if (b) {
      b.forEach(function (e) {
        var data = {};
        data.id = e._id;
        data.text = e.name;
        datas.push(data);
      });
    }
    res.send(datas);
  });
};
