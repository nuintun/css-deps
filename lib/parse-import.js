/**
 * @module parse-import
 * @license MIT
 * @version 2018/03/12
 */

import * as utils from './utils';
import postcssValuesParser from 'postcss-values-parser';

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

    if (utils.string(returned) && returned.trim()) {
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
export default function parseImport(node, replace) {
  const root = postcssValuesParser(node.params).parse();
  const path = parseUrl(root, replace);
  const media = parseMedia(root);
  const code = root.toString();

  return { path, media, code };
}
