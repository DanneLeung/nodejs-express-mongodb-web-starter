/**
 * 线下题目报名
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');

var Quiz = require('./quiz.model');
var QuizPool = require('./quiz.pool.model');

/**
 * 线下题目列表
 * @param req
 * @param res
 */
exports.list = function (req, res) {
    res.render('activities/quiz/list', {poolId: req.params.poolId});
};

/**
 * 获取题目列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
    var poolId = req.params.poolId;
    Quiz.dataTable(req.query, {conditions: {quizPool: poolId}}, function (err, data) {
        res.send(data);
    });
}

/**
 * 获取题目列表
 * @param req
 * @param res
 */
exports.datatables = function (req, res) {
    var poolId = req.params.poolId;
    QuizPool.quizs(poolId, function (quizs) {
        Quiz.dataTable(req.query, {conditions: {_id: {$in: quizs}}}, function (err, data) {
            res.send(data);
        });
    });
}

/**
 * 新建题目
 * @param req
 * @param res
 */
exports.add = function (req, res) {
    res.render('activities/quiz/form', {quiz: new Quiz(), poolId: req.params.poolId});
};

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {

    console.log(req.body);
    var id = req.body.id;
    req.body.channel = req.session.channelId;
    // handle checkbox unchecked.Å
    if (!req.body.multi) req.body.multi = false;
    //处理时间范围
    var titles = req.body.titles;
    var answers = req.body.answer;
    mergeArray(req, titles, answers)
    if (!id) {
        var quiz = new Quiz(req.body);
        quiz.save(function (err, quiz) {
            handleSaved(req, res, err, quiz);
        });
    } else {
        // update
        Quiz.findByIdAndUpdate(id, req.body, function (err, quiz) {
            handleSaved(req, res, err, (err ? req.body : quiz));
        });
    }
};

function mergeArray(req, titles, answers) {
    req.body.options = [];
    if (titles instanceof Array) {
        for (var i = 0; i < titles.length; i++) {
            if (titles[i]) {
                var a = {};
                a.title = titles[i];
                a.answer = contains(answers,i) ? true : false;
                req.body.options.push(a)
            }
        }
    } else {
        if(titles) {
            var b = {};
            b.title = titles;
            b.answer = answers ? true : false;
            req.body.options.push(b)
        }
    }
}

/**
 * 数组元素的验证是否存在
 * @param arr
 * @param obj
 * @returns {boolean}
 */
function contains(arr, obj) {
    var i = arr.length;
    while (i--) {
        if (arr[i] == obj) {
            return true;
        }
    }
    return false;
}

/**
 * 修改题目信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
    var id = req.params.id;
    Quiz.findById(id, function (err, quiz) {
        if (quiz == null) {
            req.flash('error', '此条记录已被删除');
            res.redirect('/add');
            return;
        }
        if (handleErr(req, err))
            res.render('activities/quiz/form', {quiz: quiz, poolId: req.params.poolId});
        else
            res.redirect('/activities/quiz/list/' + req.params.poolId);
    })
};

/**
 * 删除题目信息
 * @param req
 * @param res
 */
exports.del = function (req, res) {
    var ids = req.body.ids || req.params.ids;
    ids = ids.split(',');
    Quiz.remove({'_id': {$in: ids}}, function (err, result) {
        if (err) {
            console.log(err);
            req.flash('error', err);
        } else {
            req.flash('success', '数据删除成功!');
            res.redirect('/activities/quiz/list/' + req.params.poolId);
        }
    });
};


/**
 * 验证名称是否唯一
 * @param req
 * @param res
 */
exports.checkName = function (req, res) {
    var newName = req.query.title;
    var oldName = req.query.oldName;
    var poolId = req.query.poolId;
    if (newName === oldName) {
        res.send('true');
    } else {
        Quiz.count({'title': newName, quizPool: poolId}, function (err, result) {
            if (result > 0) {
                res.send('false');
            } else {
                res.send('true');
            }
        });
    }
};


/**
 * 是否上线
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
    var id = req.params.id;
    var updata = {};
    var options = {};
    var msg = "";
    Quiz.findOne({'_id': id}, function (err, info) {
        if (!err) {
            if (info.enabled == true) {
                updata.enabled = false;
                msg = "已禁用"
            } else {
                updata.enabled = true;
                msg = "已激活"
            }
            Quiz.update({'_id': id}, updata, options, function (err, re) {
                if (!err) {
                    req.flash('success', msg);
                    res.redirect('/activities/quiz/list/' + info.quizPool);
                }
            });

        }
    });
};

/**
 * 是否上线
 * @param req
 * @param res
 */
exports.multi = function (req, res) {
    var id = req.params.id;
    var updata = {};
    var options = {};
    var msg = "";
    Quiz.findOne({'_id': id}, function (err, info) {
        if (!err) {
            if (info.multi == true) {
                updata.multi = false;
                msg = "已禁用"
            } else {
                updata.multi = true;
                msg = "已激活"
            }
            Quiz.update({'_id': id}, updata, options, function (err, re) {
                if (!err) {
                    req.flash('success', msg);
                    res.redirect('/activities/quiz/list/' + info.quizPool);
                }
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
function handleSaved(req, res, err, quiz) {
    console.log(quiz);
    if (err) {
        console.log(err);
        req.flash('error', '题目保存失败!' + err);
        res.render('activities/quiz/form', {
            quiz: quiz == null ? new quiz : quiz, poolId: req.body.quizPool
        });
    } else {
        req.flash('success', '题目保存成功!');
        res.redirect('/activities/quiz/list/' + req.body.quizPool);
    }
}
