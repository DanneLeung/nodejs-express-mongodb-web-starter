/**
 * Created by danne on 2016/3/11.
 */

"use strict";
var path = require('path');
var express = require('express');
var router = express.Router();
var config = require('../../config/config');
var ueditor = require('ueditor');
var multer = require('multer');
var upload = multer({
  'dest': config.file.local + '/upload/tmp/'
});

var apiCtrl = require('./api/api.controller');
var ueCtrl = require('./api/ue.controller');

router
  .post('/upload', upload.any(), apiCtrl.upload);

// ueditor
router.all("/ueditor", ueditor(path.join(__dirname, '../../public'), ueCtrl.ue));
// router.use('/', require('./api/'));
module.exports = router;
