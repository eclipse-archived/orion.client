# cf-launcher #
A harness for your [Cloud Foundry](http://cloudfoundry.org/) application that makes debugging a bit easier.

cf-launcher wraps a simple web UI around your app, adding a [visual debugger](https://github.com/node-inspector/node-inspector),
and the ability to kill or restart your app right from the web, no CF commands necessary. If your app crashes or fails to start,
the console output viewer shows you what happened.

The launcher UI takes over a single URL prefix in your application's URL space: `/launcher`. If your app needs `/launcher`, you can
set the prefix to something else.


## Installation ##
1. **Install** cf-launcher as a dependency in your app:

   ```shell
   $ npm install --save cf-launcher
   ```

2. **Change your app's start command** to run `node_modules/.bin/launcher`.
   This is usually done by editing your app's `manifest.yml`. For example, if your `manifest.yml` has this command:

   ```
   start: node server.js
   ```

   You would change it to this:

   ```
   start: node_modules/.bin/launcher -- node server.js
   ```

3. **Set a password**.
   This step is crucial, as it prevents random web users from accessing your app's internals through cf-launcher. 

   The password can be provided as a command-line option (again, in your manifest.yml):

   ```
   start: node_modules/.bin/launcher --password secretPassw0rd -- node server.js
   ```

   Or you can set an environment variable named `LAUNCHER_PASSWORD` in your application environment. This is usually
   done using the CF [`set-env`](http://docs.run.pivotal.io/devguide/deploy-apps/environment-variable.html#cli) command:

   ```shell
   $ cf set-env myapp LAUNCHER_PASSWORD  secretPassw0rd
   ```

   The command-line argument takes priority over the environment variable if both are set. If you don't provide a password,
   cf-launcher refuses to run.

4. **Deploy** your app.

5. **Visit** `https://your_application_url/launcher`. You'll see the launcher login page. Log in with the password
   you provided earlier, and you're all set.


## Usage

	cf-launcher [options] -- [COMMAND]

Where `COMMAND` is the command you usually use to start your app (for example, `node myapp.js`).

The supported `[options]` are:

#### `--password=secret`
Required. Gives the password used to log in to cf-launcher.
####  `--urlprefix=prefix`
Optional. Gives the URL prefix reserved by cf-launcher. Defaults to `urlprefix=launcher`.

## Environment variables ##
* The `DEBUG` environment variable enables debugging output from cf-launcher. Set it to "cf-launcher" to activate it:
   ```shell
   $ cf set-env myapp DEBUG cf-launcher
   ```
 (The DEBUG variable can enable debugging for multiple libraries simultaneously. See [debug](https://www.npmjs.org/package/debug) for details.)

* The `PASSWORD` environment variable gives the password used to log in to cf-launcher.

## Uninstallation ##
When your app is ready for production, you should uninstall cf-launcher.

1. Remove cf-launcher from your app's dependencies:

   ```shell
   $ npm uninstall --save cf-launcher
   ```

2. Restore your application's original start command.


## License ##
Dual licensed under the
[Eclipse Public License](https://www.eclipse.org/legal/epl-v10.html) and the [Eclipse Distribution License](https://www.eclipse.org/org/documents/edl-v10.html).
