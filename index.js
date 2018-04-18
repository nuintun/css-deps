/**
 * @module @nuintun/css-deps
 * @author nuintun
 * @license MIT
 * @version 2.0.0
 * @description Transform css and get css dependences.
 * @see https://github.com/nuintun/css-deps#readme
 */

'use strict';

const postcssValuesParser = require('postcss-values-parser');
const postcss = require('postcss');

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
  const values = root.first.nodes;

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
      root.removeAll();
    }
  }

  return node.value;
}

/**
 * @function parseUrl
 * @param {Object} root
 * @param {Array} media
 * @param {Function} replace
 * @returns {string}
 */
function parseUrl(root, media, replace) {
  let url = '';

  if (!root.nodes.length) return url;

  const values = root.first.nodes;

  if (!values.length) return url;

  let node = values[0];

  if (node.type === 'string') {
    url = replaceImport(node, media, replace, root);
  } else if (node.type === 'func' && node.value === 'url') {
    url = replaceImport(node.nodes[1], media, replace, root);
  }

  return url;
}

/**
 * @function parseImport
 * @param {Object} node
 * @param {Function} replace
 * @returns {Array}
 */
function parseImport(node, replace, options) {
  const root = postcssValuesParser(node.params).parse();
  const media = options.media ? parseMedia(root) : [];
  const path = parseUrl(root, media, replace);
  const code = root.toString();

  return { path, media, code };
}

/**
 * @module parse-assets
 * @license MIT
 * @version 2018/03/13
 */

// CSS property with assets
const PROPS = new Set([
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
 * @function isAsset
 * @param {Object} node
 * @returns {boolean}
 */
function isAsset(node) {
  if (node) {
    const type = node.type;

    if (type === 'string' || type === 'word') {
      return true;
    }
  }

  return false;
}

/**
 * @function parseAssets
 * @param {Object} rule
 * @param {Function} onpath
 */
function parseAssets(rule, onpath) {
  const prop = rule.prop;

  if (onpath && PROPS.has(prop.replace(/^-\w+-/, ''))) {
    const root = postcssValuesParser(rule.value).parse();

    root.walk(node => {
      if (node.type === 'func') {
        switch (node.value) {
          case 'url':
          case 'image':
            // Get first param
            node = node.nodes[1];

            // Get type
            const type = node.type;

            if (type === 'string' || type === 'word') {
              replaceAssets(node, onpath, prop);
            }
            break;
          case 'image-set':
            node.each(node => {
              if (node.type === 'string') {
                const prev = node.prev();
                const prevType = prev.type;

                if (prevType === 'comma' || prevType === 'paren') {
                  replaceAssets(node, onpath, prop);
                }
              }
            });
            break;
          default:
            // AlphaImageLoader
            if (/\.?AlphaImageLoader$/i.test(node.value)) {
              node.each(node => {
                const value = node.value;

                if (node.type === 'word' && /^src(?:\s*=|$)/.test(value)) {
                  if (value === 'src') {
                    node = node.next();

                    if (node) {
                      if (node.value === '=') {
                        node = node.next();

                        isAsset(node) && replaceAssets(node, onpath, prop);
                      } else {
                        const returned = onpath(value.slice(1), prop);

                        if (isVaildValue(returned)) {
                          node.value = `=${encode(returned, true)}`;
                        }
                      }
                    }
                  } else if (value === 'src=') {
                    node = node.next();

                    isAsset(node) && replaceAssets(node, onpath, prop);
                  } else {
                    const returned = onpath(value.slice(4), prop);

                    if (isVaildValue(returned)) {
                      node.value = `src=${encode(returned, true)}`;
                    }
                  }
                }
              });
            }
            break;
        }
      }
    });

    rule.value = root.toString();
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
  if (Buffer.isBuffer(code)) code = code.toString();

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

  if (replace && !fn(replace)) replace = null;

  const onpath = fn(options.onpath) ? options.onpath : null;

  syntax.walk(node => {
    switch (node.type) {
      // At rule
      case 'atrule':
        if (node.name === 'import') {
          const parsed = parseImport(node, replace, options);
          const code = parsed.code;
          const path = parsed.path;
          const media = parsed.media;

          dependencies.push({ path, media });
          code ? (node.params = code) : node.remove();
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
