/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
var eclipse = eclipse || {};

eclipse.ProblemService = function() {
	this._listeners = [];
};

eclipse.ProblemService.prototype = {
	// provider
	_setProblems: function(problems) {
		this.problems = problems;
		for (var i = 0; i < this._listeners.length; i++) {
			this._listeners[i](problems);
		}
	},
	
	addEventListener: function(callback) {
		this._listeners.push(callback);
		if (this.problems) {
			callback(this.problems);
		}
	}	    
};


