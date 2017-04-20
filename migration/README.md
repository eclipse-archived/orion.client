## Webpack Migration Checklist

#### Setup
- Create a second clone of `orion.client` called `backup` - `cd .. && git clone https://github.com/eclipse/orion.client.git backup`
- Copy webpack/ bin/ and package.json to the root, and `npm install`
```
# Inside `orion.client`
cp -R migration/webpack .
cp -R migration/bin .
cp migration/package.json .
npm install
```

#### Orionode

Copy these files and hope there's no merge conflict
```
cp migration/orionode/defaults.pref modules/orionode/lib/orionode.client/defaults.pref
cp migration/orionode/package.json modules/orionode/package.json
```

#### Transpiling

- Copy the bundles/ folder to some safe place `cp -R org.eclipse.orion.client/bundles/ bundles/`
- Run the transpiling script `./bin/transpile.sh`
- Copy any files where transpiling failed from the backup dir to the orion.client dir

#### Build config

- For any needed entry points:
	- Remove the require.js code and script tag in the html file. If there's code that actually imports the modules and uses it (eg. connect() on a plugin) then create a new entry js file with that code instead, and use that file as the new entry point
	- Add a new `<script defer src="/js/..."><script>` tag
	- Add the appropriate new entry to `webpack/webpack.config.js`

#### Build and fix
- Run the build and fix the code manually as necessary. Specific things that might break the build includes
	- Path dependent code (eg. the worker wURL in the jsPlugin that fetches plugin files, and the regex for the pluginRegistry urls)
	- Code that might break babel.js strict mode in build time (eg. using `with()`)
	- Usage of the global variable (i.e. top level `this`)


## Build Flow

Webpack CLI / Node api -> Locale resolver -> Webpack resolver -> Loaders (including placeholderLoader used for html and css) -> Webpack bundling -> Output to build dir
