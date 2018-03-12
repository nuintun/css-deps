const css = require('../dist/index.src');

const code = `
@charset "utf-8";
@import "example1.css";
@import url(example2.css);
@import url("example3.css");
@import "example4.css" screen and (min-width:800px);
@import url(example5.css) screen and (min-width:800px);
@import url(example6.css) screen and (width:800px), (color);
@import url(example7.css) screen and (min-device-width:500px) and (max-device-width:1024px);

:root .fg, .bg{
  background-image: image-set(
    url(img/test.png) 1x,
    url("img/test-2x.png") 2x,
    url(my-img-print.png) 600dpi
  );
}
`;

const parsed = css(code, () => 'test.css', { onpath: () => 'test.png' });

console.log(parsed.code);
console.log(parsed.dependencies);
