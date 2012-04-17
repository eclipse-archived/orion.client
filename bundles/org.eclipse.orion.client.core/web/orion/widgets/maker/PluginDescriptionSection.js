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

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/PageUtil', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList', 'orion/widgets/maker/ScrollingContainerSection'], function(require, dojo, dijit, mUtil, mCommands, PageUtil) {

	dojo.declare("orion.widgets.maker.PluginDescriptionSection", [orion.widgets.maker.ScrollingContainerSection], {
						
		content: '<form class="scrollForm" action="/" method="post">' +	
					'<fieldset>' +
						'<p class="first">' +					
							'<label for="name">Plugin Name:</label>' +				
							'<input type="text" name="name" id="pluginname" size="30">' +					
						'</p>' +
						'<p>' +					
							'<label for="email">Author Name:</label>' +				
							'<input  type="text" name="email" id="pluginauthor" size="30">' +				
						'</p>' +
						'<p>' +
							'<label for="web">Licence:</label>' +				
							'<input type="text" name="web" id="pluginLicence" size="30">' +										
						'</p>' +			
						'<p>' +
							'<label for="message">Description:</label>' +
							'<textarea name="message" id="pluginDescription" cols="30" rows="10"></textarea>' +
						'</p>' +					
					'</fieldset>' +								
				'</form>',
				
		getData: function(){
			var data = [];
			data.id = this.sectionID;
			data.name = dojo.byId( 'pluginname' ).value;
			data.author = dojo.byId( 'pluginauthor' ).value;
			data.licence = dojo.byId( 'pluginLicence' ).value;
			data.description = dojo.byId( 'pluginDescription' ).value;
			return data;
		}
	});
});