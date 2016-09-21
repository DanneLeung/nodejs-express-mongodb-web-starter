/**
 * Created by xingjie201 on 2016/2/19.
 * 供应商的Controller
 */

var mongoose = require('mongoose');
var config = require('../../config/config');
var Contact = mongoose.model('Contact');
var ObjectId = mongoose.Types.ObjectId;

/*
 * list
 */
exports.list = function (req, res) {
    var servicesId=req.params.servicesId;
    Contact.find({}, function (err, contact) {
        res.render('contact/contactList', {
            contact: contact,
            servicesId:servicesId
        })
    })
};


/*role list table json datasource*/
exports.datatable = function (req, res) {
    var servicesId=req.params.servicesId;
    Contact.dataTable(req.query, {conditions: {"type": '2',"servicesId":ObjectId(servicesId)}}, function (err, data) {
        res.send(data);
    });
};
/**
 * 添加供应商的类别
 * @param req
 * @param res
 */
exports.add = function (req, res) {
    var servicesId=req.params.servicesId;
    res.render('contact/contactForm', {
        viewType: "add",
        servicesId:servicesId,
        contact: new Contact()
    })
};

/**
 * 修改供应商的信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
    var id = req.param("id");
    var servicesId=req.params.servicesId;
    Contact.findOne({'_id': id,"servicesId":ObjectId(servicesId)}, function (err, contact) {
        if (err) {
            console.log(err);
            req.flash('error', err);
            res.redirect('/supplier/contact/'+servicesId);
        } else {
            res.render('contact/contactForm', {
                viewType: "edit",
                servicesId:servicesId,
                contact: contact
            })
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
    var servicesId=req.body.servicesId;
    Contact.remove({'_id': ids,"servicesId":ObjectId(servicesId)}, function (err, result) {
        if (err) {
            console.log(err);
            req.flash('error', err);
        } else {
            req.flash('success', '数据删除成功!');
            res.redirect('/supplier/contact/'+servicesId);
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
        Contact.count({name: newName}, function (err, result) {
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
    var servicesId = req.body.servicesId;
    if (!id) {
        var contact = new Contact(req.body);
        contact.save(function (err, result) {
            if (err) {
                console.log("=========================================");
                console.log(err);
                req.flash('error', err.message);
            } else {
                req.flash('success', '数据保存成功!');
            }
            res.redirect('/supplier/contact/'+servicesId);
        });
    } else {
        // update
        Contact.update({'_id': id}, req.body, function (err, result) {
            if (err) {
                req.flash('error', err.message);
            } else {
                req.flash('success', '数据修改成功!');
            }
            res.redirect('/supplier/contact/'+servicesId);
        });
    }
};


//====================================================
//以下为渠道的访问方法
//====================================================
/*
 * list
 */
exports.channelList = function (req, res) {
    var channelId = req.params.channelId;
    Contact.find({}, function (err, contact) {
        res.render('channel/contact/contactList', {
            contact: contact,
            channelId:channelId
        })
    })
};


/*role list table json datasource*/
exports.channelDatatable = function (req, res) {
    var channelId = req.params.channelId;
    Contact.dataTable(req.query, {conditions: {"type": '1',"channelId":ObjectId(channelId)}}, function (err, data) {
        res.send(data);
    });
};
/**
 * 添加供应商的类别
 * @param req
 * @param res
 */
exports.channelAdd = function (req, res) {
    var channelId = req.params.channelId;
    res.render('channel/contact/contactForm', {
        viewType: "add",
        channelId:channelId,
        contact: new Contact()
    })
};

/**
 * 修改供应商的信息
 * @param req
 * @param res
 */
exports.channelEdit = function (req, res) {
    var id = req.param("id");
    var channelId = req.params.channelId;
    Contact.findOne({'_id': id}, function (err, contact) {
        if (err) {
            console.log(err);
            req.flash('error', err);
            res.redirect('/channel/contact/'+channelId);
        } else {
            res.render('channel/contact/contactForm', {
                viewType: "edit",
                channelId:channelId,
                contact: contact
            })
        }
    });
};

/**
 * 删除供应商
 * @param req
 * @param res
 */
exports.channelDel = function (req, res) {
    var ids = req.body.ids || req.params.ids;
    var channelId = req.body.channelId;
    Contact.remove({'_id': ids,'channelId':ObjectId(channelId)}, function (err, result) {
        if (err) {
            console.log(err);
            req.flash('error', err);
        } else {
            req.flash('success', '数据删除成功!');
            res.redirect('/channel/contact/'+channelId);
        }
    });

};

/**
 * 检查角色名称是否已经存在^
 */
exports.channelCheckName = function (req, res) {
    var newName = req.query.name;
    var oldName = req.query.oldName;
    if (newName === oldName) {
        res.send('true');
    } else {
        Contact.count({name: newName}, function (err, result) {
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
exports.channelSave = function (req, res) {
    var id = req.body.id;
    var channelId = req.body.channelId;
    if (!id) {
        var contact = new Contact(req.body);
        contact.save(function (err, result) {
            if (err) {
                console.log("=========================================");
                console.log(err);
                req.flash('error', err.message);
            } else {
                req.flash('success', '数据保存成功!');
            }
            res.redirect('/channel/contact/'+channelId);
        });
    } else {
        // update
        Contact.update({'_id': id}, req.body, function (err, result) {
            if (err) {
                req.flash('error', err.message);
            } else {
                req.flash('success', '数据修改成功!');
            }
            res.redirect('/channel/contact/'+channelId);
        });
    }
};

