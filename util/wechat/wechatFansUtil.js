/**
 * Created by ZhangXiao on 2016/4/15.
 */
var WechatApi = require('./wechatApiUtil');

/**
 * 用户粉丝api
 * @param appid
 * @param appsecret
 */
module.exports = function(appid, appsecret) {
    var api = new WechatApi(appid, appsecret).getWechatApi();

    /**
     * 修改备注
     * @param filePath
     * @param type
     * @param callback
     */
    this.updateRemark = function(openid, remark, callback){
        api.updateRemark( openid, remark, function(err, result){
            callback(err, result);
        })
    }

     /**
     * 获取粉丝分组列表
     * @param filePath
     * @param type
     * @param callback
     */
    this.getGroups = function(callback){
        api.getGroups(function(err, result){
            callback(err, result);
        })
    }

     /**
     * 新建粉丝分组
     * @param filePath
     * @param type
     * @param callback
     */
    this.createGroup = function(name, callback){
        api.createGroup(name, function(err, result){
            callback(err, result);
        })
    }
     /**
     * 移动用户进分组
     * @param filePath
     * @param type
     * @param callback
     */
    this.moveUserToGroup = function(openid, groupId, callback){
        api.moveUserToGroup(openid, groupId, function(err, result){
            callback(err, result);
        })
    }

  /**
   * 批量为用户打标签
   * @param tagId 标签ID
   * @param openList 粉丝列表
   * @param callback
   */
    this.membersBatchtagging = function(tagId, openList, callback){
      api.membersBatchtagging(tagId, openList, function(err, result){
        callback(err, result);
      })
    }

  /**
   * 获取粉丝的标签
   * @param openid
   * @param callback
   */
    this.getUserTags = function(openid, callback){
      api.getUserTags(openid, function(err, result){
        callback(err, result);
      })
    }

  /**
   * 删除分组
   * @param filePath
   * @param type
   * @param callback
   */
  this.removeGroup = function(groupId, callback){
    api.removeGroup(groupId, function(err, result){
      callback(err, result);
    })
  }

  /**
   * 删除分组
   * @param filePath
   * @param type
   * @param callback
   */
  this.updateGroup = function(groupId, name, callback){
    api.updateGroup(groupId,name, function(err, result){
      callback(err, result);
    })
  }
}
