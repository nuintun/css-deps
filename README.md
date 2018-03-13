# css-deps

> Transform css and get css dependences
>
> [![Dependencies][david-image]][david-url]

### Api

* parseDependencies(code:String, replace:Function, options:Object):Object
* parseDependencies(code:String, options:Object):Object
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

[david-image]: http://img.shields.io/david/nuintun/css-deps.svg?style=flat-square
[david-url]: https://david-dm.org/nuintun/css-deps
