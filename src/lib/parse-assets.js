/**
 * @module parse-assets
 * @license MIT
 * @version 2018/03/13
 */

import { encode, isVaildValue } from './utils';
import postcssValueParser from 'postcss-value-parser';

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
export default function parseAssets(rule, onpath) {
  const prop = rule.prop;

  if (onpath && PROPS.has(prop.replace(/^-\w+-/, ''))) {
    const root = postcssValueParser(rule.value);

    root.walk(node => {
      if (node.type === 'function') {
        switch (node.value) {
          case 'url':
          case 'image':
            // Get first param
            node = node.nodes[0];

            // Get type
            const type = node.type;

            if (type === 'string' || type === 'word') {
              replaceAssets(node, onpath, prop);
            }
            break;
          case 'image-set':
            node.nodes.forEach(node => {
              if (node.type === 'function' && node.value === 'url') {
                replaceAssets(node, onpath, prop);
              }
            });
            break;
          default:
            // AlphaImageLoader
            if (node.type === 'function' && /\.?AlphaImageLoader$/i.test(node.value)) {
              console.log(node);
              node.nodes.forEach(node => {
                console.log(node);
              });
              // node.each(node => {
              //   const value = node.value;
              //   if (node.type === 'word' && /^src(?:\s*=|$)/.test(value)) {
              //     if (value === 'src') {
              //       node = node.next();
              //       if (node) {
              //         if (node.value === '=') {
              //           node = node.next();
              //           isAsset(node) && replaceAssets(node, onpath, prop);
              //         } else {
              //           const returned = onpath(value.slice(1), prop);
              //           if (isVaildValue(returned)) {
              //             node.value = `=${encode(returned, true)}`;
              //           }
              //         }
              //       }
              //     } else if (value === 'src=') {
              //       node = node.next();
              //       isAsset(node) && replaceAssets(node, onpath, prop);
              //     } else {
              //       const returned = onpath(value.slice(4), prop);
              //       if (isVaildValue(returned)) {
              //         node.value = `src=${encode(returned, true)}`;
              //       }
              //     }
              //   }
              // });
            }
            break;
        }
      }
    });

    rule.value = root.toString();
  }
}
