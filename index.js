/**
 * @module index
 * @license MIT
 * @version 2017/11/10
 */

'use strict';

const utils = require('./lib/utils');
const postcss = require('postcss');

/**
 * @function css
 * @param {string} src
 * @param {Function} replace
 * @param {object} options
 * @returns {string|Array}
 */
module.exports = function(src, replace, options) {
  options = options || {};

  // Is buffer
  if (Buffer.isBuffer(src)) src = src.toString();

  if (utils.object(replace) && !Array.isArray(replace)) {
    options = replace;
    replace = undefined;
  }

  if (replace && !utils.fn(replace)) replace = utils.noop;

  let ast;

  try {
    ast = postcss.parse(src);
  } catch (error) {
    return replace ? src : [];
  }

  const deps = [];
  let onpath = options.onpath;
  let prefix = options.prefix;

  if (replace) {
    onpath = utils.fn(onpath) ? onpath : undefined;

    if (utils.string(onpath)) {
      prefix = onpath;
    } else {
      prefix = utils.string(prefix) ? prefix : undefined;
    }
  } else {
    onpath = prefix = undefined;
  }

  ast.walk(function(node) {
    // At rule
    if (node.type === 'atrule') {
      // Remove chartset
      if (node.name === 'charset') {
        node.remove();

        return;
      }

      if (node.name === 'import') {
        // Import
        const IMPORTRE = /url\(["']?([^"')]+)["']?\)|['"]([^"')]+)['"]/gi;

        if (IMPORTRE.test(node.params)) {
          node.params = node.params.replace(IMPORTRE, function() {
            const source = arguments[0];
            const url = arguments[1] || arguments[2];

            // Collect dependencies
            deps.push(url);

            // Replace import
            if (replace) {
              const path = replace(url, node.name);

              if (utils.string(path) && path.trim()) {
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

    // Declaration
    if (onpath && node.type === 'decl') {
      const URLRES = [
        /url\(\s*['"]?([^"')]+)["']?\s*\)/gi,
        /AlphaImageLoader\(\s*src\s*=\s*['"]?([^"')]+)["']?\s*[,)]/gi
      ];

      URLRES.some(function(pattern) {
        if (pattern.test(node.value)) {
          node.value = node.value.replace(pattern, function() {
            const source = arguments[0];
            const url = arguments[1];
            const path = onpath(url, node.prop);

            // Replace resource path
            if (utils.string(path) && path.trim()) {
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

    // Selector
    if (prefix && node.type === 'rule') {
      const PREFIXRE = /(,?\s*(?::root\s)?\s*)([^,]+)/gi;

      node.selector = node.selector.replace(PREFIXRE, '$1' + prefix + ' $2');
    }
  });

  // If replace is true, return code else all import
  if (replace) {
    return ast.toResult().css;
  } else {
    return deps;
  }
};
