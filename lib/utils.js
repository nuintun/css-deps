/**
 * @module utils
 * @license MIT
 * @version 2017/11/10
 */

'use strict';

// variable declaration
const toString = Object.prototype.toString;

/**
 * @function noop
 */
function noop() {}

/**
 * @function string
 * @param {any} string
 */
function string(string) {
  return toString.call(string) === '[object String]';
}

/**
 * @function fn
 * @param {any} fn
 */
function fn(fn) {
  return toString.call(fn) === '[object Function]';
}

/**
 * @function object
 * @param {any} object
 */
function object(object) {
  return toString.call(object) === '[object Object]';
}

// exports
module.exports = {
  noop,
  string,
  fn,
  object
};
