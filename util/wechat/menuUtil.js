/**
 * Created by ZhangXiao on 2016/4/15.
 */
var WechatApi = require('./wechatApiUtil');
/**
 * 自定义菜单工具类
 * @param appid
 * @param appsecret
 */
module.exports = function (appid, appsecret) {
  var api = new WechatApi(appid, appsecret).getWechatApi();

  /**
   * 获取当前菜单数据
   * @param callback
   */
  this.getMenu = function (callback) {
    api.getMenu(function (err, result) {
      if (err) console.error(JSON.stringify(err));
      callback(err, result);
    });
  }

  /**
   * 删除菜单
   * @param callback
   */
  this.removeMenu = function (callback) {
    api.removeMenu(function (err, result) {
      callback(err, result);
    });
  }

  /**
   * 创建菜单
   * @param menu
   * @param callback
   */
  this.createMenu = function (menu, callback) {
    api.createMenu(menu, function (err, result) {
      callback(err, result);
    });
  }
}