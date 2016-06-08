# Orion
A minimal, single-user deployment of [Eclipse Orion](http://www.eclipse.org/orion/). Orion provides an extensible IDE that runs in your browser. It's particularly good for writing Javascript.

## Features
* Basic file management
* Source code editing
* Install plugins to customize your environment
* User preferences
* Git support based on [nodegit](http://www.nodegit.org/)
* Multi-user support (optional, requires MongoDB)

## Usage
For full instructions, see the [Getting Started guide](https://wiki.eclipse.org/Orion/Node/Getting_started).

## Installation
* To install the built server run `npm install orion`.
* Alternatively, you can install from source by checking out the repo from [GitHub](https://github.com/eclipse/orion.client) or [Eclipse.org](http://git.eclipse.org/c/orion/org.eclipse.orion.client.git/)
and then running `cd modules/orionode && npm install`.
* Orion has an optional dependency on the pty.js package, which is not installed by default.  If you're on a non-Windows platform you can install this package with `npm install pty.js`.  If this package is not installed then an error message will be displayed when the server is run, but will still run fine.

### Running the server
1. Browse to the directory where you installed Orion, usually `node_modules/orion/`.
2. Edit the `orion.conf` file. Uncomment the following line, replacing the password with something of your choice:
  ```
  pwd=[secretpassword]
  ```
  This prevents unauthorized access to your Orion server.
3. Run `npm start orion` or `node [node_modules]/orion/server.js`.
4. Go to **[http://localhost:8081](http://localhost:8081)** to use Orion. You will be prompted with a basic auth dialog; enter the password you chose earlier (leave the user name blank).

The port number can be changed by passing the `--port` argument or setting the `PORT` environment variable.

### Global installation
If you installed Orion as a global package with `npm install -g orion`, you can run the command `orion` from any directory (rather than `npm start orion` as outlined above.)
Orion will then start using your current directory (or a directory you specify on the command  line) as the location.
See the [Getting Started guide](https://wiki.eclipse.org/Orion/Node/Getting_started#Using_a_global_installation_of_Orionode) for more details.

### Multi-user server
By default the server runs in single-user mode. Set `orion.single.user=false` in the `orion.conf` file
to enable multiple users. This requires a MongoDB installation.

#### Known Git issues
* Cloning repos using the SSH protocol (`ssh://`) will not work out of the box due to a [Nodegit issue](https://github.com/nodegit/nodegit/pull/763).
  You can work around this by editing `vendor/libgit2.gyp`, obtaining a newer version of OpenSSL, and then rebuilding Nodegit from source.

### Using Orion within a larger app
Use `require('orion')` to get access to our startServer function, which is suitable for use within a larger [Express](http://expressjs.com/) project:

```js
var orion = require('orion');
var express = require('express');
var myapp = express()
			.use(orion({ workspaceDir: '.myworkspace' }))
			/* .use( additional handlers ) */
```

### Running the tests
We use [Mocha](https://github.com/visionmedia/mocha) for our tests. Run `npm test` or `mocha`.

## License
Dual-licensed under the [Eclipse Public License v1.0](http://www.eclipse.org/legal/epl-v10.html) and the [Eclipse Distribution License v1.0](http://www.eclipse.org/org/documents/edl-v10.html).
