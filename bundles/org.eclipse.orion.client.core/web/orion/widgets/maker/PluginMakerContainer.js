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

define(['require', 'dojo', 'dijit', 'orion/commands', 'orion/fileClient', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList', 'orion/widgets/maker/ScrollingContainer', 'orion/widgets/maker/PluginCompletionSection'], function(require, dojo, dijit, mCommands, mFileClient) {

	dojo.declare("orion.widgets.maker.PluginMakerContainer", [orion.widgets.maker.ScrollingContainer], { //$NON-NLS-0$
		
		fileClient: null,
		
		path: '/file/FF/bundles/org.eclipse.orion.client.core/web/plugins/', //$NON-NLS-0$
		
		csscomplete: false,
		jscomplete: false,
		htmlcomplete: false,
		
		postCreate: function(){
			
			var bar = dojo.byId( 'pageToolbar' );	 //$NON-NLS-0$
			dojo.style( bar, 'borderBottom', '2px solid whitesmoke' ); //$NON-NLS-1$ //$NON-NLS-0$
			
			var actions = dojo.byId( 'pageActions' ); //$NON-NLS-0$
			
			this.sectionNavigation = dojo.create( 'div', null, actions ); //$NON-NLS-0$
		
			this.sectionList = [];
			
			this.fileClient = new mFileClient.FileClient(this.serviceRegistry);	
		},
		
		
		addCommand: function( name, command ){
		
			var id = "orion.add" + name; //$NON-NLS-0$
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
			this.commandService.renderCommands(this.toolbarID, this.toolbarID, this, this, "button"); //$NON-NLS-0$
			
			var nodes = dojo.query(".commandButton"); //$NON-NLS-0$
			
			for( var n = 0; n < nodes.length; n++ ){
				nodes[n].style.padding = '3px'; //$NON-NLS-0$
			}	
		},
		
		
		handleError: function(error){
			console.log( error );
		},
		
		handleSuccess: function(media, name ){
		
			switch( media ){
				case 'css': //$NON-NLS-0$
					this.csscomplete = true;
					break;
					
				case 'js': //$NON-NLS-0$
					this.jscomplete = true;
					break;
					
				case 'html': //$NON-NLS-0$
					this.htmlcomplete = true;
					break;
			}
		
			if( this.csscomplete && this.htmlcomplete && this.jscomplete ){
			
			
				var root = window.location.href.split('settings')[0]; //$NON-NLS-0$
				
				var pluginPath = root + 'plugins/' + name + '/' + name + '.html'; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
				
				var source;
			
				var complete = orion.widgets.maker.PluginCompletionSection({title:"Next Steps"}); //$NON-NLS-0$
				
				var createButton = dojo.byId( 'buttonorion.addCreate0' ); //$NON-NLS-0$
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
							dojo.hitch(this, 'handleSuccess', 'js', this.pluginName ), //$NON-NLS-1$ //$NON-NLS-0$
							this.handleError);
		},
		
		writeCSSContent: function(){
		
			var content =		'.plugin{\n' + //$NON-NLS-0$
									'\tborder:solid 5px #ebf4fb;\n' + //$NON-NLS-0$
									'\twidth: 400px;\n' + //$NON-NLS-0$
									'\theight: 400px;\n' + //$NON-NLS-0$
									'\tposition: absolute;\n' + //$NON-NLS-0$
									'\tleft: 50%;\n' + //$NON-NLS-0$
									'\ttop: 50%;\n' + //$NON-NLS-0$
									'\tmargin-left: -200px;\n' + //$NON-NLS-0$
									'\tmargin-top: -200px;\n' + //$NON-NLS-0$
									'\tborder-radius:5px;\n' + //$NON-NLS-0$
								'}\n\n' + //$NON-NLS-0$

								'.banner{\n' + //$NON-NLS-0$
									'\tfont-size:14px;\n' + //$NON-NLS-0$
									'\tfont-weight:bold;\n' + //$NON-NLS-0$
									'\tmargin:14px;\n' + //$NON-NLS-0$
									'\tcolor:#5b6e79;\n' + //$NON-NLS-0$
									'\ttext-align:center;\n' + //$NON-NLS-0$
									'\tmargin-top:50px;\n' + //$NON-NLS-0$
								'}\n\n' + //$NON-NLS-0$

								'.title{\n' + //$NON-NLS-0$
									'\tfont-size:20px;\n' + //$NON-NLS-0$
									'\tfont-weight:bold;\n' + //$NON-NLS-0$
									'\tmargin:10px;\n' + //$NON-NLS-0$
									'\tcolor:#5b6e79;\n' + //$NON-NLS-0$
									'\ttext-align:center;\n' + //$NON-NLS-0$
								'}\n\n' + //$NON-NLS-0$

								'.author{\n' + //$NON-NLS-0$
									'\tfont-size:14px;\n' + //$NON-NLS-0$
									'\tfont-weight:bold;\n' + //$NON-NLS-0$
									'\tmargin:10px;\n' + //$NON-NLS-0$
									'\tcolor:#5b6e79;\n' + //$NON-NLS-0$
									'\ttext-align:center;\n' + //$NON-NLS-0$
								'}\n\n' + //$NON-NLS-0$
								
								'.created{\n' + //$NON-NLS-0$
									'\tfont-size:14px;\n' + //$NON-NLS-0$
									'\tfont-weight:bold;\n' + //$NON-NLS-0$
									'\tmargin:10px;\n' + //$NON-NLS-0$
									'\tcolor:#5b6e79;\n' + //$NON-NLS-0$
									'\ttext-align:center;\n' + //$NON-NLS-0$
								'}\n\n' + //$NON-NLS-0$
								
								'.description{\n' + //$NON-NLS-0$
									'\tfont-size:14px;\n' + //$NON-NLS-0$
									'\tfont-weight:bold;\n' + //$NON-NLS-0$
						                        '\tborder-top: 1px solid #b7ddf2;\n' + //$NON-NLS-0$
									'\tmargin:10px;\n' + //$NON-NLS-0$
									'\tmargin-top:15px;\n' + //$NON-NLS-0$
									'\tpadding:15px;\n' + //$NON-NLS-0$
									'\tcolor:#5b6e79;\n' + //$NON-NLS-0$
									'\ttext-align:center;\n' + //$NON-NLS-0$
									'\twidth:275px;\n' + //$NON-NLS-0$
									'\tmargin-left:50px;\n' + //$NON-NLS-0$
									'\tmargin-right:100px;\n' + //$NON-NLS-0$
									'\tline-height:20px;\n' + //$NON-NLS-0$
								'}'; //$NON-NLS-0$
								
			this.fileClient.write( this.cssFile, content ).then(
							dojo.hitch(this, 'handleSuccess', 'css', this.pluginName ), //$NON-NLS-1$ //$NON-NLS-0$
							this.handleError);
		
		},
		
		writeHTMLContent: function(){
		
			var content = this.prepareHTMLContent();
		
			this.fileClient.write( this.htmlFile, content ).then(
							dojo.hitch(this, 'handleSuccess', 'html', this.pluginName), //$NON-NLS-1$ //$NON-NLS-0$
							this.handleError);
		},
		
		createNewFolder: function( name ){
			this.fileClient.createFolder( this.path, name ).then(
							dojo.hitch(this, 'createNewFiles'), //$NON-NLS-0$
							this.handleError);
		},
		
		createNewFiles: function( filename ){	
			
			var pluginjs = this.pluginName + '.js'; //$NON-NLS-0$
			var pluginhtml = this.pluginName + '.html'; //$NON-NLS-0$
			var plugincss = this.pluginName + '.css'; //$NON-NLS-0$
			
			this.javascriptFile = this.path + '/' + this.pluginName + '/' + pluginjs; //$NON-NLS-1$ //$NON-NLS-0$
			this.htmlFile = this.path + '/' + this.pluginName + '/' + pluginhtml; //$NON-NLS-1$ //$NON-NLS-0$
			this.cssFile = this.path + '/' + this.pluginName + '/' + plugincss; //$NON-NLS-1$ //$NON-NLS-0$

			this.fileClient.createFile( this.path + '/' + this.pluginName , pluginjs ).then( //$NON-NLS-0$
							dojo.hitch(this, 'writeJSContent'), //$NON-NLS-0$
							this.handleError);
							
			this.fileClient.createFile( this.path + '/' + this.pluginName , pluginhtml ).then( //$NON-NLS-0$
							dojo.hitch(this, 'writeHTMLContent'), //$NON-NLS-0$
							this.handleError);
							
			this.fileClient.createFile( this.path + '/' + this.pluginName , plugincss ).then( //$NON-NLS-0$
							dojo.hitch(this, 'writeCSSContent'), //$NON-NLS-0$
							this.handleError);
		},
		
		prepareHTMLContent: function(){
			var filecontent = '<!DOCTYPE html>\n' + //$NON-NLS-0$
								'<html>\n' + //$NON-NLS-0$
									'\t<head>\n' + //$NON-NLS-0$
									  '\t\t<meta charset="UTF-8"/>\n' + //$NON-NLS-0$
									  '\t\t<title>' + this.pluginName + '</title>\n' + //$NON-NLS-1$ //$NON-NLS-0$
									  '\t\t<link rel=StyleSheet href="' + this.pluginName + '.css" type="text/css"></link>\n' + //$NON-NLS-1$ //$NON-NLS-0$
									  '\t\t<script src="../../orion/plugin.js"></script>\n' + //$NON-NLS-0$
									  '\t\t<script src="' + this.pluginName + '.js"></script>\n' + //$NON-NLS-1$ //$NON-NLS-0$
									  '\t\t<script>\n' + //$NON-NLS-0$
							'\t\t</script>\n' + //$NON-NLS-0$
							'\t</head>\n' + //$NON-NLS-0$
							'\t<body>\n' + //$NON-NLS-0$
							'\t\t<div class="plugin">\n' + //$NON-NLS-0$
							'\t\t\t<div class="banner">An Eclipse Orion Plugin</div>\n' + //$NON-NLS-0$
							'\t\t\t<div class="title"> - ' + this.pluginName + ' - </div>\n' + //$NON-NLS-1$ //$NON-NLS-0$
							'\t\t\t<div class="author">Written by ' + this.pluginAuthor + '</div>\n' + //$NON-NLS-1$ //$NON-NLS-0$
							'\t\t\t<div class="created">Created 13.04.2012</div>\n' + //$NON-NLS-0$
							'\t\t\t<div class="description">' + this.pluginDescription + '</div>\n' + //$NON-NLS-1$ //$NON-NLS-0$
							'\t\t</div>\n' + //$NON-NLS-0$
							'\t</body>\n' + //$NON-NLS-0$
							'</html>'; //$NON-NLS-0$
							
			return filecontent;
		},
		
		prepareJSContent: function(){	
			var filecontent =	'/*global console eclipse CSSLint window*/\n\n' +  //$NON-NLS-0$
								'window.onload = function() {\n' + //$NON-NLS-0$
									'\tvar provider = new orion.PluginProvider();\n' + //$NON-NLS-0$
									'\tvar serviceImpl = {\n' + //$NON-NLS-0$
											'\t\trun: function(text) {\n' + //$NON-NLS-0$
												'\t\t\treturn text.split("").reverse().join("");\n' + //$NON-NLS-0$
											'\t\t}\n' + //$NON-NLS-0$
									'\t};\n' +  //$NON-NLS-0$
									'\tvar serviceProperties = {\n' +  //$NON-NLS-0$
										'\t\tname: "Reverse Text",\n' + //$NON-NLS-0$
										'\t\tkey: ["e", true, true] // Ctrl+Shift+e\n' + //$NON-NLS-0$
									'\t};\n' + //$NON-NLS-0$
									'\tprovider.registerService("orion.edit.command", serviceImpl, serviceProperties);\n' + //$NON-NLS-0$
									'\tprovider.connect();\n' + //$NON-NLS-0$
								'};'; //$NON-NLS-0$
			return filecontent;
		},
		
		createPlugin: function( item ){
			
			for( var s = 0; s < this.sectionList.length; s++ ){
				var d = this.sectionList[s].getData();	
				
				if( d.id === "Plugin Description Section" ){ //$NON-NLS-0$
				
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
			dojo.style( this.scontent, 'width', mb.w + 'px' ); //$NON-NLS-1$ //$NON-NLS-0$
			dojo.style( this.domNode.parentNode, 'overflow', 'auto' ); //$NON-NLS-1$ //$NON-NLS-0$
		}
	
	});
});