/**
 * Created by nuintun on 2015/10/26.
 */

'use strict';

var util = require('../util');
var selectorParser = require('postcss-selector-parser');

/**
 * Can unquote attribute detection from mothereff.in
 * Copyright Mathias Bynens <https://mathiasbynens.be/>
 * https://github.com/mathiasbynens/mothereff.in
 */
var escapes = /\\([0-9A-Fa-f]{1,6})[ \t\n\f\r]?/g;
var pseudoElements = ['::before', '::after', '::first-letter', '::first-line'];
var range = /[\u0000-\u002c\u002e\u002f\u003A-\u0040\u005B-\u005E\u0060\u007B-\u009f]/;

/**
 * unquote
 * @param string
 * @returns {XML|void}
 */
function unquote(string){
  return string.replace(/["']/g, '');
}

/**
 * get parsed selector
 * @param selectors
 * @param callback
 * @returns {Object}
 */
function getParsed(selectors, callback){
  return selectorParser(callback).process(selectors).result;
}

/**
 * can unquote
 * @param value
 * @returns {boolean}
 */
function canUnquote(value){
  value = unquote(value);

  if (value) {
    value = value.replace(escapes, 'a').replace(/\\./g, 'a');

    return !(range.test(value) || /^(?:-?\d|--)/.test(value));
  }

  return false;
}

/**
 * compress rule selector
 * @param rule
 */
module.exports = function (rule){
  var selector = rule.raws.selector && rule.raws.selector.raw || rule.selector;

  rule.selector = getParsed(selector, function (selectors){
    var uniqueSelectors = [];

    // wack node
    selectors.eachInside(function (selector){
      var next = selector.next();
      var toString = String(selector);

      // Trim whitespace around the value
      selector.spaces.before = selector.spaces.after = '';

      if (selector.type === 'attribute') {
        if (selector.value) {
          // Join selectors that are split over new lines
          selector.value = selector.value.replace(/\\\n/g, '').trim();

          if (canUnquote(selector.value)) {
            selector.value = unquote(selector.value);
          }

          selector.operator = selector.operator.trim();
        }

        if (selector.raw) { selector.raw.insensitive = ''; }
        selector.attribute = selector.attribute.trim();
      }

      if (selector.type === 'combinator') {
        var value = selector.value.trim();

        selector.value = value.length ? value : ' ';
      }

      if (selector.type === 'pseudo') {
        var uniques = [];

        selector.eachInside(function (child){
          if (child.type === 'selector') {
            if (!~uniques.indexOf(String(child))) {
              uniques.push(String(child));
            } else {
              child.removeSelf();
            }
          }
        });

        if (~pseudoElements.indexOf(selector.value)) {
          selector.value = selector.value.slice(1);
        }
      }

      if (selector.type === 'selector' && selector.parent.type !== 'pseudo') {
        if (!~uniqueSelectors.indexOf(toString)) {
          uniqueSelectors.push(toString);
        } else {
          selector.removeSelf();
        }
      }

      if (selector.type === 'tag') {
        selector.value = selector.value.toLowerCase();

        if (selector.value === 'from') { selector.value = '0%'; }
        if (selector.value === '100%') { selector.value = 'to'; }
      }

      if (selector.type === 'universal') {
        if (next && next.type !== 'combinator') {
          selector.removeSelf();
        }
      }
    });
  });

  // remove duplicate selector
  rule.selector = util.unique(rule.selectors).join(',');
};
