/**
 * Created by nuintun on 2015/5/26.
 */

'use strict';

// variable declaration
var toString = Object.prototype.toString;

// exports
module.exports = {
  // the noop function
  noop: function (){},
  // is string
  string: function (string){
    return toString.call(string) === '[object String]';
  },
  // is function
  fn: function (fn){
    return toString.call(fn) === '[object Function]';
  },
  // is object
  object: function (object){
    return toString.call(object) === '[object Object]';
  }
};
