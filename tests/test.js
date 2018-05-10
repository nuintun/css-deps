const css = require('../index');

const code = `
@charset "utf-8";

@import "example1.css";
@import url(example2.css);
@import url("example3.css");
@import "example4.css" screen and (min-width: 800px);
@import url(example5.css) screen and (min-width: 800px);
@import url(example6.css) screen and (width: 800px), (color);
@import url(example7.css) screen and (min-device-width: 500px) and (max-device-width: 1024px);

:root .fg,
.bg {
  -moz-background-image: image-set(url(img/test.png) 1x, url("img/test-2x.png") 2x, url(my-img-print.png) 600dpi);
  -ms-filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src="rain1977.gif", sizingMethod="scale");
}

@font-face {
  font-family: icomoon;
  src: url("/Assets/css/fonts/icomoon.eot"); /* IE9 */
  src: url("/Assets/css/fonts/icomoon.eot?#iefix") format("embedded-opentype"),
    url("/Assets/css/fonts/icomoon.svg#icomoon") format("svg"), url("/Assets/css/fonts/icomoon.woff") format("woff"),
    url("/Assets/css/fonts/icomoon.ttf") format("truetype"); /* chrome、firefox、opera、Safari, Android, iOS 4.2+ */
  font-weight: normal;
  font-style: normal;
}
`;

let id = 1;
let image = 1;

console.time('css-deps');
const parsed = css(code, (path, media) => `test-${id++}.css`, {
  media: true,
  onpath: (prop, path) => `test-${image++}.png`
});
console.timeEnd('css-deps');

console.log(parsed.code);
console.log(new Array(106).join('-'));
console.log(JSON.stringify(parsed.dependencies, null, 2));
