/*******************************************************************************
 * Copyright (c) 2012, 2013, 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, express, compression*/
var auth = require('./lib/middleware/auth'),
	express = require('express'),
	http = require('http'),
	https = require('https'),
	fs = require('fs'),
	os = require('os'),
	api = require('./lib/api'),
	compression = require('compression'),
	path = require('path'),
	socketio = require('socket.io'),
	util = require('util'),
	argslib = require('./lib/args'),
	ttyShell = require('./lib/tty_shell'),
	orion = require('./index.js'),
	prefs = require('./lib/controllers/prefs');

// Get the arguments, the workspace directory, and the password file (if configured), then launch the server
var args = argslib.parseArgs(process.argv);

var PORT_LOW = 8082;
var PORT_HIGH = 10082;
var port = args.port || args.p || process.env.PORT || 8081;
var configFile = args.config || args.c || path.join(__dirname, 'orion.conf');

var configParams = argslib.readConfigFileSync(configFile) || {};

function startServer(cb) {
	
	var workspaceArg = args.workspace || args.w;
	var workspaceConfigParam = configParams.workspace;
	var contextPath = configParams["orion.context.path"] || "";
	var workspaceDir;
	if (workspaceArg) {
		// -workspace passed in command line is relative to cwd
		workspaceDir = path.resolve(process.cwd(), workspaceArg);
	} else if (workspaceConfigParam) {
		 // workspace param in orion.conf is relative to the server install dir.
		workspaceDir = path.resolve(__dirname, workspaceConfigParam);
	} else if (configParams.isElectron) {
		workspaceDir =  path.join(os.homedir(), '.orion', '.workspace');
	} else {
		workspaceDir = path.join(__dirname, '.workspace');
	}
	argslib.createDirs([workspaceDir], function() {
	var passwordFile = args.password || args.pwd;
	argslib.readPasswordFile(passwordFile, function(password) {
		var dev = Object.prototype.hasOwnProperty.call(args, 'dev');
		var log = Object.prototype.hasOwnProperty.call(args, 'log');
		if (dev) {
			console.log('Development mode: client code will not be cached.');
		}
		if (passwordFile) {
			console.log(util.format('Using password from file: %s', passwordFile));
		}
		console.log(util.format('Using workspace: %s', workspaceDir));
		
		var server;
		try {
			// create web server
			var app = express();
			if (configParams["orion.https.key"] && configParams["orion.https.cert"]) {
				server = https.createServer({
					key: fs.readFileSync(configParams["orion.https.key"]),
					cert: fs.readFileSync(configParams["orion.https.cert"])
				}, app);
			} else {
				server = http.createServer(app);
			}

			// Configure middleware
			if (log) {
				app.use(express.logger('tiny'));
			}
			if (password || configParams.pwd) {
				app.use(auth(password || configParams.pwd));
			}
			
			app.use(compression());
			app.use(contextPath, function(req,res,next){ req.contextPath = contextPath; next();},orion({
				workspaceDir: workspaceDir,
				configParams: configParams,
				maxAge: dev ? 0 : undefined,
			}));
			var io = socketio.listen(server, { 'log level': 1, path: contextPath + '/socket.io' });
			ttyShell.install({ io: io, app: app, fileRoot: contextPath + '/file', workspaceDir: workspaceDir });

			server.on('listening', function() {
				console.log(util.format('Listening on port %d...', port));
				if (cb) {
					cb();
				}
			});
			server.on('error', function(err) {
				if (err.code === "EADDRINUSE") {
					port = Math.floor(Math.random() * (PORT_HIGH - PORT_LOW) + PORT_LOW);
					server.listen(port);
				}
			});
			server.listen(port);
		} catch (e) {
			console.error(e && e.stack);
		}
	});
	});
}

