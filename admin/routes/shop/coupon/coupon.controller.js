/**
 * Created by xingjie201 on 2016/2/19.
 * 供应商的Controller
 */
"use strict";
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var config = require('../../../../config/config');
var Coupon = mongoose.model('Coupon');
var CouponList = mongoose.model('CouponList');
var ChannelType = mongoose.model('ChannelType');
var CouponStat = mongoose.model('CouponStat');
var Company = mongoose.model('Company');
var Branch = mongoose.model('Branch');
var excalUtil = require('../../../../util/excalUtil');
var moment = require('moment');
var excal = require('excel-export');
var fs = require('fs');
var async = require('async');
var fileUtl = require('../../../../util/file');
var ShortId = require('shortid');
var _ = require('lodash');

/*
 * list
 */

exports.list = function (req, res) {
  res.render('shop/coupon/couponList', {});
};

exports.couponsDatatable = function (req, res) {
  var type = req.query.type;
  var value = req.query.value;
  var price = req.query.price;
  var needScore = req.query.needScore;

  var querys = {};//添加条件
  if (type) {
    querys.type = {$regex: type};//会员名称
  }
  if (value) {
    querys.value = value;//会员手机号
  }
  if (price) {
    querys.price = price;//会员手机号
  }
  if (needScore) {
    querys.needScore = needScore;//会员手机号
  }
  if (req.user) {
    querys.channel = req.user.channelId;//会员所属渠道
    Coupon.dataTable(req.query, {conditions: querys}, function (err, data) {
      res.send(data);
    });
  } else {
    req.flash('error', "请先登录");
    res.send("");
  }
};


exports.couponsSave = function (req, res) {
  var id = req.body.id;

  if (req.body.enabled == 'on') {
    req.body.enabled = true;
  } else {
    req.body.enabled = false;
  }

  req.body.channel = req.user.channelId;

  if (!id) {
    var coupon = new Coupon(req.body);
    coupon.save(function (err, result) {
      if (err) {
        console.log(err);
      } else {
        req.flash('success', '保存成功!');
        res.redirect('/shop/coupon');
      }
    });
  } else {
    // update
    Coupon.update({'_id': id}, req.body, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        req.flash('success', '保存成功!');
        res.redirect('/shop/coupon');
      }
    });
  }
};
/**
 * 检查券类型的标识是否已经存在^
 */
