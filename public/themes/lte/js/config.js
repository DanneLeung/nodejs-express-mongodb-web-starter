require.config({
  paths: {
    'jquery': '//cdn.bootcss.com/jquery/1.12.4/jquery.min',
    'jquery.ui': '//cdn.bootcss.com/jqueryui/1.11.4/jquery-ui.min',
    'jquery.caret': '//cdn.bootcss.com/Caret.js/0.3.1/jquery.caret.min',
    'jquery.jplayer': '//cdn.bootcss.com/jplayer/2.9.2/jplayer/jquery.jplayer.min',
    'jquery.zclip': '//cdn.bootcss.com/zclip/1.1.2/jquery.zclip.min',
    'bootstrap': '//cdn.bootcss.com/bootstrap/3.3.6/js/bootstrap.min',
    'bootstrap.switch': '//cdn.bootcss.com/bootstrap-switch/3.3.2/js/bootstrap-switch.min',
    'angular': '//cdn.bootcss.com/angular.js/1.5.6/angular.min',
    'angular.sanitize': '//cdn.bootcss.com/angular-sanitize/1.5.6/angular-sanitize.min',
    'underscore': '//cdn.bootcss.com/underscore.js/1.8.3/underscore-min',
    'chart': '//cdn.bootcss.com/Chart.js/2.1.4/Chart.min',
    'moment': '//cdn.bootcss.com/moment.js/2.13.0/moment.min',
    'filestyle': '//cdn.bootcss.com/bootstrap-filestyle/1.2.1/bootstrap-filestyle.min',
    'datetimepicker': '//cdn.bootcss.com/bootstrap-datetimepicker/4.17.37/js/bootstrap-datetimepicker.min',
    'daterangepicker': '//cdn.bootcss.com/bootstrap-daterangepicker/2.1.20/daterangepicker.min',
    'colorpicker': '//cdn.bootcss.com/spectrum/1.8.0/spectrum.min',
    // 'map': 'http://api.map.baidu.com/getscript?v=2.0&ak=F51571495f717ff1194de02366bb8da9&services=&t=20140530104353',
    'editor': '//cdn.bootcss.com/tinymce/4.3.12/jquery.tinymce.min',
    'css': '/themes/default/js/css.min',
    'webuploader': '//cdn.bootcss.com/webuploader/0.1.1/webuploader.html5only.min',
    'json2': '//cdn.bootcss.com/json2/20150503/json2.min',
    'wapeditor': './wapeditor',
    'jquery.wookmark': '//cdn.bootcss.com/jquery.wookmark/2.1.2/wookmark.min',
    'validator': '//cdn.bootcss.com/bootstrap-validator/0.5.3/js/bootstrapValidator.min',
    'select2': '//cdn.bootcss.com/select2/4.0.3/js/select2.min',
    'clockpicker': '//cdn.bootcss.com/clockpicker/0.0.7/jquery-clockpicker.min',
    'jquery.qrcode': '//cdn.bootcss.com/jquery.qrcode/1.0/jquery.qrcode.min',
    'raty': '//cdn.bootcss.com/raty/2.7.0/jquery.raty.min',
    'fileUploader': '/themes/default/js/wechat_fileUploader',
    'util': '/themes/default/js/util',
    'material': '/themes/default/js/material',
    'wechatDistrict': '/themes/default/js/wechatDistrict'
  },
  shim: {
    'jquery': {
      exports: "$"
    },
    'jquery.ui': {
      exports: "$",
      deps: ['jquery']
    },
    'jquery.caret': {
      exports: "$",
      deps: ['jquery']
    },
    'jquery.jplayer': {
      exports: "$",
      deps: ['jquery']
    },
    'bootstrap': {
      exports: "$",
      deps: ['jquery']
    },
    'bootstrap.switch': {
      exports: "$",
      deps: ['bootstrap', 'css!//cdn.bootcss.com/bootstrap-switch/3.3.2/css/bootstrap3/bootstrap-switch.min.css']
    },
    'angular': {
      exports: 'angular',
      deps: ['jquery']
    },
    'angular.sanitize': {
      exports: 'angular',
      deps: ['angular']
    },
    // 'emotion': {
    // 	deps: ['jquery']
    // },
    'chart': {
      exports: 'Chart'
    },
    'filestyle': {
      exports: '$',
      deps: ['bootstrap']
    },
    'daterangepicker': {
      exports: '$',
      deps: ['bootstrap', 'moment', 'css!//cdn.bootcss.com/bootstrap-daterangepicker/2.1.20/daterangepicker.min.css']
    },
    'datetimepicker': {
      exports: '$',
      deps: ['jquery', 'css!//cdn.bootcss.com/bootstrap-datetimepicker/4.17.37/css/bootstrap-datetimepicker.min.css']
    },
    'colorpicker': {
      exports: '$',
      deps: ['css!//cdn.bootcss.com/spectrum/1.8.0/spectrum.min.css']
    },
    // 'map': {
    // 	exports: 'BMap'
    // },
    'json2': {
      exports: 'JSON'
    },
    'webuploader': {
      deps: ['css!http://cdn.bootcss.com/webuploader/0.1.1/webuploader.css']
    },
    'wapeditor': {
      exports: 'angular',
      deps: ['angular.sanitize', 'jquery.ui', 'underscore', 'fileUploader', 'json2', 'datetimepicker']
    },
    'jquery.wookmark': {
      exports: "$",
      deps: ['jquery']
    },
    'validator': {
      exports: "$",
      deps: ['bootstrap']
    },
    'select2': {
      deps: ['//cdn.bootcss.com/select2/4.0.3/css/select2.min.css']
    },
    'clockpicker': {
      exports: "$",
      deps: ['css!//cdn.bootcss.com/clockpicker/0.0.7/bootstrap-clockpicker.min.css', 'bootstrap']
    },
    'jquery.qrcode': {
      exports: "$",
      deps: ['jquery']
    },
    'util': {
      deps: ['bootstrap']
        // },
        // 'material': {
        //   deps: ['jquery', 'underscore', 'bootstrap', 'jquery.wookmark', 'jquery.jplayer']
    }
  }
});

// Define the window and document modules so they are available for the Wookmark plugin
define('window', function () {
  return window;
});

define('document', function () {
  return document;
});