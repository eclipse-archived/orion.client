/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
window.onload = function() {
	var sBSCompareContainerEditor = new orion.SBSCompareContainer("left-viewer" , "right-viewer");
	var splitted = window.location.href.split('#');
	if(splitted.length > 1){
		var leftTH = document.getElementById("left-viewer-title");
		var rightTH = document.getElementById("right-viewer-title");
		leftTH.innerHTML = "File  : " + splitted[1];
		rightTH.innerHTML = "File On Git : " + splitted[1];
		sBSCompareContainerEditor.resolveDiff(splitted[1], 
				  function(){
					var leftTH = document.getElementById("left-viewer-title");
					var rightTH = document.getElementById("right-viewer-title");
					leftTH.innerHTML = "File  : " + splitted[1];
					rightTH.innerHTML = "File On Git : " + splitted[1];
				  },
				splitted[1]);
	}
};
