/**
 * 短连接管理
 */
var mongoose = require('mongoose');
var config = require('../../config/config');
var ObjectId = mongoose.Types.ObjectId;
var ShortUrl = mongoose.model('ShortUrl');

/**
 * 短链接列表
 * @param req
 * @param res
 */
exports.list = function (req, res) {
    res.render('wechat/shortUrl/list');
    //res.redirect('https://www.baidu.com');
    //res.writeHead(200, {'content-type': 'text/html'});
    //res.end("<script>window.location.href='https://www.baidu.com/'</script>");
};

/**
 * 跳转长链接
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.redirectUrl = function(req, res, next){
    var url = req.headers.referer;
    if(url){
        url = url.replace("//","#");
        var len = url.indexOf("/");
        var host = url.substr(0, len).replace("#","//");//域名
        var shortUrl = url.substr(len);//短链接
        var query = {//"channel": req.session.channelId, "wechat": req.session.wechat._id,
            "host": host, "shortUrl": shortUrl};
        ShortUrl.findOne(query, function(e, o){
            if(!e && o != null){
                res.redirect(o.longUrl);
                return;
            }else{
                return next();
            }
        });
    }else{
        return next();
    }
}

/**
 * 获取活动列表
 * @param req
 * @param res
 */
exports.datatable = function (req, res) {
    ShortUrl.dataTable(req.query, {
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
    var url = new ShortUrl();
    url.isNew = true;
    res.render('wechat/shortUrl/form', {sUrl: url});
};

/**
 * 修改活动信息
 * @param req
 * @param res
 */
exports.edit = function (req, res) {
    var id = req.params.id;
    ShortUrl.findById(id, function (err, url) {
        if (handleErr(req, err))
            res.render('wechat/shortUrl/form', {sUrl: url});
        else
            res.redirect('/wechat/shortUrl/list');
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
    ShortUrl.remove({'_id': {$in: ids}}, function (err, result) {
        if (err) {
            console.log(err);
            req.flash('error', err);
        } else {
            req.flash('success', '数据删除成功!');
            res.redirect('/wechat/shortUrl/list');
        }
    });
};

function getHost(longUrl){
    var perFix = "";
    if(longUrl){
        if(longUrl.indexOf("http://") > -1){
            perFix = "http://";
            longUrl = longUrl.substr(perFix.length);
        }else if(longUrl.indexOf("https://") > -1){
            perFix = "https://";
            longUrl = longUrl.substr(perFix.length);
        }
        var host = longUrl.substr(0, longUrl.indexOf('/'));
        return perFix + host;
    }
    return "";
}

/**
 * 新增或编辑时保存数据
 * @param req
 * @param res
 */
exports.save = function (req, res) {
    var id = req.body.id;
    req.body.channel = req.session.channelId;
    req.body.wechat = req.session.wechat;
    var shortId = require("shortid");
    req.body.shortUrl = shortId.generate();//更新短链接
    var expireTime = req.body.expireTime;
    if(expireTime){
        expireTime = new Date(expireTime + " 23:59:00");
        req.body.expireTime = expireTime;
    }
    if (!id) {
        ShortUrl.long2ShortUrl(req.body, function(err, obj){
            handleSaved(req, res, err, (err ? req.body : obj), '');
        });
    } else {
        // update
        ShortUrl.findByIdAndUpdate(id, req.body, function (err, obj) {
            handleSaved(req, res, err, (err ? req.body : obj), 'edit');
        });
    }
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
function handleSaved(req, res, err, url, type) {
    if (err) {
        console.log(err);
        req.flash('error', '数据保存失败!' + err);
        res.render('wechat/shortUrl/form', {
            viewType: type,
            url: url
        });
    } else {
        req.flash('success', '数据保存成功!');
        res.redirect('/wechat/shortUrl/list');
    }
}

exports.check = function(req, res){
    var longUrl = req.query.longUrl[1];
    console.log(longUrl, longUrl.indexOf('http://'), longUrl.indexOf('https://'));
    if(longUrl.indexOf('http://') > -1 || longUrl.indexOf('https://') > -1){
        res.send('true');
    }else{
        res.send('false');
    }
}
