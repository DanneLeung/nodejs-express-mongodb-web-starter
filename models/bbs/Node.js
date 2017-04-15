/**
 * BBS论坛版块
 */
'use strict';

let mongoose = require('mongoose');
// let tree = require('mongoose-tree');

let Schema = mongoose.Schema;
let ObjectId = Schema.ObjectId;

let NodeSchema = new Schema({
  title: { type: String, default: '' }, //版块标题
  description: { type: String, default: '' }, //描述
  icon: { type: String, default: '' }, //图标URL
  topics: { type: Number, default: 0 },
  sort: { type: Number, default: 1 },
  enabled: { type: Boolean, default: true } //可用
}, { timestamps: {} });
// NodeSchema.plugin(tree);

NodeSchema.statics = {
  all: function (done) {
    Node.find({}).sort('sort').exec((err, nodes) => {
      if(err) console.error(err);
      done(nodes);
    });
  },
  enabledNodes: function (done) {
    Node.find({ enabled: true }).sort('sort').exec((err, nodes) => {
      if(err) console.error(err);
      done(nodes);
    });
  },

}

var Node = mongoose.model('Node', NodeSchema, 'nodes')
module.exports = Node;