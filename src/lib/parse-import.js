/**
 * @module parse-import
 * @license MIT
 * @author nuintun
 */

import { encode, isVaildValue } from './utils';
import postcssValueParser, { stringify } from 'postcss-value-parser';

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

    return meta + stringify(node);
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
export default function parseImport(rule, replace, options) {
  const root = postcssValueParser(rule.params);

  const media = options.media ? parseMedia(root) : [];
  const path = parseUrl(root, media, replace, rule);
  const code = stringify(root);

  return { path, media, code };
}
