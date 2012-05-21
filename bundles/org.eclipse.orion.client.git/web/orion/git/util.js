/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define window document navigator*/

/**
 * This class contains static utility methods. It is not intended to be instantiated.
 * @class This class contains static utility methods.
 * @name orion.util
 */
define(['dojo', 'dijit', 'dojo/hash', 'dijit/form/ValidationTextBox'], function(dojo, dijit) {
                
	var interestedUnstagedGroup = ["Missing","Modified","Untracked","Conflicting"];
	var interestedStagedGroup = ["Added", "Changed","Removed"];
	var conflictPatterns = [["Both","Modified","Added", "Changed","Missing"],["RemoteDelete","Untracked","Removed"],["LocalDelete","Modified","Added", "Missing"]];
	var conflictType = "Conflicting";
	
	var statusTypeMap = { 
		"Missing":["gitImageSprite git-sprite-removal", "Unstaged removal"],
		"Removed":["gitImageSprite git-sprite-removal","Staged removal"],	
		"Modified":["gitImageSprite git-sprite-modification","Unstaged change"],	
		"Changed":["gitImageSprite git-sprite-modification","Staged change"],	
	    "Untracked":["gitImageSprite git-sprite-addition","Unstaged addition"],	
		"Added":["gitImageSprite git-sprite-addition","Staged addition"],	
		"Conflicting":["gitImageSprite git-sprite-conflict-file", "Conflicting"]	
	};
	
	var statusUILocation = "git/git-status2.html";
	
	function isChange(change){
		return isStaged(change) || isUnstaged(change);
	}
	
	function isStaged(change){
		for(var i = 0; i < interestedStagedGroup.length ; i++){
			if(change.type === interestedStagedGroup[i]){
				return  true;
			}
		}
		return false;
	}
	
	function isUnstaged(change){
		for(var i = 0; i < interestedUnstagedGroup.length ; i++){
			if(change.type === interestedUnstagedGroup[i]){
				return  true;
			}
		}
		return false;
	}
	
	function hasStagedChanges(status){
		for(var i = 0; i < interestedStagedGroup.length ; i++){
			if (status[interestedStagedGroup[i]].length > 0)
				return true;
		}
		return false;
	}
	
	function hasUnstagedChanges(status){
		for(var i = 0; i < interestedUnstagedGroup.length ; i++){
			if (status[interestedUnstagedGroup[i]].length > 0)
				return true;
		}
		return false;
	}
	
	//return module exports
	return {
		statusUILocation: statusUILocation,
		isStaged: isStaged,
		isUnstaged: isUnstaged,
		isChange: isChange,
		hasStagedChanges: hasStagedChanges,
		hasUnstagedChanges: hasUnstagedChanges
	};

});
