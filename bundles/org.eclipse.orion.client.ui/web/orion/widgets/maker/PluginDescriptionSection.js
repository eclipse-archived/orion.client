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

define(['i18n!orion/settings/nls/messages', 'require', 'dojo', 'dijit', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList', 'orion/widgets/maker/ScrollingContainerSection'], function(messages, require, dojo, dijit) {

	dojo.declare("orion.widgets.maker.PluginDescriptionSection", [orion.widgets.maker.ScrollingContainerSection], { //$NON-NLS-0$
						
		content: '<form class="scrollForm" action="/" method="post">' +	 //$NON-NLS-0$
					'<fieldset>' + //$NON-NLS-0$
						'<p class="first">' +					 //$NON-NLS-0$
							'<label for="name">'+messages['Plugin Name:']+'</label>' +				 //$NON-NLS-2$ //$NON-NLS-0$
							'<input type="text" name="name" id="pluginname" size="30">' +					 //$NON-NLS-0$
						'</p>' + //$NON-NLS-0$
						'<p>' +					 //$NON-NLS-0$
							'<label for="email">'+messages['Author Name:']+'</label>' +				 //$NON-NLS-2$ //$NON-NLS-0$
							'<input  type="text" name="email" id="pluginauthor" size="30">' +				 //$NON-NLS-0$
						'</p>' + //$NON-NLS-0$
						'<p>' + //$NON-NLS-0$
							'<label for="web">'+messages['Licence:']+'</label>' +				 //$NON-NLS-2$ //$NON-NLS-0$
							'<input type="text" name="web" id="pluginLicence" size="30">' +										 //$NON-NLS-0$
						'</p>' +			 //$NON-NLS-0$
						'<p>' + //$NON-NLS-0$
							'<label for="message">'+messages['Description:']+'</label>' +//$NON-NLS-2$ //$NON-NLS-0$
							'<textarea name="message" id="pluginDescription" cols="30" rows="10"></textarea>' + //$NON-NLS-0$
						'</p>' +					 //$NON-NLS-0$
					'</fieldset>' +								 //$NON-NLS-0$
				'</form>', //$NON-NLS-0$
				
		getData: function(){
			var data = [];
			data.id = this.sectionID;
			data.name = dojo.byId( 'pluginname' ).value; //$NON-NLS-0$
			data.author = dojo.byId( 'pluginauthor' ).value; //$NON-NLS-0$
			data.licence = dojo.byId( 'pluginLicence' ).value; //$NON-NLS-0$
			data.description = dojo.byId( 'pluginDescription' ).value; //$NON-NLS-0$
			return data;
		}
	});
});