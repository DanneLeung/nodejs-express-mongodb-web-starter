"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CitySchema = mongoose.Schema({
  id: ObjectId,
  name: { type: String, required: true },
  code: { type: String, required: true },
  pinyin: { type: String, required: true }
});

module.exports = mongoose.model('City', CitySchema, 'cities');