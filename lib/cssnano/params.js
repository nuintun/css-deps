/**
 * Created by nuintun on 2015/10/26.
 */

'use strict';

var util = require('../util');
var split = require('./lib/split');
var valueParser = require('postcss-value-parser');

/**
 * compress atrule params
 * @param atrule
 */
module.exports = function (atrule){
  // no params
  if (!atrule.params) {
    return;
  }

  // parse params
  var params = valueParser(atrule.params);

  // walk nodes
  params.walk(function (node){
    if (node.type === 'div' || node.type === 'function') {
      node.before = node.after = '';
    } else if (node.type === 'space') {
      node.value = ' ';
    }
  }, true);

  // remove duplicate params and space
  atrule.params = util.unique(split(params.nodes, ',')).join(',');
};
