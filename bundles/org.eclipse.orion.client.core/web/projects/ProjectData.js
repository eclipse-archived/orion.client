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
/*global orion window console define localStorage*/
/*jslint browser:true*/

define(['i18n!orion/settings/nls/messages', 'require' ], 
	
	function(messages, require) {

		function ProjectData( name, date, path, type, description, client ){
			
			this.name = name;
			this.date = date;
			this.path = path;
			this.type = type;
			this.description = description;
			this.client = client;
		}
		
		var name;
		var date;
		var path;
		var type;
		var description;
		var client;
		
		ProjectData.prototype.type = type;
		ProjectData.prototype.path = path;
		ProjectData.prototype.date = date;
		ProjectData.prototype.name = name;
		ProjectData.prototype.description = description;
		ProjectData.prototype.client = client;
		
		ProjectData.prototype.constructor = ProjectData;
		
		return{
			ProjectData:ProjectData
		};
	}
);