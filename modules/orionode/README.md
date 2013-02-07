# Orionode
A minimal, single-user deployment of [Eclipse Orion](http://www.eclipse.org/orion/). Use for hacking files on your computer using Orion's editing environment.

## Features
* Basic Navigator operations
* Basic Editor operations
* Plugin operations
* Shell command for launching a node app (type ```help node``` in the Shell page to find out more)
* Shell command for supporting npm.
* Client caching for static content
* Gzip
* Concatenation and minification of pages

## Usage
### Running the server
Run ```npm start orion``` or ```node [node_modules]/orion/server.js```.

### Using Orion within a larger app
Use ```require('orion')``` to get access to our startServer function, which is suitable for use within a larger [connect](https://github.com/senchalabs/connect/) project:

```
var orion = require('orion');
var connect = require('connect');
var myapp = connect()
    .use(orion({ workspaceDir: '.myworkspace' }))
/* .use( additional handlers ) */
```

For full instructions, see the [Getting Started guide](http://wiki.eclipse.org/Orion/Getting_Started_with_Orion_node).

## License
Dual-licensed under the [Eclipse Public License v1.0](http://www.eclipse.org/legal/epl-v10.html) and the [Eclipse Distribution License v1.0](http://www.eclipse.org/org/documents/edl-v10.html).
