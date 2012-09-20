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

/*global define*/

/**
 * This module stores one 'current' directory node and proactively fetches
 * its child nodes in order to answer them synchronously when requested.
 */ 
define(["dojo", "orion/bootstrap", "orion/fileClient"], function (dojo, mBootstrap, mFileClient) {

	var orion = {};
	orion.consolePage = {};
	
	var fileClient;

	orion.consolePage.CurrentDirectory = (function() {
		function CurrentDirectory() {
			this.currentDirectory = null;
			this.currentDirectoryChildren = null;
		}

		CurrentDirectory.prototype = {
			getCurrentDirectory: function() {
				return this.currentDirectory;
			},
			/**
			 * Returns the current directory's children synchronously, or
			 * <code>null</code> if they are not yet known.  Clients wishing
			 * to block on retrieval of the current directory's children can
			 * use the <code>withChildren()</code> function instead.
			 */
			getCurrentDirectoryChildren: function() {
				return this.currentDirectoryChildren;
			},
			/**
			 * Sets the current directory node and initiates retrieval of its
			 * child nodes.
			 */
			setCurrentDirectory: function(node) {
				this.currentDirectory = node;
				this.currentDirectoryChildren = null;
				var self = this;
				this.withChildren(
					this.currentDirectory,
					function(children) {
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
						self.currentDirectoryChildren = children;
					}
				);
			},
			withChildren: function(node, func, errorFunc) {
				if (node.Children) {
					func(node.Children);
				} else if (node.ChildrenLocation) {
					fileClient.fetchChildren(node.ChildrenLocation).then(
						function(children) {
							node.Children = children; /* cache for later */
							func(children);
						},
						function(error) {
							if (errorFunc) {
								errorFunc(error);
							}
						}
					);
				}
			}
		};
		return CurrentDirectory;
	}());

	dojo.ready(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			fileClient = new mFileClient.FileClient(serviceRegistry);
		});
	});

	return orion.consolePage;
});
