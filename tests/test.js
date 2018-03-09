const css = require('../dist/index.src');

const code = `
@charset "utf-8";
@import url("example1.css");
@import url(example2.css);
@import "example3.css";
@import "example4.css" screen and (min-width:800px);

:root .fg, .bg{
  background-image: image-set(
    url(img/test.png) 1x,
    url("img/test-2x.png") 2x,
    url(my-img-print.png) 600dpi
  );
}
`;

const parsed = css(code, () => true, { prefix: '.hello', onpath: () => 'hello.png' });

console.log(parsed.code);
console.log(parsed.dependencies);
