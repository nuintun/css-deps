/**
 * Created by nuintun on 2015/10/26.
 */

'use strict';

var util = require('../util');
var valueParser = require('postcss-value-parser');

/**
 * split nodes
 * @param nodes
 * @param div
 * @returns {Array}
 */
function split(nodes, div){
  var i;
  var max;
  var node;
  var last = '';
  var result = [];

  for (i = 0, max = nodes.length; i < max; i += 1) {
    node = nodes[i];

    if (node.type === 'div' && node.value === div) {
      result.push(last);
      last = '';
    } else {
      last += valueParser.stringify(node);
    }
  }

  result.push(last);

  return result;
}

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
