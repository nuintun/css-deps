/**
 * Created by nuintun on 2015/10/19.
 */

var fs = require('fs');
var postcss = require('postcss');
var parse = require('../');
var css = fs.readFileSync('./index.css').toString();

//var ast = postcss.parse(css, { from: './index.css' });
//
//ast.walk(function (node){
//  console.log(JSON.stringify(node, null, 2));
//  console.log('------------------------------------------');
//
//  if (node.type === 'atrule' && node.name === 'charset') {
//    node.remove()
//  }
//});
//
//console.log(ast.toResult().css);

console.time('parse');
var result = parse(css, function (url, name){
  console.log(url);
  console.log(name);
  console.log();

  return 'b.css';
}, {
  prefix: '.ui-dialog',
  onpath: function (url, name){
    console.log(url);
    console.log(name);
    console.log();

    return 'a.png';
  }
});

console.log(result);
console.timeEnd('parse');
