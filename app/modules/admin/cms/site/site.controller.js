/**
 * 站点管理
 */
var mongoose = require('mongoose');
var config = require('../../../../../config/config');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;

var moment = require('moment');

var Site = mongoose.model('Site');
var Slide = mongoose.model('Slide');
var Category = mongoose.model('CmsCategory');
var Template = mongoose.model('Template');

/**
 * 站点列表
 * @param req
 * @param res
 */
exports.index = function (req, res) {
  Site.find({}, function (err, sites) {
    if(err) {
      req.flash("error", err);
    }
    res.render('cms/site/list', { sites: sites });
  });
};
/**
 * 新建站点
 * @param req
 * @param res
 */
exports.add = function (req, res) {
  getData(req, function(result) {
    result.site = new Site();
    res.render('cms/site/form', result);
  });
};

exports.edit = function (req, res) {
  var id = req.params.id;
  var q = { _id: id };
  getData(req, function(result) {
    Site.findOne(q).exec(function (err, site) {
      if(handleErr(req, err)) {
        result.site = site;
        res.render('cms/site/form', result);
      } else {
        res.redirect('/site');
      }
    })
  });
  

};

/**
 * 上线下线
 * @param req
 * @param res
 */
exports.enable = function (req, res) {
  var id = req.params.id;
  Site.findOne({_id: id}, (err, site) => {
    if(!err && site) {
      var enable = !site.enabled;
      Site.findOneAndUpdate({_id: id}, {
        '$set': {enabled: enable}
      }, (e, s)  => {
        if(!e && s) {
          req.flash('success', '设置成功!');
        } else {
          req.flash('error', '设置失败!');
        }
        res.redirect('/cms/site/list');
      });
    }
  });
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  Site.remove({ '_id': { $in: ids } }, function (err, result) {
    if(err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/cms/site/list');
    }
  });
};

