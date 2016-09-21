/**
 * Created by ZhangXiao on 2015/6/11.
 */
var mongoose = require('mongoose')
    , MemberScore = mongoose.model('MemberScore')
    , config = require('../../config/config');
var ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');
var excal = require('excel-export');
var fs = require('fs');
var excalUtil = require('../../util/excalUtil');


exports.list = function (req, res) {
    res.render('member/memberScoreList', {})
};

exports.datatable = function (req, res) {
    var querys = {};
    var username = req.query.username;//会员名
    var mobile = req.query.mobile;//手机
    var idCardNo = req.query.idCardNo;//身份证
    querys.channel = req.user.channelId;
    if ((username != "" && username != undefined) || (mobile != "" && mobile != undefined) || (idCardNo != "" && idCardNo != undefined)) {
        var dataa = [];
        MemberScore.dataTable(req.query, {conditions: querys}, function (err, data) {
            MemberScore.find().populate([{
                path: 'member',
                select: 'username mobile idCardNo',
                match: {$or: [{username: username}, {mobile: mobile}, {idCardNo: idCardNo}]}
            },
                {
                    path: 'action',
                    select: 'code name'
                }]).exec(function (err, score) {
                score.forEach(function (e) {
                    if (e.member != null) {
                        dataa.push(e);
                    }
                });
                data.data = dataa;
                res.send(data);
            });
        });
    } else {
        //会员所属渠道
        MemberScore.dataTable(req.query, {conditions: querys}, function (err, data) {
            res.send(data);
        });

    }
};
