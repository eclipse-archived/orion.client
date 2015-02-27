# Orion (9.0)
A minimal, single-user deployment of [Eclipse Orion](http://www.eclipse.org/orion/). Orion provides an extensible IDE that runs in your browser. It's particularly good for writing Javascript.

## Features
* Basic file management
* Source code editing
* Install plugins to customize your environment
* Fully featured web shell provided by [pty.js](https://github.com/chjj/pty.js) (OS X and Linux only)

## Usage
For full instructions, see the [Getting Started guide](http://wiki.eclipse.org/Orion/Node/Getting_started).

## Installation
Run `npm install orion`. Or checkout the source repo from [GitHub](https://github.com/eclipse/orion.client) or
[Eclipse.org](http://git.eclipse.org/c/orion/org.eclipse.orion.client.git/).

### Running the server
1. Browse to the directory where you installed Orion, usually `node_modules/orion/`.
2. Edit the `orion.conf` file. Uncomment the following line, replacing the password with something of your choice:
  ```
  pwd=secr3tPassw0rd
  ```
  This prevents unauthorized access to your Orion server.
3. Run `npm start orion` or `node [node_modules]/orion/server.js`.
4. Go to **[http://localhost:8081](http://localhost:8081)** to use Orion. You will be prompted with a basic auth dialog; enter the password you chose earlier.

The port number can be changed by passing the `-p` argument.

### Global installation
If you installed Orion as a global package with `npm install -g orion`, you can run the command `orion` from any directory (rather than `npm start orion` as outlined above.)
Orion will then start using your current directory (or a directory you specify on the command  line) as the location.
See the [Getting Started guide](https://wiki.eclipse.org/Orion/Node/Getting_started#Using_a_global_installation_of_Orionode) for more details.

### Using Orion within a larger app
Use `require('orion')` to get access to our startServer function, which is suitable for use within a larger [connect](https://github.com/senchalabs/connect/) project:

```js
var orion = require('orion');
var connect = require('connect');
var myapp = connect()
			.use(orion({ workspaceDir: '.myworkspace' }))
			/* .use( additional handlers ) */
```

### Running the tests
We use [Mocha](https://github.com/visionmedia/mocha) for our tests. Run `npm test` or `mocha`.

## License
Dual-licensed under the [Eclipse Public License v1.0](http://www.eclipse.org/legal/epl-v10.html) and the [Eclipse Distribution License v1.0](http://www.eclipse.org/org/documents/edl-v10.html).
