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

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/fileClient', 'orion/PageUtil', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList', 'orion/widgets/maker/ScrollingContainer', 'orion/widgets/maker/PluginCompletionSection'], function(require, dojo, dijit, mUtil, mCommands, mFileClient, PageUtil) {

	dojo.declare("orion.widgets.maker.PluginMakerContainer", [orion.widgets.maker.ScrollingContainer], {
		
		fileClient: null,
		
		path: '/file/FF/bundles/org.eclipse.orion.client.core/web/plugins/',
		
		csscomplete: false,
		jscomplete: false,
		htmlcomplete: false,
		
		postCreate: function(){
			
			var bar = dojo.byId( 'pageToolbar' );	
			dojo.style( bar, 'borderBottom', '2px solid whitesmoke' );
			
			var actions = dojo.byId( 'pageActions' );
			
			this.sectionNavigation = dojo.create( 'div', null, actions );
		
			this.sectionList = [];
			
			this.fileClient = new mFileClient.FileClient(this.serviceRegistry);	
		},
		
		
		addCommand: function( name, command ){
		
			var id = "orion.add" + name;
			var tooltip = name;
		
			var createPluginCommand = new mCommands.Command({
				name: name,
				tooltip: tooltip,
				id: id,
				anchor: name,
				callback: dojo.hitch( this, command )
			});
			
			this.commandService.addCommand(createPluginCommand);
			this.commandService.registerCommandContribution(this.toolbarID, id, 2);
			this.commandService.renderCommands(this.toolbarID, this.toolbarID, this, this, "button");
			
			var nodes = dojo.query(".commandButton");
			
			for( var n = 0; n < nodes.length; n++ ){
				nodes[n].style.padding = '3px';
			}	
		},
		
		
		handleError: function(error){
			console.log( error );
		},
		
		handleSuccess: function(media, name ){
		
			switch( media ){
				case 'css':
					this.csscomplete = true;
					break;
					
				case 'js':
					this.jscomplete = true;
					break;
					
				case 'html':
					this.htmlcomplete = true;
					break;
			}
		
			if( this.csscomplete && this.htmlcomplete && this.jscomplete ){
			
			
				var root = window.location.href.split('settings')[0];
				
				var pluginPath = root + 'plugins/' + name + '/' + name + '.html';
				
				var source;
			
				var complete = orion.widgets.maker.PluginCompletionSection({title:"Next Steps"});
				
				var createButton = dojo.byId( 'buttonorion.addCreate0' );
				createButton.parentNode.removeChild(createButton);
				
				var menuItem = this.addSection( complete );
				
				var event = [];
				event.currentTarget = menuItem;
				
				this.scrollTo( event );
				
				complete.updateReferences( root, pluginPath, name );
			}
		},
		
		writeJSContent: function(){
		
			var content = this.prepareJSContent();
		
			this.fileClient.write( this.javascriptFile, content ).then(
							dojo.hitch(this, 'handleSuccess', 'js', this.pluginName ),
							this.handleError);
		},
		
		writeCSSContent: function(){
		
			var content =		'.plugin{\n' +
									'\tborder:solid 5px #ebf4fb;\n' +
									'\twidth: 400px;\n' +
									'\theight: 400px;\n' +
									'\tposition: absolute;\n' +
									'\tleft: 50%;\n' +
									'\ttop: 50%;\n' +
									'\tmargin-left: -200px;\n' +
									'\tmargin-top: -200px;\n' +
									'\tborder-radius:5px;\n' +
									'\tfont-family:Verdana, Arial, Helvetica, Myriad, Tahoma, clean, sans-serif;\n' +
								'}\n\n' +

								'.banner{\n' +
									'\tfont-size:14px;\n' +
									'\tfont-weight:bold;\n' +
									'\tmargin:14px;\n' +
									'\tcolor:#5b6e79;\n' +
									'\ttext-align:center;\n' +
									'\tmargin-top:50px;\n' +
								'}\n\n' +

								'.title{\n' +
									'\tfont-size:20px;\n' +
									'\tfont-weight:bold;\n' +
									'\tmargin:10px;\n' +
									'\tcolor:#5b6e79;\n' +
									'\ttext-align:center;\n' +
								'}\n\n' +

								'.author{\n' +
									'\tfont-size:14px;\n' +
									'\tfont-weight:bold;\n' +
									'\tmargin:10px;\n' +
									'\tcolor:#5b6e79;\n' +
									'\ttext-align:center;\n' +
								'}\n\n' +
								
								'.created{\n' +
									'\tfont-size:14px;\n' +
									'\tfont-weight:bold;\n' +
									'\tmargin:10px;\n' +
									'\tcolor:#5b6e79;\n' +
									'\ttext-align:center;\n' +
								'}\n\n' +
								
								'.description{\n' +
									'\tfont-size:14px;\n' +
									'\tfont-weight:bold;\n' +
						                        '\tborder-top: 1px solid #b7ddf2;\n' +
									'\tmargin:10px;\n' +
									'\tmargin-top:15px;\n' +
									'\tpadding:15px;\n' +
									'\tcolor:#5b6e79;\n' +
									'\ttext-align:center;\n' +
									'\twidth:275px;\n' +
									'\tmargin-left:50px;\n' +
									'\tmargin-right:100px;\n' +
									'\tline-height:20px;\n' +
								'}';
								
			this.fileClient.write( this.cssFile, content ).then(
							dojo.hitch(this, 'handleSuccess', 'css', this.pluginName ),
							this.handleError);
		
		},
		
		writeHTMLContent: function(){
		
			var content = this.prepareHTMLContent();
		
			this.fileClient.write( this.htmlFile, content ).then(
							dojo.hitch(this, 'handleSuccess', 'html', this.pluginName),
							this.handleError);
		},
		
		createNewFolder: function( name ){
			this.fileClient.createFolder( this.path, name ).then(
							dojo.hitch(this, 'createNewFiles'),
							this.handleError);
		},
		
		createNewFiles: function( filename ){	
			
			var pluginjs = this.pluginName + '.js';
			var pluginhtml = this.pluginName + '.html';
			var plugincss = this.pluginName + '.css';
			
			this.javascriptFile = this.path + '/' + this.pluginName + '/' + pluginjs;
			this.htmlFile = this.path + '/' + this.pluginName + '/' + pluginhtml;
			this.cssFile = this.path + '/' + this.pluginName + '/' + plugincss;

			this.fileClient.createFile( this.path + '/' + this.pluginName , pluginjs ).then(
							dojo.hitch(this, 'writeJSContent'),
							this.handleError);
							
			this.fileClient.createFile( this.path + '/' + this.pluginName , pluginhtml ).then(
							dojo.hitch(this, 'writeHTMLContent'),
							this.handleError);
							
			this.fileClient.createFile( this.path + '/' + this.pluginName , plugincss ).then(
							dojo.hitch(this, 'writeCSSContent'),
							this.handleError);
		},
		
		prepareHTMLContent: function(){
			var filecontent = '<!DOCTYPE html>\n' +
								'<html>\n' +
									'\t<head>\n' +
									  '\t\t<meta charset="UTF-8"/>\n' +
									  '\t\t<title>' + this.pluginName + '</title>\n' +
									  '\t\t<link rel=StyleSheet href="' + this.pluginName + '.css" type="text/css"></link>\n' +
									  '\t\t<script src="../../orion/plugin.js"></script>\n' +
									  '\t\t<script src="' + this.pluginName + '.js"></script>\n' +
									  '\t\t<script>\n' +
							'\t\t</script>\n' +
							'\t</head>\n' +
							'\t<body>\n' +
							'\t\t<div class="plugin">\n' +
							'\t\t\t<div class="banner">An Eclipse Orion Plugin</div>\n' +
							'\t\t\t<div class="title"> - ' + this.pluginName + ' - </div>\n' +
							'\t\t\t<div class="author">Written by ' + this.pluginAuthor + '</div>\n' +
							'\t\t\t<div class="created">Created 13.04.2012</div>\n' +
							'\t\t\t<div class="description">' + this.pluginDescription + '</div>\n' +
							'\t\t</div>\n' +
							'\t</body>\n' +
							'</html>';
							
			return filecontent;
		},
		
		prepareJSContent: function(){	
			var filecontent =	'/*global console eclipse CSSLint window*/\n\n' + 
								'window.onload = function() {\n' +
									'\tvar provider = new eclipse.PluginProvider();\n' +
									'\tvar serviceImpl = {\n' +
											'\t\trun: function(text) {\n' +
												'\t\t\treturn text.split("").reverse().join("");\n' +
											'\t\t}\n' +
									'\t};\n' + 
									'\tvar serviceProperties = {\n' + 
										'\t\tname: "Reverse Text",\n' +
										'\t\tkey: ["e", true, true] // Ctrl+Shift+e\n' +
									'\t};\n' +
									'\tprovider.registerServiceProvider("orion.edit.command", serviceImpl, serviceProperties);\n' +
									'\tprovider.connect();\n' +
								'};';
			return filecontent;
		},
		
		createPlugin: function( item ){
			
			for( var s = 0; s < this.sectionList.length; s++ ){
				var d = this.sectionList[s].getData();	
				
				if( d.id === "Plugin Description Section" ){
				
					this.pluginAuthor = d.author;
					this.pluginName = d.name;
					this.pluginDescription = d.description;
					this.pluginLicence = d.licence;
					
					this.createNewFolder( this.pluginName );
				}
			}
		},
        
		addCreationCommand: function(){
		
		},
		
		resize: function( size ){
			var mb = dojo.marginBox ( this.scontent );	
			dojo.style( this.scontent, 'width', mb.w + 'px' );
			dojo.style( this.domNode.parentNode, 'overflow', 'auto' );
		}
	
	});
});