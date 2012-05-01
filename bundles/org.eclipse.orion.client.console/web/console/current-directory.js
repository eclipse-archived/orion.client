/*global require define setTimeout */
/**
 * This module provides utility methods to retrieve information about directorie. It also keeps
 * track of the 'current' directory state by using the 'dojo.hash()' function to store and retrieve
 * the current directory location from the page URL.
 */ 
define(['dojo', 'orion/bootstrap', 'orion/fileClient'], function (dojo, mBootstrap, mFileClient) {

	var fileClient;
	var exports = {};

	//The current path. I.e. the working dir relative to which we will execute commands on the server.
	var currentTreeNode = null;
	
	function withWorkspace(k) {
		fileClient.loadWorkspace('').then(k);
	}
	exports.withWorkspace = withWorkspace;
	
	/**
	 * Make sure that there is a currentTreeNode and call given callback on the tree node
	 * as soon as its available.
	 */
	function withCurrentTreeNode(doit) {
		if (currentTreeNode===null) {
			var location = dojo.hash() || "";
			fileClient.loadWorkspace(location).then(function (node) {
				currentTreeNode = node;
				doit(node);
			});
		} else {
			//Wrapped in a setTimeout to ensure it always executed as later scheduled event.
			//otherwise the execution order will be different depending on whether currentTreeNode==null
			setTimeout(function () {
				doit(currentTreeNode);
			});
		}
	}
	exports.withCurrentTreeNode = withCurrentTreeNode;

	/**
	 * Returns true if string is a string that ends with the string suffix.
	 */
	function endsWith(string, suffix) {
		if (typeof(string)==='string' && typeof(suffix)==='string') {
			var loc = string.lastIndexOf(suffix);
			return (loc + suffix.length) === string.length;
		}
		return false;
	}

	/**
	 * Get the location of a given node's parent node. May return null if the node is a workspace node 
	 * so it doesn't have a parent.
	 * <p>
	 * Warning: a valid parent location is the empty String '' which indicates the 'root' location.
	 * To check whether a valid parent was returned use 'if (loc!==null)' rather than 'if (loc)'. 
	 * The empty String will count as 'false' in if tests!
	 */
	function getParentLocation(node) {
		if (node.Parents && node.Parents.length>0) {
			return node.Parents[0].Location;
		} else {
			//TODO: Hack allert! Should not be using URL hackery to determine parent location
			// but it seems sometimes we don't have a choice because the Parent's attribute is missing.
			// Should investigate precisely how breadcrumbs does this.
			var location = node.Location;
			var parentLocation = null;
			if (endsWith(location,'/')) {
				location = location.slice(0, location.length-1);
			}
			if (location) {
				var lastSlash = location.lastIndexOf('/');
				if (lastSlash>=0) {
					parentLocation = location.slice(0, lastSlash+1);
					if (parentLocation==='/file/') {
						parentLocation = '';
					} else if (parentLocation==='/workspace/') {
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
	
	/**
	 * Calls the callback function 'k' with the children of a given node.
	 * If the children are available the callback function is called immediately otherwise 
	 * the children will be retrieved and the callback function called whenever the children
	 * become available.
	 */
	function withChildren(node, k) {
		if (node.Children) {
			k(node.Children);
		} else if (node.ChildrenLocation) {
			fileClient.fetchChildren(node.ChildrenLocation).then(function (children) {
				node.Children = children; // cache for later.
				k(children);
			});
		}
	}
	exports.withChildren = withChildren;
	
	function withCurrentChildren(k) {
		withCurrentTreeNode(function (node) {
			withChildren(node, k);
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