exports.checkCode = function (req, res) {
  var code = req.query.code;
  var oldCode = req.query.oldCode;
  if (code === oldCode) {
    res.send('true');
  } else {
    Coupon.count({code: code, channel: ObjectId(req.session.channelId)}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

/**
 * 检查券类型名称是否已经存在^
 */
exports.checkName = function (req, res) {
  var newName = req.query.name;
  var oldName = req.query.oldName;
  if (newName === oldName) {
    res.send('true');
  } else {
    Coupon.count({name: newName, channel: ObjectId(req.session.channelId)}, function (err, result) {
      if (result > 0) {
        res.send('false');
      } else {
        res.send('true');
      }
    });
  }
};

exports.couponsCreate = function (req, res) {
  res.render('shop/coupon/couponForm', {
    //viewType: "add"
    coupon: new Coupon()
  });
};
/**
 * 删除券类型时，同时删除旗下的券明细
 * @param req
 * @param res
 */
exports.couponsDel = function (req, res) {
  var id = req.body.ids;
  Coupon.remove({'_id': id}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', '删除失败!');
      res.redirect('/shop/coupon');
    } else {
      CouponList.remove({coupon: id}, function (err, result) {
        if (!err) {
          req.flash('success', '删除成功!');
        } else {
          req.flash('error', '删除失败!');

        }
        res.redirect('/shop/coupon');
      });
    }
  });
};

exports.itemDel = function (req, res) {
  var id = req.body.ids;
  var branchName = req.body.branchName;
  var companyName = req.body.companyName;
  var couponId = req.body.coupon;
  var query = {};
  if (couponId) {
    query.coupon = couponId;
  }
  if (id) {
    query._id = id;
  }
  if (branchName) {
    query.branchName = branchName;
  }
  if (companyName) {
    query.companyName = companyName;
  }
  async.waterfall([function (callback) {
    CouponList.remove(query, function (err, result) {
      callback(err, result);
    });
  }, function (result, dome) {
    if (result) {
      CouponList.count({coupon: couponId}, function (err, count) {
        if (count >= 0) {
          Coupon.findOneAndUpdate({'_id': couponId},
            {"max": count}, {new: true}, function (err, p) {
              console.log("********************* player updated ", err, p);
              dome(err, true);
            });
        } else {
          dome(err, false);
        }
      });
    } else {
      dome(err, false);

    }
  }], function (err, result) {
    if (result) {
      req.flash('success', '删除成功!');
    } else {
      req.flash('error', '删除失败');
    }
    res.redirect('/shop/coupon/item/list/' + couponId);
  });

};

exports.couponsEdit = function (req, res) {
  var id = req.params.id;
  Coupon.findOne({'_id': id}, function (err, coupon) {
    res.render('shop/coupon/couponForm', {
      // viewType: "edit",
      coupon: coupon
    });
  });
};

exports.couponList = function (req, res) {
  var couponId = req.body.couponId || req.params.couponId;
  res.render('shop/coupon/couponItemList', {couponId: couponId});
};

exports.createCoupons = function (req, res) {
  var couponId = req.body.couponId;
  var num = req.body.num;
  Coupon.findOne({'_id': couponId}, function (err, coupon) {
    if (err) {
      console.log(err);
    } else {
      async.waterfall([
        function (callback) {
          var startNum = coupon.currentNo;
          for (var i = 0; i < num; i++) {
            var couponList = new CouponList();
            couponList.channel = req.user.channelId;
            couponList.coupon = couponId;
            couponList.value = coupon.value;
            couponList.price = coupon.price;
            couponList.needScore = coupon.needScore;
            couponList.publishTime = moment();
            couponList.avaliabeBegin = coupon.publishBegin;
            couponList.avaliabeEnd = coupon.publishEnd;
            couponList.getStatus = "01";
            var title = coupon.code + coupon.type;
            couponList.no = pad(title, startNum);

            couponList.save();
            startNum++;
          }
          callback(null, startNum);
        }, function (startNum, callback) {
          Coupon.findByIdAndUpdate(couponId, {
            $set: {
              currentNo: startNum
            }
          }, {new: true}, function () {
            callback(null, "done");
          });
        }
      ], function (err, result) {
        req.flash('success', '发券成功!');
        res.redirect('/shop/coupon/item/list/' + couponId);
      });
    }
  });
};
/**
 * 生成券号
 * @param title 标题
 * @param startNum 唯一数
 * @returns {*}
 */
function pad(title, startNum) {
  var allLen = (title + startNum).length;
  var len = 16;
  while (allLen < len) {
    title = title + "0";
    allLen = (title + startNum).length;
  }
  return title + startNum;
}

exports.couponListDatatable = function (req, res) {
  var no = req.query.no || req.body.no;
  var status = req.query.status || req.body.status;
  var mobile = req.query.mobile || req.body.mobile;
  var couponId = req.body.couponId || req.params.couponId;
  var querys = {};//添加条件
  if (no) {
    querys.no = {$regex: no};//电子券编号
  }
  if (status) {
    querys.getStatus = status;//电子券的状态
  }
  if (mobile) {
    querys.mobile = mobile;//电子券的状态
  }
  if (couponId != undefined) {
    querys.coupon = couponId;
  }
  if (req.user) {

    querys.channel = req.user.channelId;//会员所属渠道
    CouponList.dataTable(req.query, {conditions: querys}, function (err, data) {
      res.send(data);
    });
  } else {
    req.flash('error', "请先登录");
    res.send("");
  }
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
  Coupon.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Coupon.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/shop/coupon');
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
exports.listEnable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  CouponList.findOne({'_id': id}, function (err, coupon) {
    if (!err) {
      if (coupon.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      CouponList.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/shop/coupon/item/list/' + coupon.coupon + '');
        }
      });
    }

  });
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
  var isAdmin = req.user.isAdmin;
  if (isAdmin == true) {
    var channelId = req.user.channelId;
    CouponList.dataTable(req.query, {
      conditions: {
        "channelId": channelId,
        "approvedStatus": {$nin: ["00"]}
      }
    }, function (err, data) {
      res.send(data);
    });
  } else {
    var _id = req.user._id;
    CouponList.dataTable(req.query, {conditions: {"_id": _id}}, function (err, data) {
      res.send(data);
    });
  }
};

