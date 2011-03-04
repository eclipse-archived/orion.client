/*******************************************************************************
 * Copyright (c) 2011 IBM Corporation and others. All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
window.onload = function() {
	var splitted = window.location.href.split('#');
	if(splitted.length > 1){
		var controller = new orion.GitStatusController(null , splitted[1] , "unstagedZone" , "stagedZone");
		controller.getGitStatus(splitted[1]);
	}
};
