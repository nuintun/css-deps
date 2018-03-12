/**
 * @module @nuintun/css-deps
 * @author nuintun
 * @license MIT
 * @version 2.0.0
 * @description Transform css and get css dependences
 * @see https://nuintun.github.io/css-deps
 */

'use strict';

var postcssValuesParser = require('postcss-values-parser');
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
 * @module parse-import
 * @license MIT
 * @version 2018/03/12
 */

/**
 * @function parseMedia
 * @param {Object} root
 * @returns {Array}
 */
function parseMedia(root) {
  const media = [];

  if (!root.nodes.length) return media;

  const start = 1;
  const values = root.nodes[0].nodes;

  if (values.length > start) {
    const rest = values.reduce((item, node, index) => {
      if (index < start) return '';

      if (node.type === 'comma') {
        media.push(item.trim());

        return '';
      }

      return item + node;
    }, '');

    media.push(rest.trim());
  }

  return media;
}

/**
 * @function execReplace
 * @param {Function} replace
 * @param {Object} root
 * @param {Object} node
 */
function execReplace(replace, root, node) {
  if (replace) {
    const returned = replace(node.value);

    if (string(returned) && returned.trim()) {
      node.value = returned;
    } else if (returned === false) {
      root.removeAll();
    }
  }
}

/**
 * @function parseUrl
 * @param {Object} root
 * @param {Function} replace
 * @returns {string}
 */
function parseUrl(root, replace) {
  let url = '';

  if (!root.nodes.length) return url;

  const values = root.nodes[0].nodes;

  if (!values.length) return url;

  let node = values[0];

  if (node.type === 'string') {
    url = node.value;

    execReplace(replace, root, node);
  } else if (node.type === 'func' && node.value === 'url') {
    node = node.nodes[1];
    url = node.value;

    execReplace(replace, root, node);
  }

  return url;
}

/**
 * @function parseImport
 * @param {Object} node
 * @param {Function} replace
 * @returns {Array}
 */
function parseImport(node, replace) {
  const root = postcssValuesParser(node.params).parse();
  const path = parseUrl(root, replace);
  const media = parseMedia(root);
  const code = root.toString();

  return { path, media, code };
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

  if (replace) {
    if (object(replace)) {
      options = replace;
      replace = null;
    } else if (!fn(replace)) {
      replace = null;
    }
  }

  options = options || {};

  try {
    syntax = postcss.parse(code, options.postcss);
  } catch (error) {
    return { code, dependencies };
  }

  const onpath = fn(options.onpath) ? options.onpath : null;

  syntax.walk(node => {
    switch (node.type) {
      // At rule
      case 'atrule':
        if (node.name === 'import') {
          const parsed = parseImport(node, replace);
          const code = parsed.code;
          const path = parsed.path;
          const media = parsed.media;

          dependencies.push({ path, media });
          code ? (node.params = code) : node.remove();
        }
        break;
      // Declaration
      case 'decl':
        console.log(postcssValuesParser(node.value).parse());

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