/*role list table json datasource*/
exports.statDatatable = function (req, res) {
  saveCouponStat(req, function (err, result) {
    if (!err) {
      CouponStat.dataTable(req.query, {conditions: {"channel": req.session.channelId}}, function (err, data) {
        res.send(data);
      });
    } else {
      res.send({draw: '1', recordsTotal: 0, recordsFiltered: 0, data: []});
    }
  });
};


/*role list table json datasource*/
exports.getCompany = function (req, res) {
  var q = req.body.q || req.param("q");
  Company.find({fullname: {$regex: q}}, function (err, com) {
    var datas = [];
    if (com) {
      com.forEach(function (e) {
        var data = {};
        data.id = e._id;
        data.text = e.fullname;
        datas.push(data);
      });
    }
    res.send(datas);
  });
};

/*role list table json datasource*/
exports.getBranch = function (req, res) {
  var q = req.body.q || req.param("q");
  Branch.find({name: {$regex: q}}, function (err, com) {
    var datas = [];
    if (com) {
      com.forEach(function (e) {
        var data = {};
        data.id = e._id;
        data.text = e.name;
        datas.push(data);
      });
    }
    res.send(datas);
  });
};

/*role list table json datasource*/
exports.getCoupon = function (req, res) {
  var q = req.body.q || req.param("q");
  Coupon.find({name: {$regex: q}}, function (err, com) {
    var datas = [];
    if (com) {
      com.forEach(function (e) {
        var data = {};
        data.id = e._id;
        data.text = e.name;
        datas.push(data);
      });
    }
    res.send(datas);
  });
};

/**
 * 导入券的信息
 * @param req
 * @param res
 */
exports.importCoupon = function (req, res) {
  var couponId = req.body.couponId || req.params.couponId;
  var channel = req.user.channelId;
  fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'coupon', false, function (files) {
    if (files) {
      console.log("*************** read excel begin ...");
      var obj = excalUtil.readXls(files[0].path, 1);
      if (!obj || !obj.length) {
        req.flash('error', "读入");
        return handel(res, couponId);
      }
      console.log("*************** read excel end ...");
      var data = obj[0].data;
      if (data == null) {
        req.flash('error', "导入文件格式不正确");
        handel(res, couponId);
      } else {
        var len = data[0].length;
        if (len == 5) {
          impordNotGainCoupon3(data, channel, couponId, function (err, result) {
            if (err) {
              if (!result) {
                req.flash('error', '数据格式有错误!\n' + err);
              } else {
                var length = result.notImp.length;
                var arr = [];
                if (length > 10) {
                  arr = result.notImp.splice(0, 10);
                } else {
                  arr = result.notImp;
                }
                req.flash('error', "成功导入" + result.len + "条，" + result.miss + "条数据为不全，" + "重复导入券号或手机号" + length + "条,显示10条以内如下：" + arr + ".");
              }
              return handel(res, couponId);
            } else {
              req.flash('success', "券数据成功导入" + result.len + "条！" + result.miss + "条数据为不全");
              handel(res, couponId);
            }
          });
        } else if (len == 4) {
          impordGainCoupon(data, channel, couponId);
          req.flash('success', "善融优惠券已获取的数据导入成功！");
          handel(res, couponId);
        } else {
          req.flash('error', "善融优惠券导入数据失败！");
          handel(res, couponId);
        }
      }
    } else {
      handel(res, couponId);
    }
  });
}

