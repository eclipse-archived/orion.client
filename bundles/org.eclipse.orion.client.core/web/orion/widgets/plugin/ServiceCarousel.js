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
/*global dojo dijit widgets console define*/
/*jslint browser:true*/

define(['require', 'dojo', 'dijit', 'orion/util', 'dijit/TooltipDialog', 'dojo/fx'], function(require, dojo, dijit, mUtil) {
	
	dojo.declare("orion.widgets.plugin.ServiceCarousel", [dijit._Widget, dijit._Templated], {
	
		serviceState: false,
		pointer: 0,
		box: null,
		
		closedIcon: "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAwAAAANCAYAAACdKY9CAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9wCCQ46FewKfYYAAAF4SURBVCjPbZEvyFNhGMV/590ciANhjNs2nC66osHiJ8b9cdVgN4uKyWbRaDGZBIvwYRB2723WBUEEy5igYeZxYQzd7t2x7IUFn/bAOec55zxK05TxeEyWZZds3wEeAXeBP8An4I3tr5PJZJemKQLIsiyxfQ6c8f95V1XVw+l0utdsNrsInEsaA5akE6Btx/3Vfr9/HiTdOIIBKMsS29gGOCU/bTQanWD7QVQry1Lz+ZzFYsFutyOEgCQkGbhg+1Zd0vRIkG2KomC5XLJarej3+3S7XUII8dJZHehIihaQxHq9ZrvdUhQFzWaTdrvNEXO1DvwCrkSjh8OBJEnodrv0ej1arVZMD/CjLumj7SexoSRJGAwGdDodarVaBFqSbH9WlmU3gS9RHSCEgG1iw8fW/gLXAvDd9gfbhBAIIThmOf4hZnux2Wx+CyDP88tVVb2XdC9mOVUHXo9Go8eSCFmWMRwOC+A+cBt4C/y0/c32S+C6pGeSyPOcfyAyt4A7QPcNAAAAAElFTkSuQmCC",
		openIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAMCAYAAAC5tzfZAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9wCCQ46NddkXU4AAAFuSURBVCjPXZG/q9NwFMU/5yYQOhVKoF1SDK9OOjl1URxcQl+G5/LgLeJf4K7wRjdBxMXRxcFR6TfZ3e3iUGe3DKXYQSEk10GjwbPdy+X8uEdVVVEUBVVVJcBt4MrdHwI3gG/u/lHSO3f/vNlsfoQQEEBd19O+799IunR3JAHg7gxw92Bmj4uiaLTdbifAe0nnkvDfl+IfxvMnSUUs6Q5wLom+7+m6TmMFSYrjeFjcdfd7MfBozLjb7WiaBjPD3ZlOp6zXa8VxPNh9YsCDgdTMmM/nHI9H9vs9TdOQpilRFI3cct+A7+PgWZaxXC5JkoQsy8jznP/w04Aw2JNEFEXkec5isWC1WjGZTIZvDrk+KIRwC/jyJzQAfd9zOByYzWZ/s42wNklfgZejXtzMSNMUMxsrALx1952G46qqnrr7tZklQ8EjhRZ40XXddVmWrdV1jSROp9Nz4MzdL4BX7h6A18ClpJtt2z4ry7INIfAL982ks01Z8EgAAAAASUVORK5CYII=",
	
		templateString:'<div class="plugin-service-item" tabindex="-1"><div class="serviceContainerClosed" data-dojo-attach-point="serviceLabel" data-dojo-attach-event="onclick:showServices,onkeypress:onServiceClick" tabindex="0" role="button" aria-pressed="false">Services</div>' +
					   '<div class="serviceRailsHidden" data-dojo-attach-point="rails"  data-dojo-attach-event="onmouseenter:showButtons,onmouseleave:hideButtons,onfocus:showButtons,onblur:hideButtons, onkeypress:handleKeypress" tabindex="0" role="group">' +
		                  '<div class="leftButtonArea" data-dojo-attach-point="leftbutton" role="presentation">' +
		                    '<span class="carouselControl" data-dojo-attach-event="onclick:slideLeft">&lt;</span>' +
		                  '</div>' +
		                  '<div class="listContainer" data-dojo-attach-point="listContainer" role="presentation">' +
							'<ul class="serviceList" data-dojo-attach-point="testlist"></ul>' +
		                  '</div>' +
		                  '<div class="rightButtonArea" data-dojo-attach-point="rightbutton" role="presentation">' + 
							'<span class="carouselControl" data-dojo-attach-event="onclick:slideRight">&gt;</span>' + 
		                  '</div>' +
		               '</div></div>',
		
		constructor: function() {
			this.inherited(arguments);
		},
		
		postCreate: function(){
			var railsBox = dojo.marginBox( this.domNode.parentNode );
			this.addData( this.serviceData );
			this.serviceLabel.innerHTML = "Services [" + this.serviceData.length +"]";
			dojo.style( this.domNode, "width", railsBox.w - 63 + 'px' );
		},
		
		show: function(){
			dojo.removeClass( this.rails, "serviceRailsHidden" );
			dojo.addClass( this.rails, "serviceRailsVisible" );
			dojo.removeClass( this.serviceLabel, "serviceContainerClosed" );
			dojo.addClass( this.serviceLabel, "serviceContainerOpen" );
			this.serviceState = true; 
		},
		
		hide: function(){
			dojo.removeClass( this.serviceLabel, "serviceContainerOpen" );
			dojo.addClass( this.serviceLabel, "serviceContainerClosed" );
			dojo.removeClass( this.rails, "serviceRailsVisible" );
			dojo.addClass( this.rails, "serviceRailsHidden" );
			this.serviceState = false; 
		},
		
		showServices: function(){
			if( this.serviceState === false ){

				this.show();
				
				if( this.box ){
					dojo.marginBox( this.rails, this.box );
				}else{
					this.box = dojo.marginBox( this.rails );
				}
				
			}else{
				dojo.marginBox( this.rails, { h:0 } );
				this.hide();
			}
		},
		
		onServiceClick: function(evt){
			if( evt.keyCode === dojo.keys.ENTER || evt.charCode === dojo.keys.SPACE ) {
				this.showServices();
				if( this.serviceState === false ){
					dojo.attr(evt.target, "aria-pressed", "true");
				}else{
					dojo.attr(evt.target, "aria-pressed", "false");
				}
				evt.preventDefault();
			}
		},
		
		showButtons: function(){
			
			
			if(	this.serviceData.length > 1 && this.pointer > 0 ){
				dojo.style( this.leftbutton, "visibility", "visible" );
			}else{
				dojo.style( this.leftbutton, "visibility", "hidden" );
			}
			
			if( this.serviceData.length > 1 && this.pointer < this.serviceData.length -1 ){
				dojo.style( this.rightbutton, "visibility", "visible" );
			}else{
				dojo.style( this.rightbutton, "visibility", "hidden" );
			}

			var sze = dojo.marginBox( this.rails );
	
			var buttonSize = dojo.marginBox( this.leftbutton.firstChild );
			var buttonTop = Math.round(sze.h/2) - Math.round( buttonSize.h ) + 'px';
			
			dojo.style( this.leftbutton.firstChild, "top", buttonTop );
			dojo.style( this.rightbutton.firstChild, "top", buttonTop ); 
			
		},
		
		hideButtons:function(){
			dojo.style( this.leftbutton, "visibility", "hidden" );
			dojo.style( this.rightbutton, "visibility", "hidden" );
		},
		
		slideRight: function(){

			this.box = dojo.marginBox( this.rails );
		
			if( this.pointer < this.serviceData.length -1 ){
		
				this.pointer = this.pointer+1;
		
				for( var count=0; count < this.pointer; count++ ){
					dojo.style( this.listContainer.childNodes[0].childNodes[count], "display", "none" );
				};
			
				dojo.marginBox( this.rails, this.box );
			}
			
			this.showButtons();
		},
		
		slideLeft: function(){
		
			this.box = dojo.marginBox( this.rails );
		
			if( this.pointer > 0 ){
				this.pointer = this.pointer-1;
				dojo.style( this.listContainer.childNodes[0].childNodes[this.pointer], "display", "" );
			}
			
			this.showButtons();
			
			dojo.marginBox( this.rails, this.box );
		},
		
		consoleOutput: function( debugData ){
			console.log( 'Service: ' + debugData.title + ' Element: ' +  debugData.item + ':'  );
			console.log( debugData.value );
		},
		
		createServiceTable: function(data, location){

			var listItem = dojo.create( "li", {"class":"serviceData"}, location);
			
			var entry = dojo.create( "div", { "class":"listEntry" }, listItem);
           
			var tableContainer = dojo.create( "div", { "class":"tablecontainer" }, entry);
			var table = dojo.create( "table", {"class":"serviceTable"}, tableContainer );
			dojo.place('<thead><tr><th scope="col" id="...">Item</th><th scope="col" id="...">Value</th></tr></thead>', table); 
			dojo.place('<tfoot><tr><td></td></tr></tfoot>', table); 
			var tablebody = dojo.create( "tbody", null, table);
	    
			var itemCount;

			for( itemCount=0;itemCount<data.items.length;itemCount++ ){
				var row = dojo.create( "tr", null, tablebody);
				dojo.create("td", {'innerHTML':data.items[itemCount].item}, row);
				
				var value = data.items[itemCount].value;
				
				var cell = dojo.create("td", null, row);
				
				if( typeof value === 'object' ){
				
					var debugData = { title:data.service, item:data.items[itemCount].item, value: value };

					dojo.create("span", { 'class':'objectLink', 'title':'click here, then check javascript console to drill down', 'onclick': dojo.hitch( this, 'consoleOutput', debugData ), 'innerHTML':'JavaScript Object' }, cell );
				}else{
					row.innerHTML = value;
				}
			}
			
			dojo.create( "div", { "innerHTML":data.service, "class":"listTitle" }, entry );
		},
          
		addData: function(services){

			var itemCount;

			for( itemCount=0;itemCount<services.length;itemCount++ ){
				this.createServiceTable( services[itemCount], this.testlist );
			}
		},
		
		handleKeypress: function(evt) {
			if( evt.keyCode === dojo.keys.LEFT_ARROW && dojo.style(this.leftbutton, "visibility") !== "hidden" ) {
				this.slideLeft();
			}
			else if( evt.keyCode === dojo.keys.RIGHT_ARROW && dojo.style(this.rightbutton, "visibility") !== "hidden" ) {
				this.slideRight();
			}
		},
		
		startup: function(){
			this.inherited(arguments);
		}
	});
});