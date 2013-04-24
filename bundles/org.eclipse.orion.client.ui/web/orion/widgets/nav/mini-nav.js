/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define*/
/*jslint */
define(['require', 'orion/explorers/explorer-table', 'orion/explorers/navigatorRenderer', 'orion/i18nUtil'],
	function(require, mExplorer, mNavigatorRenderer, i18nUtil) {
	var FileExplorer = mExplorer.FileExplorer;
	var NavigatorRenderer = mNavigatorRenderer.NavigatorRenderer;

	function MiniNavExplorer(options) {
		FileExplorer.apply(this, arguments);
		this.inputManager = options.inputManager;
		this.progressService = options.progressService;
		var _self = this;
		this.inputManager.addEventListener("InputChanged", function(event) {
			var metadata = event.metadata, parent = metadata && metadata.Parents && metadata.Parents[0];
			if (parent) {
				console.log('loading parent info for sidebar nav ' + JSON.stringify(parent));
				// TODO should use progressService here but can't get it to work
				/*self.progressService.progress(___________,
						i18nUtil.formatMessage("Getting metadata of ${0}", metadata.Parents[0].Location));
				*/
				_self.load(_self.fileClient.read(parent.ChildrenLocation, true));
			}
		});
	}
	MiniNavExplorer.prototype = Object.create(FileExplorer.prototype, {
		load: {
			value: function() {
				FileExplorer.prototype.load.apply(this, arguments);
			}
		}
	});

	function MiniNavRenderer() {
		NavigatorRenderer.apply(this, arguments);
	}
	MiniNavRenderer.prototype = Object.create(NavigatorRenderer.prototype);
	MiniNavRenderer.prototype.showFolderLinks = true;
//	MiniNavRenderer.prototype.folderLink = require.toUrl("navigate/table.html"); //$NON-NLS-0$
	MiniNavRenderer.prototype.oneColumn = true;

	return {
		MiniNavExplorer: MiniNavExplorer,
		MiniNavRenderer: MiniNavRenderer
	};
});
