/**
 * CMS文章分类
 */
'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;
let ShortId = require('shortid');

let CmsCategorySchema = new Schema({
  _id: { type: String, default: ShortId.generate },
  parent: { type: String, ref: 'CmsCategory' },//父节点
  name: { type: String, default: '' }, //分类名称，
  description: { type: String, default: '' }, //描述
  icon: { type: String, default: '' }, //图标URL
  lineage: { type: String, default: '' },//深度
  depth: { type: Number, default: 1 },//深度
  sort: { type: Number, default: 0 },
  leaf: { type: Boolean, default: true },
  enabled: { type: Boolean, default: true } //可用
});
/**
 * Pre-save hook
 */
CmsCategorySchema.pre('save', function (next) {
  this.updateRefs(function (category) {
    next();
  });
});

CmsCategorySchema.methods.updateRefs = function (done) {
  var cur = this;
  if(!this.parent) this.parent = null;
  if (this.parent) {
    if (this.isNew) {
      CmsCategory.findOne({ '_id': cur.parent }).exec(function (err, parent) {
        if (err) {
          console.log("new category update refs err: " + err);
          return done(null);
        }

        var depth = 1;
        var lineage = cur._id;
        var maxSort = cur.sort;
        if (parent) {
          depth = parent.depth + 1;
          parent.leaf = false;
          lineage = parent.lineage + '.' + lineage;
          maxSort = parent.maxSort = parent.maxSort + 1;
        }
        cur.depth = depth;
        cur.lineage = lineage;
        cur.maxSort = maxSort;
        return done(cur);
      });
    } else {
      this.populate("parent", function (err, cur) {
        if (err) {
          console.log("category update refs err: " + err);
          return done(null);
        }
        var depth = 1;
        var lineage = cur._id;
        var parent = cur.parent;
        var maxSort = cur.sort;
        if (parent) {
          depth = parent.depth + 1;
          parent.leaf = false;
          lineage = parent.lineage + '.' + lineage;
          maxSort = parent.maxSort = parent.maxSort + 1;
        }
        cur.depth = depth;
        cur.lineage = lineage;
        cur.maxSort = maxSort;
        return done(cur);
      });
    }
  } else {
    console.log("********** update references with no parent ..." + this);
    var lineage = cur._id;
    var maxSort = cur.sort;
    cur.lineage = lineage;
    cur.maxSort = maxSort;
    return done(cur);
  }
};

CmsCategorySchema.statics.findByParent = function (channel, parent, done) {
  var q = { channel: channel };
  if (parent) {
    q.parent = parent;
  } else {
    q.parent = null;
  }
  CmsCategory.findOne(q).exec(function (err, parent) {
    if (err) console.error(err);
    if (parent) {
      CmsCategory.find({ lineage: eval('/' + parent.lineage + '/') }).sort("sort").exec(function (err, categories) {
        //console.log("categories found: " + categories);
        done(categories);
      });
    } else {
      done([]);
    }
  });

};

var CmsCategory = mongoose.model('CmsCategory', CmsCategorySchema, 'cmscategories')
module.exports = CmsCategory;
