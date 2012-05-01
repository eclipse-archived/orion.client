/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     Contributors: IBM Corporation - initial API and implementation 
 *                      (copied: see explorer-table.js)
 *     Kris De Volder (VMWare) - Copied from explorer-table.js and modified to  
 *                               implement console page.
 *******************************************************************************/ 
/*global define require dojo dijit orion window widgets localStorage*/
/*jslint browser:true devel:true*/

define(['dojo', 'orion/bootstrap', 'orion/status', 'orion/commands', 'orion/globalCommands', 
	'orion/searchClient', 'orion/fileClient', 'gcli/index', 'console/directory-type', 
	'console/current-directory', 'orion/es5shim'], 
function(dojo,  mBootstrap,        mStatus,        mCommands,        mGlobalCommands,        mSearchClient,        mFileClient,        gcli       ) {

	var withWorkspace = require('console/current-directory').withWorkspace;
	var withCurrentTreeNode = require('console/current-directory').withCurrentTreeNode;
	var withChildren = require('console/current-directory').withChildren;
	var setCurrentTreeNode = require('console/current-directory').setCurrentTreeNode;
	var getParentLocation = require('console/current-directory').getParentLocation;
	
	var statusService;
	
	////////////////// implementation of the ls command ////////////////////////////////////////////////////////////

	function editURL(node) {
		//TODO: We should do this the right way. Orion probably has some 
		// service registration points to determine 'edit' actions based on the resource type. 
		// The only (bad) reason for this hacky implementation is that I do not yet know how to do 
		// it correctly.
		return "/edit/edit.html#"+node.Location;
	}

	/**
	 * Helper function to format a single child node in a directory.
	 */
	function formatLsChild(node, result) {
		result = result || [];
		if (node.Name) {
			if (node.Directory) {
				result.push(node.Name);
				result.push('/');
			} else { 
				result.push('<a href="');
				result.push(editURL(node));
				result.push('">');
				result.push(node.Name); //TODO: html escape sequences?
				result.push('</a>');
			}
			result.push('<br>');
		}
		return result;
	}
	
	/**
	 * Helper function to format the result of ls. Accepts a current file or workspace node and
	 * formats its children.
	 * <p>
	 * Optionally accepts an array 'result' to which the resulting Strings should be pushed.
	 * <p>
	 * To avoid massive String copying the result is returned as an array of
	 * Strings rather than one massive String. Caller should join('') the returned result.
	 */
	function formatLs(node, result, k) {
		result = result || [];
		withChildren(node, function (children) {
			for (var i = 0; i < children.length; i++) {
				formatLsChild(children[i], result);
			}
			k(result);
		});
	}

	/**
	 * Execution function for the ls gcli command
	 */
	function lsExec(args, context) {
		var result = context.createPromise();
		setCurrentTreeNode(null); // Flushes current node cache.
		withCurrentTreeNode(function (node) {
			formatLs(node, [], function (buffer) {
				result.resolve(buffer.join(''));
			});
		});
		return result;
	}
	
	////////// implementaton of the 'cd' command ///////////////////////////////////////////////////
	
	function cdExec(args, context) {
		var targetDirName = args.directory;
		var result = context.createPromise();
		withCurrentTreeNode(function (node) {
			if (targetDirName==='..') {
				var newLocation = getParentLocation(node);
				if (newLocation!==null) {
					dojo.hash(newLocation);
					setCurrentTreeNode(null);
					result.resolve('Changed to parent directory');
				} else {
					result.resolve('ERROR: Can not determine parent');
				}
			} else {
				withChildren(node, function (children) {
					var found = false;
					for (var i = 0; i < children.length; i++) {
						var child = children[i];
						if (child.Name===targetDirName) {
							if (child.Directory) {
								found = true;
								setCurrentTreeNode(child);
								result.resolve('Working directory changed successfully');
							} else {
								result.resolve('ERROR: '+targetDirName+' is not a directory');
							}
						}
					}
					if (!found) {
						result.resolve('ERROR: '+targetDirName+' not found.');
					}
				});
			}
		});
		return result;
	}
	
	//////// implementation of the 'pwd' command ///////////////////////////////////////////
	
	function pwdExec(args, context) {
		//TODO: this implementation doesn't print the full path, only the name of the current
		//  directory node.
		var result = context.createPromise();
		withCurrentTreeNode(function (node) {
			var buffer = formatLsChild(node);
			result.resolve(buffer.join(''));
		});
		return result;
	}
	
	/**
	 * Add generally useful commands related to file/dir navigation.
	 * These commands are directly contributed to gcli, not via the 'orion.console.command'
	 * extension point.
	 */
	function initGenericCommands() {
		gcli.addCommand({
			name: 'ls',
			description: 'Show a list of files at the current directory',
			exec: lsExec,
			returnType: 'string'
		});
		gcli.addCommand({
			name: 'cd',
			description: 'Change current directory',
			exec: cdExec,
			returnType: 'string',
			params: [
					    {
							name: 'directory',
							type: 'directory',
							description: 'directory'
					    }
			]
		});

		gcli.addCommand({
			name: 'pwd',
			description: 'Print current directory',
			exec: pwdExec,
			returnType: 'string'
		});
	}
	
	function render(text) {
//		var node = dojo.create("pre", {className: 'console-command-output'});
//		// setting textContent we don't need to worry about escaping stuff.
//		node.textContent = text;  
//		return node;
		var obj = JSON.parse(text);
		for (var key in obj) {
			var node = dojo.create(key, obj[key]);
		//	node.textContent = 'asdf';
			return node;
		} 
	}
	
	/**
	 * This function creates a JSON object that contains bits of context information an
	 * external command may need access to to execute.
	 */
	function createPluginContext(gcliContext, k) {
		withWorkspace(function (wsNode) {
			withCurrentTreeNode(function (pwdNode) {
				return k({
					location: pwdNode.Location,
					workspaceLocation: wsNode.Location
				});
			});
		});
	}
	
	/**
	 * Creates a gcli exec function wrapping a 'run' function contributed by
	 * a 'orion.console.command' service implementation.
	 */
	function contributedExecFunc(service) {
		if (typeof(service.run)==='function') {
			//TODO: we may support different styles of exec functions based on 
			// properties set in the service. For now we just have the one
			// type that executes asynchronously and renders the result as 'pre' text.
			return function (args, context) {
				var promise = context.createPromise();
				createPluginContext(context, function (jsonContext) {
					service.run(args, jsonContext).then(function (result) {
						promise.resolve(render(result));
					});
				});
				return promise;
			};
		}
		return undefined; 
		//returns undefined if we can't create an exec function (typically because the 
		//service doesn't provide one and is just a parent node in the command hierarchy).
	}
	
	/**
	 * Wrap command implementations contributed via 'orion.console.command' extension
	 * point, and register them with gcli.
	 */
	function initContributedCommands(serviceRegistry) {
		var allReferences = serviceRegistry.getServiceReferences("orion.console.command");
		for (var i = 0; i < allReferences.length; ++i) {
			var ref = allReferences[i];
			var service = serviceRegistry.getService(ref);
			if (service) {
				gcli.addCommand({
					name: ref.getProperty("name"),
					description: ref.getProperty("description"),
					manual: ref.getProperty("manual"),
					params: ref.getProperty("params"),
					exec: contributedExecFunc(service)
				});
			}
		}
	}
	
	////////////////////////////////////////////////////////////////////////
	
	function initCommands(serviceRegistry) {
		initGenericCommands();
		initContributedCommands(serviceRegistry);
	}

	//TODO: Do we really need to wait for both dojo.ready and mBootstrap.startup?
	// Maybe one of them already implies the other?
	dojo.ready(function() {
		mBootstrap.startup().then(function(core) {
		
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			
			document.body.style.visibility = "visible";
			dojo.parser.parse();

			// Register services
			statusService = new mStatus.StatusReportingService(serviceRegistry, "statusPane", "notifications");
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: mFileClient});
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);

			statusService.setMessage("Loading...");
			
			initCommands(serviceRegistry);
			gcli.createView();
		});
	});
});