/**
 * Created by xingjie201 on 2016/3/29.
 */
var xlsx = require('node-xlsx');
var fs = require('fs');

module.exports = {
  /**
   * 读取Xlsx中的数据，返回每个单元格的数据
   * @param filePath 读取文件的路径
   * @param startRow 从文件的第几行开始读取
   */
  readXlsx: function (filePath, startRow) {
    //filePath = "./" + filePath;
    var type = filePath.split(".")[1];
    if (type != 'xlsx' && type != 'xls') {
      return null;
    }
    var obj = xlsx.parse(fs.readFileSync(filePath)); // parses a buffer'
    return obj;
     var r = startRow - 1;
     var re = [];
    var i = 0;
     obj.forEach(function (o) {
       if(i == 0){
         re = o.data;
       }else{
         re.concat(o.data);
       }
       i++;
     });
     return re;
  },
  /**
   * 读取Xlsx中的数据，返回整个读取数据obj，调用之后需要对返回值坐处理
   * @param filePath 读取文件的路径
   * @param startRow 从文件的第几行开始读取
   */
  readXls: function (filePath, startRow) {
    //filePath = "./" + filePath;
    var type = filePath.split(".")[1];
    if (type != 'xlsx' && type != 'xls') {
      return null;
    }
    var obj = xlsx.parse(fs.readFileSync(filePath)); // parses a buffer'
    return obj;
    // var r = startRow - 1;
    // var re = [];
    // obj.forEach(function (o) {
    //     var data = o.data;
    //     for (var i = r; i < data.length; i++) {
    //         re.push(data[i]);
    //     }
    // });
    // return re;
  }
}