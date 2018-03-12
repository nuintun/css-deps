/**
 * @module index
 * @license MIT
 * @version 2017/11/10
 */

import * as postcss from 'postcss';
import * as utils from './lib/utils';
import parseImport from './lib/parse-import';
import postcssValuesParser from 'postcss-values-parser';

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
