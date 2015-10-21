/**
 * Created by nuintun on 2015/10/19.
 */

'use strict';

var util = require('./lib/util');
var postcss = require('postcss');

function inline(str){
  return str.trim().replace(/[\r\n\t]/g, '');
}

module.exports = function (src, replace, options){
  options = options || {};

  if (Buffer.isBuffer(src)) src = src.toString();

  if (util.object(replace) && !Array.isArray(replace)) {
    options = replace;
    replace = undefined;
  }

  if (replace && !util.fn(replace)) replace = util.noop;

  try {
    var ast = postcss.parse(src);
  } catch (error) {
    return replace ? src : [];
  }

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
    // comments
    if (node.type === 'comment') {
      if (options.compress === true) {
        node.remove();
      }

      return;
    }

    // compress
    if (options.compress === true) {
      // props
      for (var prop in node.raws) {
        if (node.raws.hasOwnProperty(prop)) {
          if (util.string(node.raws[prop])) {
            node.raws[prop] = inline(node.raws[prop]);
            node.raws[prop] = postcss.list.space(node.raws[prop]).join('');
          } else if (util.object(node.raws[prop]) && node.raws[prop].raw) {
            node.raws[prop].raw = postcss.list.comma(node.raws[prop].raw).map(function (value){
              return postcss.list.space(value).join(' ');
            }).join(',');
          }
        }
      }

      // selector
      if (node.selector) {
        node.selector = postcss.list.comma(node.selector).join(',');
      }
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

        return false;
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