function handel(res, couponId) {
  res.redirect('/shop/coupon/item/list/' + couponId);
}


/**
 * 导入未获取的券信息
 * @param data 券信息的内容
 * @param channel 渠道
 */
function impordNotGainCoupon(data, channel, couponId, callback) {
  var mobile = -1;
  var no = -1;
  var code = -1;
  var bank = -1;
  var company = -1;
  var noArr = [];
  var index = 0;
  if (data.length == 1) {
    return callback(null, noArr);
  }
  data[0].forEach(function (a) { //获取标题的下标
    switch (a) {
      case "手机号码":
        mobile = index;
        break;
      case "电子券编号":
        no = index;
        break;
      case "验证码":
        code = index;
        break;
      case "所属支行":
        bank = index;
        break;
      case "公司名称":
        company = index;
        break;
      default:
        break;
    }
    index += 1;
  })
  data.splice(0, 1);
  async.map(data, function (e, callback) {
    async.waterfall([function (callback) {
      Company.findOneAndUpdate({fullname: e[company]}, {fullname: e[company]}, {upsert: true}, function (err, companys) {
        callback(err, companys);
      });
    }, function (companys, dome) {
      var coupon = {
        mobile: mobile == -1 ? "" : e[mobile],
        no: no == -1 ? "" : e[no],
        code: code == -1 ? "" : e[code],
        branchName: bank == -1 ? "" : e[bank],
        channel: channel,
        coupon: couponId,
        getStatus: '01',
        company: companys._id
      };
      if (companys) {
        coupon.company = companys._id;
        coupon.companyName = companys.fullname
      }
      CouponList.findOneAndUpdate({
        channel: channel,
        $or: [{no: no == -1 ? "" : e[no]}, {mobile: e[mobile]}],
        coupon: couponId
      }, coupon, {upsert: true}, function (err, list) {   //验证券号和手机号是否已经存在
        dome(err, list)
      });
    }], function (err, result) {
      callback(null, e);
    });
  }, function (err, result) {
    if (result) {
      CouponList.count({coupon: ObjectId(couponId)}, function (err, counts) {
        if (counts > 0) {
          Coupon.findOneAndUpdate({'_id': ObjectId(couponId)},
            {"max": counts}, {new: true}, function (err1, p) {
              return callback(err1, noArr); //返回已经存在的券号
            });
        } else {
          return callback(err, noArr); //返回已经存在的券号
        }
      });
    }
  });

}
/**
 * 导入未获取的券信息
 * @param data 券信息的内容
 * @param channel 渠道
 */
