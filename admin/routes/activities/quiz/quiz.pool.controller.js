/**
 * 线下题库报名
 */
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var async = require('async');
var moment = require('moment');
var excalUtil = require('../../../../util/excalUtil');
var fileUtl = require('../../../../util/file');

var QuizPool = require('./quiz.pool.model');
var Quiz = require('./quiz.model');

/**
 * 题库列表
 * @param req
 * @param res
 */
exports.list = function (req, res) {
    res.render('activities/quiz/poolList', {});
};

/**
 * 获取题库列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
    QuizPool.dataTable(req.query, {conditions: {'channel': req.session.channelId}}, function (err, data) {
        res.send(data);
    });
}

/**
 * 新建题库
 * @param req
 * @param res
 */
exports.add = function (req, res) {
    res.render('activities/quiz/poolForm', {quiz: new QuizPool()});
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
    if (!req.body.count) req.body.count = 10;
    fileUtl.saveUploadFiles(req.files, req.session.channel.identity, 'quizPool', true, function (files) {
        console.log("req.files==========================",req.files.type)
        if (!id) {
            var quiz = new QuizPool(req.body);
            quiz.save(function (err, quiz) {
                if (quiz) {
                    if (files && files.length > 0) {
                        var data = excalUtil.readXlsx(files[0].path, 1);
                        if (data == null) {
                            req.flash('error', "导入文件格式不正确");
                        } else {
                            impordWhite(data, quiz._id);
                        }
                    }
                }
                handleSaved(req, res, err, quiz);
            });
        } else {
            // update
            QuizPool.findByIdAndUpdate(id, req.body, function (err, quiz) {
                if (quiz) {
                    if (files && files.length > 0) {
                        var data = excalUtil.readXlsx(files[0].path, 1);
                        if (data == null) {
                            req.flash('error', "导入文件格式不正确");
                        } else {
                            impordWhite(data, quiz._id);
                        }
                    }
                }
                handleSaved(req, res, err, (err ? req.body : quiz));
            });
        }
    })
};

/**
 * 修改题库信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
    var id = req.params.id;
    QuizPool.findById(id, function (err, quiz) {
        if (quiz == null) {
            req.flash('error', '此条记录已被删除');
            res.redirect('/add');
            return;
        }
        if (handleErr(req, err))
            res.render('activities/quiz/poolForm', {quiz: quiz});
        else
            res.redirect('/activities/quiz/pool');
    })
};

/**
 * 删除题库信息
 * @param req
 * @param res
 */
exports.del = function (req, res) {
    var ids = req.body.ids || req.params.ids;
    ids = ids.split(',');
    QuizPool.remove({'_id': {$in: ids}}, function (err, result) {
        if (err) {
            console.log(err);
            req.flash('error', err);
        } else {
            Quiz.remove({'quizPool': {$in: ids}}, function (err, result) {
                if (err) {
                    console.log("err===", err);
                    req.flash('error', err);
                } else {
                    req.flash('success', '数据删除成功!');
                }
            })
            req.flash('success', '数据删除成功!');
            res.redirect('/activities/quiz/pool');
        }
    });
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
    QuizPool.findOne({'_id': id}, function (err, info) {
        if (!err) {
            if (info.enabled == true) {
                updata.enabled = false;
                msg = "已禁用"
            } else {
                updata.enabled = true;
                msg = "已激活"
            }
            QuizPool.update({'_id': id}, updata, options, function (err, info) {
                if (!err) {
                    req.flash('success', msg);
                    res.redirect('/activities/quiz/pool');
                }
            });

        }
    });
};


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
        QuizPool.count({'name': newName, channel: req.session.channelId}, function (err, result) {
            if (result > 0) {
                res.send('false');
            } else {
                res.send('true');
            }
        });
    }
};

/**
 * 获取正在使用的题库
 * @param req
 * @param res
 */
