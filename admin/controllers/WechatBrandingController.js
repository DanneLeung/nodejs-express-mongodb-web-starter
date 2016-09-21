/**
 * 微信推广控制器
 */
var mongoose = require('mongoose')
  , _ = require('lodash')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , WechatBranding = mongoose.model('WechatBranding')
  , File = mongoose.model('File')
  , BrandSetting = mongoose.model('BrandSetting')
  , WechatFans = mongoose.model('WechatFans')
  , Branch = mongoose.model('Branch')
  , config = require('../../config/config');
var async = require("async");
var fileUtl = require('../../util/file');
var imgUtil = require('../../util/imgutil');
var excalUtil = require('../../util/excalUtil');
var moment = require('moment');
var csv = require('fast-csv');
var fs = require('fs');

exports.index = function (req, res) {
  BrandSetting.findOne({"appid": req.session.wechat.appid}, function(err, result){
    res.render("wechat/branding/index", result);
  });
}

exports.dataTable = function (req, res) {
  //增加公众号条件
  WechatBranding.dataTable(req.query,{conditions: {"wechat": req.session.wechat._id,"user":{$exists: true}}}, function (err, result) {
    res.send(result);
  });
}

/**
 * 保存推广设置信息
 * @param req
 * @param res
 */
exports.save = function (req, res) {
  if(req.body.id != "undefined"){
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'setting', false, function(fs) {
      imgUtil.thumbnail(fs, 120, function(ffs) {
        fileUtl.saveFiles(ffs, function(err, files) {
          if (err) req.flash('warning', '文件保存时发生错误');
          var file = null;
          if(files && files.length > 0){
            file = files[0];//图片Logo处理
          }
          BrandSetting.findOne({"_id": req.body.id}, function(err, brandSetting){
            if (!req.body.auth)
              brandSetting.auth = false;
            else
              brandSetting.auth = true;

            if (!req.body.mobile)
              brandSetting.mobile = false;
            else
              brandSetting.mobile = true;

            if (!req.body.fullname)
              brandSetting.fullname = false;
            else
              brandSetting.fullname = true;

            if (!req.body.idcard)
              brandSetting.idcard = false;
            else
              brandSetting.idcard = true;

            if (!req.body.email)
              brandSetting.email = false;
            else
              brandSetting.email = true;

            if (!req.body.employeeNo)
              brandSetting.employeeNo = false;
            else
              brandSetting.employeeNo = true;

            brandSetting.type = req.body.type;
            if(brandSetting.type == '1'){
              brandSetting.expireSeconds = req.body.expireSeconds;
              brandSetting.sceneStr = null;
            }else if(brandSetting.type == '2'){
              brandSetting.expireSeconds = null;
              brandSetting.sceneStr = req.body.sceneStr;
            }
            if(file != null){
              brandSetting.logo = file;//图片
            }
            brandSetting.title = req.body.title;
            brandSetting.desc = req.body.desc;
            brandSetting.html = req.body.html;
            brandSetting.save(function(e, o){
              if(e){
                req.flash('error', "修改推广信息失败！");
                res.redirect("/wechat/branding/index");
                return;
              }
              req.flash('success', "修改推广信息成功！");
              res.redirect("/wechat/branding/index");
            });
          });
        });
      });
    });
  }else{
    var brandSetting = new BrandSetting(req.body);
    if (!req.body.auth) brandSetting.auth = false;
    if (!req.body.mobile) brandSetting.mobile = false;
    if (!req.body.fullname) brandSetting.fullname = false;
    if (!req.body.idcard) brandSetting.idcard = false;
    if (!req.body.email) brandSetting.email = false;
    brandSetting.appid = req.session.wechat.appid;
    brandSetting.save(function(err, result){
      if(err){
        req.flash('error', "保存推广信息失败！");
        res.redirect("/wechat/branding/index");
        return;
      }
      req.flash('success', "保存推广信息成功！");
      res.redirect("/wechat/branding/index");
    });
  }
};

exports.approved = function(req, res){
  var id = req.params.id;
  if(id == null || id == ''){
    req.flash('error', "审批失败！");
    res.redirect("/wechat/branding/index");
    return;
  }
  WechatBranding.update({"_id": id}, {"approved": true}, function(e, o){
    req.flash('success', "审批成功！");
    res.redirect("/wechat/branding/index");
  });
}

