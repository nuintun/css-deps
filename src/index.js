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
 * @param {string|Buffer} code
 * @param {Function} [replace]
 * @param {Object} [options]
 * @param {Object} [options.postcss]
 * @param {Function} [options.onpath]
 * @returns {Object}
 */
export default function parser(code, replace, options) {
  let syntax;
  const dependencies = [];

  // Is buffer
  if (Buffer.isBuffer(code)) {
    code = code.toString();
  }

  if (replace && utils.object(replace)) {
    options = replace;
    replace = null;
  }

  options = options || {};

  try {
    syntax = postcss.parse(code, options.postcss);
  } catch (error) {
    return { code, dependencies };
  }

  if (replace && !utils.fn(replace)) {
    replace = null;
  }

  const onpath = utils.fn(options.onpath) ? options.onpath : null;

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
