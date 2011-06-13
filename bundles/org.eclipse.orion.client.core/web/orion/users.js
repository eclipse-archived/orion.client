/*******************************************************************************
 * Copyright (c) 2009, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define */

define([], function(){

	/**
	 * Creates a new user service. A user service should be obtained from
	 * the service registry rather than calling this constructor. This constructor
	 * is intended for service registry initialization code.
	 * @class The user service keeps track of the current Orion user.
	 * @name orion.users.UserService
	 */
	function UserService(serviceRegistry) {
		this._serviceRegistry = serviceRegistry;
		this._serviceRegistration = serviceRegistry.registerService("IUsers", this);
		this._user = null;
	}
 
	UserService.prototype = /** @lends orion.users.UserService */ {
	    setUser: function(user) {
			this._user = user;
		},
	    
		getUser: function(onDone) {
			onDone(this._user);
		}
	};
	//return module exports
	return {UserService: UserService};
});