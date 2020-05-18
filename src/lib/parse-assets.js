/**
 * @module parse-assets
 * @license MIT
 * @author nuintun
 */

import { encode, isVaildValue } from './utils';
import postcssValueParser, { stringify, walk } from 'postcss-value-parser';

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
export default function parseAssets(rule, onpath) {
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
            walk(nodes, node => {
              const { type } = node;

              if (type === 'string' || type === 'word') {
                replaceAssets(node, onpath, prop);
              }
            });
            break;
          case 'image-set':
            walk(nodes, ({ type, value }) => {
              if (type === 'function' && value === 'url') {
                // Walk nodes
                walk(node.nodes, node => {
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

              walk(nodes, node => {
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

    rule.value = stringify(root);
  }
}
