/**
 * Created by nuintun on 2015/10/26.
 */

'use strict';

var valueParser = require('postcss-value-parser');

/**
 * split nodes
 * @param nodes
 * @param div
 * @returns {Array}
 */
module.exports = function (nodes, div){
  var i;
  var max;
  var node;
  var last = '';
  var result = [];

  // loop nodes
  for (i = 0, max = nodes.length; i < max; i += 1) {
    node = nodes[i];

    if (node.type === 'div' && node.value === div) {
      result.push(last);
      last = '';
    } else {
      last += valueParser.stringify(node);
    }
  }

  // push last
  result.push(last);

  // return result
  return result;
};
