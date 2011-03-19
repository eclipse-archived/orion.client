/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
dojo.addOnLoad(function(){
	// initialize service registry and EAS services
	serviceRegistry = new eclipse.ServiceRegistry();
	var commandService = new eclipse.CommandService({serviceRegistry: serviceRegistry});
	var preferenceService = new eclipse.PreferencesService(serviceRegistry, "/prefs/user");
	var searcher = new eclipse.Searcher({serviceRegistry: serviceRegistry});

	eclipse.globalCommandUtils.generateBanner("toolbar", commandService, preferenceService, searcher);
	var canvas = document.getElementById("diff-canvas");
	var compareMergeContainer = new orion.CompareMergeContainer("left-viewer" , "right-viewer" , canvas);
	var splitted = window.location.href.split('#');
	if(splitted.length > 1){
		var hash = splitted[1];
		var params = hash.split("?");
		var diffURI = null;
		var fileURI = null;
		if(params.length === 1){
			fileURI = params[0];
		} else {
			fileURI = params[1];
			diffURI = params[0];
		}
		
		compareMergeContainer.resolveDiff(diffURI, 
											  fileURI,
				  function(){
					  dojo.place(document.createTextNode("File: " + fileURI), "left-viewer-title", "only");				  
					  dojo.place(document.createTextNode("File On Git: " + fileURI), "right-viewer-title", "only");				  
				  },
				  function(errorResponse , ioArgs){
					  var message = typeof(errorResponse.message) === "string" ? errorResponse.message : ioArgs.xhr.statusText; 
					  dojo.place(document.createTextNode(message), "left-viewer-title", "only");				  
					  dojo.place(document.createTextNode(message), "right-viewer-title", "only");				  
					  dojo.style("left-viewer-title", "color", "red");
					  dojo.style("right-viewer-title", "color", "red");
				  }
		);
		
		
		/*
		//canvas.width = canvas.parentNode.clientWidth;
		//canvas.height = canvas.parentNode.clientHeight;
		
		var context = canvas.getContext("2d");
		context.fillStyle   = '#00f'; // blue
		context.strokeStyle = '#00f'; // red
		context.lineWidth   = 1;
		context.beginPath();
		context.moveTo(0 , 0);
		//context.lineTo(canvas.width -2  ,canvas.height -2);
		context.bezierCurveTo( canvas.parentNode.clientWidth/3, 2, canvas.parentNode.clientWidth -2- canvas.parentNode.clientWidth/3  ,100 -2 , canvas.parentNode.clientWidth -2  ,100 -2 );
		context.stroke();	
		*/	
		
	}
	
});


function onCanvasResize(evt){
	console.log("resize end !!!!");
}

