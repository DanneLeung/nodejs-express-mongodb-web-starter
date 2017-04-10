/**
 * Created by yu869 on 2015/11/26.
 */

"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ProvinceSchema = mongoose.Schema({
  id: ObjectId,
  name: { type: String, required: true },
  code: { type: String, required: true }
});

module.exports = mongoose.model('Province', ProvinceSchema, 'provinces');