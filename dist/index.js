/**
 * @module @nuintun/css-deps
 * @author nuintun
 * @license MIT
 * @version 2.0.0
 * @description Transform css and get css dependences
 * @see https://nuintun.github.io/css-deps
 */
"use strict";var postcss=require("postcss");const toString=Object.prototype.toString;function string(t){return"[object String]"===toString.call(t)}function fn(t){return"[object Function]"===toString.call(t)}function object(t){return"[object Object]"===toString.call(t)}function parser(t,e,r){let s;Buffer.isBuffer(t)&&(t=t.toString());const n=[];e&&(object(e)?(r=e,e=null):fn(e)||(e=null)),r=r||{};try{s=postcss.parse(t,r.postcss)}catch(e){return{code:t,dependencies:n}}const c=fn(r.onpath)?r.onpath:null;return s.walk(t=>{switch(t.type){case"atrule":if("import"===t.name){const r=/(?:url\()?(["']?)([^"')]+)\1(?:\))?/i;r.test(t.params)&&(t.params=t.params.replace(r,(r,s,c)=>{if(n.push(c),e){const s=e(c,t.name);if(string(s)&&s.trim())return r.replace(c,s);!1===s&&t.remove()}return r}))}break;case"decl":if(c){[/url\(\s*(['"]?)([^"')]+)\1\s*\)/gi,/[(,\s]+src\s*=\s*(['"]?)([^"')]+)\1/gi].some(e=>!!e.test(t.value)&&(t.value=t.value.replace(e,(e,r,s)=>{const n=c(s,t.prop);return string(n)&&n.trim()?e.replace(s,n):e}),!0))}}}),{code:t=s.toResult().css,dependencies:n}}module.exports=parser;