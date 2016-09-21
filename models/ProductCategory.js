/**
 * 商品分类
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var ShortId = require('shortid');
var _ = require('lodash');

var CategorySchema = mongoose.Schema({
  _id: {type: String, default: ShortId.generate},
  parentId: {type: String, ref: "Category"},    //上级分类
  children: [{type: String, ref: "Category"}],    //上级分类
  channel: {type: ObjectId, ref: "Channel"}, //渠道，为空时属于系统全局
  code: {type: String, required: true, default: ""}, // 分类标识
  name: {type: String, required: true, default: ""}, // 分类名称
  sort: {type: Number, default: 0},   // 分类排序，同级
  maxSort: {type: Number, default: 0},   // 同级最大排序号
  depth: {type: Number, default: 1},   // 深度
  lineage: {type: String, default: ""},//页路径
  description: {type: String, default: ""},//分类描述
  leaf: {type: Boolean, default: true},    //叶节点，true时无子节点
  topNav: {type: Boolean, default: false},    //顶置分类
  enabled: {type: Boolean, default: true} // 激活
}, {timestamps: {}, minimize: false});

/**
 * Pre-save hook
 */
CategorySchema.pre('save', function (next) {
  this.updateRefs(function (menu) {
    next();
  });
});

//CategorySchema.pre('update', function () {
//  console.log("############### menu post update .");
//});

CategorySchema.post('remove', function (m) {
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

CategorySchema.statics.maxSort = function (parentId, done) {
  Category.aggregate({$match: {parentId: parentId}})
    .group({_id: null, maxBalance: {$max: '$sort'}})
    .select('sort')
    .exec(function (err, res) {
      if (err) console.log(err);
      console.log(res); //
      done(res);
    });
};

CategorySchema.methods.updateRefs = function (done) {
  if (this.parentId) {
    if (this.isNew) {
      var cur = this;
      Category.findOne({'_id': cur.parentId}).exec(function (err, parent) {
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
    this.lineage = this.code;
    console.log("********** update references with no parent ..." + this);
    return done(null);
  }
};

CategorySchema.statics.findCategorys = function (parentCode, done) {
  Category.findOne({code: parentCode}).exec().then(function (parent) {
    //if (err)
    if (parent) {
      var lineage = '/' + parent.lineage + './';
      Category.find({lineage: eval(lineage)}, function (err, menus) {
        done(menus);
      });
    } else {
      done(null);
    }
  });
};
CategorySchema.statics.findCategorysByParent = function (parentCode, includes, done) {
  if (!includes) includes = [];
  Category.findOne({code: parentCode, enabled: true}).exec().then(function (parent) {
    //console.log("######## load channel %s menu %s. ", parent);
    //if (err)
    if (parent) {
      Category.find({
        parentId: parent._id, /*topNav: true,*/
        enabled: true,
        _id: {$in: includes}
      }).sort("sort").populate({
        path: "children",
        match: {enabled: true/*, topNav: true*/, _id: {$in: includes}},
        options: {sort: "sort"},
        populate: {
          path: 'children',
          match: {enabled: true/*, topNav: true*/, _id: {$in: includes}},
          options: {sort: "sort"}
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

var Category = mongoose.model('Category', CategorySchema, 'categories');

module.exports = Category;