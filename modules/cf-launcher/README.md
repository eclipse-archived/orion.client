# cf-launcher #
A harness for Node.js [Cloud Foundry](http://cloudfoundry.org/) applications that makes debugging a bit easier.

cf-launcher wraps a simple web UI around your app, adding a [visual debugger](https://github.com/node-inspector/node-inspector),
a [shell](https://www.npmjs.org/package/tty.js), and the ability to kill or restart your app process right from the web.
If your app crashes or fails to start, the console output viewer shows you what happened.

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
   command: node server.js
   ```

   You would change it to this:

   ```
   command: node_modules/.bin/launcher -- node server.js
   ```

3. **Set a password**.
   This step is crucial, as it prevents random web users from accessing your app's internals through cf-launcher. 

   The password can be provided as a command-line option (again, in your manifest.yml):

   ```
   command: node_modules/.bin/launcher --password secretPassw0rd -- node server.js
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


## Command-line usage

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

## User interface
Once you've logged in, you're taken to a landing page that shows the status of your app, and the stdout/stderr log. Use the tabs
on the top banner to access the debugger and shell.

![screenshot](http://i.imgur.com/YH0kJqu.png)

## File access with WebDAV
cf-launcher includes a [WebDAV](http://en.wikipedia.org/wiki/WebDAV) server, which provides access to the files in your app instance.
Most operating systems ship with a WebDAV client built in, allowing you to map your instance files to a local drive or folder. You
can then view and edit the files in your app instance as easily as local files.

WebDAV connection info:
* URL: `http://your_application_url/launcher/dav`
* Username: (Any username should work, but don't leave it blank.)
* Password: (The password you chose when you set up cf-launcher.)

For detailed setup instructions, see:
* [Windows](http://doc.owncloud.org/server/6.0/user_manual/files/files.html#windows)
* [OS X](http://support.apple.com/kb/PH13859)
* [Linux](http://doc.owncloud.org/server/6.0/user_manual/files/files.html#linux)

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
