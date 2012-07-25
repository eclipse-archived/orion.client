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

define(['i18n!orion/console/nls/messages', 'require', 'dojo', 'dijit', 'orion/bootstrap', 'orion/commands', 'orion/fileClient', 'orion/searchClient', 'orion/globalCommands',
		'orion/widgets/Console', 'console/current-directory', 'console/paramType-file', 'orion/i18nUtil'], 
	function(messages, require, dojo, dijit, mBootstrap, mCommands, mFileClient, mSearchClient, mGlobalCommands, mConsole, mCurrentDirectory, mFileParamType, i18nUtil) {

	var fileClient;

	var resolveError = function(result, error) {
		result.resolve(dojo.string.substitute(messages['File service error: ${0}'], ["<em>" + error + "</em>"])); //$NON-NLS-2$ //$NON-NLS-1$
	};

	/* implementation of the 'edit' command */

	function editExec(node) {
		var href = "/edit/edit.html#" + node.file.Location; //$NON-NLS-0$
		window.open(href);
	}

	/* implementation of the 'ls' command */

	/* formats a directory child node */
	function formatLsChild(node, result) {
		result = result || [];
		if (node.Name) {
			if (node.Directory) {
				result.push(node.Name);
				result.push('/'); //$NON-NLS-0$
			} else { 
				result.push('<a href="/edit/edit.html#' + node.Location + '">'); //$NON-NLS-1$ //$NON-NLS-0$
				result.push(node.Name); //TODO html escape sequences?
				result.push('</a>'); //$NON-NLS-0$
			}
			result.push('<br>'); //$NON-NLS-0$
		}
		return result;
	}

	function formatFullPath(node) {
		var path = fileClient.fileServiceName(node.Location) || "";
		var parents = node.Parents;
		// TODO it could be useful to make the path segments link to something
		// useful, see breadcrumb.js for an idea
		if (parents) {
			path += '/'; //$NON-NLS-0$
			for (var i = parents.length; --i >= 0 ;){
				path += parents[i].Name; 
				path += '/'; //$NON-NLS-0$
			}
			path += node.Name;
		}
		if (node.Directory) {
			path += '/'; //$NON-NLS-0$
		}
		return path;
	}

	/*
	 * Formats the children of a current file or workspace node.  Optionally accepts
	 * an array 'result' to which the resulting Strings are pushed.
	 * 
	 * To avoid massive String copying, the result is returned as an array of
	 * Strings rather than one massive String. Caller should join('') the returned result.
	 */
	function formatLs(node, result, func) {
		result = result || [];
		mCurrentDirectory.withChildren(node,
			function(children) {
				children.sort(function(a,b) {
					var isDir1 = a.Directory;
					var isDir2 = b.Directory;
					if (isDir1 !== isDir2) {
						return isDir1 ? -1 : 1;
					}
					var n1 = a.Name && a.Name.toLowerCase();
					var n2 = b.Name && b.Name.toLowerCase();
					if (n1 < n2) { return -1; }
					if (n1 > n2) { return 1; }
					return 0;
				});
				for (var i = 0; i < children.length; i++) {
					formatLsChild(children[i], result);
				}
				func(result);
			},
			function(error) {
				func([]);
			}
		);
	}

	function lsExec(args, context) {
		var result = context.createPromise();
		mCurrentDirectory.setCurrentTreeNode(null); /* flushes current node cache */
		mCurrentDirectory.withCurrentTreeNode(
			function(node) {
				formatLs(node, [], function(buffer) {
					result.resolve(buffer.join(''));
				});
			},
			function(error) {
				resolveError(result, error);
			}
		);
		return result;
	}

	/* implementaton of the 'cd' command */

	function cdExec(args, context) {
		var targetDirName = args.directory;
		if (typeof(targetDirName) !== "string") { //$NON-NLS-0$
			targetDirName = targetDirName.Name;
		}
		var result = context.createPromise();
		mCurrentDirectory.withCurrentTreeNode(
			function(node) {
				if (targetDirName === '..') { //$NON-NLS-0$
					fileClient.loadWorkspace(node.Location).then(
						dojo.hitch(this, function(metadata) {
							if (!metadata.Parents) {
								/* changing to the root where file services are mounted */
								mCurrentDirectory.setCurrentTreeNode(null);
								dojo.hash('#'); //$NON-NLS-0$
								result.resolve(dojo.string.substitute(messages['Changed to: ${0}'], ["<b>/</b>"])); //$NON-NLS-1$
							} else if (metadata.Parents.length === 0) {
								/* changing to the root directory within the current file service */
								// TODO: computing the parent location based on the current location may not always be valid
								mCurrentDirectory.setCurrentTreeNode(null);
								var index = metadata.Location.indexOf('/', 1); //$NON-NLS-0$
								var hash = metadata.Location.substr(0, index);
								dojo.hash(hash);
								var buffer = fileClient.fileServiceName(metadata.Location);
								result.resolve(dojo.string.substitute(messages['Changed to: ${0}'], ["<b>" + buffer + "</b>"])); //$NON-NLS-2$ //$NON-NLS-1$
							} else {
								var parentLocation = metadata.Parents[0].Location;
								fileClient.loadWorkspace(parentLocation).then(
									dojo.hitch(this, function(parentMetadata) {
										mCurrentDirectory.setCurrentTreeNode(parentMetadata);
										dojo.hash(parentMetadata.Location);
										var buffer = formatFullPath(parentMetadata);
										result.resolve(dojo.string.substitute(messages['Changed to: ${0}'], ["<b>" + buffer + "</b>"])); //$NON-NLS-2$ //$NON-NLS-1$
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
					mCurrentDirectory.withChildren(node,
						function(children) {
							var found = false;
							for (var i = 0; i < children.length; i++) {
								var child = children[i];
								if (child.Name === targetDirName) {
									if (child.Directory) {
										found = true;
										mCurrentDirectory.setCurrentTreeNode(child);
										dojo.hash(child.Location);
										fileClient.loadWorkspace(child.Location).then(
											dojo.hitch(this, function(metadata) {
												var buffer = formatFullPath(metadata);
												result.resolve(dojo.string.substitute(messages['Changed to: ${0}'], ["<b>" + buffer + "</b>"])); //$NON-NLS-2$ //$NON-NLS-1$
											}),
											dojo.hitch(this, function(error) {
												resolveError(result, error);
											})
										);
									} else {
										resolveError(result, dojo.string.substitute(messages['${0} is not a directory'], [targetDirName]));
									}
									break;
								}
							}
							if (!found) {
								resolveError(result, dojo.string.substitute(messages['${0} was not found'], [targetDirName]));
							}
						},
						function(error) {
							resolveError(result, error);
						}
					);
				}
			},
			function(error) {
				resolveError(result, error);
			}
		);
		return result;
	}

	/* implementation of the 'pwd' command */

	function pwdExec(args, context) {
		var result = context.createPromise();
		mCurrentDirectory.withCurrentTreeNode(
			function(node) {
				fileClient.loadWorkspace(node.Location).then(
					dojo.hitch(this, function(metadata) {
						var buffer = formatFullPath(metadata);
						result.resolve("<b>" + buffer + "</b>"); //$NON-NLS-1$ //$NON-NLS-0$
					}),
					dojo.hitch(this, function(error) {
						resolveError(result, error);
					})
				);
			},
			function(error) {
				resolveError(result, error);
			}
		);
		return result;
	}

	/* methods for handling contributed commands */

	/*
	 * Creates a gcli exec function that wraps a 'callback' function contributed by
	 * an 'orion.console.command' service implementation.
	 */
	function contributedExecFunc(service) {
		if (typeof(service.callback) === 'function') { //$NON-NLS-0$
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
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			document.body.style.visibility = "visible"; //$NON-NLS-0$
			dojo.parser.parse();

			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			mGlobalCommands.generateBanner("toolbar", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$
			mGlobalCommands.setPageTarget({task: "Console"});

			var console = new mConsole.Console(dojo.byId("console-input"), dojo.byId("console-output")); //$NON-NLS-1$ //$NON-NLS-0$
			/* the Console creates a child of console-input, resize to give it a height */
			dijit.byId("centerPane").resize(); //$NON-NLS-0$

			/* add the locally-defined types */
			var directoryType = new mFileParamType.ParamTypeFile("directory", true, false); //$NON-NLS-0$
			console.addType(directoryType);
			var fileType = new mFileParamType.ParamTypeFile("file", false, true); //$NON-NLS-0$
			console.addType(fileType);

			/* add the locally-defined commands */
			console.addCommand({
				name: 'cd', //$NON-NLS-0$
				description: messages['Change current directory'],
				callback: cdExec,
				returnType: 'string', //$NON-NLS-0$
				parameters: [{
					name: 'directory', //$NON-NLS-0$
					type: 'directory', //$NON-NLS-0$
					description: messages['Directory']
				}]
			});
			console.addCommand({
				name: 'edit', //$NON-NLS-0$
				description: messages['Edit a file'],
				callback: editExec,
				returnType: 'string', //$NON-NLS-0$
				parameters: [{
					name: 'file', //$NON-NLS-0$
					type: 'file', //$NON-NLS-0$
					description: messages['File']
				}]
			});
			console.addCommand({
				name: 'ls', //$NON-NLS-0$
				description: messages['Show a list of files in the current directory'],
				callback: lsExec,
				returnType: 'string' //$NON-NLS-0$
			});
			console.addCommand({
				name: 'pwd', //$NON-NLS-0$
				description: messages['Print current directory'],
				callback: pwdExec,
				returnType: 'string' //$NON-NLS-0$
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
					if(ref.getProperty("nls") && ref.getProperty("descriptionKey")){
						i18nUtil.getMessageBundle(ref.getProperty("nls")).then(dojo.hitch(this, function(ref, commandMessages){
							console.addCommand({
								name: ref.getProperty("name"), //$NON-NLS-0$
								description: commandMessages[ref.getProperty("descriptionKey")], //$NON-NLS-0$
								callback: contributedExecFunc(service),
								returnType: 'string', //$NON-NLS-0$
								parameters: ref.getProperty("parameters"), //$NON-NLS-0$
								manual: ref.getProperty("manual") //$NON-NLS-0$
							});
						}, ref));
					}else{
						console.addCommand({
							name: ref.getProperty("name"), //$NON-NLS-0$
							description: ref.getProperty("description"), //$NON-NLS-0$
							callback: contributedExecFunc(service),
							returnType: 'string', //$NON-NLS-0$
							parameters: ref.getProperty("parameters"), //$NON-NLS-0$
							manual: ref.getProperty("manual") //$NON-NLS-0$
						});
					}
				}
			}
		});
	});
});