exports.del = function (req, res) {
  var ids = req.body.ids || req.params.ids;
  ids = ids.split(',');
  Site.remove({ '_id': { $in: ids } }, function (err, result) {
    if(err) {
      console.log(err);
      req.flash('error', err);
    } else {
      req.flash('success', '数据删除成功!');
      res.redirect('/cms/site/list');
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
  // handle checkbox unchecked.Å
  if(!req.body.enabled) req.body.enabled = false;
  if(!req.body.wechat) delete req.body.wechat;

  if(!id) {
    var site = new Site(req.body);
    if(site.enabled) site.publishedAt = Date.now();
    site.save(function (err, newSite) {
      //req, res, err, site, type
      handleSaved(req, res, err, req.body, 'add');
    });
  } else {
    // update
    if(req.body.enabled) req.body.publishedAt = Date.now();
    else req.body.publishedAt = null;
    Site.findByIdAndUpdate(id, req.body, function (err, site) {
      handleSaved(req, res, err, (err ? req.body : site), 'edit');
    });
  }
};

/**
 * 编辑模板
 * @param req
 * @param res
 */
exports.template = function (req, res) {
  var id = req.params.id;
  var q = { _id: id };
  async.waterfall([
    //获取站点
    function(cb) {
      Site.findOne({_id: id}).exec(function (err, site) {
        return cb(err, site);
      });
    }, function (site, cb) {
      //获取模版
      Template.find({}).exec(function(err, templates) {
        return cb(err, {site: site, templates: templates});
      });
    },
    function(results, cb) {
      //获取轮播图
      Slide.enabledList( function (err, slides) {
        results.slides = JSON.stringify(slides);
        results.slide = slides;
        cb(null, results);
      });
    }, function(results, cb) {
      Category.find({  enabled: true }).sort('lineage').exec(function (err, categories) {
        results.categories = JSON.stringify(categories);
        results.category = categories;
        cb(null, results);
      });
    }
  ], function(err, results) {
    if(err) {
      console.log('===========',err);
      req.flash("error", "系统无法编辑");
      return res.redirect('/cms/site/edit'+id);
    }
    //站点还没保存
    if(!results.site) {
      req.flash('error','未找到相应站点');
      return res.redirect('/cms/site/add');
    }
    res.render('cms/site/template', results);
  });
};

/**
 * 复制站点
 * @param req
 * @param res
 */
exports.copy = function (req, res) {
  var id = req.params.id;
  Site.findById(id, function (err, site) {
    if (!err) {
      var copySite = new Site({
        wechat: site.wechat, //使用的微信号
        template: site.template,
        name: site.name + '副本', //名称
        title: site.title + '副本', //标题
        favicon: site.favicon, //站点icon
        logo: site.logo, //站点logo
        domain: site.domain, //绑定域名
        slide: site.slide, //首页轮播
        url: site.url, //平台入口真实url
        qrcode: site.qrcode, //平台入口真实url
        script: site.script, //底部统计代码等
        metas: site.metas, //meta元素
        seoKeywords: site.seoKeywords, //站点seo关键字
        keyword: site.keyword, //触发关键字
        description: site.description, //描述
        copyright: site.copyright, //版权声明
        params:  site.params,
        navigation: site.navigation, //导航
        // pages: [{ type: ObjectId, ref: "Page" }], //子页面
        publishedAt: site.publishedAt,
        enabled: site.enabled //激活
      });
      copySite.save(function (error, newSite) {
        if (!error || !newSite) {
          req.flash('success', '数据复制成功!');
        } else {
          req.flash('error', '数据复制失败!');
        }
        res.redirect('/cms/site');
      });
    }
  })
};


/**
 * 模板保存
 * @param req
 * @param res
 */
exports.templateSave = function (req, res) {
  var id = req.params.id;
  var values = req.body.value;
  var params = [];
  console.log(req.body);
  if(!(values instanceof Array)) {
    if(values) {
      params.push({
        name: req.body.name ? req.body.name : '',
        label: req.body.label ? req.body.label : '',
        value: req.body.value ? req.body.value : '',
        number: req.body.number ? req.body.number : 0,
        moreNum: req.body.moreNum ? req.body.moreNum : 0,
        img: req.body.img ? req.body.img : ''
      })
    }
  } else {
    values.forEach(function(v, i) {
      params.push({
        name: req.body.name[i] ? req.body.name[i] : '',
        label: req.body.label[i] ? req.body.label[i] : '',
        value: v,
        number: req.body.number[i] ? req.body.number[i] : 0,
        moreNum: req.body.moreNum[i] ? req.body.moreNum[i] : 0,
        img: req.body.img[i] ? req.body.img[i] : ''
      })
    });
  }
  Site.findOne({_id: id}).exec(function(e, s) {
    if(!e && s) {
      s.template = req.body.template;
      s.params = params;
      s.save(function(err, site) {
        console.log('----------------err',err);
        if(err || !site) {
          req.flash('error','模版保存失败');
          return res.redirect('/cms/site/template/'+id);
        }
        res.redirect('/cms/site');
      });
    }
  });
}

/**
 * 导航页
 * @param req
 * @param res
 */
exports.navigate = function (req, res) {
  var id = req.params.id;
  getNavData(req, id, function(err, results) {
    if(err) {
      req.flash('error',err);
      return res.redirect('/cms/site');
    }
    res.render('cms/site/navigate', results);
  });
};

/**
 * 导航页
 * @param req
 * @param res
 */
exports.navigateSave = function (req, res) {
  var id = req.params.id;
  var params = [];
  if(req.body.label && req.body.label.length) {
    if(req.body.label instanceof Array) {
      req.body.label.forEach(function(l, i) {
        if(l && req.body.paramsValue && req.body.paramsValue[i]) {
          params.push({
            name: req.body.paramsName && req.body.paramsName[i] ? req.body.paramsName[i] : '',
            label: l,
            value: req.body.paramsValue[i],
            number: req.body.paramsNumber && req.body.paramsNumber[i] ? Number(req.body.paramsNumber[i]) : -1,
            moreNum: req.body.paramsMoreNum && req.body.paramsMoreNum[i] ? Number(req.body.paramsMoreNum[i]) : 15,
          });
        }        
      });
    } else {
      if(req.body.paramsValue) {
        params.push({
          name: req.body.paramsName ? req.body.paramsName : '',
          label: req.body.label,
          value: req.body.paramsValue,
          number: req.body.paramsNumber ? Number(req.body.paramsNumber) : -1,
          moreNum: req.body.paramsMoreNum ? Number(req.body.paramsMoreNum) : 15,
        });
      }
    }
  }
  //params: label, params*
  //内链 {{siteid}}
  var title = req.body.title;
  var nav = [];
  if(title instanceof Array) {
    title.forEach(function(t, i) {
      var link = req.body.link && req.body.link[i] ? req.body.link[i] : '';
      // if(req.body.linkType && req.body.linkType[i] == 'in') {
      //   //内链处理
      //   link = link.replace(/{{siteid}}/g, id);
      // }
      nav.push({
        title: t,
        link: link,
        image: req.body.image[i] ? req.body.image[i] : '',
        iconClass: req.body.iconClass[i] ? req.body.iconClass[i] : '',
        sort: req.body.sort[i] ? req.body.sort[i] : 0
      });
    });
  } else {   
    var link = req.body.link;
    if(link) {
      // if(req.body.linkType && req.body.linkType == 'in') {
      //   //内链处理
      //   link = link.replace(/{{siteid}}/g, id);
      // }
      nav.push({
        title: req.body.title ? req.body.title : '',
        link: link,
        image: req.body.image ? req.body.image : '',
        iconClass: req.body.iconClass ? req.body.iconClass : '',
        sort: req.body.sort ? req.body.sort : ''
      }); 
    }
       
  }
  
  Site.findOneAndUpdate({_id: id}, {
    '$set': {
      navigation: nav,
      params: params
    }
  }, (err, site) => {
    if(!err && site) {
      req.flash('success','添加成功');
      return res.redirect('/cms/site');
    } else {
      getNavData(req, id, function(err, results) {
        req.flash('error','添加失败');
        if(err) {         
          return res.redirect('/cms/site');
        }
        results.site.params = params;
        results.site.navigation = nav;
        res.render('cms/site/navigate', results);
      });
    }
  });
}

/**
 * 处理错误，如果没有错误返回true，可以进行下一步，否则返回false
 * @param req
 * @param res
 * @param err
 * @param msg
 */
function handleErr(req, err, msg) {
  if(err) {
    console.log(err);
    req.flash('error', msg ? msg : err);
    return false;
  }
  return true;
}

// handle object saved
function handleSaved(req, res, err, site, type) {
  if(err) {
    getData(req, function(result) {
      result.site = {
        name: req.body.name,
        title: req.body.title,
        wechat: req.body.wechat,
        domain: req.body.domain,
        template: req.body.template,
        slide: req.body.slide,
        icon: req.body.icon,
        enabled: req.body.enabled,
        script: req.body.script,
        description: req.body.description,
        seoKeywords: req.body.seoKeywords,
        logo: req.body.logo,
        id: req.body.id ? req.body.id : null
      }
      req.flash('error', err ? err : '站点保存失败!');
      res.render('cms/site/form', result);
    });
    // req.flash('error', err ? err : '站点保存失败!');
    // Slide.enabledList( function (err, slides) {
    //   res.render('cms/site/form', {
    //     viewType: type,
    //     site: site
    //   });
    // });
  } else {
    console.log('success');
    var roleId = req.body.roles;
    req.flash('success', '站点保存成功!');
    res.redirect('/cms/site/navigate/' + site._id);
  }
}

//编辑 添加 获取轮播和模板
function getData(req, callback) {
  async.parallel({
    slides: function(cb) {
      Slide.enabledList( function (err, slides) {
        cb(null, slides);
      });
    },
    templates: function(cb) {
      Template.find({}).exec(function(err, templates) {
        return cb(null, templates);
      });
    }
  }, function(err, result) {
   callback(result);
  });
}

//导航需加载
function getNavData(req, id, callback) {
  async.parallel({
    site: function(cb) {
      Site.findOne({_id: id, }).populate('template').exec(function(err, site) {
        if(err) {
         return cb('系统错误', null);
        }
        if(!site) {
          return cb('未找到相应站点', null);
        }
        var temp = null;
        if(site.template && site.template.links && site.template.links.length){
          temp = JSON.stringify(site.template.links);
        }
        site.templates = temp;
        cb(null, site);
      });
    },
    slides: function(cb) {
      Slide.enabledList( function (err, slides) {
        var slidesStr = JSON.stringify(slides);
        cb(null, {jsonData: slides, strData: slidesStr});
      });
    },
    categories: function(cb) {
      Category.find({  enabled: true }).sort('lineage').exec(function (err, categories) {
        var categoriesStr = JSON.stringify(categories);
        cb(null, {jsonData: categories, strData: categoriesStr});
      });
    }
  }, function(err, results) {
    callback(err, results);
  });
}
