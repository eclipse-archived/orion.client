# Orion (10.0)
A minimal, single-user deployment of [Eclipse Orion](http://www.eclipse.org/orion/). Orion provides an extensible IDE that runs in your browser. It's particularly good for writing Javascript.

## Features
* Basic file management
* Source code editing
* Install plugins to customize your environment
* Fully featured web shell provided by [pty.js](https://github.com/chjj/pty.js) (OS X and Linux only)
* Experimental git support based on [nodegit](http://www.nodegit.org/) (optional [add-on](#Adding Git support))

## Usage
For full instructions, see the [Getting Started guide](http://wiki.eclipse.org/Orion/Node/Getting_started).

## Installation
* Run `npm install orion`.
  * Or if you prefer, install from source: checkout the repo from [GitHub](https://github.com/eclipse/orion.client) or [Eclipse.org](http://git.eclipse.org/c/orion/org.eclipse.orion.client.git/),
    then run `cd modules/orionode && npm install`.
* Want Git features? Read the [next section](#Adding Git support).

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

### Adding Git support
The Orion Node server has limited support for Orion's rich [Git user interface](https://github.com/eclipse/orion.client/blob/master/bundles/org.eclipse.orion.client.help/web/helpContent/Orion%20User%20Guide/Git%20User%20Guide.md).
This is a brand new feature, so expect some incomplete workflows and rough edges. To try it out:

* `cd` to the directory where you installed the Orion Node server. (If you installed from source, `cd` into the `modules/orionode` folder.)
* Run `npm install nodegit@~0.4.0`
* Grab a coffee while libgit2 is downloaded/compiled.
* [Run the server](#Running the server) as usual.
* Click the git icon on the toolbar to access the Git Repository page. From here you can clone repos into your workspace, commit changes, and more!

#### Known Git issues
* Cloning repos with `ssh://` and `git:` URLs does not work. HTTP/HTTPS does work.
* Clicking an outgoing commit shows no details in the right-hand pane.
* `origin/master` shown as "new branch" when it's not new.
* All commits are shown in **Outgoing**, even those that belong under **History**.
* Outoging commit log shows "More commits" link even when the end has been reached.

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
