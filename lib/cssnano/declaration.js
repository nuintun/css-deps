/**
 * Created by nuintun on 2015/10/26.
 */

'use strict';

var split = require('./lib/split');
var valueParser = require('postcss-value-parser');

/**
 * compress decl value
 * @param decl
 */
module.exports = function (decl){
  // no value
  if (!decl.value) {
    return;
  }

  // remove space around ie ie hack
  decl.value = decl.value.replace(/\s*(\\\d)\s*/, '$1');

  // parse value
  var values = valueParser(decl.value);

  // walk nodes
  values.walk(function (node){
    if (node.type === 'div' || node.type === 'function') {
      node.before = node.after = '';
    } else if (node.type === 'space') {
      node.value = ' ';
    }
  }, true);

  // remove duplicate space
  decl.value = split(values.nodes, ',').join(',');
};
