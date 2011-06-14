define(['dojo'], function(dojo) {


function updateNavTools (registry, explorer, toolbarId, selectionToolbarId, item) {
		var toolbar = dojo.byId(toolbarId);
		if (toolbar) {
			dojo.empty(toolbar);
		} else {
			throw "could not find toolbar " + toolbarId;
		}
		registry.getService("orion.page.command").then(dojo.hitch(explorer, function(service) {
			service.renderCommands(toolbar, "dom", item, explorer, "image");
			if (selectionToolbarId) {
				var selectionTools = dojo.create("span", {id: selectionToolbarId}, toolbar, "last");
				service.renderCommands(selectionTools, "dom", null, explorer, "image");
			}
		}));
		
		// Stuff we do only the first time
		if (!eclipse.doOnce) {
			eclipse.doOnce = true;
			registry.getService("orion.page.selection").then(function(service) {
				service.addEventListener("selectionChanged", function(singleSelection, selections) {
					var selectionTools = dojo.byId(selectionToolbarId);
					if (selectionTools) {
						dojo.empty(selectionTools);
						registry.getService("orion.page.command").then(function(commandService) {
							commandService.renderCommands(selectionTools, "dom", selections, explorer, "image");
						});
					}
				});
			});
		}
	}
return {updateNavTools : updateNavTools};
});