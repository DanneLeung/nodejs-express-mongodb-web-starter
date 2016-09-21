/**
 * Created by xingjie201 on 2016/2/19.
 * 供应商的Controller
 */

var mongoose = require('mongoose');
var config = require('../../config/config');
var ServicesType = mongoose.model('ServicesType');

/*
 * list
 */
exports.list = function (req, res) {
    ServicesType.find({}, function (err, type) {
        res.render('supplier/servicesType/servicesTypeList', {
            type: type
        })
    })
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
    ServicesType.dataTable(req.query, function (err, data) {
        res.send(data);
    });
};
/**
 * 添加供应商的类别
 * @param req
 * @param res
 */
exports.add = function (req, res) {
    res.render('supplier/servicesType/servicesTypeForm', {
        viewType: "add",
        type: new ServicesType()
    })
};

exports.edit = function (req, res) {
    var id = req.param("id");
    ServicesType.findOne({'_id': id}, function (err, type) {
        if (err) {
            console.log(err);
            req.flash('error', err);
            res.redirect('/supplier/servicesType');
        } else {
            res.render('supplier/servicesType/servicesTypeForm', {
                viewType: "edit",
                type: type
            })
        }
    });
};

/**
 * 删除供应商的类别
 * @param req
 * @param res
 */
exports.del = function (req, res) {
    var ids = req.body.ids || req.params.ids;
    ServicesType.remove({'_id': ids}, function (err, result) {
        if (err) {
            console.log(err);
            req.flash('error', err);
        } else {
            req.flash('success', '数据删除成功!');
            res.redirect('/supplier/servicesType');
        }
    });

};

/**
 * 获取供应商填充列表框
 * @param req
 * @param res
 */
exports.getServiceType = function (req, res) {
    ServicesType.find({}, function (err, type) {
        res.send(type);
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
        ServicesType.count({name: newName}, function (err, result) {
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
        var type = new ServicesType(req.body);
        type.save(function (err, result) {
            if (err) {
                req.flash('error',err.message);
            } else {
                req.flash('success', '数据保存成功!');
            }
            res.redirect('/supplier/servicesType');
        });
    } else {
        // update
        ServicesType.update({'_id': id}, req.body, function (err, result) {
            if (err) {
                req.flash('error', err.message);
            } else {
                req.flash('success', '数据修改成功!');
            }
            res.redirect('/supplier/servicesType');
        });
    }
};

