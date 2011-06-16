/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define */

define([], function() {

	/**
	 * Creates a new problem service instance. Client should obtain the service
	 * <tt>orion.core.marker</tt> from the service registry rather than instantiate
	 * this service directly.
	 * @class The problem service tracks markers and sends notification of marker changes.
	 * @name orion.problems.ProblemService
	 */
	function ProblemService(serviceRegistry) {
		this._serviceRegistry = serviceRegistry;
		this._serviceRegistration = serviceRegistry.registerService("orion.core.marker", this);
	}

	ProblemService.prototype = /** @lends orion.problems.ProblemService.prototype */ {
		// provider
		_setProblems: function(problems) {
			this.problems = problems;
			this._serviceRegistration.dispatchEvent("problemsChanged", problems);
		}	    
	};
	ProblemService.prototype.constructor = ProblemService;
	
	//return the module exports
	return {ProblemService: ProblemService};
});