if (process.versions.electron) {
	var electron = require('electron'),
		autoUpdater = require('./lib/autoUpdater'),
		spawn = require('child_process').spawn,
		allPrefs = prefs.readPrefs(),
		feedURL = configParams["orion.autoUpdater.url"],
		version = electron.app.getVersion(),
		name = electron.app.getName(),
		platform = os.platform(),
		arch = os.arch();

	configParams.isElectron = true;
	electron.app.buildId = configParams["orion.buildId"];

	if (feedURL) {
		var updateChannel = allPrefs.user && allPrefs.user.updateChannel ? allPrefs.user.updateChannel : configParams["orion.autoUpdater.defaultChannel"],
			latestUpdateURL;
		if (platform === "linux") {
			latestUpdateURL = feedURL + '/download/channel/' + updateChannel + '/linux';
		} else {
			latestUpdateURL = feedURL + '/update/channel/' + updateChannel + '/' + platform + "_" + arch + '/' + version;
		}
		var resolveURL = feedURL + '/api/resolve?platform=' + platform + '&channel=' + updateChannel;
		
		autoUpdater.setResolveURL(resolveURL);
		autoUpdater.setFeedURL(latestUpdateURL);
	}

	var handleSquirrelEvent = function() {
		if (process.argv.length === 1 || os.platform() !== 'win32') { // No squirrel events to handle
			return false;
		}

		var	target = path.basename(process.execPath);

		function executeSquirrelCommand(args, done) {
			var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
			var child = spawn(updateDotExe, args, { detached: true });
			child.on('close', function() {
				done();
			});
		}

		var squirrelEvent = process.argv[1];
		switch (squirrelEvent) {
			case '--squirrel-install':
			case '--squirrel-updated':
				// Install desktop and start menu shortcuts
				executeSquirrelCommand(["--createShortcut", target], electron.app.quit);
				setTimeout(electron.app.quit, 1000);
				return true;
			case '--squirrel-obsolete':
				// This is called on the outgoing version of the app before
				// we update to the new version - it's the opposite of
				// --squirrel-updated
				electron.app.quit();
				return true;
			case '--squirrel-uninstall':
				// Remove desktop and start menu shortcuts
				executeSquirrelCommand(["--removeShortcut", target], electron.app.quit);
				setTimeout(electron.app.quit, 1000);
				return true;
		}
		return false;
	};

	if (handleSquirrelEvent()) {
		// Squirrel event handled and app will exit in 1000ms
		return;
	}

	var readyToOpenDir, relativeFileUrl;
	electron.app.on('open-file', function(event, path) {
		readyToOpenDir = path;
	});
	electron.app.on('ready', function() {
		var updateDownloaded  = false,
			updateDialog = false,
			linuxDialog = false,
			prefsWorkspace = allPrefs.user && allPrefs.user.workspace && allPrefs.user.workspace.currentWorkspace,
			recentWorkspaces = allPrefs.user && allPrefs.user.workspace && allPrefs.user.workspace.recentWorkspaces,
			Menu = electron.Menu;
			
		if (prefsWorkspace) {
			configParams.workspace = prefsWorkspace;
		}
		if(readyToOpenDir){
			try{
				var stats = fs.statSync(readyToOpenDir);
				if(stats.isFile()){
					var parentDir = path.dirname(readyToOpenDir);
					var similarity = 0;
					configParams.workspace = parentDir;
					recentWorkspaces.forEach(function(eachRecent){
						if(parentDir.lastIndexOf(eachRecent,0) === 0 && eachRecent.length > similarity){
							similarity = eachRecent.length;
							return configParams.workspace = eachRecent;
						}
					});
					relativeFileUrl = api.toURLPath(readyToOpenDir.substring(configParams.workspace.length));
				}else if(stats.isDirectory()){
					configParams.workspace = readyToOpenDir;
				}
				allPrefs.user.workspace.currentWorkspace = configParams.workspace;
				var RECENT_ARRAY_LENGTH = 10;
				var oldIndex = recentWorkspaces.indexOf(configParams.workspace);
				if(oldIndex !== -1){
					allPrefs.user.workspace.recentWorkspaces.splice(oldIndex,1);
				}
				if(recentWorkspaces.length < RECENT_ARRAY_LENGTH){
					allPrefs.user.workspace.recentWorkspaces.unshift(configParams.workspace);
				}else if(recentWorkspaces.length === RECENT_ARRAY_LENGTH){
					allPrefs.user.workspace.recentWorkspaces.pop();
					allPrefs.user.workspace.recentWorkspaces.unshift(configParams.workspace);
				}
				prefs.writePrefs(allPrefs);
			}catch(e){}
		}
		if (process.platform === 'darwin') {
			if (!Menu.getApplicationMenu()) {
				var template = [{
					label: "Application",
					submenu: [
						{ label: "About Application", selector: "orderFrontStandardAboutPanel:" },
						{ type: "separator" },
						{ label: "Quit", accelerator: "Command+Q", click: function() { electron.app.quit(); }}
					]}, {
					label: "Edit",
					submenu: [
						{ label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
						{ label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
						{ type: "separator" },
						{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
						{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
						{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
						{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
						{ label: "openDevTool", accelerator: "Cmd+Option+I",visible:false, click: function (item, focusedWindow) {
							//if windows, add F12 to also open dev tools - depending on electron / windows versions this might not be allowed to be rebound
							if (focusedWindow) focusedWindow.webContents.toggleDevTools();
						}}
					]}
				];
				Menu.setApplicationMenu(Menu.buildFromTemplate(template));
			}
		} else {
			//always add Ctrl+Shift+I for non-MacOS platforms - matches the browser devs tools shortcut
			var template = [makeDevToolMenuItem("Devtool","Ctrl+Shift+I")];
			Menu.setApplicationMenu(Menu.buildFromTemplate(template));
		}
		if(process.platform === "win32") {
			var menu = Menu.getApplicationMenu();
			//if windows, add F12 to also open dev tools - depending on electron / windows versions this might not be allowed to be rebound
			menu.append(new electron.MenuItem(makeDevToolMenuItem("DevtoolforWin32","F12")));
			Menu.setApplicationMenu(menu);
		}
		function makeDevToolMenuItem(label, accelerator){
			return {
				label: label,
				submenu: [
					{ label: "openDevTool", accelerator: accelerator, click: function (item, focusedWindow) {
			          if (focusedWindow) focusedWindow.webContents.toggleDevTools();
			        }}
				]
			}
		}
		autoUpdater.on("error", function(error) {
			console.log(error);
		});
		autoUpdater.on("update-available-automatic", function(newVersion) {
			if (platform === "linux" && !linuxDialog) {
				electron.dialog.showMessageBox({
					type: 'question',
					message: 'Update version ' + newVersion + ' is available.',
					detail: 'Use your package manager to update, or click Download to get the new package.',
					buttons: ['Download', 'OK']
				}, function (response) {
					if (response === 0) {
						electron.shell.openExternal(latestUpdateURL);
					} else {
						linuxDialog = false;
					}
				});
				linuxDialog = true;
			} else {
				autoUpdater.checkForUpdates();
			}
			
		});
		autoUpdater.on("update-downloaded", /* @callback */ function(event, releaseNotes, releaseName, releaseDate, updateURL) {
			updateDownloaded = true;
			if (!updateDialog) {
				electron.dialog.showMessageBox({
					type: 'question',
					message: 'Update version ' + releaseName + ' of ' + name + ' has been downloaded.',
					detail: 'Would you like to restart the app and install the update? The update will be applied automatically upon closing.',
					buttons: ['Update', 'Later']
				}, function (response) {
					if (response === 0) {
						autoUpdater.quitAndInstall();
					}
				});
				updateDialog = true;
			}
		});

		function scheduleUpdateChecks () {
			var checkInterval = (parseInt(configParams["orion.autoUpdater.checkInterval"], 10) || 30) * 1000 * 60;
			var resolveNewVersion = function() {
				autoUpdater.resolveNewVersion(false);
			}.bind(this);
			setInterval(resolveNewVersion, checkInterval);
		}
		function createWindow(url){
			var Url = require("url");
			var windowOptions = allPrefs.windowBounds || {width: 1024, height: 800};
			windowOptions.title = "Orion";
			windowOptions.icon = "icon/256x256/orion.png";
			var nextWindow = new electron.BrowserWindow(windowOptions);
			var ipcMain  = electron.ipcMain;
			nextWindow.setMenuBarVisibility(false);	// This line only work for Window and Linux
			if (windowOptions.maximized) {
				nextWindow.maximize();
			}
			nextWindow.loadURL("file:///" + __dirname + "/lib/main.html#" + encodeURI(url));
			nextWindow.webContents.on("new-window", /* @callback */ function(event, url, frameName, disposition, options){
				event.preventDefault();
				if (false === undefined) {// Always open new tabs for now
					createWindow(url);
				} 
				else if (Url.parse(url).hostname !== "localhost") {
					electron.shell.openExternal(url);
				}
				else {
					nextWindow.webContents.executeJavaScript('createTab("' + url + '");');
				}
			});
			nextWindow.on("close", function(event) {
				function exit() {
					allPrefs = prefs.readPrefs();
					allPrefs.windowBounds = nextWindow.getBounds();
					allPrefs.windowBounds.maximized = nextWindow.isMaximized();
					prefs.writePrefs(allPrefs);
					if (updateDownloaded) {
						nextWindow.webContents.session.clearCache(function() {
							nextWindow.destroy();
						});
					}else{
						nextWindow.destroy();
					}
				}
				event.preventDefault();
				nextWindow.webContents.send('toCollectTabsUrl');	
				ipcMain.on("collectTabsUrl", function(event, args){
					var allPrefs = prefs.readPrefs();
					var lastOpenedTabUrls = {};
					lastOpenedTabUrls[allPrefs.user.workspace.currentWorkspace] = args;
					allPrefs.user.workspace.lastOpenedTabUrls = lastOpenedTabUrls;
					prefs.writePrefs(allPrefs);
					exit();
				});
			});
			nextWindow.webContents.once("did-frame-finish-load", function () {
				if (feedURL) {
					autoUpdater.resolveNewVersion(false);
					scheduleUpdateChecks();
				}
			});
			api.getOrionEE().on("electron_workspace_changed",function(newWorkspace){
				console.log("server.js knows: ", newWorkspace);
				nextWindow.webContents.send('toCollectTabsUrl');
				ipcMain.on("collectTabsUrl", function(event, args){
					var allPrefs = prefs.readPrefs();
					var toSaveUrls = {};
					var lastWorkspace = allPrefs.user.workspace.recentWorkspaces[1];
					toSaveUrls[lastWorkspace] = args;
					allPrefs.user.workspace.lastOpenedTabUrls = toSaveUrls;
					prefs.writePrefs(allPrefs);
					var _lastOpenedTabUrls = allPrefs.user && allPrefs.user.workspace && allPrefs.user.workspace.lastOpenedTabUrls || allPrefs.user.workspace.lastOpenedTabUrls || {};
					var lastOpenedTabUrls = _lastOpenedTabUrls[newWorkspace] || [];
					nextWindow.webContents.executeJavaScript('closeAllTabs();');
					var hostUrl = "http://localhost:" + port;
					if(lastOpenedTabUrls.length > 0 && lastOpenedTabUrls[0] !== 'about:blank'){
						nextWindow.webContents.executeJavaScript('createTab("' + hostUrl + "/" + lastOpenedTabUrls[0] + '");');
						for(var i = 1; i < lastOpenedTabUrls.length; i++ ){
							if(lastOpenedTabUrls[i] !== 'about:blank'){
								
								nextWindow.webContents.executeJavaScript('window.open("' + hostUrl + "/" + lastOpenedTabUrls[i] + '");');
							}
						}
					}else{ // if user open that workspace for the first time
						nextWindow.webContents.executeJavaScript('createTab("' + hostUrl + '");');
					}
				});

			});	
			return nextWindow;
		}
		startServer(function() {
			var mainWindow,
			 	hostUrl = "http://localhost:" + port,
			 	_lastOpenedTabUrls = allPrefs.user && allPrefs.user.workspace && allPrefs.user.workspace.lastOpenedTabUrls || allPrefs.user.workspace.lastOpenedTabUrls || {},
				lastOpenedTabUrls = _lastOpenedTabUrls[prefsWorkspace] || [];

			if(relativeFileUrl){
				var fileUrl = hostUrl + "/edit/edit.html#/file" + relativeFileUrl;
				lastOpenedTabUrls.unshift("edit/edit.html#/file" + relativeFileUrl);
			}
			if(readyToOpenDir && prefsWorkspace !== configParams.workspace){
				mainWindow = createWindow(fileUrl ? fileUrl : hostUrl);
			}else{
				if(lastOpenedTabUrls.length > 0 && lastOpenedTabUrls[0] !== 'about:blank'){
					mainWindow = createWindow(hostUrl + "/" + lastOpenedTabUrls[0]); 
					for(var i = 1; i < lastOpenedTabUrls.length; i++ ){
						if(lastOpenedTabUrls[i] !== 'about:blank'){
							mainWindow.webContents.executeJavaScript('window.open("' + hostUrl + "/" + lastOpenedTabUrls[i] + '");');
						}
					}
				}else{ // if user open Orion for the first time
					mainWindow = createWindow(hostUrl);
				}
			}
			mainWindow.on('closed', function() {
				mainWindow = null;
			});
		});
	});
	electron.app.on('window-all-closed', function() {
		electron.app.quit();	
	});
	
} else {
	startServer();
}
