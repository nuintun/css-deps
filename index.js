/**
 * Created by nuintun on 2015/10/19.
 */

'use strict';

var util = require('./lib/util');
var postcss = require('postcss');
var cssnano = require('./lib/cssnano');

/**
 * is a empty rule
 * @param rule
 * @returns {boolean}
 */
function isEmptyRule(rule){
  for (var i = 0, length = rule.nodes.length; i < length; i++) {
    if (rule.nodes[i].type !== 'comment') {
      return false;
    }
  }

  return true;
}

/**
 * css-deps
 * @param src
 * @param replace
 * @param options
 * @returns {String|Array}
 */
module.exports = function (src, replace, options){
  options = options || {};

  // is buffer
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
        // remove comments
        node.remove();
      }

      return;
    }

    // compress
    if (options.compress === true) {
      // compress declaration
      if (node.type === 'decl') {
        // remove extra space in the declaration value
        cssnano.declaration(node);

        // ensure that !important values do not have any excess space
        if (node.important) {
          node.raws.important = '!important';
        }

        // remove extra space semicolons and space before the declaration
        if (node.raws.before) {
          node.raws.before = node.raws.before.replace(/[;\s]/g, '');
        }

        // remove extra space before the declaration and value
        node.raws.between = ':';
      }

      // compress rule and atrule
      if (node.type === 'rule' || node.type === 'atrule') {
        // rule
        if (node.type === 'rule') {
          // remove empty rule
          if (isEmptyRule(node)) {
            node.remove();

            return;
          }

          // remove extra space in selectors
          cssnano.selector(node);
        } else {
          // remove extra space in params
          cssnano.params(node);
          // remove extra space between the at-rule’s name and it's parameters
          node.raws.afterName = ' ';
        }

        // remove extra before and between the rule and atrule
        node.raws.before = node.raws.between = '';
      }

      // remove final newline
      node.raws.after = '';
      // remove last semicolon
      node.raws.semicolon = false;
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
