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

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/PageUtil', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList', 'orion/widgets/settings/InputBuilder'], function(require, dojo, dijit, mUtil, mCommands, PageUtil) {

	dojo.declare("orion.widgets.maker.ScrollingContainerSection", [dijit._Widget, dijit._Templated], {
	
		templateString:	'<div>' +
							'<a class="anchor" data-dojo-attach-point="anchor" id="section" name="section"></a>' +
							'<div data-dojo-attach-point="section" class="sectionBlock">' + 
								'<div data-dojo-attach-point="contentArea" class="inner">' + 
								'</div>' +
							'</div>' +				
							'<div data-dojo-attach-point="sectionTitle" class="pluginTitle"></div>' + 
							'<div data-dojo-attach-point="orderCircle" class="circle">1</div>' + 
						'</div>',
						
		content: "<div></div>",
						
		order: 1,
		
		postCreate: function(){
			this.sectionID = this.title + ' Section';
			this.selectedNode = this.home;
			this.anchor.id = this.title;
			this.anchor.name = this.title;
			this.sectionTitle.innerHTML = this.title;
		},
		
		startup: function(){
			var mb = dojo.position( this.domNode );
			var parentmb = dojo.position( this.domNode.parentNode );
			this.sectionTitle.style.top = mb.y - parentmb.y - 18 + 'px';
			this.orderCircle.style.top =  mb.y - parentmb.y + 30 + 'px';
			dojo.place( this.content, this.contentArea );
		},
		
		setOrder: function( order ){
			this.order = order;
			this.orderCircle.innerHTML = this.order;
		},
		
		getData: function(){
			var data = [];
			data.id = this.sectionID;
			return data;
		}
	
	});
});