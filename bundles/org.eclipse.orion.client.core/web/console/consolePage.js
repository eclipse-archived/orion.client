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

	var fileClient, output;

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
				//TODO html escape sequences in Name?
				result.push('<a href="#' + node.Location + '" class="lsDirectory">' + node.Name + '</a>'); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$ 
			} else {
				//TODO html escape sequences in Name?
				result.push('<a href="/edit/edit.html#' + node.Location + '" target="_blank">' + node.Name + '</a>'); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
			result.push('<br>'); //$NON-NLS-0$
		}
		return result;
	}

	function formatFullPath(node) {
		var path = fileClient.fileServiceName(node.Location) || "";
		var parents = node.Parents;
		// TODO it could be useful to make the path segments link to something,
		// see breadcrumb.js for an idea
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
						var links = output.querySelectorAll(".lsDirectory"); //$NON-NLS-0$
						for (var i = 0; i < links.length; i++) {
							links[i].setAttribute('target', '_self'); //$NON-NLS-1$ //$NON-NLS-0$
							links[i].className = '';
						}
					}, 1);
				});
			},
			function(error) {
				resolveError(result, error);
			}
		);
		return result;
	}

	/* implementaton of the 'cd' command */

	var hashUpdated = false;
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
						dojo.hitch(this, function(fullNode) {
							if (!fullNode.Parents) {
								/* changing to the root where file services are mounted */
								mCurrentDirectory.setCurrentTreeNode(null);
								hashUpdated = true;
								dojo.hash('#'); //$NON-NLS-0$
								result.resolve(dojo.string.substitute(messages['Changed to: ${0}'], ["<b>/</b>"])); //$NON-NLS-1$
							} else if (fullNode.Parents.length === 0) {
								/* changing to the root directory within the current file service */
								// TODO: computing the parent location based on the current location may not always be valid
								mCurrentDirectory.setCurrentTreeNode(null);
								var index = fullNode.Location.indexOf('/', 1); //$NON-NLS-0$
								var hash = fullNode.Location.substr(0, index);
								hashUpdated = true;
								dojo.hash(hash);
								var buffer = fileClient.fileServiceName(fullNode.Location);
								result.resolve(dojo.string.substitute(messages['Changed to: ${0}'], ["<b>" + buffer + "</b>"])); //$NON-NLS-2$ //$NON-NLS-1$
							} else {
								var parentLocation = fullNode.Parents[0].Location;
								fileClient.loadWorkspace(parentLocation).then(
									dojo.hitch(this, function(parentMetadata) {
										mCurrentDirectory.setCurrentTreeNode(parentMetadata);
										hashUpdated = true;
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
										hashUpdated = true;
										dojo.hash(child.Location);
										fileClient.loadWorkspace(child.Location).then(
											dojo.hitch(this, function(childNode) {
												var buffer = formatFullPath(childNode);
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
					dojo.hitch(this, function(fullNode) {
						var buffer = formatFullPath(fullNode);
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
			dojo.parser.parse();

			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			fileClient = new mFileClient.FileClient(serviceRegistry);
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			mGlobalCommands.generateBanner("orion-consolePage", serviceRegistry, commandService, preferences, searcher); //$NON-NLS-0$
			mGlobalCommands.setPageTarget({task: "Console"});

			/* the Console creates a child of console-input, resize to give it a height */
			output = dojo.byId("console-output"); //$NON-NLS-0$
			var console = new mConsole.Console(dojo.byId("console-input"), output); //$NON-NLS-0$

			/* add the locally-defined types */
			var directoryType = new mFileParamType.ParamTypeFile("directory", true, false); //$NON-NLS-0$
			console.addType(directoryType);
			var fileType = new mFileParamType.ParamTypeFile("file", false, true); //$NON-NLS-0$
			console.addType(fileType);

			/* add the locally-defined commands */
			console.addCommand({
				name: 'cd', //$NON-NLS-0$
				description: messages['Changes the current directory'],
				callback: cdExec,
				returnType: 'string', //$NON-NLS-0$
				parameters: [{
					name: 'directory', //$NON-NLS-0$
					type: 'directory', //$NON-NLS-0$
					description: messages['The name of the directory']
				}]
			});
			console.addCommand({
				name: 'edit', //$NON-NLS-0$
				description: messages['Edits a file'],
				callback: editExec,
				returnType: 'string', //$NON-NLS-0$
				parameters: [{
					name: 'file', //$NON-NLS-0$
					type: 'file', //$NON-NLS-0$
					description: messages['The name of the file']
				}]
			});
			console.addCommand({
				name: 'ls', //$NON-NLS-0$
				description: messages['Lists the files in the current directory'],
				callback: lsExec,
				returnType: 'string' //$NON-NLS-0$
			});
			console.addCommand({
				name: 'pwd', //$NON-NLS-0$
				description: messages['Prints the current directory location'],
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
					} else {
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

			dojo.subscribe("/dojo/hashchange", function(newHash) { //$NON-NLS-0$
				if (hashUpdated) {
					hashUpdated = false;
					return;
				}
				if (newHash.length === 0) {
					mCurrentDirectory.setCurrentTreeNode(null);
					console.output(dojo.string.substitute(messages['Changed to: ${0}'], ["<b>/</b>"])); //$NON-NLS-1$
					return;
				}
				fileClient.loadWorkspace(newHash).then(
					dojo.hitch(this, function(newNode) {
						mCurrentDirectory.setCurrentTreeNode(newNode);
						var buffer = formatFullPath(newNode);
						console.output(dojo.string.substitute(messages['Changed to: ${0}'], ["<b>" + buffer + "</b>"])); //$NON-NLS-2$ //$NON-NLS-1$
					})
				);
			});
		});
	});
});
