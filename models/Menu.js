/**
 * 系统菜单
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var _ = require('lodash');

var MenuSchema = mongoose.Schema({
  parentId: {type: ObjectId, ref: "Menu"},    //上级菜单
  children: [{type: ObjectId, ref: "Menu"}],    //上级菜单
  module: {type: ObjectId, ref: "Module"},    //所属模块，模块禁用后菜单也不可以使用
  //type: {type: String, required: true, default: ""},     //菜单类型（如头部菜单“01”，侧边栏菜单“02”）
  code: {type: String, required: true, default: ""}, // 菜单标识
  title: {type: String, required: true, default: ""}, // 菜单标题
  link: {type: String, required: false, index: true, default: ""},   // 菜单链接（关联权限）
  iconClass: {type: String, default: ''},//图表class
  sort: {type: Number, required: false, default: 0},   // 菜单排序，同级
  maxSort: {type: Number, required: false, default: 0},   // 同级最大排序号
  depth: {type: Number, required: false, default: 1},   // 深度
  lineage: {type: String, required: false, default: ""},//页路径
  leaf: {type: Boolean, default: true},    //叶节点，true时无子节点
  topNav: {type: Boolean, default: false},    //顶置菜单
  enabled: {type: Boolean, default: true} // 激活
}, {timestamps: {}, minimize: false});

/**
 * Pre-save hook
 */
MenuSchema.pre('save', function (next) {
  this.updateRefs(function (menu) {
    next();
  });
});

//MenuSchema.pre('update', function () {
//  console.log("############### menu post update .");
//});

MenuSchema.post('remove', function (m) {
  console.log("############### menu post remove .");
  if (m.parentId) {
    m.populate("parentId", function (err, cur) {
      var parent = cur.parentId;
      parent.children = _.pullAllWith(parent.children, [cur._id], _.isEqual);
      parent.save();
    });
  } else {
  }
});

MenuSchema.statics.maxSort = function (parentId, done) {
  Menu.aggregate({$match: {parentId: parentId}})
    .group({_id: null, maxBalance: {$max: '$sort'}})
    .select('sort')
    .exec(function (err, res) {
      if (err) console.log(err);
      console.log(res); //
      done(res);
    });
};

MenuSchema.methods.updateRefs = function (done) {
  if (this.parentId) {
    if (this.isNew) {
      var cur = this;
      Menu.findOne({'_id': cur.parentId}).exec(function (err, parent) {
        if (err) {
          console.log("new menu update refs err: " + err);
          return done(null);
        }

        var depth = 1;
        var lineage = cur.code;
        var maxSort = cur.sort;
        if (parent) {
          depth = parent.depth + 1;
          parent.leaf = false;
          lineage = parent.lineage + '.' + lineage;
          maxSort = parent.maxSort = parent.maxSort + 1;
        }
        parent.children.push(cur);
        parent.children = _.uniqWith(parent.children, _.isEqual);
        parent.save();
        cur.depth = depth;
        cur.lineage = lineage;
        cur.maxSort = maxSort;
        return done(cur);
      });
    } else {
      this.populate("parentId", function (err, cur) {
        if (err) {
          console.log("menu update refs err: " + err);
          return done(null);
        }
        var depth = 1;
        var lineage = cur.code;
        var parent = cur.parentId;
        var maxSort = cur.sort;
        if (parent) {
          depth = parent.depth + 1;
          parent.leaf = false;
          lineage = parent.lineage + '.' + lineage;
          maxSort = parent.maxSort = parent.maxSort + 1;
        }
        parent.children.push(cur);
        parent.children = _.uniqWith(parent.children, _.isEqual);
        parent.save();
        cur.depth = depth;
        cur.lineage = lineage;
        cur.maxSort = maxSort;
        return done(cur);
      });
    }
  } else {
    console.log("********** update references with no parent ..." + this);
    return done(null);
  }
};

MenuSchema.statics.findByLink = function (link, done) {
  if (_.endsWith(link, '/')) {
    link = link.substr(0, link.length - 1);
  }
  Menu.findOne({link: link}, function (err, m) {
    if (err) console.error(err);
    done(m);
  });
};

MenuSchema.statics.findMenus = function (parentCode, done) {
  Menu.findOne({code: parentCode}).exec().then(function (parent) {
    //if (err)
    if (parent) {
      var lineage = '/' + parent.lineage + './';
      Menu.find({lineage: eval(lineage)}, function (err, menus) {
        done(menus);
      });
    } else {
      done(null);
    }
  });
};
MenuSchema.statics.findMenusByParent = function (parentCode, includes, done) {
  if (!includes) includes = [];
  Menu.findOne({code: parentCode, enabled: true}).exec().then(function (parent) {
    //console.log("######## load channel %s menu %s. ", parent);
    //if (err)
    if (parent) {
      Menu.find({parentId: parent._id, /*topNav: true,*/ enabled: true, _id: {$in: includes}}).sort("sort").populate({
        path: "children",
        match: {enabled: true/*, topNav: true*/, _id: {$in: includes}},
        options: {sort: "sort"},
        populate: {
          path: 'children',
          match: {enabled: true/*, topNav: true*/, _id: {$in: includes}},
          options: {sort: "sort"},
          populate: {
            path: 'children',
            match: {enabled: true/*, topNav: true*/, _id: {$in: includes}},
            options: {sort: "sort"}
          }
        }
      }).exec(function (err, menus) {
        //console.log("menus found: " + menus);
        done(menus);
      });
    } else {
      done(null);
    }
  });
};

var Menu = mongoose.model('Menu', MenuSchema, 'menus');

module.exports = Menu;
