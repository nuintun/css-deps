/**
 * Created by nuintun on 2015/10/26.
 */

'use strict';

var util = require('../util');
var split = require('./lib/split');
var valueParser = require('postcss-value-parser');

/**
 * compress decl value
 * @param decl
 */
module.exports = function (decl){
  if (!decl.value) {
    return;
  }

  var values = valueParser(decl.value);

  values.walk(function (node){
    if (node.type === 'div' || node.type === 'function') {
      node.before = node.after = '';
    } else if (node.type === 'space') {
      node.value = ' ';
    }
  }, true);

  decl.value = split(values.nodes, ',').join();
};