exports.del = function(req, res){
  var id = req.params.id;
  if(id == null || id == ''){
    req.flash('error', "删除失败！");
    res.redirect("/wechat/branding/index");
    return;
  }
  WechatBranding.remove({"_id": id}, function(e, o){
    req.flash('success', "删除成功！");
    res.redirect("/wechat/branding/index");
  });
}

/**
 * 统计申请人员的粉丝
 * @param req
 * @param res
 */
exports.group = function(req, res){
  res.render("wechat/branding/scanlist", {"identifyNo": req.params.identifyNo});
}

exports.wbDataTable = function (req, res) {
  WechatFans.dataTable(req.query,{conditions: {"identifyNo": req.params.identifyNo, "flag": true}}, function (err, result) {
    res.send(result);
  });
}

exports.import = function(req, res){
  fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'employee', false, function(fs) {
    if(fs){
      var data = excalUtil.readXlsx(fs[0].path, 1);
      if(data.length > 0){
        var data = data[0];
        var map = data.data.slice(2);
        var channelId = req.session.channelId;
        var wechat = req.session.wechat._id;
        //获取不重复的机构信息
        var distinctBranch = getDistinctBranchMap(map);
        BrandSetting.findOne({"appid": req.session.wechat.appid}, function(e, bs){
          var settingId = null;
          if(bs != null){
            settingId = bs._id;
          }
          //更新网点的机构号
          processBranch(distinctBranch, channelId, function(){
            //导入白名单，并设置与网点的关联关系
            processWechatBranding(map, channelId, wechat, function(){
              //导入机构白名单
              porcessBSBranch(distinctBranch, channelId, wechat, settingId, req, function(){

              });
            });
          });
        });
        req.flash('success', "上传成功！");
        res.redirect("/wechat/branding/index");
      }
    }
  });
}

function getDistinctBranchMap(map){
  if(!map || map.length == 0){
    return null;
  }
  var distinct = [];
  var contains = function(m, k){
    var bl = false;
    m.forEach(function(o){
      if(o.name+ o.val == k){
        bl = true;
        return;
      }
    });
    return bl;
  }
  map.forEach(function(o){
    if(!contains(distinct, o[2]+o[3])){
      distinct.push({"name": o[2], "val": o[3]});
    }
  });
  return distinct;
}
/**
 * 处理，每个网点下的机构号
 * @param data
 * @param next
 */
function processBranch(data, channelId, next){
  if(data == null){
    return next();
  }
  data.forEach(function(o){
    Branch.findOneAndUpdate({"channel": channelId, "name":{$regex: o.name}},{"no": o.val}, function(e, obj){
    });
  });
  next();
}

/**
 * 导入白名单
 * @param data
 */
function processWechatBranding(data, channelId, wechat, next){
  if(data == null){
    return next();
  }
  data.forEach(function(o){
    Branch.findOne({"no": o[3]}, function(err, b){
      var branchId = null;
      if(b != null){
        branchId = b._id; //网点ID
      }
      var bs = {
        "channel": channelId,
        "user":{
          "fullname": o[1],
          "mobile": o[4],
          "employeeNo": o[0]
        },
        "approved": true, //认证过
        "flag": 1, //用户白名单
        "scanTimes": 0, //扫码次数
        "gainFans": 0, //获粉次数
        "wechat": wechat,
        "enabled": true //启用
      };
      if(branchId != null){
        bs = _.assign(bs, {"branch": branchId});
      }
      WechatBranding.findOne({"user.employeeNo": bs.user.employeeNo}, function(e, o){
        if(o == null){
          new WechatBranding(bs).save((e, o)=>{
          });
        }else{
          WechatBranding.findOneAndUpdate({"user.employeeNo": bs.user.employeeNo}, bs, function(err, obj){});
        }
      });
    });
  });
  next();
}

/**
 * 导入机构白名单
 * @param data
 */
