/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global document define*/
define(['require', 'orion/plugin', 'orion/xhr', 'orion/Deferred'], function(require, PluginProvider, xhr, Deferred) {
	
	/* log provider server scope */
	var LOGAPI_SCOPE = "logs/";
	
	var headers = {
		name: "Orion Shell Log Provider Service",
		version: "1.0",
		description: "This plugin integrates access to Orion log files."
	};

	var temp = document.createElement('a');
	function createLocation(location) {
		temp.href = location;
		var absLocation = temp.href;
		if(temp.host){
			return absLocation.substring(absLocation.indexOf(temp.host)+temp.host.length);
		}
		
		return absLocation;
	}

	function callLogService(url, raw){
		var d = new Deferred();
		var handler = raw ? "text/plain" : "json";
		
		xhr("GET", url, {
			headers : {
				"Orion-Version" : "1",
				"Content-Type" : "charset=UTF-8"
			},
			timeout : 15000,
			handleAs : handler
		}).then(function(resp) {
			if(raw){ d.resolve(resp.responseText); }
			else { d.resolve(JSON.parse(resp.responseText)); }
		}, function(error){
			d.reject(error);
		});
		
		return d;
	}

	var provider = new PluginProvider(headers);
	var printAppenders = {
		name: "logs",
		description: "Prints all file-based appenders in the current logger context.",
		returnType: "string",
		parameters: [{
			name: "metadata",
			type: "boolean",
			description: "Prints file-appender metadata in JSON format."
		}, {
			name: "appenderName",
			type: "string",
			description: "The file-appender name which should be displayed.",
			defaultValue: ""
		}]
	};
	
	var printAppendersImpl = {
		callback: function(args) {
			var deferred = new Deferred();
			
			//TODO: Workaround, see bug 413230
			if(args.appenderName === ""){
				callLogService(createLocation(require.toUrl(LOGAPI_SCOPE))).then(function(resp){
					deferred.resolve(JSON.stringify(resp, undefined, 2));
				}, function(error){
					deferred.reject(error);
				});
			} else {
				if(args.metadata){
					callLogService(createLocation(require.toUrl(LOGAPI_SCOPE))).then(function(resp){
						
						var found = false;
						for(var i=0; i<resp.Children.length; ++i){
							var appender = resp.Children[i];
							if(appender.Name === args.appenderName){
								found = true;
							
								callLogService(appender.Location).then(function(response){
									deferred.resolve(JSON.stringify(response, undefined, 2));
								}, function(error){
									deferred.reject(error);
								});
								
								break;
							}
						}
						
						if(!found){
							deferred.reject("No appender named " + args.appenderName + " present in current logger context.");
						}
						
					}, function(error){
						deferred.reject(error);
					});
				} else {
					callLogService(createLocation(require.toUrl(LOGAPI_SCOPE))).then(function(resp){
					
						var found = false;
						for(var i=0; i<resp.Children.length; ++i){
							var appender = resp.Children[i];
							if(appender.Name === args.appenderName){
								found = true;
								
								callLogService(appender.DownloadLocation, true).then(function(response){
									deferred.resolve(response);
								}, function(error){
									deferred.reject(error);
								});
								
								break;
							}
						}
						
						if(!found){
							deferred.reject("No appender named " + args.appenderName + " present in current logger context.");
						}
						
					}, function(error){
						deferred.reject(error);
					});
				}
			}

			return deferred;
	   }
 	};
 	
	provider.registerServiceProvider("orion.shell.command", printAppendersImpl, printAppenders);
	provider.connect();
});