/**
 * Created by Renee on 2016/7/30.
 */
jQuery(function () {

  var $ = jQuery,
    thumbnailWidth = 100,
    thumbnailHeight = 100,
    uploader,

    // 初始化Web Uploader
    uploader = WebUploader.create({
      auto: true,
      swf: '/images/Uploader.swf',
      server: '/shop/product/link/upload',
      pick: '#filePicker',
      duplicate: true,
      fileNumLimit: 1,
      accept: {
        title: 'Images',
        extensions: 'gif,jpg,jpeg,bmp,png',
        mimeTypes: 'image/*'
      }
    });
  uploader.on('fileQueued', function (file, res) {
    //console.log(file);
    uploader.makeThumb(file, function (error, src) {
      if(!error) {
        $('#thumb img').attr('src', src);
        $('#thumb').show();
      }
    }, thumbnailWidth, thumbnailHeight);
  });

  // 文件上传失败，现实上传出错。
  uploader.on('uploadError', function (file) {
    alert('上传出错！请重新上传！');
  });
  uploader.on('uploadSuccess', function (file, res) {
    $('.picUrl p').html(res.src);
    $('.picUrl').show();
    // percentages[ file.id ] = [res.id, res.url];
  });

  // 完成上传完了，成功或者失败，先删除进度条。
  uploader.on('uploadComplete', function (file, res) {});

});