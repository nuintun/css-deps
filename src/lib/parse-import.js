/**
 * @module parse-import
 * @license MIT
 * @version 2018/03/12
 */

import { encode, isVaildValue } from './utils';
import postcssValueParser from 'postcss-value-parser';

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
export default function parseImport(node, replace, options) {
  const root = postcssValueParser(node.params);
  const media = options.media ? parseMedia(root) : [];
  const path = parseUrl(root, media, replace);
  const code = root.toString();

  return { path, media, code };
}
