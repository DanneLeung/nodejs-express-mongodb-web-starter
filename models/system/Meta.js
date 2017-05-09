/**
 * 系统元数据定义数据模型，元数据是用于可枚举的固定value-label对数据
 * metas数组如[{value:'a',label:'aaaaaa'},{value:'b', label:'bbbbbbb'}]，
 * 可使用lodash的_.keyBy可以转换为类似map数据类型{a:{value:'a',label:'aaaaaa'},b:{value:'b', label:'bbbbbbb'}}，便于界面使用
 */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MetaSchema = new Schema({
  code: { type: String, default: '', index: true, unique: true }, //标识
  name: { type: String, default: '' }, //名称
  description: { type: String, default: '' }, //描述
  metas: [{
    value: String,
    label: String,
    sort: Number
  }], //元数据列表
  enabled: { type: Boolean, default: true } //是否激活
});

/**
 * 根据类型读取metas列表
 */
MetaSchema.statics.findByCode = function (code, done) {
  mongoose.model('Meta').findOne({ code: code }).exec((err, meta) => {
    if(err) console.error(err);
    var metas = [];
    if(meta) metas = meta.metas;
    done(metas);
  });
};

module.exports = mongoose.model('Meta', MetaSchema, 'metas');