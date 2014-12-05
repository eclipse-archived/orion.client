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

**`--password=secret`** Required. Gives the password used to log in to cf-launcher.

**`--urlprefix=prefix`** Optional. Gives the URL prefix reserved by cf-launcher. Defaults to `urlprefix=launcher`.

**`--cors=origin`** Optional. Enables CORS requests to cf-launcher from the given [origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Origin).
  By default, CORS is not enabled.

## User interface
Once you've logged in, you're taken to a landing page that shows the status of your app, and the stdout/stderr log. Use the tabs
on the top banner to access the debugger and shell.

![screenshot](https://i.imgur.com/YH0kJqu.png)

## File access with WebDAV
cf-launcher includes a [WebDAV](http://en.wikipedia.org/wiki/WebDAV) server, which provides access to the files in your app instance.
Most operating systems ship with a WebDAV client built in, allowing you to map your instance files to a local drive or folder. You
can then view and edit the files in your app instance as easily as local files.

WebDAV connection info:
* URL: `https://your_application_url/launcher/dav`
* Username: `vcap`
* Password: (The password you chose when you set up cf-launcher.)

HTTPS is mandatory when connecting from most WebDAV clients: accessing your files using an `http://..` URL will fail.
But who needs HTTP anyway?

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

## Environment variables ##
cf-launcher can be controlled using the following environment variables:

#### DEBUG ####
The `DEBUG` environment variable enables debugging output from cf-launcher. For example this:
```shell
$ cf set-env myapp DEBUG cf-launcher:*
```
will print all debug output from cf-launcher to standard output, meaning it will appear in your app's `cf logs`.

To filter debug output, the following suffixes can appear after cf-launcher:
* `*`: logs everything.
* `auth`: logs login attempts and logouts.
* `proc`: logs action taken by the process manager, which is responsible for managing the lifecycle of the
  target app and node inspector. It can be scoped down further:
  * `proc:target`: logs only actions related to the target app process.
  * `proc:debugger`: logs only actions related to the node-inspector process.
* `proxy`: logs action taken by the reverse proxy, which takes over the web port and forwards requests based
  on the request URL.
* `webdav`: logs WebDAV requests. (This is an alias for the `debugMode` flag in the underlying jsDAV server.)

The `DEBUG` variable is very flexible. See [debug](https://www.npmjs.org/package/debug) for full details.

#### LAUNCHER_CORS_ORIGINS ####
* Gives a JSON array of origins that CORS requests will be allowed from.
* For example, to allow CORS requests from https://foo.example.org:
```shell
cf set-env myapp LAUNCHER_CORS_ORIGINS "[\"https://foo.example.org\"]"
```
* If any `--cors` command-line options are provided, the environment variable is ignored.

#### PASSWORD ####
* The `PASSWORD` environment variable gives the password used to log in to cf-launcher.

## License ##
Dual licensed under the
[Eclipse Public License](https://www.eclipse.org/legal/epl-v10.html) and the [Eclipse Distribution License](https://www.eclipse.org/org/documents/edl-v10.html).
