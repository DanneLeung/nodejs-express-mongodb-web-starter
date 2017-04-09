/**
 * Created by JiBingKun on 2015/7/25.
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
/**
 * 权限
 * @type {Schema}
 * @param {action:权限}
 * @param {subject:Post或者Get,设置按钮权限的时候使用}
 * @param {name}
 * @param {description}
 */
var PermissionSchema = mongoose.Schema({
  id: ObjectId,
  subject: {type: String, default: ''},
  action: {type: String, default: ''},
  name: {type: String, default: ''},
  //urlPrefix: {type: String, default: ''},
  url: {type: String, default: ''},
  description: {type: String, default: ''}
});

/**
 * Permission的公用方法
 *
 */
PermissionSchema.methods = {
  /**
   * 根据用户ID,删除权限
   * Callback:
   * - err, 数据库异常
   * - permission,权限
   * @param {String} params 查询条件(为空或者为ID)
   * @param {Function} callback 回调函数
   */
  delPermissionById: function (params, callback) {
    Permission.remove({_id: params}, callback);
  }
};


/**
 * Permission的静态方法
 */
PermissionSchema.statics.findOrCreate = function (params, callback) {
  var that = this;

  function findOrCreateOne(params, callback) {
    that.findOne(params, function (err, permission) {
      if (err) return callback(err);
      if (permission) return callback(null, permission);
      that.create(params, callback);
    });
  }

  if (Array.isArray(params)) {
    var permissions = [];
    async.forEachSeries(params, function (param, next) {
      findOrCreateOne(param, function (err, permission) {
        permissions.push(permission);
        next(err);
      });
    }, function (err) {
      callback.apply(null, [err].concat(permissions));
    });
  }
  else {
    findOrCreateOne(params, callback);
  }
};

module.exports.Permission = Permission = mongoose.model('Permission', PermissionSchema, 'permissions');
