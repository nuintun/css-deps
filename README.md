# css-deps

>Transform css and get css dependences
>
>[![Dependencies][david-image]][david-url]

### Api
* parseDependencies(code:String, replace:Function, options:Object):String
* parseDependencies(code:String, options:Object):Array
  * options { compress:Boolean, prifix:String, onpath:Function }
  * prifix: add prifix before selector
  * onpath: replace css resource file url

### Example
css:
```css
@import "reset.css";
@import "base.css";

html, body {
  height: 100%;
  width: 100%;
  font-size: 13px;
  font-family: Microsoft Yahei, SimSun, sans-serif;
}
```

js:
```js
var parseDependencies = require('css-deps');
var deps = parseDependencies(source);

// print dependencies
console.log(deps);
```

parser output:
```js
['reset.css', 'base.css']
```

## License

[MIT](LICENSE)

[david-image]: http://img.shields.io/david/nuintun/css-deps.svg?style=flat-square
[david-url]: https://david-dm.org/nuintun/css-deps
