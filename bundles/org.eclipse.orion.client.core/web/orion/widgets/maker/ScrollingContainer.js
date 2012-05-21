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

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/fileClient', 'orion/PageUtil', 'dijit/TooltipDialog', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/plugin/PluginList', 'orion/widgets/settings/InputBuilder'], function(require, dojo, dijit, mUtil, mCommands, mFileClient, PageUtil) {

	dojo.declare("orion.widgets.maker.ScrollingContainer", [dijit._Widget, dijit._Templated], { //$NON-NLS-0$
	
		templateString:	'<div>' +  //$NON-NLS-0$
							'<div data-dojo-attach-point="scontent" class="scrollcontent">' +  //$NON-NLS-0$
								'<div data-dojo-attach-point="sections" style="padding-bottom:200px;"></div>' + //$NON-NLS-0$
							'</div>' +  //$NON-NLS-0$
						'</div>', //$NON-NLS-0$
						
		scrolling: false,	
		offset: null,
		travel: null,
		selectedNode: null,
		sectionCount: 0,
		lastScroll: 0,
		sectionList: null,
		
		postCreate: function(){
			
			var bar = dojo.byId( 'pageToolbar' );	 //$NON-NLS-0$
			dojo.style( bar, 'borderBottom', '2px solid whitesmoke' ); //$NON-NLS-1$ //$NON-NLS-0$
			
			var actions = dojo.byId( 'pageActions' ); //$NON-NLS-0$
			
			this.sectionNavigation = dojo.create( 'div', null, actions ); //$NON-NLS-0$
		
			this.sectionList = [];
			
			this.fileClient = new mFileClient.FileClient(this.serviceRegistry);	
			
			dojo.style( this.domNode.parentNode, 'background', 'white' ); //$NON-NLS-1$ //$NON-NLS-0$
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

        complete: function(name){
			window.location.hash = name;
			this.scrolling = false;
        },
        
        rate: function(score){

			var rate = Math.max(Math.abs(Math.round(score/ 3)), 1200);
			return rate;
        },
        
        fourthRoot: function(n){
			return n*n*n*n;
        },
        
        roll: function(name, time){
        
            var ease = ( new Date().getTime() ) - time;
            var decrement = 2;      
            var constant = 0.5;
            
            if( ease >= this.value ){
            
                window.clearInterval( this.interval );
                this.complete( name );
                
            }else{
            
				var rate = ease / this.value;
                ease = decrement * rate;
                
                if( ease < 1 ){
					ease = constant * this.fourthRoot(ease);
                }else{
					ease -= decrement;
                    ease = -constant * ( this.fourthRoot(ease) - decrement );
                }
                
                this.lastScroll = this.offset + this.travel * ease;
                
                console.log( 'POINT: ' + this.lastScroll ); //$NON-NLS-0$
                
				dojo.byId( 'centerPane' ).scrollTop = this.lastScroll; //$NON-NLS-0$
            }
        },
        
        smooth: function( name ){
			var date = new Date().getTime();   
			this.interval = window.setInterval( dojo.hitch( this, 'roll', name, date ), 15 ); //$NON-NLS-0$
        },
		
		adjust: function( node ){
			dojo.removeClass( this.selectedNode, 'smiSelected' ); //$NON-NLS-0$
			this.selectedNode = node;
			dojo.addClass( this.selectedNode, 'smiSelected' ); //$NON-NLS-0$
        },
		
		position: function(element){	
			var coordinate = { x: 0, y: 0 };		
			if( element !== null ){
                coordinate.x += element.offsetLeft;
				coordinate.y += element.offsetTop;
                element = element.offsetParent;
            }
            return coordinate;
		},
						
		scrollTo: function(event){
			
			this.scrolling = true;
			
			try{
				var targetName = event.currentTarget.href.split("#")[1]; //$NON-NLS-0$
				var targetNode = dojo.byId( targetName );
				this.offset = this.lastScroll;
				this.travel = this.position( targetNode ).y - this.offset;
				this.value = this.rate( this.travel );
				this.smooth( targetName );
				this.adjust( event.currentTarget );			
			}catch(e){
				console.error(e);
				return true;
			}
		},
		
		createMenuItem: function( name, count ){
		
			var content = { 'class':'scrollmenuitem',  //$NON-NLS-1$ //$NON-NLS-0$
							'href': '#' + name,  //$NON-NLS-1$ //$NON-NLS-0$
							'data-dojo-attach-point':name,  //$NON-NLS-0$
							'onclick': dojo.hitch( this, 'scrollTo' ), //$NON-NLS-1$ //$NON-NLS-0$
							'innerHTML': name }; //$NON-NLS-0$
			
			var menuItem = dojo.create( 'a', content ); //$NON-NLS-0$
			
			if( !this.selectedNode ){
				this.selectedNode = menuItem;			
				dojo.addClass( this.selectedNode, 'smiSelected' ); //$NON-NLS-0$
			}
			
			var listItem = dojo.create( 'li' ); //$NON-NLS-0$
			
			listItem.appendChild( menuItem );
			
			var counter = dojo.create( 'div', { innerHTML: count, 'class':'itemcount' }, listItem ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			
			var actions = dojo.byId( 'pageActions' ); //$NON-NLS-0$
		
			dojo.byId( this.toolbarID ).appendChild( listItem );
			
			return menuItem;
		},
		
		/* This will need a ScrolingContainerSection object */
		
		addSection: function(section){
			this.sectionList.push(section);
			this.sectionCount = this.sectionCount +1;
			section.setOrder( this.sectionCount );
			var menuItem = this.createMenuItem( section.title, this.sectionCount );
			this.sections.appendChild( section.domNode );
			section.startup();
			
			return menuItem;
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