/**
 * @module @nuintun/css-deps
 * @author nuintun
 * @license MIT
 * @version 2.2.1
 * @description Transform css and get css dependences.
 * @see https://github.com/nuintun/css-deps#readme
 */

'use strict';

const postcss = require('postcss');
const postcssValueParser = require('postcss-value-parser');

/**
 * @module utils
 * @license MIT
 * @author nuintun
 */

// Variable declaration
const { toString } = Object.prototype;

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
 * @function encode
 * @param {sting} path
 * @param {boolean} word
 * @returns {string}
 */
function encode(path, word) {
  if (word && /[ ,]/.test(path)) {
    return JSON.stringify(path);
  } else {
    return path.replace(/['"]/g, '\\$&');
  }
}

/**
 * @function isVaildValue
 * @param {any} value
 * @returns {boolean}
 */
function isVaildValue(value) {
  if (value && string(value)) {
    return true;
  }

  return false;
}

/**
 * @module parse-import
 * @license MIT
 * @author nuintun
 */

/**
 * @function parseMedia
 * @param {Object} node
 * @returns {Array}
 */
function parseMedia(node) {
  const start = 1;
  const media = [];
  const { nodes } = node;

  if (nodes.length <= start) return media;

  const rest = nodes.reduce((meta, node, index) => {
    if (index < start) return '';

    if (node.type === 'div') {
      media.push(meta.trim());

      return '';
    }

    return meta + postcssValueParser.stringify(node);
  }, '');

  media.push(rest.trim());

  return media;
}

/**
 * @function replaceImport
 * @param {Object} node
 * @param {Array} media
 * @param {Function} replace
 * @param {Object} root
 * @returns {string}
 */
function replaceImport(node, media, replace, root) {
  if (replace) {
    const returned = replace(node.value, media);

    if (isVaildValue(returned)) {
      node.value = encode(returned, node.type === 'word');
    } else if (returned === false) {
      root.remove();
    }
  }

  return node.value;
}

/**
 * @function parseUrl
 * @param {Object} node
 * @param {Array} media
 * @param {Function} replace
 * @returns {string}
 */
function parseUrl(node, media, replace, root) {
  let url = '';

  const { nodes } = node;

  if (!nodes.length) return url;

  [node] = nodes;

  if (node.type === 'string') {
    url = replaceImport(node, media, replace, root);
  } else if (node.type === 'function' && node.value === 'url') {
    [node] = node.nodes;

    if (node) {
      url = replaceImport(node, media, replace, root);
    }
  }

  return url;
}

/**
 * @function parseImport
 * @param {Object} rule
 * @param {Function} replace
 * @returns {Array}
 */
function parseImport(rule, replace, options) {
  const root = postcssValueParser(rule.params);

  const media = options.media ? parseMedia(root) : [];
  const path = parseUrl(root, media, replace, rule);
  const code = postcssValueParser.stringify(root);

  return { path, media, code };
}

/**
 * @module parse-assets
 * @license MIT
 * @author nuintun
 */

// CSS property with assets
const PROPS = new Set([
  'src',
  'filter',
  'cursor',
  'background',
  'background-image',
  'border-image',
  'border-image-source',
  'list-style',
  'list-style-image'
]);

/**
 * @function execReplace
 * @param {Object} node
 * @param {Function} onpath
 */
function replaceAssets(node, onpath, prop) {
  const returned = onpath(prop, node.value);

  if (isVaildValue(returned)) {
    node.value = encode(returned, node.type === 'word');
  }
}

/**
 * @function parseAssets
 * @param {Object} rule
 * @param {Function} onpath
 */
function parseAssets(rule, onpath) {
  const { prop } = rule;

  if (onpath && PROPS.has(prop.replace(/^-\w+-/, ''))) {
    const root = postcssValueParser(rule.value);

    root.walk(node => {
      if (node.type === 'function') {
        const { nodes } = node;

        switch (node.value) {
          case 'url':
          case 'image':
            // Walk nodes
            postcssValueParser.walk(nodes, node => {
              const { type } = node;

              if (type === 'string' || type === 'word') {
                replaceAssets(node, onpath, prop);
              }
            });
            break;
          case 'image-set':
            postcssValueParser.walk(nodes, ({ type, value }) => {
              if (type === 'function' && value === 'url') {
                // Walk nodes
                postcssValueParser.walk(node.nodes, node => {
                  const { type } = node;

                  if (type === 'string' || type === 'word') {
                    replaceAssets(node, onpath, prop);
                  }
                });
              }
            });
            break;
          default:
            // AlphaImageLoader
            if (node.type === 'function' && /\.?AlphaImageLoader$/i.test(node.value)) {
              let src = '';

              postcssValueParser.walk(nodes, node => {
                switch (node.type) {
                  case 'word':
                    src += node.value;
                    break;
                  case 'string':
                    src === 'src=' && replaceAssets(node, onpath, prop);
                  case 'div':
                    src = '';
                }
              });
            }
            break;
        }
      }
    });

    rule.value = postcssValueParser.stringify(root);
  }
}

/**
 * @module index
 * @license MIT
 * @version 2017/11/10
 */

/**
 * @function parser
 * @param {string|Buffer} code
 * @param {Function} [replace]
 * @param {Object} [options]
 * @param {Object} [options.postcss]
 * @param {Function} [options.onpath]
 * @returns {Object}
 */
function parser(code, replace, options) {
  let syntax;
  const dependencies = [];

  // Is buffer
  if (Buffer.isBuffer(code)) {
    code = code.toString();
  }

  if (replace && object(replace)) {
    options = replace;
    replace = null;
  }

  options = options || {};

  try {
    syntax = postcss.parse(code, options.postcss);
  } catch (error) {
    return { code, dependencies };
  }

  if (replace && !fn(replace)) {
    replace = null;
  }

  const onpath = fn(options.onpath) ? options.onpath : null;

  syntax.walk(node => {
    switch (node.type) {
      // At rule
      case 'atrule':
        if (node.name === 'import') {
          const { code, path, media } = parseImport(node, replace, options);

          node.params = code;

          dependencies.push({ path, media });
        }
        break;
      // Declaration
      case 'decl':
        parseAssets(node, onpath);
        break;
    }
  });

  // Get css code
  code = syntax.toResult().css;

  // Returned
  return { code, dependencies };
}

module.exports = parser;
