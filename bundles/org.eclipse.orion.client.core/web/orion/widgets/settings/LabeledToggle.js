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

define(['require', 'dojo', 'dijit', 'orion/util', 'orion/commands'], function(require, dojo, dijit, mUtil, mCommands) {

	dojo.declare("orion.widgets.settings.LabeledToggle",[dijit._Widget, dijit._Templated],{
	
		state: false,
		
		templateString: '<div>' + 
							'<label style="display:table;">' +
								'<span data-dojo-attach-point="mylabel" style="display:table-cell; vertical-align:middle;" >Label:</span>' + 
								'<span style="display:table-cell; vertical-align:middle;">' +
								'<span class="toggleShell">' +
									'<div data-dojo-attach-point="leftToggle" data-dojo-attach-event="onclick:toggle"></div><div data-dojo-attach-point="rightToggle" data-dojo-attach-event="onclick:toggle"></div>' +
									'<div data-dojo-attach-point="toggleSlide" class="toggleSlide"></div>' +
								'</span>' +
								'</span>' +
//								'<div data-dojo-attach-point="toggleOff" class="toggleOff"></div>' +
							'</label>' + 
						'</div>',
						
		onAction: function(){
						
		},
		
		styleSwitch: function(){
			if( this.state === true ){
				this.leftToggle.innerHTML = this.toggleOnState;
				this.rightToggle.innerHTML = this.toggleOffSwitch;
          
				dojo.addClass( this.leftToggle, 'toggleOn' );
				dojo.addClass( this.rightToggle, 'toggleOff' );
		
            }else{
				this.leftToggle.innerHTML = this.toggleOnSwitch;
				this.rightToggle.innerHTML = this.toggleOffState;
	
				dojo.addClass( this.leftToggle, 'toggleOff' );
				dojo.addClass( this.rightToggle, 'toggleOn' );	
            }
		},
		
		toggle: function(){
		
			dojo.removeClass( this.leftToggle );
			dojo.removeClass( this.rightToggle );
			
			if( this.state === true ){
				this.state = false;
				
			}else{
				this.state = true;
				
				this.onAction();
			}
			
			this.styleSwitch();
		},
        
        postCreate: function(){
        
            this.inherited( arguments );
        
			this.mylabel.innerHTML = this.fieldlabel + ':';
        
			this.styleSwitch();
//            dojo.style( this.myfield, 'width', '20px' );
        }, 
        
        startup: function(){
        
        }
    });
});