function impordNotGainCoupon2(data, channel, couponId, callback) {
  var mobile = -1;
  var no = -1;
  var code = -1;
  var bank = -1;
  var company = -1;
  var noArr = [];
  var index = 0;
  if (data.length == 1) {
    return callback(null, noArr);
  }
  data[0].forEach(function (a) { //获取标题的下标
    switch (a) {
      case "手机号码":
        mobile = index;
        break;
      case "电子券编号":
        no = index;
        break;
      case "验证码":
        code = index;
        break;
      case "所属支行":
        bank = index;
        break;
      case "公司名称":
        company = index;
        break;
      default:
        break;
    }
    index += 1;
  })

  data.splice(0, 1);
  console.log("************************ import coupon begin .... ", moment(new Date()).format("YYYY-MM-DD HH:mm:ss"));
  var iteree = function (e, callback) {
    var comp = {fullname: e[company], channel: channel};
    Company.findOneAndUpdate(comp, comp, {
      upsert: true
    }, function (err, companys) {
      // console.log("jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj===========", companys);
      if (err) {
        console.error(err);
        return callback(null, null);
      } else if (companys) {
        //创建券的信息
        var coupon = {
          mobile: mobile == -1 ? "" : e[mobile],
          no: no == -1 ? "" : e[no],
          code: code == -1 ? "" : e[code],
          branchName: bank == -1 ? "" : e[bank],
          channel: channel,
          coupon: couponId,
          company: companys._id,
          companyName: companys.fullname,
          getStatus: '01'
        };
        CouponList.findOneAndUpdate({
          channel: channel,
          coupon: couponId,
          $or: [{no: no == -1 ? "" : e[no]}, {mobile: e[mobile]}]
        }, coupon, {new: true, upsert: true, setDefaultsOnInsert: true}, function (err, cl) {   //验证券号和手机号是否已经存在
          if (err) {
            console.error(err);
            return callback(null, null);
          }
          console.log("********************** find and update coupon ", moment(new Date()).format("YYYY-MM-DD HH:mm:ss"));
          return callback(null, cl.no);
        });
      }
    });
  };
  async.each(data, iteree, function (err, result) {
    console.log("********************** result ", moment(new Date()).format("YYYY-MM-DD HH:mm:ss"), result);
    if (result && result.length) {
      CouponList.count({coupon: ObjectId(couponId)}, function (err, counts) {
        if (counts > 0) {
          Coupon.findOneAndUpdate({'_id': ObjectId(couponId)},
            {"max": counts}, {new: true}, function (err1, p) {
              return callback(err1, result); //返回已经存在的券号
            });
        } else {
          return callback(err, result); //返回已经存在的券号
        }
      });
    } else {
      return callback(err, result); //返回已经存在的券号
    }
  });

}
/**
 * 导入未获取的券信息
 * @param data 券信息的内容
 * @param channel 渠道
 */
