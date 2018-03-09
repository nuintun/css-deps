/**
 * @module @nuintun/css-deps
 * @author nuintun
 * @license MIT
 * @version 2.0.0
 * @description Transform css and get css dependences
 * @see https://nuintun.github.io/css-deps
 */
"use strict";var postcss=require("postcss");const toString=Object.prototype.toString;function string(t){return"[object String]"===toString.call(t)}function fn(t){return"[object Function]"===toString.call(t)}function object(t){return"[object Object]"===toString.call(t)}function parser(t,e,r){let n;Buffer.isBuffer(t)&&(t=t.toString());const s=[];try{n=postcss.parse(t)}catch(e){return{code:t,dependencies:s}}e&&(object(e)?(r=e,e=null):fn(e)||(e=null));const c=fn((r=r||{}).onpath)?r.onpath:null;return n.walk(t=>{switch(t.type){case"atrule":if("import"===t.name){const r=/(?:url\()?(["']?)([^"')]+)\1(?:\))?/i;r.test(t.params)&&(t.params=t.params.replace(r,(r,n,c)=>{if(s.push(c),e){const n=e(c,t.name);if(string(n)&&n.trim())return r.replace(c,n);!1===n&&t.remove()}return r}))}break;case"decl":if(c){[/url\(\s*(['"]?)([^"')]+)\1\s*\)/gi,/[(,\s]+src\s*=\s*(['"]?)([^"')]+)\1/gi].some(e=>!!e.test(t.value)&&(t.value=t.value.replace(e,(e,r,n)=>{const s=c(n,t.prop);return string(s)&&s.trim()?e.replace(n,s):e}),!0))}}}),{code:t=n.toResult().css,dependencies:s}}module.exports=parser;