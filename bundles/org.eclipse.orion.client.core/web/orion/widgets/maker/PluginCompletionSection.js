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

	dojo.declare("orion.widgets.maker.PluginCompletionSection", [orion.widgets.maker.ScrollingContainerSection], {
						
		content:'<form class="scrollForm" action="/" method="post">' +	
					'<fieldset>' +
						'<div class="steps">' +
							'<a id="code" class="nextlink downloadbutton" style="float: left; background-color: #2dad2d;" target="_blank"><span style="display: inline-block;">Edit Plugin JavaScript</span></a>' +
							'<a id="installer" class="nextlink downloadbutton" style="padding-left:20px;float: left; background-color: #2dad2d;" target="_blank"><span style="display: inline-block;">Install Plugin</span></a>' +
						'</div>' +
					'</fieldset>' +								
				'</form>',
				
		updateReferences: function( root, path, name ){
			var installer = dojo.byId( "installer" );
			installer.href = root + 'settings/settings.html#,category=plugins,installPlugin=' + path;
			
			var code = dojo.byId( "code" );
			code.href =  root + 'edit/edit.html#/file/FF/bundles/org.eclipse.orion.client.core/web/plugins/' + name + '/' + name + '.js';
		},
				
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