function impordNotGainCoupon3(data, channel, couponId, callback) {
  var mobile = -1;
  var no = -1;
  var code = -1;
  var bank = -1;
  var companyIdx = -1;
  var noArr = [];
  var index = 0;
  if (data.length == 1) {
    return callback(null, noArr);
  }
  data[0].forEach(function (a) { //获取标题的下标
    switch (a) {
      case "手机号码":
        mobile = index;
        break;
      case "电子券编号":
        no = index;
        break;
      case "验证码":
        code = index;
        break;
      case "所属支行":
        bank = index;
        break;
      case "公司名称":
        companyIdx = index;
        break;
      default:
        break;
    }
    index += 1;
  });
  data.splice(0, 1);
  console.log("************************ import coupon begin .... ", moment(new Date()).format("YYYY-MM-DD HH:mm:ss"));
  // validation
  let validate = function (i, e) {
    let error = '';
    let mb = mobile == -1 ? "" : _.replace(_.trim(e[mobile]), '\t\n\r', '');
    if (!mb || mb.length != 11 || !/^1\d{10}$/.test(mb)) {
      error += '第' + (i + 2) + '行手机号码 [' + mb + ']不正确!';
    } else {
      e[mobile] = mb;
    }

    let cno = no == -1 ? "" : _.replace(_.trim(e[no]), '\t\n\r', '');
    if (!cno || cno.length <= 0) {
      error += '\n第' + (i + 2) + '行券号为空!';
    } else {
      e[no] = cno;
    }

    let xcode = code == -1 ? "" : _.replace(_.trim(e[code]), '\t\n\r', '');
    if (!xcode || xcode.length <= 0) {
      error += '\n第' + (i + 2) + '行验证码为空!';
    } else {
      e[code] = xcode;
    }

    return error;
  }

  let companies = {}, cs = [], errors = [];
  for (let i = 0; i < data.length; i++) {
    if (!data[i] || data[i].length < 5) {
      if (data[i].length == 0) {
        break;
      } else {
        continue;
      }
    }
    // validation error.
    let er = validate(i, data[i]);
    if (er != '') {
      errors.push(er);
      continue;
    }

    let fullname = data[i][companyIdx];
    let comp = companies[fullname];
    if (!comp) {
      comp = {channel: channel._id, fullname: fullname};
      companies[fullname] = comp;
      cs.push(comp);
    }
  }

  // check errors;
  if (errors && errors.length) {
    return callback(errors.join('\n'), null);
  }

  async.map(cs, (c1, ccb) => {
    Company.findOne(c1, (err, newCompany) => {
      if (err) console.error(err);
      if (newCompany) {
        ccb(null, newCompany);
      } else {
        var c2 = new Company(c1);
        c2.save((err, newC) => {
          if (err) console.error(err);
          ccb(null, newC);
        });
      }
    })
  }, (err, ccs) => {
    console.log("****************** ccs ", ccs);
    companies = {};
    for (var i in ccs) {
      companies[ccs[i].fullname] = ccs[i];
    }

    let result = [];
    let miss = 0;
    for (var j in data) {
      if (!data[j] || data[j].length < 5) {
        if (data[j].length == 0) {
          break;
        } else {
          miss++;
          continue;
        }
      }
      var e = data[j];
      var fullname = e[companyIdx];
      var cno = (no == -1 ? "" : e[no]) + "";
      if (cno && cno.indexOf('.') >= 0) {
        cno = cno.substr(0, cno.indexOf('.'));
      }

      var cmobile = (mobile == -1 ? "" : e[mobile]) + "";
      if (cmobile && cmobile.indexOf('.') >= 0) {
        cmobile = cmobile.substr(0, cmobile.indexOf('.'));
      }

      var coupon = {
        createdAt: new Date(),
        updatedAt: new Date(),
        channel: channel._id,
        coupon: new ObjectId(couponId),
        mobile: cmobile,
        no: cno,
        code: code == -1 ? "" : e[code],
        branchName: bank == -1 ? "" : e[bank],
        value: 0,//面值
        price: 0,//售价，可能需要使用支付换券
        needScore: 0,//所兑换积分数
        getStatus: '01',
        enabled: true
      };
      var c = companies[fullname];
      if (c) {
        coupon.company = c._id;
        coupon.companyName = fullname;
      }
      console.log("************************ coupon list .... ", moment(new Date()).format("YYYY-MM-DD HH:mm:ss"));
      result.push(coupon);
    }
    var rt = {};
    rt.miss = miss;
    if (result && result.length > 0) {
      mongoose.connection.collections['couponList'].insertMany(result, {ordered: false}, function (err, result) {
        var nos = [];
        if (err) {
          console.error(err);
          err.writeErrors.forEach(function (e) {
            nos.push(e.errmsg.split('key:')[1].split(':')[2].split('}')[0]);
          });
        }
        var len = 0;
        if (result) {
          len = result.insertedCount;
        }
        rt.len = len;
        rt.notImp = nos;
        if (len > 0) {
          Coupon.findOneAndUpdate({'_id': ObjectId(couponId)},
            {$inc: {"max": len}}, {new: true}, function (err1, p) {
              if (nos.length > 0) {
                return callback(err, rt); //返回已经存在的券号
              } else {
                return callback(null, rt); //返回已经存在的券号
              }
            });
        } else {
          if (nos.length > 0) {
            return callback(err, rt); //返回已经存在的券号
          } else {
            return callback(null, rt); //返回已经存在的券号
          }
        }
      });
    } else {
      rt.len = 0;
      rt.notImp = [];
      return callback(err, rt);
    }
  });
}


/**
 * 导入获取到券信息
 * @param data 券信息的内容
 * @param channel 渠道
 */
