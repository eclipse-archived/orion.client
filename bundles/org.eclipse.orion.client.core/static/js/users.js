/*******************************************************************************
 * Copyright (c) 2009, 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/
 
/**
 * User Service
 * @class Service for keeping track of the user
 */
eclipse.UserService = function(serviceRegistry) {
	this._serviceRegistry = serviceRegistry;
	this._serviceRegistration = serviceRegistry.registerService("IUsers", this);
	this._user = null;
};
 
eclipse.UserService.prototype = {
    setUser: function(user) {
   		this._user = user;
	},
    
	getUser: function(onDone) {
   		onDone(this._user);
	}
};