function porcessBSBranch(data, channelId, wechat, settingId, req, next){
  if(data == null){
    return next();
  }
  data.forEach(function(o){
    Branch.findOne({"no": o.val}, function(err, b){
      var branchId = null;
      if(b != null){
        branchId = b._id; //网点ID
      }
      var bs = {
        "channel": channelId,
        "user":{
          "fullname": o.name,
          "employeeNo": o.val
        },
        "approved": true, //认证过
        "flag": 2, //用户白名单
        "scanTimes": 0, //扫码次数
        "gainFans": 0, //获粉次数
        "wechat": wechat,
        "enabled": true //启用
      };
      if(branchId != null){
        bs = _.assign(bs, {"branch": branchId});//增加网点关联
      }
      if(bs.user.employeeNo != null){
        WechatBranding.findOne({"user.employeeNo": bs.user.employeeNo}, function(e, o){
          if(o == null){
            new WechatBranding(bs).save(function(e, wb){
              if(wb != null){
                var url = req.session.contextFront
                    +"/register/share?cid="+req.session.channel.identity
                    +"&brandId="+wb._id
                    +"&settingId="+settingId
                    +"&wid="+req.session.wechat._id;
                console.log(url);
                WechatBranding.findOneAndUpdate({"_id": wb._id},{"url": url},function(){});
              }
            });
          }else{
            WechatBranding.findOneAndUpdate({"user.employeeNo": bs.user.employeeNo}, bs, function(err, obj){
              if(obj != null){
                var url = req.session.contextFront
                    +"/register/share?cid="+req.session.channel.identity
                    +"&brandId="+obj._id
                    +"&settingId="+settingId
                    +"&wid="+req.session.wechat._id;
                console.log(url,"");
                WechatBranding.findOneAndUpdate({"_id": obj._id},{"url": url},function(){});
              }
            });
          }
        });
      }else{
        console.log('un porcess:',bs.user.fullname, bs.user.employeeNo);
      }
    });
  });
  next();
}

exports.qrcodeList = function(req, res){
  res.render("wechat/branding/brandQrCodelist");
}

exports.qrcodeDataTable = function (req, res) {
  //增加公众号条件(机构)
  WechatBranding.dataTable(req.query,{conditions: {"wechat": req.session.wechat._id, "flag": "2"}}, function (err, result) {
    res.send(result);
  });
}

/**
 * 导出白名单
 * @param req
 * @param res
 */
exports.exportCsv = function(req, res){
  var fullname = req.body.fullname;
  var employeeNo = req.body.employeeNo;
  var rangeTime = req.body.rangeTime;
  var startTime;
  var endTime;
  if(rangeTime){
    rangeTime = rangeTime.split(" - ");
    if(rangeTime.length > 0){
      startTime = new Date(rangeTime[0]);
      endTime = new Date(rangeTime[1]);
    }
  }
  console.log('params******************>', fullname, employeeNo, rangeTime, startTime, endTime);
  var query = {"wechat": req.session.wechat._id, "user":{$exists: true}};
  if(fullname){
    query = _.assign(query, {"user.fullname": fullname});
  }else if(employeeNo){
    query = _.assign(query, {"user.employeeNo": employeeNo});
  }
  var buf = new Buffer("姓名,员工号,昵称,扫描时间");
  async.waterfall([function(cb){
    WechatBranding.find(query, function(err, result) {
      if (!err && result && result.length > 0) {
        cb(null, result);
      }else{
        cb(null, []);
      }
    });
  }, function(result, cb){
    if(result.length == 0){
      cb(null, {'wb': [], 'fans': []});
    }else{
      async.map(result, function(wbObj, next){
        //排除扫码时间
        var query = {"identifyNo": wbObj.user.employeeNo, "channelWechat": wbObj.wechat};
        if(startTime && startTime != 'Invalid Date'){
            query = _.assign(query, {"subscribe_time": {$gte: Math.ceil(startTime.getTime() / 1000)}})
        }else if(endTime && endTime != 'Invalid Date'){
            query = _.assign(query, {"subscribe_time": {$lte: Math.ceil(endTime.getTime() / 1000)}})
        }
        WechatFans.find(query, function(e, wf){
          var data = {'wb': wbObj, 'fans': wf};
          next(null, data);
        });
      }, function(err, wbMap){
          //包含粉丝列表(fans)的wb
          cb(null, wbMap);
      });
    }
  }, function(wbMap, cb){
    //循环处理主表和明细表数据，写入buf
    if(wbMap && wbMap.length > 0){
      wbMap.forEach(function(obj){
        var wb = obj.wb;
        var fullname = "";
        if (wb && wb.user && wb.user.employeeNo) fullname = wb.user.fullname
        var employeeNo = "";
        if (wb && wb.user && wb.user.employeeNo) employeeNo = wb.user.employeeNo;
        var label = "\n"+ fullname + "," + employeeNo + ",";
        if(obj.fans && obj.fans.length > 0){
          obj.fans.forEach(function(f){
            var subscribe_time = '';
            if(f.subscribe_time){
              subscribe_time = new moment(f.subscribe_time * 1000).format('YYYY-MM-DD HH:mm:ss');
            }
            var nickname = "";
            if(f.nickname)  nickname =  f.nickname
            buf += label + nickname + "," + subscribe_time;
          });
        }else{
          buf += label + "" + "," + "";
        }
      });
    }
    cb(null, buf);
  }], function(err, buf){
    if(!err){
      res.setHeader('Content-Type', 'application/vnd.openxmlformats');
      res.setHeader("Content-Disposition", "attachment; filename=" + Date.now() + ".csv");
      var str = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(buf)]);
      res.end(str);
    }
  })
}

