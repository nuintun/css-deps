/**
 * @module @nuintun/css-deps
 * @author nuintun
 * @license MIT
 * @version 2.0.0
 * @description Transform css and get css dependences
 * @see https://nuintun.github.io/css-deps
 */

'use strict';

var postcss = require('postcss');

/**
 * @module utils
 * @license MIT
 * @version 2017/11/10
 */

// Variable declaration
const toString = Object.prototype.toString;

/**
 * @function string
 * @param {any} string
 * @returns {boolean}
 */
function string(string) {
  return toString.call(string) === '[object String]';
}

/**
 * @function fn
 * @param {any} fn
 * @returns {boolean}
 */
function fn(fn) {
  return toString.call(fn) === '[object Function]';
}

/**
 * @function object
 * @param {any} object
 * @returns {boolean}
 */
function object(object) {
  return toString.call(object) === '[object Object]';
}

/**
 * @module index
 * @license MIT
 * @version 2017/11/10
 */

/**
 * @function parser
 * @param {string} code
 * @param {Function} replace
 * @param {object} options
 * @returns {Object}
 */
function parser(code, replace, options) {
  // Is buffer
  if (Buffer.isBuffer(code)) code = code.toString();

  let syntax;
  const dependencies = [];

  try {
    syntax = postcss.parse(code);
  } catch (error) {
    return { code, dependencies };
  }

  if (replace) {
    if (object(replace)) {
      options = replace;
      replace = null;
    } else if (!fn(replace)) {
      replace = null;
    }
  }

  options = options || {};

  const onpath = fn(options.onpath) ? options.onpath : null;

  syntax.walk(node => {
    switch (node.type) {
      // At rule
      case 'atrule':
        if (node.name === 'import') {
          // Import
          const IMPORT_RE = /(?:url\()?(["']?)([^"')]+)\1(?:\))?/i;

          if (IMPORT_RE.test(node.params)) {
            node.params = node.params.replace(IMPORT_RE, (source, quote, url) => {
              // Collect dependencies
              dependencies.push(url);

              // Replace import
              if (replace) {
                const returned = replace(url, node.name);

                if (string(returned) && returned.trim()) {
                  return source.replace(url, returned);
                } else if (returned === false) {
                  node.remove();
                }
              }

              return source;
            });
          }
        }
        break;
      // Declaration
      case 'decl':
        if (onpath) {
          // https://github.com/postcss/postcss-url/blob/master/src/lib/decl-processor.js#L21
          const URL_PATTERNS = [
            /url\(\s*(['"]?)([^"')]+)\1\s*\)/gi,
            /[(,\s]+src\s*=\s*(['"]?)([^"')]+)\1/gi // AlphaImageLoader
          ];

          // Parse url
          URL_PATTERNS.some(pattern => {
            if (pattern.test(node.value)) {
              node.value = node.value.replace(pattern, (source, quote, url) => {
                const returned = onpath(url, node.prop);

                // Replace resource path
                if (string(returned) && returned.trim()) {
                  return source.replace(url, returned);
                } else {
                  return source;
                }
              });

              return true;
            }

            return false;
          });
        }
        break;
    }
  });

  // Get css code
  code = syntax.toResult().css;

  // Returned
  return { code, dependencies };
}

module.exports = parser;
