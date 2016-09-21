/**
 * Created by xingjie201 on 2016/2/19.
 * 供应商的Controller
 */

var mongoose = require('mongoose');
var config = require('../../config/config');
var Message = mongoose.model('Message');

/*
 * list
 */
exports.list = function (req, res) {
    Message.find({}, function (err, msg) {
        res.render('system/message/messageList', {
            msg: msg
        })
    })
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
    Message.dataTable(req.query, function (err, data) {
        res.send(data);
    });
};
/**
 * 添加信息
 * @param req
 * @param res
 */
exports.add = function (req, res) {
    res.render('system/message/messageForm', {
        viewType: "add",
        msg: new Message()
    })
};

/**
 * 修改信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
    var id = req.params.id;
    Message.findOne({'_id': id}, function (err, msg) {
        if (err) {
            console.log(err);
            req.flash('error', err);
            res.redirect('/system/message');
        } else {
            res.render('system/message/messageForm', {
                viewType: "edit",
                msg: msg
            })
        }
    });
};

/**
 * 删除信息
 * @param req
 * @param res
 */
exports.del = function (req, res) {
    var ids = req.body.ids || req.params.ids;
    Message.remove({'_id': ids}, function (err, msg) {
        if (err) {
            console.log(err);
            req.flash('error', err);
        } else {
            req.flash('success', '数据删除成功!');
            res.redirect('/system/message');
        }
    });

};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkName = function (req, res) {
    var key = req.query.key;
    var oldKey = req.query.oldKey;
    if (key === oldKey) {
        res.send('true');
    } else {
        Message.count({'key': key}, function (err, result) {
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
    if (!id) {
        var msg = new Message(req.body);
        msg.save(function (err, result) {
            if (err) {
                req.flash('error',err.message);
            } else {
                req.flash('success', '数据保存成功!');
            }
            res.redirect('/system/message');
        });
    } else {
        // update
        Message.update({'_id': id}, req.body, function (err, msg) {
            if (err){
                req.flash('error', err.message);
            }else {
                req.flash('success', '数据修改成功!');
            }
            res.redirect('/system/message');
        });
    }
};
/**
 * 获取供应商填充列表框
 * @param req
 * @param res
 */
exports.getChannelType = function (req, res) {
    Message.find({}, function (err, service) {
        res.send(service);
    });
};
