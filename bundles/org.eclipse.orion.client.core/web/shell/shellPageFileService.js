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
 * its child nodes in an attempt to answer them synchronously when requested.
 */ 
define(["dojo", "orion/bootstrap", "orion/fileClient"], function (dojo, mBootstrap, mFileClient) {

	var orion = {};
	orion.shellPage = {};
	
	var fileClient;

	orion.shellPage.ShellPageFileService = (function() {
		function ShellPageFileService() {
			this.currentDirectory = null;
			var self = this;
			this.withNode(
				this.SEPARATOR,
				function(node) {
					self.rootNode = node;
				});
		}

		ShellPageFileService.prototype = {
			SEPARATOR: "/", //$NON-NLS-0$
			computePathString: function(node) {
				if (node.Location === this.SEPARATOR) {
					return this.SEPARATOR;
				}
				var path = this.SEPARATOR + fileClient.fileServiceName(node.Location);
				var parents = node.Parents;
				if (parents) {
					path += this.SEPARATOR;
					for (var i = parents.length; --i >= 0 ;){
						path += parents[i].Name; 
						path += this.SEPARATOR;
					}
					path += node.Name;
				}
				if (node.Directory) {
					path += this.SEPARATOR;
				}
				return path;
			},
			getChild: function(node, name) {
				if (name.length === 0) {
					return null;
				}
				if (name === "..") { //$NON-NLS-0$
					return this.getParent(node);
				}
				if (!node.Children) {
					return null;
				}
				for (var i = 0; i < node.Children.length; i++) {
					if (node.Children[i].Name === name) {
						return node.Children[i];
					}
				}
				return null;
			},
			getCurrentDirectory: function() {
				return this.currentDirectory;
			},
			/**
			 * Resolves path in terms of the specified root node (or the
			 * current directory if a root node is not provided) and returns
			 * the node of the resulting directory.
			 */
			getDirectory: function(root, path) {
				if (path.indexOf(this.SEPARATOR) === 0) {
					root = this.rootNode;
					path = path.substring(1);
				} else {
					if (!root) {
						if (!this.currentDirectory) {
							/* no node to resolve the path in terms of */
							return null;
						}
						root = this.currentDirectory;
					}
				}
				var segments = path.substring(0, path.lastIndexOf(this.SEPARATOR)).split(this.SEPARATOR);
				var result = root;
				for (var i = 0; i < segments.length; i++) {
					if (segments[i].length > 0) {
						result = this.getChild(result, segments[i]);
						if (!result || !result.Directory) {
							/* non-existent directory */
							return null;
						}
					}
				}

				/*
				 * If the full path represents a directory then initiate the
				 * retrieval of its full node info and children.
				 */
				var lastSegment = path.substring(path.lastIndexOf(this.SEPARATOR) + 1);
				var child = this.getChild(result, lastSegment);
				if (child) {
					this._retrieveNode(child);
				}

				if (!result.Children) {
					this._retrieveNode(result);
				}
				return result;
			},
			getParent: function(node) {
				if (node.parent) {
					this._retrieveNode(node.parent);
				}
				return node.parent;
			},
			loadWorkspace: function(path) {
				return fileClient.loadWorkspace(path);
			},
			/**
			 * Sets the current directory node and initiates retrieval of its
			 * child nodes.
			 */
			setCurrentDirectory: function(node) {
				this.currentDirectory = node;
				this._retrieveNode(node);
			},
			withChildren: function(node, func, errorFunc) {
				if (node.Children) {
					if (func) {
						func(node.Children);
					}
				} else if (node.ChildrenLocation) {
					var self = this;
					fileClient.fetchChildren(node.ChildrenLocation).then(
						function(children) {
							self._sort(children);
							var parents = node.Parents ? node.Parents.slice(0) : [];
							parents.unshift(node);
							for (var i = 0; i < children.length; i++) {
								children[i].parent = node;
								children[i].Parents = parents;
							}
							node.Children = children;
							if (func) {
								func(children);
							}
						},
						function(error) {
							if (errorFunc) {
								errorFunc(error);
							}
						}
					);
				} else {
					if (func) {
						func(null);
					}
				}
			},
			withNode: function(location, func, errorFunc) {
				var self = this;
				fileClient.loadWorkspace(location).then(
					function(node) {
						self._retrieveNode(node, func, errorFunc);
					},
					errorFunc);
			},

			/** @private */
			
			_retrieveNode: function(node, func, errorFunc) {
				if (node.Parents && node.Children) {
					if (func) {
						func(node);
					}
					return;
				}

				var self = this;
				var retrieveChildren = function(node, func, errorFunc) {
					if (node.Directory && !node.Children) {
						self.withChildren(
							node,
							function(children) {
								if (func) {
									func(node);
								}
							},
							errorFunc);
					} else {
						if (func) {
							func(node);
						}
					}
				};
				var updateParents = function(node) {
					if (node.Location === self.SEPARATOR) {
						return;
					}
					if (!node.Parents) {
						/* node is the root of a file service */
						node.parent = self.rootNode;
					} else if (node.Parents.length === 0) {
						/* node's parent is the root of a file service */
						var index = node.Location.indexOf(self.SEPARATOR, 1);
						var location = node.Location.substring(0, index);
						fileClient.loadWorkspace(location).then(
							function(parent) {
								parent.parent = self.rootNode;
								node.parent = parent;
							});
					} else {
						node.parent = node.Parents[0];
						for (var i = 0; i < node.Parents.length - 1; i++) {
							node.Parents[i].parent = node.Parents[i+1];
							node.Parents[i].Directory = true;
						}
					}
				};
				if (!node.Parents && !node.Projects && node.Location !== self.SEPARATOR && node.Name !== fileClient.fileServiceName(node.Location)) {
					fileClient.loadWorkspace(node.Location).then(
						function(metadata) {
							node.Parents = metadata.Parents;
							updateParents(node);
							retrieveChildren(node, func, errorFunc);
						});
				} else {
					if (node.ChildrenLocation) {
						node.Directory = true;
					}
					updateParents(node);
					retrieveChildren(node, func, errorFunc);
				}
			},
			_sort: function(children) {
				children.sort(function(a,b) {
					if (a.Directory !== b.Directory) {
						return a.Directory ? -1 : 1;
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
			}
		};
		return ShellPageFileService;
	}());

	dojo.ready(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			fileClient = new mFileClient.FileClient(serviceRegistry);
		});
	});

	return orion.shellPage;
});
