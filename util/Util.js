/**
 * Created by xingj on 2016/7/11.
 */

/**
 * 验证obj是否在该数组中
 * @param obj 元素
 * @param arr 数组
 * @returns {boolean} 结果
 */
exports.inArray = function inArray(obj, arr) {
  var i = arr.length;
  while (i--) {
    if (arr[i] == obj) {
      return true;
    }
  }
  return false;
};

