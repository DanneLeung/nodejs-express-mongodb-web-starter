/*初始化上传图片按钮
 * id 初始化上传按钮
 * type 文件类型
 * key 上传对象是所属 管理员头像、用户头像、文档首图等，后台根据key来进行不同规格的图片压缩
 * */
function initUploadFyBtn(id, type, key, callBack) {
  var typedes = 'Image Files';
  var filtertype = '*.gif; *.jpg; *.png';
  var buttonText = '<i class="fa fa-cloud-upload">';
  var uploadApi = '/api/upload';
  var autoUpdate = true;
  var buttonWidth = 100;
  var buttonStyle = 'uploadify-btn-default';
  if (type == 'zip') {
    typedes = 'Zip Files';
    filtertype = '*.zip';
    buttonText = '安装本地模板(*.zip)';
    buttonWidth = 130;
    buttonStyle = 'uploadify-btn-primary';
  }
  if (type == 'xlsx') {
    typedes = 'xlsx Files';
    filtertype = '*.xlsx;*.xls';
    //buttonText = '导入';
    buttonWidth = 60;
    buttonStyle = 'btn-default';
  }
  if (type == 'images') {
    buttonText = '选择图片';
  }
  if (type == 'certificate') {
    filtertype = '*.*';
    buttonText = '上传证书';
    buttonWidth = 130;
    buttonStyle = 'uploadify-btn-primary';
  }
  $("#" + id).uploadify({
    //指定swf文件
    swf: '/themes/default/plugins/uploadify/uploadify.swf',
    //后台处理的页面
    uploader: uploadApi + '?type=' + type + '&key=' + key,
    //按钮显示的文字
    buttonText: buttonText,
    buttonClass: buttonStyle,
    //显示的高度和宽度，默认 height 30；width 120
    height: 30,
    width: buttonWidth,
    //上传文件的类型  默认为所有文件    All Files  ;  '*.*'
    //在浏览窗口底部的文件类型下拉菜单中显示的文本
    fileTypeDesc: typedes,
    //允许上传的文件后缀
    fileTypeExts: filtertype,
    //发送给后台的其他参数通过formData指定
    //'formData': { 'adminUserId' : adminUserId , 'type': type, 'key': key},
    //选择文件后自动上传
    auto: autoUpdate,
    //设置为true将允许多文件上传
    multi: false,
    onUploadSuccess: function (file, data, response) {
      callBack(JSON.parse(data));
    }
  });
}