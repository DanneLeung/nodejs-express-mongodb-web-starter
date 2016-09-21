/**
 * Created by yu869 on 2016/3/14.
 */
"use strict";

var mongoose = require('mongoose');
var async = require('async');
var config = require('../../config/config');

var fs = require('fs');
var path = require("path");

var PaymentMethod = mongoose.model('PaymentMethod');
var SmsSetting = mongoose.model('SmsSetting');

exports.paymentSetting = function (req, res) {
    res.render('setting/paymentSetting/paymentList');
};

exports.paymentDataTable = function (req, res) {
    var name = req.query.name;
    var enable = req.query.enable;

    console.log("name", "==========================>", name);
    console.log("enable", "==========================>", enable);

    var querys = {};//添加条件
    if (name != "" && name != undefined) {
        querys.name = {$regex: name};//会员名称
    }
    if (enable != "" && enable != undefined) {
        querys.enable = {$regex: enable};//会员手机号
    }
    PaymentMethod.dataTable(req.query, {conditions: querys}, function (err, data) {
        res.send(data);
    });
};

exports.paymentAdd = function (req, res) {
    res.render('setting/paymentSetting/paymentForm', {
        viewType: "add"
    });
};

function changeToArray(Object) {
    if (Object instanceof Array) {
        return Object;
    } else {
        return new Array(Object);
    }
}

exports.paymentSave = function(req, res) {
    var id = req.body.id;
    var paramsName = changeToArray(req.body.paramName);
    var paramsValue = changeToArray(req.body.paramValue);
    var paramsDesc = changeToArray(req.body.paramDesc);
    var checked = changeToArray(req.body.isChecked);
    var required = changeToArray(req.body.isRequired);

    var params = new Array();
    for (var i=0;i<paramsName.length;i++) {
        var param = new Object();
        param.paramName = paramsName[i];
        param.paramValue = paramsValue[i];
        param.paramDesc = paramsDesc[i];
        param.isChecked = checked[i];
        param.isRequired = required[i];
        params.push(param);
    }

    if (!id) {
        var payment = new PaymentMethod(req.body);
        payment.params = params;
        payment.save(function (err, result) {
            if (err) {
                console.log(err);
                console.log("数据添加失败！");
                req.flash('error', '添加失败!');
            } else {
                req.flash('success', '添加成功!');
            }
            res.redirect('/setting/paymentSetting');
        });
    } else {
        req.body.params = params;
        // update
        PaymentMethod.update({'_id': id}, req.body, function (err, result) {
            if (err) {
                console.log("数据修改失败！");
                req.flash('error', '保存失败!');
            } else {
                req.flash('success', '保存成功!');
            }
            res.redirect('/setting/paymentSetting');
        });
    }
};

exports.paymentDel = function(req, res) {
    var id = req.body.ids;
    PaymentMethod.remove({'_id': id}, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/setting/paymentSetting');
        }
    });
};

exports.paymentEdit = function(req, res) {
    var id = req.query.id;
    var type = req.query.type;
    PaymentMethod.findOne({'_id': id}, function (err, paymentMethod) {
        if (err) {
            console.log(err);
        } else {
            res.render('setting/paymentSetting/paymentForm', {
                viewType: type,
                payment: paymentMethod
            });
        }
    });
};

exports.enableOrDisable = function(req, res) {
    var id = req.body.ids;
    PaymentMethod.findOne({'_id': id}, function (err, paymentMethod) {
        var enable = paymentMethod.enable;
        if (enable == '01') {
            enable = '00';
        } else {
            enable = '01';
        }
        paymentMethod.enable = enable;
        paymentMethod.save(function(err, o) {
            res.redirect('/setting/paymentSetting');
        })
    });
};

exports.smsSetting = function(req, res) {
    res.render('setting/smsSetting/smsList');
};

exports.smsDataTable = function(req, res) {
    var name = req.query.name;
    var enable = req.query.enable;

    console.log("name", "==========================>", name);
    console.log("enable", "==========================>", enable);

    var querys = {};//添加条件
    if (name != "" && name != undefined) {
        querys.name = {$regex: name};//会员名称
    }
    if (enable != "" && enable != undefined) {
        querys.enable = {$regex: enable};//会员手机号
    }
    SmsSetting.dataTable(req.query, {conditions: querys}, function (err, data) {
        res.send(data);
    });
};

exports.smsAdd = function(req, res) {
    res.render('setting/smsSetting/smsForm', {
        viewType: "add",
        sms: new SmsSetting()
    });
};

exports.smsSave = function(req, res) {
    var id = req.body.id;
    var paramsName = changeToArray(req.body.paramName);
    var paramsValue = changeToArray(req.body.paramValue);
    var paramsDesc = changeToArray(req.body.paramDesc);
    var checked = changeToArray(req.body.isChecked);
    var required = changeToArray(req.body.isRequired);
    var params = new Array();
    for (var i=0;i<paramsName.length;i++) {
        var param = new Object();
        param.paramName = paramsName[i];
        param.paramValue = paramsValue[i];
        param.paramDesc = paramsDesc[i];
        param.isChecked = checked[i];
        param.isRequired = required[i];
        params.push(param);
    }

    if (!id) {
        var sms = new SmsSetting(req.body);
        sms.params = params;
        console.log("sms", "========================>", sms);
        sms.save(function (err, result) {
            if (err) {
                console.log(err);
                console.log("数据添加失败！");
                req.flash('error', '添加失败!');
            } else {
                req.flash('success', '添加成功!');
            }
            res.redirect('/setting/smsSetting');
        });
    } else {
        console.log("body", "==========================>" + req.body);
        req.body.params = params;
        // update
        SmsSetting.update({'_id': id}, req.body, function (err, result) {
            if (err) {
                console.log("数据修改失败！");
                req.flash('error', '保存失败!');
            } else {
                req.flash('success', '保存成功!');
            }
            res.redirect('/setting/smsSetting');
        });
    }
};

exports.smsDel = function(req, res) {
    var id = req.body.ids;
    SmsSetting.remove({'_id': id}, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/setting/smsSetting');
        }
    });
};

exports.smsEdit = function(req, res) {
    var id = req.params.id;
    var type = req.query.type;
    SmsSetting.findOne({'_id': id}, function (err, sms) {
        if (err) {
            console.log(err);
        } else {
            res.render('setting/smsSetting/smsForm', {
                viewType: type,
                sms: sms
            });
        }
    });
};

/**
 * 是否激活菜单
 * @param req
 * @param res
 */
exports.isEnabled = function (req, res) {
    var id = req.param("id");
    var updata = {};
    var options = {};
    var msg = "";
    SmsSetting.findOne({'_id': id}, function (err, info) {
        if (!err) {
            if (info.enable == true) {
                updata.enable = false;
                msg = "已禁用"
            } else {
                updata.enable = true;
                msg = "已激活"
            }
            SmsSetting.update({'_id': id}, updata, options, function (err, info) {
                if (!err) {
                    req.flash('success', msg);
                    res.redirect('/setting/smsSetting');
                }
            });
        }
    });
};


exports.smsEnableOrDisable = function(req, res) {
    var id = req.body.ids;
    SmsSetting.findOne({'_id': id}, function (err, sms) {
        var enable = sms.enable;
        if (enable == '01') {
            enable = '00';
        } else {
            enable = '01';
        }
        sms.enable = enable;
        sms.save(function(err, o) {
            res.redirect('/setting/smsSetting');
        })
    });
};