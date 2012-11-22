/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     Kris De Volder (VMWare) - initial API and implementation
 *******************************************************************************/

/*global define window*/
/*jslint browser:true sub:true*/

define(["i18n!orion/shell/nls/messages", "require", "dojo", "orion/bootstrap", "orion/commands", "orion/fileClient", "orion/searchClient", "orion/globalCommands",
		"orion/widgets/Shell", "orion/treetable", "shell/shellPageFileService", "shell/paramType-file", "shell/paramType-plugin", "shell/paramType-service",
		"orion/i18nUtil", "shell/extensionCommands", "orion/contentTypes", "orion/pluginregistry"],
	function(messages, require, dojo, mBootstrap, mCommands, mFileClient, mSearchClient, mGlobalCommands, mShell, mTreeTable, mShellPageFileService, mFileParamType,
		mPluginParamType, mServiceParamType, i18nUtil, mExtensionCommands, mContentTypes, mPluginRegistry) {

	var shellPageFileService, fileClient, output;
	var hashUpdated = false;
	var contentTypeService, openWithCommands = [], serviceRegistry;
	var pluginRegistry, pluginsType, preferences, serviceElementCounter = 0;

	/* model and renderer for displaying services */

	var ServicesModel = (function() {
		function ServicesModel(root) {
			this.root = root;
		}
		ServicesModel.prototype = {
			getRoot: function(onItem) {
				onItem(this.root);
			},
			getChildren: function(parentItem, onComplete) {
				onComplete(parentItem.values);
			},
			getId: function(item) {
				return item.elementId;
			}
		};
		return ServicesModel;
	}());

	var ServicesRenderer = (function() {
		function ServicesRenderer() {
		}
		ServicesRenderer.prototype = {			
			getTwistieElementId: function(rowId) {
				return rowId + "__expand"; //$NON-NLS-0$
			},
			initTable: function(tableNode) {
			},
			labelColumnIndex: function() {
				return 0;
			},
			render: function(item, tr) {
				tr.className += " treeTableRow"; //$NON-NLS-0$
				var td = document.createElement("td"); //$NON-NLS-0$
				tr.appendChild(td);

				if (!item.value) {
					/* top-level row displaying service name */
					var span = document.createElement("span"); //$NON-NLS-0$
					td.appendChild(span);

					var twistieElement = document.createElement("span"); //$NON-NLS-0$
					twistieElement.id = this.getTwistieElementId(tr.id);
					span.appendChild(twistieElement);
					twistieElement.className = "modelDecorationSprite core-sprite-closedarrow"; //$NON-NLS-0$
					var self = this;
					twistieElement.onclick = function(event) {
						self.tableTree.toggle(tr.id);
					};

					td = document.createElement("td"); //$NON-NLS-0$
					tr.appendChild(td);
					var b = document.createElement("b"); //$NON-NLS-0$
					td.appendChild(b);
					b.textContent = item.name;
					if (item.id) {
						span = document.createElement("span"); //$NON-NLS-0$
						td.appendChild(span);
						span.textContent = " (" + item.id + ")"; //$NON-NLS-1$ //$NON-NLS-0$
					}
					td.colSpan = "2"; //$NON-NLS-0$
					return;
				}

				/* child row displaying a property of a service */
				td = document.createElement("td"); //$NON-NLS-0$
				tr.appendChild(td);
				td.textContent = item.name;
				td = document.createElement("td"); //$NON-NLS-0$
				tr.appendChild(td);
				td.textContent = item.value;
			},
			updateExpandVisuals: function(row, isExpanded) {
				var twistieElement = document.getElementById(this.getTwistieElementId(row.id));
				if (twistieElement) {
					var className = twistieElement.className;
					if (isExpanded) {
						className += " core-sprite-openarrow"; //$NON-NLS-0$
						className = className.replace(/\s?core-sprite-closedarrow/g, "");
					} else {
						className += " core-sprite-closedarrow"; //$NON-NLS-0$
						className = className.replace(/\s?core-sprite-openarrow/g, "");
					}
					twistieElement.className = className;
				}
			}
		};
		return ServicesRenderer;
	}());

	/* general functions for working with file system nodes */

	var resolveError = function(promise, xhrResult) {
		var error = xhrResult;
		try {
			error = JSON.parse(xhrResult.responseText);
		} catch (e) {}
		if (error && error.Message) {
			error = i18nUtil.formatMessage(messages["Error: ${0}"], error.Message);
		} else if (typeof xhrResult.url === "string") {
			if (xhrResult.status === 0) {
				error = i18nUtil.formatMessage(messages["NoResponseFromServer"], xhrResult.url);
			} else {
				error = i18nUtil.formatMessage(messages["ServerError"], xhrResult.url, xhrResult.status, xhrResult.statusText);
			}
		}
		var errNode = document.createElement("span"); //$NON-NLS-0$
		errNode.textContent = error;
		promise.resolve(errNode);
	};

	function computeEditURL(node) {
		for (var i = 0; i < openWithCommands.length; i++) {
			var openWithCommand = openWithCommands[i];
			if (openWithCommand.visibleWhen(node)) {
				return openWithCommand.hrefCallback({items: node});  /* use the first one */
			}
		}

		/*
		 * Use the default editor if there is one and the resource is not an image,
		 * otherwise open the resource's direct URL.
		 */
		var contentType = contentTypeService.getFileContentType(node);
		switch (contentType && contentType.id) {
			case "image/jpeg": //$NON-NLS-0$
			case "image/png": //$NON-NLS-0$
			case "image/gif": //$NON-NLS-0$
			case "image/ico": //$NON-NLS-0$
			case "image/tiff": //$NON-NLS-0$
			case "image/svg": //$NON-NLS-0$
				return node.Location;
		}

		var defaultEditor = null;
		for (i = 0; i < openWithCommands.length; i++) {
			if (openWithCommands[i].isEditor === "default") { //$NON-NLS-0$
				defaultEditor = openWithCommands[i];
				break;
			}
		}
		if (!defaultEditor) {
			return node.Location;
		}
		return defaultEditor.hrefCallback({items: node});
	}

	function createLink(node) {
		var link = document.createElement("a"); //$NON-NLS-0$
		if (node.Directory) {
			link.href = "#" + node.Location; //$NON-NLS-0$
			link.className = "shellPageDirectory"; //$NON-NLS-0$
			link.textContent = node.Name;
			return link;
		}
		link.href = computeEditURL(node);
		link.target = "_blank";  //$NON-NLS-0$
		link.textContent = node.Name;
		return link;
	}

	/* implementations of built-in file system commands */

	function getChangedToElement(dirName) {
		var span = document.createElement("span"); //$NON-NLS-0$
		span.appendChild(document.createTextNode(messages["Changed to: "]));
		var bold = document.createElement("b"); //$NON-NLS-0$
		bold.appendChild(document.createTextNode(dirName));
		span.appendChild(bold);
		return span;
	}
	
	function cdExec(args, context) {
		var node = args.directory;
		if (!node) {
			return "";
		}
		shellPageFileService.setCurrentDirectory(node);
		hashUpdated = true;
		dojo.hash(node.Location);
		var pathString = shellPageFileService.computePathString(node);
		return getChangedToElement(pathString);
	}

	function editExec(node) {
		if (!node.file) {
			return;
		}
		var url = computeEditURL(node.file);
		window.open(url);
	}

	function lsExec(args, context) {
		var result = context.createPromise();
		var location = dojo.hash() || shellPageFileService.SEPARATOR;
		shellPageFileService.loadWorkspace(location).then(
			function(node) {
				shellPageFileService.setCurrentDirectory(node); /* flush current node cache */
				shellPageFileService.withChildren(node,
					function(children) {
						var fileList = document.createElement("div"); //$NON-NLS-0$
						for (var i = 0; i < children.length; i++) {
							fileList.appendChild(createLink(children[i]));
							fileList.appendChild(document.createElement("br")); //$NON-NLS-0$
						}
						result.resolve(fileList);

						/*
						 * GCLI changes the target for all <a> tags contained in a result to _blank,
						 * to force clicked links to open in a new window or tab.  However links that
						 * are created by this command to represent directories should open in the
						 * same window/tab since the only change is the page hash.
						 *
						 * To work around this GCLI behavior, do a pass of all links created by this
						 * command to represent directories and change their targets back to _self.
						 * This must be done asynchronously to ensure that it runs after GCLI has done
						 * its initial conversion of targets to _blank.
						 */
						setTimeout(function() {
							var links = output.querySelectorAll(".shellPageDirectory"); //$NON-NLS-0$
							for (var i = 0; i < links.length; i++) {
								links[i].setAttribute("target", "_self"); //$NON-NLS-1$ //$NON-NLS-0$
								links[i].className = "";
							}
						}, 1);
					},
					function(error) {
						resolveError(result, error);
					}
				);
			},
			function(error) {
				resolveError(result, error);
			}
		);
		return result;
	}

	function pwdExec(args, context) {
		var result = context.createPromise();
		var node = shellPageFileService.getCurrentDirectory();
		shellPageFileService.loadWorkspace(node.Location).then(
			function(node) {
				var buffer = shellPageFileService.computePathString(node);
				var b = document.createElement("b"); //$NON-NLS-0$
				b.appendChild(document.createTextNode(buffer));
				result.resolve(b);
			},
			function(error) {
				resolveError(result, error);
			}
		);
		return result;
	}

	/* implementations of built-in plug-in management commands */

	function pluginServicesExec(args, context) {
		if (!args.plugin) {
			return "";
		}

		var result = document.createElement("div"); //$NON-NLS-0$
		var services = args.plugin.getServiceReferences();
		services.forEach(function(service) {
			var current = {values: []};
			var keys = service.getPropertyKeys();
			keys.forEach(function(key) {
				if (key === "service.names") { //$NON-NLS-0$
					current.name = service.getProperty(key).join();
				}
				if (key === "id") {
					current.id = service.getProperty(key);
				}
				current.values.push({name: key, value: service.getProperty(key)});
			});
			if (current.name) {
				current.elementId = "serviceElement" + serviceElementCounter++; //$NON-NLS-0$
				current.values.forEach(function(value) {
					value.elementId = "serviceElement" + serviceElementCounter++; //$NON-NLS-0$
				});
				var parent = document.createElement("div"); //$NON-NLS-0$
				result.appendChild(parent);
				var renderer = new ServicesRenderer();
				var tableTree = new mTreeTable.TableTree({
					model: new ServicesModel(current),
					showRoot: true,
					parent: parent,
					renderer: renderer
				});
				renderer.tableTree = tableTree;
			}
		});
		return result;
	}

	function pluginsListExec(args, context) {
		var plugins = pluginsType.getPlugins();
		var result = document.createElement("table"); //$NON-NLS-0$
		for (var i = 0; i < plugins.length; i++) {
			var row = document.createElement("tr"); //$NON-NLS-0$
			result.appendChild(row);
			var td = document.createElement("td"); //$NON-NLS-0$
			row.appendChild(td);
			var b = document.createElement("b"); //$NON-NLS-0$
			td.appendChild(b);
			b.textContent = plugins[i].name;
			var state = plugins[i].getState();
			if (state !== "active" && state !== "starting") { //$NON-NLS-1$ //$NON-NLS-0$
				var span = document.createElement("span"); //$NON-NLS-0$
				td.appendChild(span);
				span.textContent = " (" + messages.disabled + ")"; //$NON-NLS-1$ //$NON-NLS-0$
			}
		}
		return result;
	}

	function pluginsDisableExec(args, context) {
		var plugin = args.plugin;
		if (!plugin) {
			return "";
		}

		var result = context.createPromise();
		plugin.stop().then(
			function() {
				result.resolve(messages.Succeeded);
			},
			function(error) {
				result.resolve(error);
			}
		);
		return result;
	}

	function pluginsEnableExec(args, context) {
		var plugin = args.plugin;
		if (!plugin) {
			return "";
		}

		var result = context.createPromise();
		plugin.start({lazy:true}).then(
			function() {
				result.resolve(messages.Succeeded);
			},
			function(error) {
				result.resolve(error);
			}
		);
		return result;
	}

	function pluginsInstallExec(args, context) {
		var url = args.url.trim();
		if (/^\S+$/.test(url)) {
			if (pluginRegistry.getPlugin(url)){
				return messages["Plug-in is already installed"];
			}
			var result = context.createPromise();
			pluginRegistry.installPlugin(url).then(
				function(plugin) {
					plugin.start({lazy:true}).then(
						function() {
							preferences.getPreferences("/plugins").then(function(plugins) { //$NON-NLS-0$
								plugins.put(url, true);
							});
							result.resolve(messages.Succeeded);
						},
						function(error) {
							result.resolve(error);
						}
					);
				},
				function(error) {
					result.resolve(error);
				}
			);
			return result;
		}
		return messages["Invalid plug-in URL"];
	}

	function pluginsReloadExec(args, context) {
		var plugin = args.plugin;
		if (!plugin) {
			return "";
		}

		var result = context.createPromise();
		plugin.update().then(
			function() {
				result.resolve(messages.Succeeded);
			},
			function(error) {
				result.resolve(error);
			}
		);
		return result;
	}

	function pluginsUninstallExec(args, context) {
		if (!args.plugin) {
			return "";
		}

		var result = context.createPromise();
		if (args.plugin.isAllPlugin) {
			var msg = messages["Are you sure you want to uninstall all contributed plug-ins?"];
			if (!window.confirm(msg)) {
				return messages.Aborted;
			}
			args.plugin.uninstall().then(
				function() {
					preferences.getPreferences("/plugins").then( //$NON-NLS-0$
						function(plugins) {
							var locations = args.plugin.getPluginLocations();
							for (var i = 0; i < locations.length; i++) {
								plugins.remove(locations[i]);
							}
						}.bind(this) /* force a sync */
					);
					result.resolve(messages.Succeeded);
				},
				function(error) {
					result.resolve(error);
				}
			);
		} else {
			var location = args.plugin.getLocation();
			var plugin = pluginRegistry.getPlugin(location);
			plugin.uninstall().then(
				function() {
					preferences.getPreferences("/plugins").then( //$NON-NLS-0$
						function(plugins) {
							plugins.remove(location);
						}.bind(this) /* force a sync */
					);
					result.resolve(messages.Succeeded);
				},
				function(error) {
					result.resolve(error);
				}
			);
		}
		return result;
	}
	
	/* implementations of built-in service management commands */

	function serviceContributorsExec(args, context) {
		if (!args.id) {
			return "";
		}

		var serviceId = args.id.trim();
		var result = document.createElement("div"); //$NON-NLS-0$
		var plugins = pluginsType.getPlugins();
		plugins.forEach(function(plugin) {
			var services = plugin.getServiceReferences();
			services.forEach(function(service) {
				var names = service.getProperty("service.names"); //$NON-NLS-0$
				if (names.indexOf(serviceId) !== -1) {
					var current = {name: plugin.name, values: []};
					var keys = service.getPropertyKeys();
					keys.forEach(function(key) {
						if (key === "id") { //$NON-NLS-0$
							current.id = service.getProperty(key);
						}
						current.values.push({name: key, value: service.getProperty(key)});
					});
					current.elementId = "serviceElement" + serviceElementCounter++; //$NON-NLS-0$
					current.values.forEach(function(value) {
						value.elementId = "serviceElement" + serviceElementCounter++; //$NON-NLS-0$
					});
					var parent = document.createElement("div"); //$NON-NLS-0$
					result.appendChild(parent);
					var renderer = new ServicesRenderer();
					var tableTree = new mTreeTable.TableTree({
						model: new ServicesModel(current),
						showRoot: true,
						parent: parent,
						renderer: renderer
					});
					renderer.tableTree = tableTree;
				}
			});
		});

		return result;
	}

	/* functions for handling contributed commands */

	/*
	 * Creates a gcli exec function that wraps a 'callback' function contributed by
	 * an 'orion.shell.command' service implementation.
	 */
	function contributedExecFunc(service) {
		if (typeof(service.callback) === "function") { //$NON-NLS-0$
			return function(args, context) {
				var promise = context.createPromise();
				service.callback(args).then(
					function(result) {
						promise.resolve(result);
					},
					function(error) {
						resolveError(promise, error);
					}
				);
				return promise;
			};
		}
		return undefined; 
	}

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			pluginRegistry = core.pluginRegistry;
			serviceRegistry = core.serviceRegistry;
			preferences = core.preferences;

			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			mGlobalCommands.generateBanner("orion-shellPage", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$
			mGlobalCommands.setPageTarget({task: messages.Shell});

			output = document.getElementById("shell-output"); //$NON-NLS-0$
			var input = document.getElementById("shell-input"); //$NON-NLS-0$
			var shell = new mShell.Shell({input: input, output: output});
			shell.setFocus();

			shellPageFileService = new mShellPageFileService.ShellPageFileService();
			var location = dojo.hash();
			var ROOT_ORIONCONTENT = "/file"; //$NON-NLS-0$
			shellPageFileService.loadWorkspace(location || ROOT_ORIONCONTENT).then(
				function(node) {
					shellPageFileService.setCurrentDirectory(node);
				}
			);
			if (location.length === 0) {
				hashUpdated = true;
				dojo.hash(ROOT_ORIONCONTENT);
			}

			/* add the locally-defined types */
			var directoryType = new mFileParamType.ParamTypeFile("directory", shellPageFileService, true, false); //$NON-NLS-0$
			shell.registerType(directoryType);
			var fileType = new mFileParamType.ParamTypeFile("file", shellPageFileService, false, true); //$NON-NLS-0$
			shell.registerType(fileType);

			/* for single-selection commands for use on any plug-in */
			var pluginType = new mPluginParamType.ParamTypePlugin("plugin", pluginRegistry, false, true); //$NON-NLS-0$
			shell.registerType(pluginType);
			/* for multiple-selection commands for use on any plug-in */
			pluginsType = new mPluginParamType.ParamTypePlugin("plugins", pluginRegistry); //$NON-NLS-0$
			shell.registerType(pluginsType);
			/* for single-selection commands for use on contributed plug-ins only */
			var contributedPluginType = new mPluginParamType.ParamTypePlugin("contributedPlugin", pluginRegistry, true, true); //$NON-NLS-0$
			shell.registerType(contributedPluginType);
			/* for multiple-selection commands for use on contributed plug-ins only */
			var contributedPluginsType = new mPluginParamType.ParamTypePlugin("contributedPlugins", pluginRegistry, true); //$NON-NLS-0$
			shell.registerType(contributedPluginsType);

			var serviceType = new mServiceParamType.ParamTypeService("service", pluginRegistry); //$NON-NLS-0$
			shell.registerType(serviceType);

			/* add the locally-defined commands */
			shell.registerCommand({
				name: "cd", //$NON-NLS-0$
				description: messages["Changes the current directory"],
				callback: cdExec,
				parameters: [{
					name: "directory", //$NON-NLS-0$
					type: "directory", //$NON-NLS-0$
					description: messages["The name of the directory"]
				}],
				returnType: "html" //$NON-NLS-0$
			});
			shell.registerCommand({
				name: "edit", //$NON-NLS-0$
				description: messages["Edits a file"],
				callback: editExec,
				parameters: [{
					name: "file", //$NON-NLS-0$
					type: "file", //$NON-NLS-0$
					description: messages["The name of the file"]
				}]
			});
			shell.registerCommand({
				name: "ls", //$NON-NLS-0$
				description: messages["Lists the files in the current directory"],
				callback: lsExec,
				returnType: "html" //$NON-NLS-0$
			});
			shell.registerCommand({
				name: "pwd", //$NON-NLS-0$
				description: messages["Prints the current directory location"],
				callback: pwdExec,
				returnType: "html" //$NON-NLS-0$
			});
			shell.registerCommand({
				name: "clear", //$NON-NLS-0$
				description: messages["Clears the shell screen"],
				callback: function(args, context) {
					shell.clear();
				}
			});

			/* plug-in management commands */
			shell.registerCommand({
				name: "plugins", //$NON-NLS-0$
				description: messages["Commands for working with plug-ins"]
			});
			shell.registerCommand({
				name: "plugins list", //$NON-NLS-0$
				description: messages["Lists all registered plug-ins"],
				callback: pluginsListExec,
				returnType: "html" //$NON-NLS-0$
			});
			shell.registerCommand({
				name: "plugins install", //$NON-NLS-0$
				description: messages["Installs a plug-in from a URL"],
				callback: pluginsInstallExec,
				parameters: [{
					name: "url", //$NON-NLS-0$
					type: "string", //$NON-NLS-0$
					description: messages["The plug-in URL"]
				}],
				returnType: "string" //$NON-NLS-0$
			});
			shell.registerCommand({
				name: "plugins uninstall", //$NON-NLS-0$
				description: messages["Uninstalls a contributed plug-in from the configuration"],
				callback: pluginsUninstallExec,
				parameters: [{
					name: "plugin", //$NON-NLS-0$
					type: "contributedPlugins", //$NON-NLS-0$
					description: messages["The name of the contributed plug-in"]
				}],
				returnType: "string" //$NON-NLS-0$
			});
			shell.registerCommand({
				name: "plugins reload", //$NON-NLS-0$
				description: messages["Reloads a plug-in"],
				callback: pluginsReloadExec,
				parameters: [{
					name: "plugin", //$NON-NLS-0$
					type: "plugins", //$NON-NLS-0$
					description: messages["The name of the plug-in"]
				}],
				returnType: "string" //$NON-NLS-0$
			});
			shell.registerCommand({
				name: "plugins enable", //$NON-NLS-0$
				description: messages["Enables a contributed plug-in"],
				callback: pluginsEnableExec,
				parameters: [{
					name: "plugin", //$NON-NLS-0$
					type: "contributedPlugins", //$NON-NLS-0$
					description: messages["The name of the contributed plug-in"]
				}],
				returnType: "string" //$NON-NLS-0$
			});
			shell.registerCommand({
				name: "plugins disable", //$NON-NLS-0$
				description: messages["Disables a contributed plug-in"],
				callback: pluginsDisableExec,
				parameters: [{
					name: "plugin", //$NON-NLS-0$
					type: "contributedPlugins", //$NON-NLS-0$
					description: messages["The name of the contributed plug-in"]
				}],
				returnType: "string" //$NON-NLS-0$
			});
			shell.registerCommand({
				name: "plugins services", //$NON-NLS-0$
				description: messages["Displays a plug-in's services"],
				callback: pluginServicesExec,
				parameters: [{
					name: "plugin", //$NON-NLS-0$
					type: "plugin", //$NON-NLS-0$
					description: messages["The name of the plug-in"]
				}],
				returnType: "html" //$NON-NLS-0$
			});

			/* service management commands */
			shell.registerCommand({
				name: "service", //$NON-NLS-0$
				description: messages["Commands for working with a service"]
			});

			shell.registerCommand({
				name: "service contributors", //$NON-NLS-0$
				description: messages["Displays all plug-in contributions for a service"],
				callback: serviceContributorsExec,
				parameters: [{
					name: "id", //$NON-NLS-0$
					type: "service", //$NON-NLS-0$
					description: messages["The service identifier"]
				}],
				returnType: "html" //$NON-NLS-0$
			});

			/* initialize the editors cache (used by some of the build-in commands */
			contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
			serviceRegistry.getService("orion.core.contenttypes").getContentTypes().then(function(contentTypes) { //$NON-NLS-0$
				var commands = mExtensionCommands._createOpenWithCommands(serviceRegistry, contentTypes);
				for (var i = 0; i < commands.length; i++) {
					var commandDeferred = mExtensionCommands._createCommandOptions(commands[i].properties, commands[i].service, serviceRegistry, contentTypes, true);
					commandDeferred.then(
						function(command) {
							openWithCommands.push(command);
						}
					);
				}
			});

			// TODO
			/* add types contributed through the plug-in API */
//			var allReferences = serviceRegistry.getServiceReferences("orion.shell.type");
//			for (var i = 0; i < allReferences.length; ++i) {
//				var ref = allReferences[i];
//				var service = serviceRegistry.getService(ref);
//				if (service) {
//					var type = {name: ref.getProperty("name"), parse: contributedParseFunc(service)};
//					if (service.stringify) {
//						type.stringify = service.stringify;
//					}
//					if (service.increment) {
//						type.increment = service.increment;
//					}
//					if (service.decrement) {
//						type.decrement = service.decrement;
//					}
//					shell.registerType(type);
//				}
//			}
			
			/* add commands contributed through the plug-in API */
			var allReferences = serviceRegistry.getServiceReferences("orion.shell.command"); //$NON-NLS-0$
			for (var i = 0; i < allReferences.length; ++i) {
				var ref = allReferences[i];
				var service = serviceRegistry.getService(ref);
				if (service) {
					if (ref.getProperty("nls") && ref.getProperty("descriptionKey")){  //$NON-NLS-1$ //$NON-NLS-0$
						i18nUtil.getMessageBundle(ref.getProperty("nls")).then( //$NON-NLS-0$
							function(ref, commandMessages) {
								shell.registerCommand({
									name: ref.getProperty("name"), //$NON-NLS-0$
									description: commandMessages[ref.getProperty("descriptionKey")], //$NON-NLS-0$
									callback: contributedExecFunc(service),
									returnType: "string", //$NON-NLS-0$
									parameters: ref.getProperty("parameters"), //$NON-NLS-0$
									manual: ref.getProperty("manual") //$NON-NLS-0$
								});
						}, ref);
					} else {
						shell.registerCommand({
							name: ref.getProperty("name"), //$NON-NLS-0$
							description: ref.getProperty("description"), //$NON-NLS-0$
							callback: contributedExecFunc(service),
							returnType: "string", //$NON-NLS-0$
							parameters: ref.getProperty("parameters"), //$NON-NLS-0$
							manual: ref.getProperty("manual") //$NON-NLS-0$
						});
					}
				}
			}

			dojo.subscribe("/dojo/hashchange", function(hash) { //$NON-NLS-0$
				if (hashUpdated) {
					hashUpdated = false;
					return;
				}
				if (hash.length === 0) {
					shellPageFileService.loadWorkspace(shellPageFileService.SEPARATOR).then(
						function(node) {
							shellPageFileService.setCurrentDirectory(node);
						}
					);
					shell.output(getChangedToElement(shellPageFileService.SEPARATOR));
					return;
				}
				shellPageFileService.loadWorkspace(hash).then(
					function(node) {
						shellPageFileService.setCurrentDirectory(node);
						var buffer = shellPageFileService.computePathString(node);
						shell.output(getChangedToElement(buffer));
					}
				);
			});
		});
	});
});
