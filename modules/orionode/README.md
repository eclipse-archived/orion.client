# Orionode
A minimal, single-user deployment of [Eclipse Orion](http://www.eclipse.org/orion/). Orion provides an extensible IDE that runs in your browser. It's particularly good for writing Javascript.

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
For full instructions, see the [Getting Started guide](http://wiki.eclipse.org/Orion/Node/Getting_started).
### Running the server
# Run ```npm start orion``` or ```node [node_modules]/orion/server.js```.
# Go to [localhost:8081](http://localhost:8081) to use Orion. (You can change the port by passing the```-p``` option).

### Using Orion within a larger app
Use ```require('orion')``` to get access to our startServer function, which is suitable for use within a larger [connect](https://github.com/senchalabs/connect/) project:

```
var orion = require('orion');
var connect = require('connect');
var myapp = connect()
    .use(orion({ workspaceDir: '.myworkspace' }))
/* .use( additional handlers ) */
```

### Running the tests
We use [Mocha](https://github.com/visionmedia/mocha) for our tests. Run ```npm test``` or ```mocha```.

## License
Dual-licensed under the [Eclipse Public License v1.0](http://www.eclipse.org/legal/epl-v10.html) and the [Eclipse Distribution License v1.0](http://www.eclipse.org/org/documents/edl-v10.html).
