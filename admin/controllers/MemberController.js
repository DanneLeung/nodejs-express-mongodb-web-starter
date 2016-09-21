/**
 * Created by ZhangXiao on 2015/6/11.
 */
var mongoose = require('mongoose')
  , Member = mongoose.model('Member')
  , config = require('../../config/config');
var ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');
var excal = require('excel-export');
var fs = require('fs');
var excalUtil = require('../../util/excalUtil');


exports.index = function (req, res) {
  res.render('member/index', {})
};
exports.list = function (req, res) {
  res.render('member/memberList', {})
};

exports.datatable = function (req, res) {
  var name = req.param("name");
  var username = req.param("username");
  var phone = req.param("phone");
  var email = req.param("email");
  var score = req.param("score");

  var querys = {};//添加条件
  if (name != "" && name != undefined) {
    querys.fullname = {$regex: name};//会员名称
  }
  if (username != "" && username != undefined) {
    querys.username = {$regex: username};//会员名称
  }
  if (phone != "" && phone != undefined) {
    querys.mobile = {$regex: phone};//会员手机号
  }
  if (email != "" && email != undefined) {
    querys.email = {$regex: email};//会员email
  }
  if (score != "" && score != undefined) {
    querys.score = {$gte: score};//会员email
  }
  if (req.user) {
    querys.channel = req.user.channelId;
    //会员所属渠道
    Member.dataTable(req.query, {conditions: querys}, function (err, data) {
      res.send(data);
    });
  } else {
    req.flash('error', "请先登录");
    res.send("");
  }

};
/**
 * 删除订单
 * @param req
 * @param res
 */
exports.memberDel = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  Member.remove({'_id': ids}, function (err, result) {
    if (err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/member/list');
    }
  });
};
exports.init = function (req, res) {
  var m = new Member({
    wechatId: ObjectId('56dfd578b1d50db8304459c9'),//微信用户ID
    phone: '15821879171',//手机号码
    name: 'test1',//密码
    email: 'xingjie201@163.com',//密码
    channelId: ObjectId('56e261730a18770001ca6964')//密码
  });
  m.password = "123456";
  m.save(function (err, m) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect('/member/list');
};

/**
 * 导出订单
 * @param req
 * @param res
 */
exports.exportMember = function (req, res) {
  var conf = {};
  conf.cols = [{       //导出文件的标题
    caption: '序号',
    type: 'number'
    , width: 10
  }, {
    caption: '微信用户',
    type: 'string'
    , width: 30
  }, {
    caption: 'openid',
    type: 'string'
    , width: 30
  }, {
    caption: '用户名',
    type: 'string'
    , width: 25
  }, {
    caption: '会员名称',
    type: 'string'
    , width: 25
  }, {
    caption: '手机号',
    type: 'string'
    , width: 25
  }, {
    caption: 'email',
    type: 'string',
    width: 30
  }, {
    caption: '所属渠道',
    type: 'string',
    width: 25
  }, {
    caption: '所属分组',
    type: 'string',
    width: 25
  }];

  getMember(req, res, function (err, orders) {
    conf.rows = orders;     //数据内容
    var result = excal.execute(conf);
    var filename = "Member" + moment().format("YYYYMMDDhhmmss") + ".xlsx";  //生成文件名
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + filename);
    res.end(result, 'binary');
  });
}
function queryMember(querys, callback) {
  var query = Member.find(querys).sort('createdAt');
  query.populate([  //这里将所需信的关联对象查出
    {"path": "wechatId", "select": "nickname"},
    {"path": "channel", "select": "channelName"},
    {"path": "group", "select": "name"}
  ]).exec(function (err, m) {      //查询结果
    if (!err) {
      var order = [];
      var i = 0;
      m.forEach(function (pop) {
        i++;
        var item;
        item = [i
          , pop.wechatId == null ? "" : pop.wechatId.nickname   //微信用户
          , pop.openid ? pop.openid : "需要绑定微信"    //微信用户的openid只有在绑定微信时会显示
          , pop.username     //用户名
          , pop.fullname     //会员名
          , pop.mobile    //手机号
          , pop.email    //email
          , pop.channel == null ? "" : pop.channel.channelName  //渠道名称
          , pop.group == null ? "未分组" : pop.group.name   //所在分组
        ];
        order.push(item);
      });
      callback(err, order);   //返回结果
    }
  });
}

