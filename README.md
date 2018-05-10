# css-deps

> Transform css and get css dependences
>
> [![NPM Version][npm-image]][npm-url]
> [![Download Status][download-image]][npm-url]
> [![Dependencies][david-image]][david-url]

### Api

* parseDependencies(code:String|Buffer, replace:Function, options:Object):Object
* parseDependencies(code:String|Buffer, options:Object):Object
  * options { media:Boolean, onpath:Function }
    * media: parse import media query
    * onpath: replace css resource file url

### Example

css:

```css
@import 'reset.css';
@import 'base.css';

html,
body {
  height: 100%;
  width: 100%;
  font-size: 13px;
  font-family: Microsoft Yahei, SimSun, sans-serif;
}
```

js:

```js
const parseDependencies = require('css-deps');
const dependencies = parseDependencies(source).dependencies;

// print dependencies
console.log(dependencies);
```

parser output:

```js
[{ path: 'reset.css', media: [] }, { path: 'base.css', media: [] }];
```

## License

[MIT](LICENSE)

[npm-image]: http://img.shields.io/npm/v/@nuintun/css-deps.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/@nuintun/css-deps
[download-image]: http://img.shields.io/npm/dm/@nuintun/css-deps.svg?style=flat-square
[david-image]: http://img.shields.io/david/nuintun/css-deps.svg?style=flat-square
[david-url]: https://david-dm.org/nuintun/css-deps
