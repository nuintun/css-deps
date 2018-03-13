/**
 * @module index
 * @license MIT
 * @version 2017/11/10
 */

import * as postcss from 'postcss';
import * as utils from './lib/utils';
import parseImport from './lib/parse-import';
import parseAssets from './lib/parse-assets';

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
        parseAssets(node, onpath);
        break;
    }
  });

  // Get css code
  code = syntax.toResult().css;

  // Returned
  return { code, dependencies };
}
