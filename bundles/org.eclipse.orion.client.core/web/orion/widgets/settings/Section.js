/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets orion  window console define localStorage*/
/*jslint browser:true*/

/* This SettingsContainer widget is a dojo border container with a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/util' ], function(messages, require, dojo, dijit, mUtil, mCommands) {

	dojo.declare("orion.widgets.settings.Section", [dijit._Widget, dijit._Templated], { //$NON-NLS-0$
		
		templateString: '<section role="region" aria-labelledby="Navigation-header">' + //$NON-NLS-0$
							'<h3 data-dojo-attach-point="title">'+messages['Title']+'</h3>' + //$NON-NLS-2$ //$NON-NLS-0$
							'<div data-dojo-attach-point="sectionContent">' +  //$NON-NLS-0$
							'</div>' +  //$NON-NLS-0$
						'</section>', //$NON-NLS-0$
								
		postCreate: function(){
			
			this.title.innerHTML = this.sectionName;	
			
			if( this.container ){
				this.container.appendChild( this.domNode );
			}
			
			if( this.sections ){
				for( var s = 0; s < this.sections.length; s++ ){
					
					this.sectionContent.appendChild( this.sections[s].domNode );
					
					this.sections[s].startup();
				}
			}
		},
		
		addContent: function( node ){
			this.sectionContent.appendChild( node );
		}
	});
});