exports.getQuizPools = function (req, res) {
    QuizPool.find({channel: req.session.channelId}, function (err, pool) {
        if (pool) {
            res.send(pool);
        } else {
            res.send([]);
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
        req.flash('error', '题库保存失败!' + err);
        res.render('activities/quiz/poolForm', {
            quiz: quiz == null ? new QuizPool() : quiz
        });
    } else {
        var poolId = req.body.roles;
        req.flash('success', '题库保存成功!');
        res.redirect('/activities/quiz/pool');
    }
}

/**
 * 题库的导入并保存
 * @param data 题库的保存
 * @param poolId 题库的Id
 */
function impordWhite(data, poolId) {
    var i = 0;
    var title = -1;
    var description = -1;
    var multi = -1;
    var level = -1;
    var score = -1;
    var answer = -1;
    var option1 = -1;
    var option2 = -1;
    var option3 = -1;
    var option4 = -1;
    var option5 = -1;
    data.forEach(function (e) {
        if (i == 0) {
            var index = 0;
            e.forEach(function (a) {
                switch (a) {
                    case "题目标题":
                        title = index;
                        break;
                    case "题目描述":
                        description = index;
                        break;
                    case "是否多选":
                        multi = index;
                        break;
                    case "难度":
                        level = index;
                        break;
                    case "分数":
                        score = index;
                        break;
                    case "题目答案":
                        answer = index;
                        break;
                    case "选项A":
                        option1 = index;
                        break;
                    case "选项B":
                        option2 = index;
                        break;
                    case "选项C":
                        option3 = index;
                        break;
                    case "选项D":
                        option4 = index;
                        break;
                    case "选项E":
                        option5 = index;
                        break;
                    default:
                        break;
                }
                index += 1;
            })
        } else if (data.length-1 >= i) {
            var q = {
                title: title == -1 ? "" : e[title],
                description: description == -1 ? "" : e[description],
                multi: multi == -1 ? false : e[multi] == "是" ? true : false,
                level: level == -1 ? 1 : e[level],
                score: score == -1 ? 1 : e[score]
            };
            var answer1 = e[answer]?e[answer]:"ABCDE";
            var quiz = new Quiz(q);
            if (e[option1]) {
                var a = 'A';
                var an = answer1.indexOf(a);
                var option = {
                    title: e[option1],
                    answer: an >= 0 ? true : false
                }
                quiz.options.push(option)
            }
            if (e[option2]) {
                var b = 'B';
                var bn = answer1.indexOf(b);
                var option = {
                    title: e[option2],
                    answer: bn >= 0 ? true : false
                }
                quiz.options.push(option)
            }
            if (e[option3]) {
                var c = 'C';
                var cn = answer1.indexOf(c);
                var option = {
                    title: e[option3],
                    answer: cn >= 0 ? true : false
                }
                quiz.options.push(option)
            }
            if (e[option4]) {
                var d = 'D';
                var dn = answer1.indexOf(d);
                var option = {
                    title: e[option4],
                    answer: dn >= 0 ? true : false
                }
                quiz.options.push(option)
            }
            if (e[option5]) {
                var E = 'E';
                var en = answer1.indexOf(E);
                var option = {
                    title: e[option5],
                    answer: en >= 0 ? true : false
                }
                quiz.options.push(option)
            }
            quiz.quizPool = poolId;
            quiz.save(function (err, quiz) {
                if (err) {
                    console.log("err============", i, err);
                }
            });
        }
        i += 1;
    })

}


/**
 * 查找指定角色的权限
 * @param req
 * @param res
 */
exports.quizs = function (req, res) {
    var poolId = req.params.poolId;
    console.log("QuizPoolID: " + poolId);
    if (!poolId) {
        res.send({});
    } else {
        QuizPool.quizs(poolId, function (quizs) {
            res.send(quizs);
        });
    }

};

/**
 * 指定题目
 * @param req
 * @param res
 */
exports.addQuizs = function (req, res) {
    var poolId = req.body.poolId || req.params.poolId;
    var ids = req.body.ids || req.params.ids;
    if(ids){
        ids = ids.split(",");
    }
    if (!poolId) {
        res.send({});
    } else {
        QuizPool.addQuizs(poolId, ids, function (err, pool) {
            if (err) {
                req.flash('error', '为题库指定题目失败!');
            } else {
                req.flash('success', '为题库指定题目成功');
            }
            res.redirect('/activities/quiz/list/' + poolId);
        });
    }
};
/**
 * 指定题目
 * @param req
 * @param res
 */
exports.revokeQuizs = function (req, res) {
    var poolId = req.body.poolId || req.params.poolId;
    var ids = req.body.ids || req.params.ids;
    ids = ids.split(",");
    console.log("Revoke quizs with QuizPoolID: " + poolId + ", PermissionIds: " + ids);
    if (!poolId) {
        res.send({});
    } else {
        QuizPool.revokeQuizs(poolId, ids, function (err, pool) {
            if (err) {
                req.flash('error', '移除指定题目失败!');
            } else {
                req.flash('success', '移除指定题目成功');
            }
            res.redirect('/activities/quiz/list/' + poolId);
        });
    }
};
