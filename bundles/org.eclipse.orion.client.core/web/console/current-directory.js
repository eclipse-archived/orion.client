/*******************************************************************************
 * @license
 * Copyright (c) 2012 VMWare and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     Kris De Volder (VMWare) - initial API and implementation
 *******************************************************************************/

/*global define setTimeout */

/**
 * This module provides utility methods to retrieve information about directories. It also keeps
 * track of the 'current' directory state by using the 'dojo.hash()' function to store and retrieve
 * the current directory location from the page URL.
 */ 
define(['dojo', 'orion/bootstrap', 'orion/fileClient'], function (dojo, mBootstrap, mFileClient) {

	var fileClient;
	var exports = {};

	/* the working directory relative to which we will execute commands on the server */
	var currentTreeNode = null;

	function withWorkspace(func) {
		fileClient.loadWorkspace('').then(func);
	}
	exports.withWorkspace = withWorkspace;

	/* ensure that there is a currentTreeNode and invoke a function with it */
	function withCurrentTreeNode(func) {
		if (currentTreeNode === null) {
			var location = dojo.hash() || "";
			fileClient.loadWorkspace(location).then(function(node) {
				currentTreeNode = node;
				func(node);
			});
		} else {
			/*
			 * The following is wrapped in a setTimeout to match the timing of
			 * the currentTreeNode == null case.
			 */
			setTimeout(function() {
				func(currentTreeNode);
			});
		}
	}
	exports.withCurrentTreeNode = withCurrentTreeNode;

	function endsWith(string, suffix) {
		if (typeof(string) === 'string' && typeof(suffix) === 'string') {
			var loc = string.lastIndexOf(suffix);
			return (loc + suffix.length) === string.length;
		}
		return false;
	}

	/*
	 * Returns the location of a node's parent node, or null if the node does not have a parent.
	 *
	 * Note: '' is a valid parent location, which indicates the 'root' location. To determine if
	 * a valid parent was returned, use 'if (loc !== null)' rather than 'if (loc)'. 
	 */
	function getParentLocation(node) {
		if (node.Parents && node.Parents.length > 0) {
			return node.Parents[0].Location;
		} else {
			//TODO: Should not be using URL hackery to determine parent location, but there
			// sometimes is not a choice when the Parent's attribute is missing.
			var location = node.Location;
			var parentLocation = null;
			if (endsWith(location,'/')) {
				location = location.slice(0, location.length - 1);
			}
			if (location) {
				var lastSlash = location.lastIndexOf('/');
				if (lastSlash >= 0) {
					parentLocation = location.slice(0, lastSlash + 1);
					if (parentLocation === '/file/') {
						parentLocation = '';
					} else if (parentLocation === '/workspace/') {
						parentLocation = null;
					}
				}
			}
			return parentLocation;
		}
	}
	exports.getParentLocation = getParentLocation;

	function setCurrentTreeNode(node) {
		currentTreeNode = node;
		if (currentTreeNode && currentTreeNode.Location) {
			dojo.hash(currentTreeNode.Location);
		}
	}
	exports.setCurrentTreeNode = setCurrentTreeNode;

	/* calls a callback function with the children of a given node */
	function withChildren(node, func) {
		if (node.Children) {
			func(node.Children);
		} else if (node.ChildrenLocation) {
			fileClient.fetchChildren(node.ChildrenLocation).then(function(children) {
				node.Children = children; /* cache for later */
				func(children);
			});
		}
	}
	exports.withChildren = withChildren;

	function withCurrentChildren(func) {
		withCurrentTreeNode(function(node) {
			withChildren(node, func);
		});
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