/**
 * 导出汇总数据
 * @param req
 * @param res
 */
exports.exportTotal = function(req, res){
  var datas = [];
  WechatBranding.count({"user":{$exists: true}, "wechat": req.session.wechat._id},function(err, count){
    if(count > 0){
      var index = 0;
      var pageSize = 500;
      var page = 1;
      var page = parseInt(count / pageSize);
      if(count % pageSize > 0){
        page++;
      }
      var currentPage = 1;
      var total = 0;
      async.whilst(function(){
        return currentPage <= page
      },function(cb){
        WechatBranding.find({"user":{$exists: true}, "wechat": req.session.wechat._id}).skip(index).limit(pageSize).exec(function(e, o){
          console.log(o.length, '抓取数据次数:', currentPage);
          index = currentPage * pageSize;
          //处理数据
          datas = datas.concat(o);
          currentPage++;
          setTimeout(cb, 500);
        })
      },function(err){
        console.log('err=============>',err);
        console.log('分配抓取数据完成，数据总记录数:', datas.length);
        porcess(datas, req, res);
      })
    }else{
      console.log('no data fount...');
    }
  })
}

function porcess(datas, req, res){
  async.map(datas, function(data, cb){
    var o = {};
    o.fullname = data.user.fullname != null ? data.user.fullname : "";
    o.mobile = data.user.mobile != null ? data.user.mobile : "";
    var employeeNo = "";
    if(data.user.employeeNo){
      employeeNo = "'"+data.user.employeeNo;
    }
    o.employeeNo = employeeNo;
    o.createTime = moment(data.createdAt).format('YYYY-MM-DD HH:mm');
    o.exportTime = moment().format('YYYY-MM-DD HH:mm');
    o.gainFans = data.gainFans;
    async.series([function(next){
      WechatFans.count({"channelWechat": req.session.wechat._id, "identifyNo": data.user.employeeNo, "flag": true}, function(e, count){
        if(e){
          o.fansCount = 0;
          next();
        }else{
          o.fansCount = count;
          next();
        }
      });
    },function(next){
      WechatFans.count({"channelWechat": req.session.wechat._id, "identifyNo": data.user.employeeNo, "flag": false}, function(e, count){
        if(e){
          o.cancelCount = 0;
          next();
        }else{
          o.cancelCount = count;
          next();
        }
      });
    }], function(e, obj){
      cb(e, o);
    });
  }, function(err, result){
    if(err){
      console.log(err, result.length);
      return;
    }
      res.setHeader('Content-Type', 'application/vnd.openxmlformats');
      res.setHeader("Content-Disposition", "attachment; filename=" + Date.now() + ".csv");
      var str;
    //导出csv
    csv.write(result, {headers: true, transform: function(row){
      //transfrom 重新设置列标题
      return {
        '姓名': row.fullname,
        '手机号': row.mobile,
        '员工号': row.employeeNo,
        '生成时间': row.createTime,
        '导出时间': row.exportTime,
        '粉丝数': row.fansCount,
        '取消粉丝数': row.cancelCount,
        '粉丝统计': row.gainFans,
      }
    }})
      //.pipe(ws);
    .on('data', function(buf){
      //str += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(buf)]);
      if(str){
        //str+= buf;
        str += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(buf)]);
      }else{
        //str= buf;
        str = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(buf)]);
      }
    }).on('end', function(result){
      res.end(str);
      console.log('end...',result);
    });
  });
}
