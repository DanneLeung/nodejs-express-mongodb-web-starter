'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Node = mongoose.model('Node');
var Topic = mongoose.model('Topic');

exports.nodes = function (req, res, next) {
  Node.enabledNodes((nodes) => {
    res.locals.nodes = nodes;
    next();
  });

};

exports.index = function (req, res) {
  res.render('m/index');
};

exports.topics = function (req, res) {
  var node = req.params.node || req.query.node;
  var offset = req.query.offset || 0;
  var limit = 10;
  Topic.topicsWithNode(node, offset, limit, (topics) => {
    res.render('m/topics', { topics: topics });
  });
};

exports.home = function (req, res) {
  res.render('m/home');
};

exports.user = function (req, res) {
  res.render('m/user');
};