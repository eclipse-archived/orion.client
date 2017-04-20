# AMD to ES6 module transpiler

[![Build Status](https://travis-ci.org/jonbretman/amd-to-as6.svg?branch=master)](https://travis-ci.org/jonbretman/amd-to-as6)

### What is it?
A simple tool for converting AMD modules into ES6 modules, either via the command line or programmatically.

### Why?
AMD and RequireJS are great, but ES6 modules provide a nicer syntax for writing JS modules and there are so many great [tools](https://github.com/addyosmani/es6-tools) available now for converting ES6 to ES5 which also allow you to use ES6 syntax/features.

### Installing

```sh
npm install amd-to-es6 -g
```

### Usage

To convert a single file (compiled output sent to stdout):

```sh
amdtoes6 my-amd-module.js > my-awesome-es6-module.js
```

To convert a whole directory:

```sh
amdtoes6 --dir src/ --out es6/
```

If you want to modify the original files just set `--out` to the same as `--dir`.

```sh
amdtoes6 --dir src --out src
```

If you want some files to be ignored use the `--ignore` flag which accepts a glob pattern that is relative to `--dir`.

```sh
amdtoes6 --dir src --ignore libs/**/*.js
```

If you want the indentation to be "fixed" then use the `--beautify` option which just runs the output through [jsbeautify](https://github.com/beautify-web/js-beautify).

If a file cannot be compiled an message will be printed explaining the error and it will be skipped.

### Examples

Modules without dependencies.

**AMD**
```js
define(function () {
    return {};
});
```

**ES6**
```js
export default {};
```

---

Modules with dependencies.

**AMD**
```js
define(['path/to/a', 'path/to/b'], function (a, b) {
    return function (x) {
        return a(b(x));
    };
});
```

**ES6**
```js
import a from 'path/to/a';
import b from 'path/to/b';

export default function (x) {
    return a(b(x));
};
```

---

If you have AMD modules that look like this, where not all dependencies are assigned to parameters but accessed in the module using `require`, `amdtoes6` will have to create some variable names. You wil probably want to change these.

**AMD**
```js
define(['require', 'path/to/a', 'path/to/b'], function (require) {
    return function (x) {
        var a = require('a');
        var b = require('b');
        return a(b(x));
    };
});
```

**ES6**
```js
import $__path_to_a from 'path/to/a';
import $__path_to_b from 'path/to/b';

export default function (x) {
    var a = $__path_to_a;
    var b = $__path_to_b;
    return a(b(x));
};
```

---

Imports for side-effects.

**AMD**
```js
define(['path/to/a', 'path/to/b'], function () {
    return {};
});
```

**ES6**
```js
import 'path/to/a';
import 'path/to/b';

export default {};
```

---

Without the `--beautify` option.

**AMD**
```js
define(['path/to/a', 'path/to/b'], function (a, b) {
    return function (x) {
        return a(b(x));
    };
});
```

**ES6**
```js
import a from 'path/to/a';
import b from 'path/to/b';

    export default function (x) {
        return a(b(x));
    };
```

### Options
```sh

  Usage: amdtoes6 [options]

  Options:

    -h, --help          output usage information
    -d --dir <dirname>  Use this option to specify a directory to compile.
    -o --out <dirname>  If using the --dir option this specifies the output directory.
    -i --ignore <glob>  If using the --dir options this specifies to exclude eg. libs/**/*
    -b --beautify       Run the output through jsbeautify (mainly useful for fixing indentation)

```

### Not Supported
* Named define modules eg. `define('my-module', function () {})`
* Files with multiple module definitions
* UMD style modules where the callback passed to `define` is not a function literal eg. `define(factoryFn)`