/**
 * 获取订单导出的数据
 * @param req
 * @param res
 * @param callback 回调函数进行返回结果
 */
function getMember(req, res, callback) {
  var name = req.param("name");
  var username = req.param("username");
  var phone = req.param("phone");
  var email = req.param("email");
  var score = req.param("score");
  var channel = req.user.channelId;
  var querys = {};//添加条件

  if (username != "" && username != undefined) {
    querys.username = {$regex: username};//会员名称
  }
  if (name != "" && name != undefined) {
    querys.fullname = {$regex: name};//会员名称
  }
  if (phone != "" && phone != undefined) {
    querys.mobile = {$regex: phone};//会员手机号
  }
  if (email != "" && email != undefined) {
    querys.email = {$regex: email};//会员email
  }
  if (score != "" && score != undefined) {
    querys.score = {$gte: score};//会员email
  }
  querys.channel = channel;//会员所属渠道

  queryMember(querys, function (err, order) {
    if (!err) {
      callback(err, order);
    }
  });
}

/**
 * 是否激活会员
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  var updata = {};
  var options = {};
  var msg = "";
  Member.findOne({'_id': id}, function (err, info) {
    if (!err) {
      if (info.enabled == true) {
        updata.enabled = false;
        msg = "已禁用"
      } else {
        updata.enabled = true;
        msg = "已激活"
      }
      Member.update({'_id': id}, updata, options, function (err, info) {
        if (!err) {
          req.flash('success', msg);
          res.redirect('/member/list');
        }
      });
    }
  });
};
/**
 * 重置会员密码
 * @param req
 * @param res
 */
exports.resetPwd = function (req, res) {
  var id = req.params.id;
  Member.findOne({'_id': id}, function (err, user) {
    if (user) {
      var pwd = user.encryptPassword("123456");
      var updata = {hashed_password: pwd};
      // update
      Member.update({'_id': user._id}, updata, function (err, result) {
        if (err) {
          req.flash('error', err.message);
        } else {
          req.flash('success', '密码已重置成功!');
        }
        res.redirect('/member/list');
      });
    }
  });
};
/**
 * 为选中的微信粉丝分组
 * @param req
 * @param res
 */
exports.setMemberGroup = function (req, res) {
  var ids = req.param("memberIds");
  var groupId = req.param("groupName");
  var update = {"group": groupId};
  var options = {}
  ids = ids.split(",");
  Member.find({'_id': {$in: ids}}, function (err, datas) {
    datas.forEach(function (fans) {
      Member.update({_id: fans._id}, update, options, function (err, docs) {
        if (err) {
          console.log(err);
        }
      });
    });
    res.send("分组已设置");
  });
};

/**
 * 导入会员信息
 * @param req
 * @param res
 */
exports.importMember = function (req, res) {
  var filePath = req.body.filePath || req.params.filePath;
  var channel = req.user.channelId;
  var i = 0;
  var data = excalUtil.readXlsx(filePath, 2);
  if(data == null){
    req.flash('error', "导入文件格式不正确");
  }else {
    data.forEach(function (e) {
      var member = new Member({
        openid: e[1],
        username: e[2],
        fullname: e[3],
        mobile: e[4],
        email: e[5],
        idCardNo: e[6],
        score: e[7],
        channel: channel
      });
      member.save(function (err, m) {
        if (err) {
          console.log(err);
          i += 1;
        } else {
          i += 0;
        }
        if (i > 0) {
          req.flash('error', err.message);
        }
      });
    });
  }
  res.redirect('/member/list');
};