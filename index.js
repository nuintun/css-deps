/**
 * Created by nuintun on 2015/10/19.
 */

'use strict';

var util = require('./lib/uitl');
var postcss = require('postcss');

module.exports = function (src, replace, options){
  options = options || {};

  if (Buffer.isBuffer(src)) src = src.toString();

  replace = util.fn(replace) ? replace : undefined;

  if (util.object(replace) && !Array.isArray(replace)) {
    options = replace;
    replace = undefined;
  }

  try {
    var ast = options.parse(src);
  } catch (error) {
    return replace ? src : [];
  }

  var deps = [];
  var onpath = options.onpath;
  var prefix = options.prefix;
  var IMPORTRE = /url\(["']?([^"')]+)["']?\)|['"]([^"')]+)['"]/gi;
  var URLRES = [
    /url\(\s*['"]?([^"')]+)["']?\s*\)/gi,
    /AlphaImageLoader\(\s*src\s*=\s*['"]?([^"')]+)["']?\s*[,)]/gi
  ];

  if (replace) {
    onpath = util.fn(onpath) ? onpath : undefined;

    if (util.string(onpath)) {
      prefix = onpath;
    } else {
      prefix = util.string(prefix) ? prefix : undefined;
    }
  } else {
    onpath = prefix = undefined;
  }

  ast.walk(function (node){
    // at rule
    if (node.type === 'atrule') {
      // remove chartset
      if (node.name === 'charset') {
        return node.remove();
      }

      if (node.name === 'import') {

      }
    }
  });
};