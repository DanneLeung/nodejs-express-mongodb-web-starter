/**
 * 系统模块
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ModuleSchema = mongoose.Schema({
  //parentId: {type: ObjectId, ref: "Module"},    //上级菜单
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  url: { type: String, default: '' }, //入口url
  editable: { type: Boolean, default: true }, // 用户可否编辑
  enabled: { type: Boolean, default: true } // 是否可用，禁用则相关功能不可使用
}, { timestamps: {} });

/**
 * 查询enabled状态的模块列表
 * @param enabled
 * @returns {*}
 */
ModuleSchema.statics.getEnabled = function (enabled) {
  return mongoose.model('Module').find({ enabled: enabled }).exec();
  //mongoose.model('Module').find({enabled: enabled}, function (err, modules) {
  //  if (err) console.log(err);
  //  done(modules);
  //});
}

module.exports = mongoose.model('Module', ModuleSchema, 'modules');