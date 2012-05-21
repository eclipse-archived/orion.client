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

define(['i18n!settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/PageUtil', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList', 'orion/widgets/maker/ScrollingContainerSection'], function(messages, require, dojo, dijit, mUtil, mCommands, PageUtil) {

	dojo.declare("orion.widgets.maker.PluginCompletionSection", [orion.widgets.maker.ScrollingContainerSection], { //$NON-NLS-0$
						
		content:'<form class="scrollForm" action="/" method="post">' +	 //$NON-NLS-0$
					'<fieldset>' + //$NON-NLS-0$
						'<div class="steps">' + //$NON-NLS-0$
							'<a id="code" class="nextlink downloadbutton" style="float: left; background-color: #2dad2d;" target="_blank"><span style="display: inline-block;">'+messages['Edit Plugin JavaScript']+'</span></a>' + //$NON-NLS-2$ //$NON-NLS-0$
							'<a id="installer" class="nextlink downloadbutton" style="padding-left:20px;float: left; background-color: #2dad2d;" target="_blank"><span style="display: inline-block;">'+messages['Install Plugin']+'</span></a>' + //$NON-NLS-2$ //$NON-NLS-0$
						'</div>' + //$NON-NLS-0$
					'</fieldset>' +								 //$NON-NLS-0$
				'</form>', //$NON-NLS-0$
				
		updateReferences: function( root, path, name ){
			var installer = dojo.byId( "installer" ); //$NON-NLS-0$
			installer.href = root + 'settings/settings.html#,category=plugins,installPlugin=' + path; //$NON-NLS-0$
			
			var code = dojo.byId( "code" ); //$NON-NLS-0$
			code.href =  root + 'edit/edit.html#/file/FF/bundles/org.eclipse.orion.client.core/web/plugins/' + name + '/' + name + '.js'; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
		},
				
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