function impordGainCoupon(data, channel, couponId) {
  var i = 0;
  var no = -1;
  var code = -1;
  var getTime = -1;
  var getStatus = -1;
  data.forEach(function (e) {
    var update = {};
    if (i == 0) {
      var index = 0;
      e.forEach(function (a) {
        switch (a) {
          case "电子券编号":
            no = index;
            break;
          case "验证码":
            code = index;
            break;
          case "获取时间":
            getTime = index;
            break;
          case "状态":
            getStatus = index;
            break;
          default:
            break;
        }
        index += 1;
      })
    } else {
      update.getTime = getTime == -1 ? "" : new Date(e[getTime]);
      var bb = getStatus == -1 ? "" : e[getStatus]
      if (bb == "已使用") {
        update.getStatus = "03";
      } else {
        update.getStatus = "01";
      }
      CouponList.findOneAndUpdate({
        channel: channel,
        no: (no == -1 ? "" : e[no]),
        coupon: couponId
      }, update, function (err, result) {
        if (err) {
          console.log("err=====>>", err);
        }
      });
    }
    i += 1;
  })

}

/**
 * 导出券模板
 * @param req
 * @param res
 */
exports.exportCoupon = function (req, res) {
  console.log("exportCoupon========================================================")
  var conf = {};
  conf.cols = [{       //导出文件的标题
    caption: '手机号',
    type: 'string'
    , width: 20
  }, {
    caption: '电子券编号',
    type: 'string'
    , width: 50
  }, {
    caption: '验证码',
    type: 'string'
    , width: 30
  }, {
    caption: '所属支行',
    type: 'string'
    , width: 30
  }, {
    caption: '公司名称',
    type: 'string'
    , width: 50
  }];
  queryMember(function (err, users) {
    conf.rows = users;     //数据内容
    var result = excal.execute(conf);
    var filename = "Coupon" + moment().format("YYYYMMDDhhmmss") + ".xlsx";  //生成文件名
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + filename);
    res.end(result, 'binary');
  });
}
function queryMember(callback) {
  var coupons = [];
  var item = ["17662666208", "ccb3339449889", "33388", "建设银行上海龙华支行", "鸣泰信息科技股份"];
  var item1 = ["17662666208", "ccb3337544889", "23456", "建设银行上海龙华支行", "鸣泰信息科技股份"];
  var item2 = ["17662666208", "ccb3339874889", "54322", "建设银行上海龙华支行", "鸣泰信息科技股份"];
  coupons.push(item);
  coupons.push(item1);
  coupons.push(item2);
  callback(null, coupons);
}


/**
 * 导出券统计的结果集
 * @param req
 * @param res
 */
exports.exportStatList = function (req, res) {
  var conf = {};
  conf.cols = [{       //导出文件的标题
    caption: '序号',
    type: 'number'
    , width: 10
  }, {
    caption: '券类型',
    type: 'string'
    , width: 50
  }, {
    caption: '面值',
    type: 'number'
    , width: 30
  }, {
    caption: '券售价',
    type: 'number'
    , width: 30
  }, {
    caption: '公司名称',
    type: 'string'
    , width: 50
  }, {
    caption: '未领取数',
    type: 'number',
    width: 30
  }, {
    caption: '已领取数',
    type: 'number',
    width: 30
  }, {
    caption: '已使用数',
    type: 'number',
    width: 30
  }, {
    caption: '总数',
    type: 'number',
    width: 30
  }];
  queryCouponStat(function (err, cs) {
    conf.rows = cs;     //数据内容
    var result = excal.execute(conf);
    var filename = "CouponStat" + moment().format("YYYYMMDDhhmmss") + ".xlsx";  //生成文件名
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + filename);
    res.end(result, 'binary');
  });
}
function queryCouponStat(callback) {
  var query = CouponStat.find({}).sort("createdAt");
  query.populate([  //这里将所需信的关联对象查出
    {"path": "coupon", "select": "name value price"},
    {"path": "company", "select": "fullname"}
  ]).exec(function (err, stats) {
    var couponStats = [];
    if (stats) {
      var i = 1;
      stats.forEach(function (e) {
        var stat = [i, e.coupon.name, e.coupon.value, e.coupon.price.toFixed(2), e.company ? e.company.fullname : "", e.noGain, e.gain, e.used, e.total];
        i += 1;
        couponStats.push(stat);
      });
      callback(err, couponStats);
    } else {
      callback("没有券统计的结果集", []);

    }

  });
}

