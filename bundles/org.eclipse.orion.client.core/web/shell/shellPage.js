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

define(["i18n!orion/shell/nls/messages", "require", "dojo", "orion/bootstrap", "orion/commands", "orion/fileClient", "orion/searchClient", "orion/globalCommands",
		"orion/widgets/Shell", "shell/shellPageFileService", "shell/paramType-file", "orion/i18nUtil", "shell/extensionCommands", "orion/contentTypes"],
	function(messages, require, dojo, mBootstrap, mCommands, mFileClient, mSearchClient, mGlobalCommands, mShell, mShellPageFileService, mFileParamType, i18nUtil, mExtensionCommands, mContentTypes) {

	var shellPageFileService, fileClient, output;
	var hashUpdated = false;
	var contentTypeService, openWithCommands = [], serviceRegistry;

	var resolveError = function(result, error) {
		if (error && error.Message) {
			error = error.Message;
		}
		result.resolve(i18nUtil.formatMessage(messages["File service error: ${0}"], "<em>" + error + "</em>")); //$NON-NLS-1$ //$NON-NLS-0$
	};

	/* general functions for working with file system nodes */

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

	function computeLinkString(node) {
		if (node.Directory) {
			return "<a href=\"#" + node.Location + "\" class=\"shellPageDirectory\">" + node.Name + "</a>"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$ 
		} 
		var href = computeEditURL(node);
		return "<a href=\"" + href + "\" target=\"_blank\">" + node.Name + "</a>"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	}

	/* implementations of the build-in commands */

	function cdExec(args, context) {
		var node = args.directory;
		if (!node) {
			return "";
		}
		shellPageFileService.setCurrentDirectory(node);
		hashUpdated = true;
		dojo.hash(node.Location);
		var pathString = shellPageFileService.computePathString(node);
		return i18nUtil.formatMessage(messages["Changed to: ${0}"], "<b>" + pathString + "</b>"); //$NON-NLS-1$ //$NON-NLS-0$
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
		fileClient.loadWorkspace(location).then(
			function(node) {
				shellPageFileService.setCurrentDirectory(node); /* flush current node cache */
				shellPageFileService.withChildren(node,
					function(children) {
						var buffer = [];
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
		fileClient.loadWorkspace(node.Location).then(
			function(node) {
				var buffer = shellPageFileService.computePathString(node);
				result.resolve("<b>" + buffer + "</b>"); //$NON-NLS-1$ //$NON-NLS-0$
			},
			function(error) {
				resolveError(result, error);
			}
		);
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
			serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;

			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			mGlobalCommands.generateBanner("orion-shellPage", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$
			mGlobalCommands.setPageTarget({task: messages["Shell"]});

			output = document.getElementById("shell-output"); //$NON-NLS-0$
			var input = document.getElementById("shell-input"); //$NON-NLS-0$
			var shell = new mShell.Shell({input: input, output: output});
			shell.setFocus();

			shellPageFileService = new mShellPageFileService.ShellPageFileService();
			var location = dojo.hash();
			var ROOT_ORIONCONTENT = "/file"; //$NON-NLS-0$
			fileClient.loadWorkspace(location || ROOT_ORIONCONTENT).then(
				function(node) {
					shellPageFileService.setCurrentDirectory(node);
				});
			if (location.length === 0) {
				hashUpdated = true;
				dojo.hash(ROOT_ORIONCONTENT);
			}

			/* add the locally-defined types */
			var directoryType = new mFileParamType.ParamTypeFile("directory", shellPageFileService, true, false); //$NON-NLS-0$
			shell.registerType(directoryType);
			var fileType = new mFileParamType.ParamTypeFile("file", shellPageFileService, false, true); //$NON-NLS-0$
			shell.registerType(fileType);

			/* add the locally-defined commands */
			shell.registerCommand({
				name: "cd", //$NON-NLS-0$
				description: messages["Changes the current directory"],
				callback: cdExec,
				parameters: [{
					name: "directory", //$NON-NLS-0$
					type: "directory", //$NON-NLS-0$
					description: messages["The name of the directory"]
				}]
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
				callback: lsExec
			});
			shell.registerCommand({
				name: "pwd", //$NON-NLS-0$
				description: messages["Prints the current directory location"],
				callback: pwdExec
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
					fileClient.loadWorkspace(shellPageFileService.SEPARATOR).then(
						function(node) {
							shellPageFileService.setCurrentDirectory(node);
						}
					);
					shell.output(i18nUtil.formatMessage(messages["Changed to: ${0}"], "<b>/</b>")); //$NON-NLS-0$
					return;
				}
				fileClient.loadWorkspace(hash).then(
					function(node) {
						shellPageFileService.setCurrentDirectory(node);
						var buffer = shellPageFileService.computePathString(node);
						shell.output(i18nUtil.formatMessage(messages["Changed to: ${0}"], "<b>" + buffer + "</b>")); //$NON-NLS-1$ //$NON-NLS-0$
					}
				);
			});
		});
	});
});
