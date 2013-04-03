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
define(['i18n!git/nls/gitmessages', 'orion/compare/compareCommands', 'orion/compare/resourceComparer', 'orion/webui/littlelib'], function(messages, mCompareCommands, mResourceComparer, lib) {
                
	var interestedUnstagedGroup = ["Missing","Modified","Untracked","Conflicting"]; //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	var interestedStagedGroup = ["Added", "Changed","Removed"]; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	var conflictPatterns = [["Both","Modified","Added", "Changed","Missing"],["RemoteDelete","Untracked","Removed"],["LocalDelete","Modified","Added", "Missing"]]; //$NON-NLS-11$ //$NON-NLS-10$ //$NON-NLS-9$ //$NON-NLS-8$ //$NON-NLS-7$ //$NON-NLS-6$ //$NON-NLS-5$ //$NON-NLS-4$ //$NON-NLS-3$ //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	var conflictType = "Conflicting"; //$NON-NLS-0$
	
	var statusTypeMap = { 
		"Missing":["gitImageSprite git-sprite-removal", messages['Unstaged removal']], //$NON-NLS-1$ //$NON-NLS-0$
		"Removed":["gitImageSprite git-sprite-removal",messages['Staged removal']],	 //$NON-NLS-1$ //$NON-NLS-0$
		"Modified":["gitImageSprite git-sprite-file",messages['Unstaged change']],	 //$NON-NLS-1$ //$NON-NLS-0$
		"Changed":["gitImageSprite git-sprite-file",messages['Staged change']],	 //$NON-NLS-1$ //$NON-NLS-0$
	    "Untracked":["gitImageSprite git-sprite-addition",messages['Unstaged addition']],	 //$NON-NLS-1$ //$NON-NLS-0$
		"Added":["gitImageSprite git-sprite-addition",messages['Staged addition']],	 //$NON-NLS-1$ //$NON-NLS-0$
		"Conflicting":["gitImageSprite git-sprite-conflict-file", messages['Conflicting']] //$NON-NLS-1$ //$NON-NLS-0$
	};
	
	var statusUILocation = "git/git-status2.html"; //$NON-NLS-0$
	
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
	
	function isChange(change){
		return isStaged(change) || isUnstaged(change);
	}
	
	function hasStagedChanges(status){
		for(var i = 0; i < interestedStagedGroup.length ; i++){
			if (status[interestedStagedGroup[i]].length > 0) {
				return true;
			}
		}
		return false;
	}
	
	function hasUnstagedChanges(status){
		for(var i = 0; i < interestedUnstagedGroup.length ; i++){
			if (status[interestedUnstagedGroup[i]].length > 0) {
				return true;
			}
		}
		return false;
	}
	
	function createCompareWidget(serviceRegistry, commandService, resource, hasConflicts, parentDivId, commandSpanId, editableInComparePage, gridRenderer){
		var diffProvider = new mResourceComparer.DefaultDiffProvider(serviceRegistry);
		var cmdProvider = new mCompareCommands.CompareCommandFactory({commandService: commandService, commandSpanId: commandSpanId, gridRenderer: gridRenderer});
		var comparerOptions = {
			toggleable: true,
			type: "inline", //$NON-NLS-0$
			readonly: true,
			hasConflicts: hasConflicts,
			diffProvider: diffProvider,
			resource : resource,
			editableInComparePage : editableInComparePage
		};
		var viewOptions = {
			parentDivId: parentDivId,
			commandProvider: cmdProvider
		};
		var comparer = new mResourceComparer.ResourceComparer(serviceRegistry, commandService, comparerOptions, viewOptions);
		comparer.start().then(function(maxHeight) {
			var vH = 420;
			if (maxHeight < vH) {
				vH = maxHeight;
			}
			var diffContainer = lib.node(parentDivId);
			diffContainer.style.height = vH + "px"; //$NON-NLS-0$
		});
	}
	
	//return module exports
	return {
		statusUILocation: statusUILocation,
		isStaged: isStaged,
		isUnstaged: isUnstaged,
		isChange: isChange,
		hasStagedChanges: hasStagedChanges,
		hasUnstagedChanges: hasUnstagedChanges,
		createCompareWidget: createCompareWidget
	};

});
