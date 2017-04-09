$.fn.fileupload = function (options) {
  var opt = {type: 'images', key: '640X480'};
  $.extend(opt, options);
  opt.picker = $(this).attr('id');
  var callback = opt.callback || function () {
    };
  var uploader = WebUploader.create({
    auto: true, //自动上传
    // 文件接收服务端。
    server: '/api/upload' + '?type=' + opt.type + '&key=' + opt.key,
    // 选择文件的按钮。可选。
    // 内部根据当前运行是创建，可能是input元素，也可能是flash.
    pick: '#' + opt.picker,
    // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
    resize: false
  });
  // 文件上传成功，给item添加成功class, 用样式标记上传成功。
  uploader.on('uploadSuccess', function (file, data) {
    //- console.log("######## file uploaded. ", JSON.stringify(file));
    callback(data);
  });
  uploader.on('uploadError', function (file) {
    bootbox.alert('上传文件出错,请重试!');
  });
  return uploader;
}
