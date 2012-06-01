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
 * This module provides utility methods to retrieve information about directories. It also keeps
 * track of the 'current' directory state by using the 'dojo.hash()' function to store and retrieve
 * the current directory location from the page URL.
 */ 
define(['dojo', 'orion/bootstrap', 'orion/fileClient'], function (dojo, mBootstrap, mFileClient) {

	var exports = {};

	var fileClient;
	var currentTreeNode = null;

	/* ensure that there is a currentTreeNode and invoke a function with it */
	function withCurrentTreeNode(func, errorFunc) {
		if (currentTreeNode !== null) {
			func(currentTreeNode);
		} else {
			var location = dojo.hash() || '/'; //$NON-NLS-0$
			fileClient.loadWorkspace(location).then(
				function(node) {
					currentTreeNode = node;
					func(node);
				},
				function(error) {
					if (errorFunc) {
						errorFunc(error);
					}
				}
			);
		}
	}
	exports.withCurrentTreeNode = withCurrentTreeNode;

	function setCurrentTreeNode(node) {
		currentTreeNode = node;
	}
	exports.setCurrentTreeNode = setCurrentTreeNode;

	/* calls a callback function with the children of a given node */
	function withChildren(node, func, errorFunc) {
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
	exports.withChildren = withChildren;

	function withCurrentChildren(func, errorFunc) {
		withCurrentTreeNode(
			function(node) {
				withChildren(node, func, errorFunc);
			},
			errorFunc
		);
	}
	exports.withCurrentChildren = withCurrentChildren;

	dojo.ready(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			fileClient = new mFileClient.FileClient(serviceRegistry);
		});
	});

	return exports;	
});
