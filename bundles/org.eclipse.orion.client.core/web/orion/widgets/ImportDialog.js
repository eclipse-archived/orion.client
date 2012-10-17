/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit dojox widgets console define orion*/
/*jslint browser:true */

define(['i18n!orion/widgets/nls/messages', 'dojo', 'dijit', 'dojox', 'dijit/Dialog', 'dojo/data/ItemFileReadStore', 'dojox/form/Uploader', 'dojox/form/uploader/FileList', 'dojox/form/uploader/plugins/IFrame', 'dijit/form/Button', 'dijit/ProgressBar', 'orion/widgets/_OrionDialogMixin', 'text!orion/widgets/templates/ImportDialog.html', 'dojo/io/iframe'], function(messages, dojo, dijit, dojox) {

dojo.declare("orion.widgets.ImportDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], { //$NON-NLS-0$
	widgetsInTemplate : true,

	templateString: '<div class="dijitDialog" tabindex="-1" waiRole="dialog" waiState="labelledby-${id}_title">' + //$NON-NLS-0$
						'<div data-dojo-attach-point="titleBar" class="dijitDialogTitleBar">' + //$NON-NLS-0$
							'<span data-dojo-attach-point="titleNode" class="dijitDialogTitle" id="${id}_title"></span>' + //$NON-NLS-0$
							'<span data-dojo-attach-point="closeButtonNode" class="dijitDialogCloseIcon" data-dojo-attach-event="onclick:onCancel" title="${buttonCancel}">' + //$NON-NLS-0$
								'<span data-dojo-attach-point="closeText" class="closeText" title="${buttonCancel}">x</span>' + //$NON-NLS-0$
							'</span>' + //$NON-NLS-0$
						'</div>' + //$NON-NLS-0$
						'<div ondragover="event.preventDefault()" data-dojo-attach-point="containerNode" class="dijitDialogPaneContent">' + //$NON-NLS-0$
							'<div class="uploadContainer" data-dojo-attach-event="drop:drop,dragenter:dragEnter,dragexit:dragExit,dragover:dragOver">' + //$NON-NLS-0$
								'<div class="dottedOutline">' + //$NON-NLS-0$
									'<div data-dojo-attach-point="dragArea" class="floatingSection">' + //$NON-NLS-0$
										'<div class="uploadInstruction">'+messages['Drag a file here']+  //$NON-NLS-0$
										'</div>' +//$NON-NLS-0$
										'<div class="uploadOptions">(' +  //$NON-NLS-0$
										'<input style="height: 20px;" class="uploadOptionsItem" dojoAttachPoint="unzipCheckbox" id="${id}_unzipCheckbox" dojoType="dijit.form.CheckBox" checked="true" type="checkbox">' + //$NON-NLS-0$
										'<label style="line-height: 20px;" class="uploadOptionsItem" dojoAttachPoint="unzipCheckboxLabel" for="${id}_unzipCheckbox">'+messages['unzip zips']+'</label>' + //$NON-NLS-1$ //$NON-NLS-0$
										')</div>'  + //$NON-NLS-0$
										'<div class="tipInstruction">'+messages['or if you prefer']+'</div>' +  //$NON-NLS-1$ //$NON-NLS-0$
										'<form data-dojo-attach-point="importform" method="post" id="importDialog.myForm" enctype="multipart/form-data" >' + //$NON-NLS-0$
										'<input class="uploadBrowser" data-dojo-attach-point="importloader" name="uploadedfile" multiple="false" type="file" id="importLoader" force="iframe" data-dojo-type="dojox.form.Uploader" style="height: 20px" label="'+messages['Browse...']+'" >' + //$NON-NLS-2$ //$NON-NLS-0$
										'<input type="submit" label="Finish" value="OK" dojoType="dijit.form.Button" style="visibility:hidden;padding: 20 0 10 0; float: right; clear: both;"/>' + //$NON-NLS-0$
										'</form>' + //$NON-NLS-0$
										
									'</div>' + //$NON-NLS-0$
								'</div>' + //$NON-NLS-0$
								'<div>' + //$NON-NLS-0$
							'</div>' + //$NON-NLS-0$
						'</div>' +  //$NON-NLS-0$
					'</div>', //$NON-NLS-0$


	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},

	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = messages['Import a file or zip'];
	},

	handleReadyState: function(state){	
		if( this.req.readyState === 4 ){
			this.hide();
			this.options.func();
		}
	},

	/* This upload works for the drag and dropped files */

	uploadDroppedFiles: function(file, unzip) {
		// Use native XMLHttpRequest instead of XhrGet since dojo 1.5 does not allow to send binary data as per docs
		this.req = new XMLHttpRequest();

		this.req.open('post', this.options.importLocation, true); //$NON-NLS-0$
		this.req.setRequestHeader("X-Requested-With", "XMLHttpRequest"); //$NON-NLS-1$ //$NON-NLS-0$
		this.req.setRequestHeader("Slug", file.name); //$NON-NLS-0$
		if (!unzip) {
			this.req.setRequestHeader("X-Xfer-Options", "raw"); //$NON-NLS-1$ //$NON-NLS-0$
		}
		this.req.setRequestHeader("Content-Type", file.type); //$NON-NLS-0$
		this.req.onreadystatechange = dojo.hitch( this, 'handleReadyState' ); //$NON-NLS-0$
		this.req.send(file);
	},

	/* upload from form input */

	upload: function(files){

		if(files){
			var uploadData = { preventDefault: function(){}, stopPropagation: function(){} };	
			uploadData.fileList = files;
			this.importloader.upload(files);
		}		
	},

	handleFiles: function(files){

		this.importloader.form[0].files = files;
		var checkboxState = this.unzipCheckbox.get('checked'); //$NON-NLS-0$)
		for( var i=0; i< files.length; i++ ){
			this.uploadDroppedFiles(files[i], checkboxState && (files[i].name.indexOf(".zip") === files[i].name.length-4)); //$NON-NLS-0$)
		}
	},

	dragEnter: function(evt){
		return false;
	},

	dragExit: function(evt){
		return false;
	},

	dragOver: function(evt){
		return false;
	},

	drop: function(evt){
		evt.preventDefault();
		evt.stopPropagation();
 
		var files = evt.dataTransfer.files;
		var count = files.length;
 
		if( count > 0 ){
			this.handleFiles(files);
		}
	},

	postCreate : function() {
		this.inherited(arguments);

		dojo.style( this.importloader.domNode, "left", '100px' ); //$NON-NLS-1$ //$NON-NLS-0$
		dojo.style( this.titleBar, "padding", '10px 10px 10px' ); //$NON-NLS-1$ //$NON-NLS-0$

		this.importloader.force = 'iframe'; //$NON-NLS-0$
		this.importloader.preventDefault = function(){};
		this.importloader.stopPropagation = function(){};

		this.importform.action = this.options.importLocation;
		this.importloader.url = this.options.importLocation;

		dojo.connect(this.importloader, "onChange", dojo.hitch(this, function(dataArray) { //$NON-NLS-0$
			var uploadData = { preventDefault: function(){}, stopPropagation: function(){} };
			this.importloader.upload(uploadData);
		}));

		dojo.connect(this.importloader, "onError", dojo.hitch(this, function(dataArray) { //$NON-NLS-0$
			setTimeout(dojo.hitch(this, function(){
				this.hide();
			}), 2000);		
		}));

		dojo.connect(this.importloader, "onComplete", dojo.hitch(this, function(dataArray) { //$NON-NLS-0$
			setTimeout(dojo.hitch(this, function(){
				this.hide();
				this.options.func();
			}), 2000);		
		}));
		
		// Stop the dialog from submitting if trying to activate the upload button with a keyboard.
		// See https://bugs.eclipse.org/bugs/show_bug.cgi?id=370969
		
		dojo.connect(this.importloader, "onKeyPress", function(evt) { //$NON-NLS-0$
			if(evt.keyCode === dojo.keys.ENTER) {
				evt.stopPropagation();
			}
		});
	}
});
});
