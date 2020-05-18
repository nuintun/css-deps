/**
 * @module utils
 * @license MIT
 * @author nuintun
 */

// Variable declaration
const { toString } = Object.prototype;

/**
 * @function noop
 */
export const noop = () => {};

/**
 * @function string
 * @param {any} string
 * @returns {boolean}
 */
export function string(string) {
  return toString.call(string) === '[object String]';
}

/**
 * @function fn
 * @param {any} fn
 * @returns {boolean}
 */
export function fn(fn) {
  return toString.call(fn) === '[object Function]';
}

/**
 * @function object
 * @param {any} object
 * @returns {boolean}
 */
export function object(object) {
  return toString.call(object) === '[object Object]';
}

/**
 * @function encode
 * @param {sting} path
 * @param {boolean} word
 * @returns {string}
 */
export function encode(path, word) {
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
export function isVaildValue(value) {
  if (value && string(value)) {
    return true;
  }

  return false;
}