/**
 * 券的统计
 * @param req
 * @param res
 */
exports.getCouponList = function (req, res) {
  res.render('shop/coupon/couponStat');
}


/**
 * 删除原来的统计数据，保存现有统计的结果
 * @param req
 * @param res
 * @param callback
 */
function saveCouponStat(req, callback) {
  var query = {};
  var channel = req.session.channelId;
  query.channel = channel;
  var coupon = req.body.coupon || req.query.coupon;
  if (coupon) {
    query._id = coupon;
  }

  async.waterfall([function (callback) {
    CouponStat.remove(function (err, result) {
      callback(err, result);
    });
  }, function (result, callback) {
    Coupon.find(query, function (err, doce) {
      callback(err, doce);
    });
  }], function (err, doce) {
    if (!doce || doce.length == 0) {
      callback("没有券的数据", doce);
    } else {
      async.map(doce, function (e, ccb) {
        var id = e._id;
        getCouponById(id, req, function (err, result) { //根据设备获取订单分组文档
          console.log("result$$$$$$$$$$$", result);
          if (result) {
            var stat = {
              channel: ObjectId(channel),
              coupon: id,
              noGain: result.noGain, //未获取
              gain: result.gain, //已获取
              used: result.used,  //已使用
              total: result.total  //已使用
            };
            if (result.company) {
              stat.company = result.company;
            }
            ccb(err, stat)
          } else {
            ccb(err, 0)
          }
        });
      }, function (err, result) {
        if (result && result.length > 0) {
          mongoose.connection.collections['couponStats'].insertMany(result, {ordered: false}, function (err, result) {
            callback(err, result);
          });
        } else {
          callback(err, result);
        }
      });
    }
  });

}


/**
 * 根据休息室的ID获取不同状态的统计 时间为当天
 * @param req
 * @param couponId
 * @param callback 回调函数
 */
function getCouponById(couponId, req, callback) {
  var company = req.body.company || req.query.company;
  var status = req.body.status || req.query.status;
  var times = req.body.times || req.query.times;

  var query = {};
  var initial = {};

  query.coupon = ObjectId(couponId)
  initial.num = 0;
  initial.company = "";
  if (company) {
    query.company = company;
  }
  if (status) {
    query.getStatus = status;
  }
  if (times) {
    var op = times.split(' - ');
    var op1 = new Date(moment(op[0]));
    var op2 = new Date(moment(op[1]));
    query.updatedAt = {$gte: op1, $lt: op2};

  }

  //分组查询数据
  mongoose.connection.collections['couponList'].group({"getStatus": true}, query, initial
    , function (obj, prev) {   //统计每组的数量，支付金额，金额
      prev.num++;
      prev.company = obj.company;
    }
    , true
    , function (err, results) {  //返回结果
      var result =
      {
        total: 0,
        company: '', //公司信息
        noGain: 0, //未获取
        gain: 0, //已获取
        used: 0//已使用

      };
      if (results.length > 0) {

        for (var i in results) {
          switch (results[i].getStatus) {
            case '01':
              result.noGain = results[i].num;
              break;
            case '02':
              result.gain = results[i].num;
              break;
            case '03':
              result.used = results[i].num;
              break;
            default:
              break;
          }
          result.total += results[i].num;
          result.company = results[i].company;
        }
        callback(err, result);
      } else {
        callback(err, result);
      }
    });
}





