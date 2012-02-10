/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: 
 *		John Arthorne (IBM Corporation) - initial API and implementation
 *		Felipe Heidrich (IBM Corporation) - initial API and implementation
 ******************************************************************************/
define(['dojo'], function(dojo) {


function updateNavTools (registry, explorer, toolbarId, selectionToolbarId, item) {
		var toolbar = dojo.byId(toolbarId);
		if (toolbar) {
			dojo.empty(toolbar);
		} else {
			throw "could not find toolbar " + toolbarId;
		}
		var commandService = registry.getService("orion.page.command");
		commandService.renderCommands(toolbar, "dom", item, explorer, "button");
		if (selectionToolbarId) {
			var selectionTools = dojo.byId(selectionToolbarId);
			if (selectionTools) {
				dojo.empty(selectionTools);
				commandService.renderCommands(selectionTools, "dom", selections, explorer, "button");
			}
		}

		
		// Stuff we do only the first time
		if (!eclipse.doOnce) {
			eclipse.doOnce = true;
			registry.getService("orion.page.selection").addEventListener("selectionChanged", function(singleSelection, selections) {
				var selectionTools = dojo.byId(selectionToolbarId);
				if (selectionTools) {
					dojo.empty(selectionTools);
					commandService.renderCommands(selectionTools, "dom", selections, explorer, "button");
				}
			});
		}
	}
return {updateNavTools : updateNavTools};
});
