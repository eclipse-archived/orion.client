/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others. 
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit dojox widgets console define orion*/
/*jslint browser:true */

define(['dojo', 'dijit', 'dojox', 'dijit/Dialog', 'dojo/data/ItemFileReadStore', 'dojox/form/Uploader', 'dojox/form/uploader/FileList', 'dojox/form/uploader/plugins/IFrame', 'dijit/form/Button', 'dijit/ProgressBar', 'orion/widgets/_OrionDialogMixin', 'text!orion/widgets/templates/ImportDialog.html', 'dojo/io/iframe'], function(dojo, dijit, dojox) {

dojo.declare("orion.widgets.ImportDialog", [ dijit.Dialog, orion.widgets._OrionDialogMixin ], {
	widgetsInTemplate : true,

	templateString: '<div class="dijitDialog" tabindex="-1" waiRole="dialog" waiState="labelledby-${id}_title">' +
						'<div data-dojo-attach-point="titleBar" class="dijitDialogTitleBar">' +
							'<span data-dojo-attach-point="titleNode" class="dijitDialogTitle" id="${id}_title"></span>' +
							'<span data-dojo-attach-point="closeButtonNode" class="dijitDialogCloseIcon" data-dojo-attach-event="onclick:onCancel" title="${buttonCancel}">' +
								'<span data-dojo-attach-point="closeText" class="closeText" title="${buttonCancel}">x</span>' +
							'</span>' +
						'</div>' +
						'<div data-dojo-attach-point="containerNode" class="dijitDialogPaneContent">' +
							'<div class="uploadContainer" data-dojo-attach-event="dragenter:dragEnter,dragexit:dragExit,dragover:dragOver,drop:drop">' +
								'<div class="dottedOutline">' +
									'<div data-dojo-attach-point="dragArea" class="floatingSection">' +
										'<div class="uploadInstruction">Drag a File or Zip here</div>' + 
										'<div class="tipInstruction">or if you prefer</div>' + 
										'<form data-dojo-attach-point="importform" method="post" id="importDialog.myForm" enctype="multipart/form-data" >' +

										'<input class="uploadBrowser" data-dojo-attach-point="importloader" name="uploadedfile" multiple="false" type="file" id="importLoader" force="iframe" data-dojo-type="dojox.form.Uploader" style="height: 20px" label="Browse..." >' +
										'<input type="submit" label="Finish" value="OK" dojoType="dijit.form.Button" style="visibility:hidden;padding: 20 0 10 0; float: right; clear: both;"/>' +
										'</form>' +
									'</div>' +
								'</div>' +
							'</div>' +
						'</div>' + 
					'</div>',


	constructor : function() {
		this.inherited(arguments);
		this.options = arguments[0] || {};
	},

	postMixInProperties : function() {
		this.inherited(arguments);
		this.title = "Import a file or zip";
	},

	handleReadyState: function(state){	
		if( this.req.readyState === 4 ){
			this.hide();
			this.options.func();
		}
	},

	/* This upload works for the drag and dropped files */

	uploadDroppedFiles: function(file) {
		// Use native XMLHttpRequest instead of XhrGet since dojo 1.5 does not allow to send binary data as per docs
		this.req = new XMLHttpRequest();

		this.req.open('post', this.options.importLocation, true);
		this.req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		this.req.setRequestHeader("Slug", file.name);
		if (file.name.indexOf(".zip") !== file.name.length-4) {
			this.req.setRequestHeader("X-Xfer-Options", "raw");
		}
		this.req.setRequestHeader("Content-Type", file.type);
		this.req.onreadystatechange = dojo.hitch( this, 'handleReadyState' );
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

		for( var f=0; f< files.length; files++ ){
			this.uploadDroppedFiles(files[f]);
		}
	},

	dragEnter: function(evt){
		evt.stopPropagation();
		evt.preventDefault();
	},

	dragExit: function(evt){
		evt.stopPropagation();
		evt.preventDefault();
	},

	dragOver: function(evt){
		evt.stopPropagation();
		evt.preventDefault();
	},

	drop: function(evt){	
		evt.stopPropagation();
 
		var files = evt.dataTransfer.files;
		var count = files.length;
 
		if( count > 0 ){
			this.handleFiles(files);
		}
	},

	postCreate : function() {
		this.inherited(arguments);

		dojo.style( this.importloader.domNode, "left", '100px' );
		dojo.style( this.titleBar, "padding", '10px 10px 10px' );

		this.importloader.force = 'iframe';
		this.importloader.preventDefault = function(){};
		this.importloader.stopPropagation = function(){};

		this.importform.action = this.options.importLocation;
		this.importloader.url = this.options.importLocation;

		dojo.connect(this.importloader, "onChange", dojo.hitch(this, function(dataArray) {
			var uploadData = { preventDefault: function(){}, stopPropagation: function(){} };
			this.importloader.upload(uploadData);
		}));

		dojo.connect(this.importloader, "onError", dojo.hitch(this, function(dataArray) {
			setTimeout(dojo.hitch(this, function(){
				this.hide();
			}), 2000);		
		}));

		dojo.connect(this.importloader, "onComplete", dojo.hitch(this, function(dataArray) {
			setTimeout(dojo.hitch(this, function(){
				this.hide();
				this.options.func();
			}), 2000);		
		}));
		
		// Stop the dialog from submitting if trying to activate the upload button with a keyboard.
		// See https://bugs.eclipse.org/bugs/show_bug.cgi?id=370969
		
		dojo.connect(this.importloader, "onKeyPress", function(evt) {
			if(evt.keyCode === dojo.keys.ENTER) {
				evt.stopPropagation();
			}
		});
	}
});
});
