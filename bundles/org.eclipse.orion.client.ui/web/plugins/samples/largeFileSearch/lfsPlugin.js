/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd*/
define(["orion/plugin", "i18n!myMessageBundle/nls/cmdMessages"], function(PluginProvider, messages) {
	var provider = new PluginProvider({
		name: "3rd party special search plugin", //$NON-NLS-0$
		description: "3rd party special search plugin" //$NON-NLS-0$
	});
		provider.registerServiceProvider("orion.edit.command.category", {}, { //$NON-NLS-1$
			  id : "search.special", //$NON-NLS-1$
	          name: messages['SpecialSearchCatName'],
	          tooltip : messages['SpecialSearchCatNameTooltip']
		});
		provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			{
    				/** @callback */
					execute: function(editorContext, options) {
						options.kind ='parentFolder'; //$NON-NLS-1$
						console.log(editorContext);
						console.log(options);
					}
				},
    			{
		    		name: messages["SpecialSearchOnParentFolder"],
		    		tooltip : messages['SpecialSearchOnParentFolderTooltip'],
		    		parentPath: "search.special", //$NON-NLS-1$
		    		id : "search.special.fromParent",  //$NON-NLS-1$
		    		key : [ "u", true, true, false, false]  //$NON-NLS-1$
		    		//contentType: ['application/javascript', 'text/html']  //$NON-NLS-1$ //$NON-NLS-2$
		    	}
    	);
    	provider.registerServiceProvider("orion.edit.command",  //$NON-NLS-1$
    			{
    				/** @callback */
					execute: function(editorContext, options) {
						options.kind ='project'; //$NON-NLS-1$
					}
				},
    			{
		    		name: messages["SpecialSearchOnProject"],
		    		tooltip : messages['SpecialSearchOnProjectTooltip'],
		    		parentPath: "search.special", //$NON-NLS-1$
		    		id : "search.special.fromProject",  //$NON-NLS-1$
		    		//key : [ "g", true, true, false, false],
		    		//contentType: ['application/javascript', 'text/html']  //$NON-NLS-1$ //$NON-NLS-2$
    			}
    	);
	provider.connect();
});
