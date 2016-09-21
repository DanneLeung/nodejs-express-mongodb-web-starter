/**
 * Created by xingjie201 on 2016/2/19.
 * 供应商的Controller
 */

var mongoose = require('mongoose');
var config = require('../../config/config');
var Service = mongoose.model('Service');

/*
 * list
 */
exports.list = function (req, res) {
    Service.find({}, function (err, service) {
        res.render('supplier/service/serviceList', {
            service: service
        })
    })
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
    Service.dataTable(req.query, function (err, data) {
        res.send(data);
    });
};
/**
 * 添加供应商的类别
 * @param req
 * @param res
 */
exports.add = function (req, res) {
    res.render('supplier/service/serviceForm', {
        viewType: "add",
        service: new Service()
    })
};

/**
 * 修改供应商的信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
    var id = req.param("id");
    Service.findOne({'_id': id}, function (err, service) {
        if (err) {
            console.log(err);
            req.flash('error', err);
            res.redirect('/supplier/service');
        } else {
            res.render('supplier/service/serviceForm', {
                viewType: "edit",
                service: service
            })
        }
    });
};
/**
 * 是否激活供应商
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
    var id = req.param("id");
    var updata = {};
    var options = {};
    var msg = "";
    Service.findOne({'_id': id}, function (err, service) {
        if (!err) {
            if (service.enabled == true) {
                updata.enabled = false;
                msg = "已禁用"
            } else {
                updata.enabled = true;
                msg = "已激活"
            }
            Service.update({'_id': id}, updata, options, function (err, service) {
                if (!err) {
                    req.flash('success', msg);
                    res.redirect('/supplier/service');
                }
            });
        }
    });
};

/**
 * 删除供应商
 * @param req
 * @param res
 */
exports.del = function (req, res) {
    var ids = req.body.ids || req.params.ids;
    Service.remove({'_id': ids}, function (err, result) {
        if (err) {
            console.log(err);
            req.flash('error', err);
        } else {
            req.flash('success', '数据删除成功!');
            res.redirect('/supplier/service');
        }
    });

};

/**
 * 检查角色名称是否已经存在^
 */
exports.checkName = function (req, res) {
    var newName = req.query.name;
    var oldName = req.query.oldName;
    if (newName === oldName) {
        res.send('true');
    } else {
        Service.count({name: newName}, function (err, result) {
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
        var service = new Service(req.body);
        service.save(function (err, result) {
            if (err) {
                req.flash('error', err.message);
            } else {
                req.flash('success', '数据保存成功!');
            }
            res.redirect('/supplier/service');
        });
    } else {
        // update
        Service.update({'_id': id}, req.body, function (err, result) {
            if (err) {
                req.flash('error', err.message);
            } else {
                req.flash('success', '数据修改成功!');
            }
            res.redirect('/supplier/service');
        });
    }
};
/**
 * 获取供应商填充列表框
 * @param req
 * @param res
 */
exports.getService = function (req, res) {
    Service.find({}, function (err, service) {
        res.send(service);
    });
};
