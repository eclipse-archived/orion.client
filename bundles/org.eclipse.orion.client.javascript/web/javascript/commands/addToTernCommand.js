/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
 /*eslint-env amd, browser*/
define([
'orion/objects',
'i18n!javascript/nls/messages'
], function(Objects, Messages) {

	/**
	 * Command executed from the file navigator that will add selected files to the .tern-project file
	 * @param ternProjectManager The TernProjectManager instance used to manager Tern options
	 */
	function AddToTernCommand(ternProjectManager) {
		this.ternProjectManager = ternProjectManager;
	}

	Objects.mixin(AddToTernCommand.prototype, {
		run: function(selection) {
			var projectFile;
			var ternProjectManager = this.ternProjectManager;
			var files = [];
			if (Array.isArray(selection)){
				for (var i=0; i<selection.length; i++) {
					var currentFile = selection[i];
					if (currentFile.Location && currentFile.Parents && !currentFile.Directory){
						// TODO Limit action to a single project (either by limiting command visibility or check each file's project)
						if (!projectFile){
							projectFile = ternProjectManager.getProjectFile(currentFile);
						}
						// TODO Should we strip the leading segments (relative to project root?)
						files.push(currentFile.Location);
					}
				}
				
				if (projectFile && files.length > 0){
					ternProjectManager.ensureTernProjectFileLocation(projectFile).then(function(ternFileLocation){
						// TODO Need to mark the Tern settings dirty
						if (ternFileLocation){
							return ternProjectManager.parseTernJSON(ternFileLocation).then(function(jsonOptions){
								if (jsonOptions){
									// Modify the existing file
									if (Array.isArray(jsonOptions.loadEagerly)){
										// TODO Don't duplicate existing entries
										jsonOptions.loadEagerly = jsonOptions.loadEagerly.concat(files);
									} else {
										jsonOptions.loadEagerly = files;
									}
								} else {
									// Overwrite the file contents
									jsonOptions = {
										loadEagerly: files
									};
								}							
								// Write the file
								return ternProjectManager.writeTernFile(ternFileLocation, jsonOptions);
							});
						} else {
							// fileClient.create
							// fileClient.write
							var jsonOptions = {
								loadEagerly: files
							};
							return ternProjectManager.writeTernFile(ternFileLocation, jsonOptions);
							
						}
						return null;
					});
				}
			}
		}
	});

	return {
		AddToTernCommand : AddToTernCommand
	};
});