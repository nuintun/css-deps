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
  if (!atrule.params) {
    return;
  }

  var params = valueParser(atrule.params);

  params.walk(function (node){
    if (node.type === 'div' || node.type === 'function') {
      node.before = node.after = '';
    } else if (node.type === 'space') {
      node.value = ' ';
    }
  }, true);

  atrule.params = util.unique(split(params.nodes, ',')).join();
};
