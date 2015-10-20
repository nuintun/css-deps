/**
 * Created by nuintun on 2015/10/19.
 */

'use strict';

var util = require('./lib/util');
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
    var ast = postcss.parse(src);
  } catch (error) {
    return replace ? src : [];
  }

  options.minify = true;
  var deps = [];
  var onpath = options.onpath;
  var prefix = options.prefix;

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
    // minify
    if (options.minify === true) {
      for (var prop in node.raws) {
        if (node.raws.hasOwnProperty(prop) && util.string(node.raws[prop])) {
          node.raws[prop] = node.raws[prop].replace(/[\r\n\t]/g, '').replace(/\s+/g, '');
        }
      }

      if (node.selector) {
        node.selector = node.selector.replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ');
      }
    }

    // comments
    if (node.type === 'comment') {
      if (options.minify === true) {
        node.remove();
      }

      return;
    }

    // at rule
    if (node.type === 'atrule') {
      // remove chartset
      if (node.name === 'charset') {
        node.remove();

        return;
      }

      if (node.name === 'import') {
        // import
        var IMPORTRE = /url\(["']?([^"')]+)["']?\)|['"]([^"')]+)['"]/gi;

        if (IMPORTRE.test(node.params)) {
          node.params = node.params.replace(IMPORTRE, function (){
            var source = arguments[0];
            var url = arguments[1] || arguments[2];

            // collect dependencies
            deps.push(url);

            // replace import
            if (replace) {
              var path = replace(url, node.name);

              if (util.string(path) && path.trim()) {
                return source.replace(url, path);
              } else if (path === false) {
                node.remove();
              }
            }

            return source;
          });
        }

        return;
      }
    }

    // declaration
    if (onpath && node.type === 'decl') {
      var URLRES = [
        /url\(\s*['"]?([^"')]+)["']?\s*\)/gi,
        /AlphaImageLoader\(\s*src\s*=\s*['"]?([^"')]+)["']?\s*[,)]/gi
      ];

      URLRES.some(function (pattern){
        if (pattern.test(node.value)) {
          node.value = node.value.replace(pattern, function (){
            var source = arguments[0];
            var url = arguments[1];
            var path = onpath(url, node.prop);

            // replace resource path
            if (util.string(path) && path.trim()) {
              return source.replace(url, path);
            } else {
              return source;
            }
          });

          return true;
        }
      });

      return;
    }

    // selector
    if (prefix && node.type === 'rule') {
      var PREFIXRE = /(,?\s*(?::root\s)?\s*)([^,]+)/gi;

      node.selector = node.selector.replace(PREFIXRE, '$1' + prefix + ' $2');
    }
  });

  // if replace is true, return code else all import
  if (replace) {
    return ast.toResult().css;
  } else {
    return deps;
  }
};