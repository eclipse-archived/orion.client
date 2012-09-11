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
/*jslint browser:true*/

define(["i18n!orion/console/nls/messages", "require", "dojo", "orion/bootstrap", "orion/commands", "orion/fileClient", "orion/searchClient", "orion/globalCommands",
		"orion/widgets/Console", "console/currentDirectory", "console/paramType-file", "orion/i18nUtil", "console/extensionCommands", "orion/contentTypes"], 
	function(messages, require, dojo, mBootstrap, mCommands, mFileClient, mSearchClient, mGlobalCommands, mConsole, mCurrentDirectory, mFileParamType, i18nUtil, mExtensionCommands, mContentTypes) {

	var currentDirectory, fileClient, output;
	var hashUpdated = false;
	var contentTypeService, openWithCommands = [], serviceRegistry;

	var resolveError = function(result, error) {
		result.resolve(dojo.string.substitute(messages["File service error: ${0}"], ["<em>" + error + "</em>"])); //$NON-NLS-2$ //$NON-NLS-1$
	};

	/* general functions for working with file system nodes */

	function computeEditHref(node) {
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

	function computeLinkString(node) {
		if (node.Directory) {
			//TODO html escape sequences in Name?
			return "<a href=\"#" + node.Location + "\" class=\"consolePageDirectory\">" + node.Name + "</a>"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$ 
		} 
		//TODO html escape sequences in Name?
		var href = computeEditHref(node);
		return "<a href=\"" + href + "\" target=\"_blank\">" + node.Name + "</a>"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	}

	function computePathString(node) {
		var path = fileClient.fileServiceName(node.Location) || "";
		var parents = node.Parents;
		// TODO consider making the path segments links
		if (parents) {
			path += "/"; //$NON-NLS-0$
			for (var i = parents.length; --i >= 0 ;){
				path += parents[i].Name; 
				path += "/"; //$NON-NLS-0$
			}
			path += node.Name;
		}
		if (node.Directory) {
			path += "/"; //$NON-NLS-0$
		}
		return path;
	}
	
	/* implementations of the build-in commands */

	function cdExec(args, context) {
		var targetDirName = args.directory;
		if (typeof(targetDirName) !== "string") { //$NON-NLS-0$
			targetDirName = targetDirName.Name;
		}
		var result = context.createPromise();
		var node = currentDirectory.getCurrentDirectory();
		if (targetDirName === "..") { //$NON-NLS-0$
			fileClient.loadWorkspace(node.Location).then(
				dojo.hitch(this, function(fullNode) {
					if (!fullNode.Parents) {
						/* changing to the root where file services are mounted */
						fileClient.loadWorkspace("/").then( //$NON-NLS-0$
							dojo.hitch(this, function(node) {
								currentDirectory.setCurrentDirectory(node);
								hashUpdated = true;
								dojo.hash("#"); //$NON-NLS-0$
								result.resolve(dojo.string.substitute(messages["Changed to: ${0}"], ["<b>/</b>"])); //$NON-NLS-1$
							}),
							dojo.hitch(this, function(error) {
								resolveError(result, error);
							})
						);	
					} else if (fullNode.Parents.length === 0) {
						/* changing to the root directory within the current file service */
						// TODO: computing the parent location based on the current location may not always be valid
						var index = fullNode.Location.indexOf("/", 1); //$NON-NLS-0$
						var hash = fullNode.Location.substr(0, index);
						fileClient.loadWorkspace(hash).then(
							dojo.hitch(this, function(node) {
								currentDirectory.setCurrentDirectory(node);
								hashUpdated = true;
								dojo.hash(hash);
								var buffer = fileClient.fileServiceName(fullNode.Location);
								result.resolve(dojo.string.substitute(messages["Changed to: ${0}"], ["<b>" + buffer + "</b>"])); //$NON-NLS-2$ //$NON-NLS-1$
							}),
							dojo.hitch(this, function(error) {
								resolveError(result, error);
							})
						);
					} else {
						var parentLocation = fullNode.Parents[0].Location;
						fileClient.loadWorkspace(parentLocation).then(
							dojo.hitch(this, function(parentMetadata) {
								currentDirectory.setCurrentDirectory(parentMetadata);
								hashUpdated = true;
								dojo.hash(parentMetadata.Location);
								var buffer = computePathString(parentMetadata);
								result.resolve(dojo.string.substitute(messages["Changed to: ${0}"], ["<b>" + buffer + "</b>"])); //$NON-NLS-2$ //$NON-NLS-1$
							}),
							dojo.hitch(this, function(error) {
								resolveError(result, error);
							})
						);
					}
				}),
				dojo.hitch(this, function(error) {
					resolveError(result, error);
				})
			);
		} else {
			currentDirectory.withChildren(node,
				function(children) {
					var found = false;
					for (var i = 0; i < children.length; i++) {
						var child = children[i];
						if (child.Name === targetDirName) {
							if (child.Directory) {
								found = true;
								currentDirectory.setCurrentDirectory(child);
								hashUpdated = true;
								dojo.hash(child.Location);
								fileClient.loadWorkspace(child.Location).then(
									dojo.hitch(this, function(childNode) {
										var buffer = computePathString(childNode);
										result.resolve(dojo.string.substitute(messages["Changed to: ${0}"], ["<b>" + buffer + "</b>"])); //$NON-NLS-2$ //$NON-NLS-1$
									}),
									dojo.hitch(this, function(error) {
										resolveError(result, error);
									})
								);
							} else {
								resolveError(result, dojo.string.substitute(messages["${0} is not a directory"], [targetDirName]));
							}
							break;
						}
					}
					if (!found) {
						resolveError(result, dojo.string.substitute(messages["${0} was not found"], [targetDirName]));
					}
				},
				function(error) {
					resolveError(result, error);
				}
			);
		}
		return result;
	}

	function editExec(node) {
		var href = computeEditHref(node.file);
		window.open(href);
	}

	function lsExec(args, context) {
		var result = context.createPromise();
		var location = dojo.hash() || "/"; //$NON-NLS-0$
		fileClient.loadWorkspace(location).then(
			function(node) {
				currentDirectory.setCurrentDirectory(node); /* flush current node cache */
				currentDirectory.withChildren(node,
					function(children) {
						var buffer = [];
						children.sort(function(a,b) {
							var isDir1 = a.Directory;
							if (isDir1 !== b.Directory) {
								return isDir1 ? -1 : 1;
							}
							var name1 = a.Name && a.Name.toLowerCase();
							var name2 = b.Name && b.Name.toLowerCase();
							if (name1 < name2) {
								return -1;
							}
							if (name1 > name2) {
								return 1;
							}
							return 0;
						});
						for (var i = 0; i < children.length; i++) {
							buffer.push(computeLinkString(children[i]));
							buffer.push("<br>"); //$NON-NLS-0$
						}
						result.resolve(buffer.join(""));

						/*
						 * GCLI changes the target for all <a> tags contained in a result to _blank,
						 * to force clicked links to open in a new window or tab.  However for links
						 * that are created by this command to represent directories, selection should
						 * happen within the same page since it just changes the page hash.
						 *
						 * To work around this GCLI behavior do a pass of all links created by this
						 * command to represent directories and change their targets back to _self.
						 * This must be done asynchronously to ensure that it runs after GCLI has done
						 * its initial conversion of targets to _blank.
						 */
						setTimeout(function() {
							var links = output.querySelectorAll(".consolePageDirectory"); //$NON-NLS-0$
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
		var node = currentDirectory.getCurrentDirectory();
		fileClient.loadWorkspace(node.Location).then(
			dojo.hitch(this, function(fullNode) {
				var buffer = computePathString(fullNode);
				result.resolve("<b>" + buffer + "</b>"); //$NON-NLS-1$ //$NON-NLS-0$
			}),
			dojo.hitch(this, function(error) {
				resolveError(result, error);
			})
		);
		return result;
	}


	/* functions for handling contributed commands */

	/*
	 * Creates a gcli exec function that wraps a 'callback' function contributed by
	 * an 'orion.console.command' service implementation.
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
			serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			dojo.parser.parse();

			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			mGlobalCommands.generateBanner("orion-consolePage", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$
			mGlobalCommands.setPageTarget({task: messages["Console"]});

			output = dojo.byId("console-output"); //$NON-NLS-0$
			var console = new mConsole.Console(dojo.byId("console-input"), output); //$NON-NLS-0$

			currentDirectory = new mCurrentDirectory.CurrentDirectory();
			var location = dojo.hash() || "/"; //$NON-NLS-0$
			fileClient.loadWorkspace(location).then(
				function(node) {
					currentDirectory.setCurrentDirectory(node);
				}
//				, function(error) {
//					// TODO log
//				}
			);

			/* add the locally-defined types */
			var directoryType = new mFileParamType.ParamTypeFile("directory", currentDirectory, true, false); //$NON-NLS-0$
			console.addType(directoryType);
			var fileType = new mFileParamType.ParamTypeFile("file", currentDirectory, false, true); //$NON-NLS-0$
			console.addType(fileType);

			/* add the locally-defined commands */
			console.addCommand({
				name: "cd", //$NON-NLS-0$
				description: messages["Changes the current directory"],
				callback: cdExec,
				returnType: "string", //$NON-NLS-0$
				parameters: [{
					name: "directory", //$NON-NLS-0$
					type: "directory", //$NON-NLS-0$
					description: messages["The name of the directory"]
				}]
			});
			console.addCommand({
				name: "edit", //$NON-NLS-0$
				description: messages["Edits a file"],
				callback: editExec,
				returnType: "string", //$NON-NLS-0$
				parameters: [{
					name: "file", //$NON-NLS-0$
					type: "file", //$NON-NLS-0$
					description: messages["The name of the file"]
				}]
			});
			console.addCommand({
				name: "ls", //$NON-NLS-0$
				description: messages["Lists the files in the current directory"],
				callback: lsExec,
				returnType: "string" //$NON-NLS-0$
			});
			console.addCommand({
				name: "pwd", //$NON-NLS-0$
				description: messages["Prints the current directory location"],
				callback: pwdExec,
				returnType: "string" //$NON-NLS-0$
			});

			/* initialize the editors cache (used by some of the build-in commands */
			contentTypeService = new mContentTypes.ContentTypeService(serviceRegistry);
			serviceRegistry.getService("orion.core.contenttypes").getContentTypes().then(function(contentTypes) { //$NON-NLS-0$
				var commands = mExtensionCommands._createOpenWithCommands(serviceRegistry, contentTypes);
				for (var i = 0; i < commands.length; i++) {
					var commandDeferred = mExtensionCommands._createCommandOptions(commands[i].properties, commands[i].service, serviceRegistry, contentTypes, true);
					commandDeferred.then(dojo.hitch(this,
						function(command) {
							openWithCommands.push(command);
						}
					));
				}
			});

			// TODO
			/* add types contributed through the plug-in API */
//			var allReferences = serviceRegistry.getServiceReferences("orion.console.type");
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
//					console.addType(type);
//				}
//			}
			
			/* add commands contributed through the plug-in API */
			var allReferences = serviceRegistry.getServiceReferences("orion.console.command"); //$NON-NLS-0$
			for (var i = 0; i < allReferences.length; ++i) {
				var ref = allReferences[i];
				var service = serviceRegistry.getService(ref);
				if (service) {
					if(ref.getProperty("nls") && ref.getProperty("descriptionKey")){  //$NON-NLS-1$ //$NON-NLS-0$
						i18nUtil.getMessageBundle(ref.getProperty("nls")).then(dojo.hitch(this, function(ref, commandMessages){ //$NON-NLS-1$
							console.addCommand({
								name: ref.getProperty("name"), //$NON-NLS-0$
								description: commandMessages[ref.getProperty("descriptionKey")], //$NON-NLS-0$
								callback: contributedExecFunc(service),
								returnType: "string", //$NON-NLS-0$
								parameters: ref.getProperty("parameters"), //$NON-NLS-0$
								manual: ref.getProperty("manual") //$NON-NLS-0$
							});
						}, ref));
					} else {
						console.addCommand({
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

			dojo.subscribe("/dojo/hashchange", function(newHash) { //$NON-NLS-0$
				if (hashUpdated) {
					hashUpdated = false;
					return;
				}
				if (newHash.length === 0) {
					fileClient.loadWorkspace("/").then( //$NON-NLS-0$
						dojo.hitch(this, function(node) {
							currentDirectory.setCurrentDirectory(node);
						})
					);
					console.output(dojo.string.substitute(messages["Changed to: ${0}"], ["<b>/</b>"])); //$NON-NLS-1$
					return;
				}
				fileClient.loadWorkspace(newHash).then(
					dojo.hitch(this, function(newNode) {
						currentDirectory.setCurrentDirectory(newNode);
						var buffer = computePathString(newNode);
						console.output(dojo.string.substitute(messages["Changed to: ${0}"], ["<b>" + buffer + "</b>"])); //$NON-NLS-2$ //$NON-NLS-1$
					})
				);
			});
		});
	});
});
