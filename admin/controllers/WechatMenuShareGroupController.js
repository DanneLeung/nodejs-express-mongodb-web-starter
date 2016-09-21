/**
 * Created by ZhangXiao on 2019/9/12.
 * 分享朋友圈统计
 */
var mongoose = require('mongoose')
  , WechatMenuShare = mongoose.model('WechatMenuShare')
  , WechatMenuShareGroup = mongoose.model('WechatMenuShareGroup')
  , config = require('../../config/config');
var csv = require('fast-csv');

/**
 * 进入分享统计界面
 * @param req
 * @param res
 */
exports.list = function (req, res) {
  res.render('wechat/shareGroup/list')
}

exports.datatable = function (req, res) {
  WechatMenuShareGroup.dataTable(req.query, {
    conditions: {
      'wechat': req.session.wechat._id
    }
  },function (err, data) {
    res.send(data);
  });
}

/**
 * 时时统计数据
 * @param req
 * @param res
 */
exports.groupData = function (req, res) {
  var dateRange = req.body.dateRange;
  if(!dateRange){
    res.redirect('/wechat/shareGroup/list');
    return;
  }
  var range = dateRange.split(" - ");
  WechatMenuShareGroup.groupData({"startDate": range[0], "endDate": range[1]},
    req.session.wechat._id, function(err, obj){
      if(err){
        console.log(err)
      }
      res.redirect('/wechat/shareGroup/list')
  })
};

/**
 * 查看明细
 * @param req
 * @param res
 */
exports.detail = function (req, res) {
  var id = req.params.id;
  if(!id){
    req.flash("error", "查看明细失败")
    res.redirect('/wechat/shareGroup/list');
    return;
  }
  WechatMenuShareGroup.findOne({'_id': id}, function (err, group) {
    if (err) {
      console.log(err);
      req.flash('error', err);
      res.redirect('/wechat/shareGroup/list');
    } else {
      res.render('wechat/shareGroup/detail', {
        //viewType: "edit",
        fansId: group.wechatFans,
        dateRange: group.shareDateRange
      })
    }
  });
};

/**
 * 查看明细datatable
 * @param req
 * @param res
 */
exports.detailDatatable = function(req, res){
  var dateRange = req.query.dateRange;
  var fansId = req.query.fansId;
  var range = dateRange.split(" - ");
  WechatMenuShare.dataTable(req.query, {
    conditions: {
      'wechat': req.session.wechat._id,
      'wechatFans': fansId,
      'shareDate': {$gte: range[0], $lte: range[1]}
    }
  },function (err, data) {
    res.send(data);
  });
}

/**
 * 导出统计数据
 * @param req
 * @param res
 */
exports.export = function(req, res){
  WechatMenuShareGroup.find({"wechat": req.session.wechat._id}, (err, result)=>{
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + Date.now() + ".csv");
    var str;
    //导出csv
    csv.write(result, {headers: true, transform: function(row){
        //transfrom 重新设置列标题
        return {
          '昵称': row.nickname,
          '转发次数': row.count,
          '统计时段': row.shareDateRange
        }
      }})
      .on('data', function(buf){
        if(str){
          str += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(buf)]);
        }else{
          str = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(buf)]);
        }
      }).on('end', function(result){
      res.end(str);
      console.log('export csv end...');
    });
  })
}

/**
 * 导出明细
 * @param req
 * @param res
 */
exports.exportDetail = function(req, res){
  var dateRange = req.query.dateRange;
  console.log('dateRange=============>', dateRange, req.query.fansId)
  var range = dateRange.split(' - ');
  WechatMenuShare.find({"wechat": req.session.wechat._id, "wechatFans": req.query.fansId, "shareDate": {$gte: range[0], $lte: range[1]}}, (err, result)=>{
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + Date.now() + ".csv");
    var str;
    //导出csv
    csv.write(result, {headers: true, transform: function(row){
        //transfrom 重新设置列标题
        return {
          '昵称': row.nickname,
          '界面描述': row.desc,
          '转发链接': row.link,
          '转发时间': row.shareTime
        }
      }})
      .on('data', function(buf){
        if(str){
          str += Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(buf)]);
        }else{
          str = Buffer.concat([new Buffer('\xEF\xBB\xBF', 'binary'), new Buffer(buf)]);
        }
      }).on('end', function(result){
      res.end(str);
      console.log('export csv end...');
    });
  })
}

