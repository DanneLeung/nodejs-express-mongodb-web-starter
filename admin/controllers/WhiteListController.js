/**
 * 站点管理
 */
var mongoose = require('mongoose');
var config = require('../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;
var excalUtil = require('../../util/excalUtil');
var fileUtl = require('../../util/file');

var moment = require('moment');

var WhiteList = mongoose.model('WhiteList');

/**
 * 站点列表
 * @param req
 * @param res
 */
exports.list = function (req, res) {
    res.render('activities/white/list');
};
/**
 * 获取活动列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
    WhiteList.dataTable(req.query, {
        conditions: {
            'channel': req.session.channelId,
            'wechat': req.session.wechat._id
        }
    }, function (err, data) {
        res.send(data);
    });
}


/**
 * 新建站点
 * @param req
 * @param res
 */
exports.add = function (req, res) {
    res.render('activities/white/form', {white: new WhiteList()});
};

/**
 * 修改活动信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
    var id = req.params.id;
    WhiteList.findById(id, function (err, white) {
        if (handleErr(req, err))
            res.render('activities/white/form', {white: white});
        else
            res.redirect('/activities/white/list');
    })
};

/**
 * 删除活动信息
 * @param req
 * @param res
 */
exports.del = function (req, res) {
    var ids = req.body.ids || req.params.ids;
    ids = ids.split(',');
    WhiteList.remove({'_id': {$in: ids}}, function (err, result) {
        if (err) {
            console.log(err);
            req.flash('error', err);
        } else {
            req.flash('success', '数据删除成功!');
            res.redirect('/activities/white/list');
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
    req.body.channel = req.session.channelId;
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'white', true, function (files) {
        setMobiles(req);
        if (!id) {
            req.body.wechat = req.session.wechat;
            var white = new WhiteList(req.body);
            white.save(function (err, white) {
                if (!err) {
                    if (files && files.length > 0) {
                        var data = excalUtil.readXlsx(files[0].path, 1);
                        if (data == null) {
                            req.flash('error', "导入文件格式不正确");
                        } else {
                            impordWhite(data, white);
                        }
                    }
                }
                handleSaved(req, res, err, white, 'add');
            });
        } else {
            // update
            WhiteList.findByIdAndUpdate(id, req.body, function (err, white) {
                if (!err) {
                    if (files && files.length > 0) {
                        var data = excalUtil.readXlsx(files[0].path, 1);
                        if (data == null) {
                            req.flash('error', "导入文件格式不正确");
                        } else {
                            impordWhite(data, white);
                        }
                    }
                }
                handleSaved(req, res, err, (err ? req.body : white), 'edit');
            });
        }
    });
};

/**
 * 处理错误，如果没有错误返回true，可以进行下一步，否则返回false
 * @param req
 * @param res
 * @param err
 * @param msg
 */
function handleErr(req, err, msg) {
    if (err) {
        console.log(err);
        req.flash('error', msg ? msg : err);
        return false;
    }
    return true;
}

// handle object saved
function handleSaved(req, res, err, activities, type) {
    if (err) {
        console.log(err);
        req.flash('error', '数据保存失败!' + err);
        res.render('activities/white/form', {
            viewType: type,
            white: activities
        });
    } else {
        var roleId = req.body.roles;
        req.flash('success', '数据保存成功!');
        res.redirect('/activities/white/list');
    }
}

/**
 * 验证活动名称是否唯一
 * @param req
 * @param res
 */
exports.checkName = function (req, res) {
    var newName = req.query.name;
    var oldName = req.query.oldName;
    if (newName === oldName) {
        res.send('true');
    } else {
        WhiteList.count({'name': newName, channel: req.session.channelId}, function (err, result) {
            if (result > 0) {
                res.send('false');
            } else {
                res.send('true');
            }
        });
    }
};

/**
 * 验证活动名称是否唯一
 * @param req
 * @param res
 */
exports.importWhite = function (req, res) {
    var filePath = req.body.filePath || req.params.filePath;
    var whiteId = req.body.whiteId || req.params.whiteId;

    if (whiteId) {
        var data = excalUtil.readXlsx(filePath, 1);
        if(data == null){
            res.send({code: "0", meg: "导入失败,格式不正确"});
        }else {
            WhiteList.findById(whiteId, function (err, result) {
                if (result) {
                    impordWhite(data, result.list);
                    WhiteList.findByIdAndUpdate(whiteId, result, function (err, activities) {
                        if (!err) {
                            res.send({code: "1", meg: "导入成功"});
                        } else {
                            res.send({code: "0", meg: "导入失败"});
                        }
                    });
                }
            })
        }
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
    WhiteList.findOne({'_id': id}, function (err, info) {
        if (!err) {
            if (info.enabled == true) {
                updata.enabled = false;
                msg = "已下线"
            } else {
                updata.enabled = true;
                msg = "已上线"
            }
            WhiteList.update({'_id': id}, updata, options, function (err, info) {
                if (!err) {
                    req.flash('success', msg);
                    res.redirect('/activities/white/list');
                }
            });

        }
    });
};

/**
 * 获取该白名单的所有手机号
 * @param req
 * @param res
 */
exports.getMobiles = function (req, res) {
    var id = req.params.id;
    WhiteList.findOne({'_id': id}, function (err, w) {
        if (!err) {
            if (w) {
                res.send(w.list)
            } else {
                res.send([]);
            }
        }
    });
};

/**
 * 获取所有白名单
 * @param req
 * @param res
 */
exports.getWhite = function (req, res) {
    WhiteList.find({
        'channel': req.session.channelId,
        'wechat': req.session.wechat._id
    }, function (err, whites) {
        if (whites) {
            res.send(whites);
        }else{
            res.send([]);
        }
    });
};

/**
 * 设置手机号
 * @param req
 */
function setMobiles(req) {
    var mobiles = req.body.mobile;
    req.body.list = [];
    if (mobiles instanceof Array) {
        for (var i = 0; i < mobiles.length; i++) {
            var a = {};
            a.mobile = mobiles[i];
            req.body.list.push(a)
        }
    } else {
        if(mobiles){
            var b = {};
            b.mobile = mobiles;
            req.body.list.push(b)
        }
    }
}
/**
 * 导入白名单的信息
 * @param data 白名单的信息
 * @param whiteList 白名单
 */
function impordWhite(data, whiteList) {
    var i = 0;
    var mobile = -1;
    var name = -1;
    var identity = -1;
    var email = -1;
    data.forEach(function (e) {
        if (i == 0) {
            var index = 0;
            e.forEach(function (a) {
                switch (a) {
                    case "手机号码":
                        mobile = index;
                        break;
                    case "真实姓名":
                        name = index;
                        break;
                    case "身份证":
                        identity = index;
                        break;
                    case "邮箱":
                        email = index;
                        break;
                    default:
                        break;
                }
                index += 1;
            })
        } else {
            var white = {
                mobile: mobile == -1 ? "" : e[mobile],
                name: name == -1 ? "" : e[name],
                identity: identity == -1 ? "" : e[identity],
                email: email == -1 ? "" : e[email]
            };
            whiteList.list.push(white)
        }
        i += 1;
    })
    WhiteList.findByIdAndUpdate(whiteList._id, whiteList, function (err, result) {
        if (err) {
            console.log("err==============", err);
        }
    });
}
