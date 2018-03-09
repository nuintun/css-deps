/**
 * @module index
 * @license MIT
 * @version 2017/11/10
 */

import * as postcss from 'postcss';
import * as utils from './lib/utils';

/**
 * @function parser
 * @param {string} code
 * @param {Function} replace
 * @param {object} options
 * @returns {Object}
 */
export default function parser(code, replace, options) {
  // Is buffer
  if (Buffer.isBuffer(code)) code = code.toString();

  let syntax;
  const dependencies = [];

  if (replace) {
    if (utils.object(replace)) {
      options = replace;
      replace = null;
    } else if (!utils.fn(replace)) {
      replace = null;
    }
  }

  options = options || {};

  try {
    syntax = postcss.parse(code, options.postcss);
  } catch (error) {
    return { code, dependencies };
  }

  const onpath = utils.fn(options.onpath) ? options.onpath : null;

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

                if (utils.string(returned) && returned.trim()) {
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
                if (utils.string(returned) && returned.trim()) {
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
