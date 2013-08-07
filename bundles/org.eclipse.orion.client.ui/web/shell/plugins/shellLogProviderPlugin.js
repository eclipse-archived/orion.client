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
define(['require', 'orion/plugin', 'orion/xhr', 'orion/Deferred', 'orion/i18nUtil'],
 function(require, PluginProvider, xhr, Deferred, i18nUtil) {
	
	/* log provider server scope */
	var LOG_API_SCOPE = "logs/";
	
	var headers = {
		name: "Orion Log Provider Service",
		version: "1.0",
		description: "This plugin provides shell access to Orion log provider service."
	};

	var temp = document.createElement('a');
	function createLocation(location) {
		temp.href = location;
		var absLocation = temp.href;
		if(temp.host){
			return absLocation.substring(absLocation.indexOf(temp.host) + temp.host.length);
		}
		
		return absLocation;
	}
	
	var temp2 = document.createElement('a');
	function toAbsoluteLocation(location) {
		temp2.href = location;
		var absLocation = temp2.href;
		return absLocation;
	}
	
	/* used to generate absolute download links */
	function qualifyURL(location){
		return toAbsoluteLocation(createLocation(require.toUrl(location)));
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
	
	/* register base command */
	provider.registerServiceProvider(
        "orion.shell.command", null, {
        name: "logs",
        description: "Commands for accessing Orion logs."
    });
    
	/* downloads appender active log-file */
	var logsDownloadImpl = {
		callback: function(args){			
			var deferred = new Deferred();
			var appenderName = args['appender-name'];

			callLogService(createLocation(require.toUrl(LOG_API_SCOPE))).then(function(resp){
				if(resp.Children.length === 0){
					var errorMessage = i18nUtil.formatMessage("ERROR: No file appenders were found in the current logger context.",
						resp.Children.length);
							
					deferred.reject(errorMessage);
					return; // failed
				}
				
				if(resp.Children.length === 1){
					var child = resp.Children[0];
					if(appenderName && appenderName !== child.Name){
						/* user is looking for a different appender then the default one */
						var errorMessage = i18nUtil.formatMessage("ERROR: No file appender named ${0} found in the current logger context.",
							appenderName);
							
						deferred.reject(errorMessage);
						return; // failed
					}
					
					/* provide the default one */
					deferred.resolve(qualifyURL(child.DownloadLocation));
					return; // success
				}
				
				/* multiple appenders in context */
					
				if(!appenderName){
					/* there's no default appender, fail */
					var errorMessage = i18nUtil.formatMessage("ERROR: Found ${0} file appenders in the current logger context. " +
						"Could not determine which appender to use by default.", resp.Children.length);
					
					deferred.reject(errorMessage);
					return; // failed
				}
					
				for(var i=0; i<resp.Children.length; ++i){
					var child = resp.Children[i];
					if(child.Name === appenderName){
						deferred.resolve(qualifyURL(child.DownloadLocation));
						return; // success
					}
				}
				
				/* no suitable appender could be found */
				var errorMessage = i18nUtil.formatMessage("ERROR: No file appender named ${0} found in the current logger context.",
					appenderName);
							
				deferred.reject(errorMessage);
				return; // failed
					
			}, function(error){
				deferred.reject("Error: " + error);
			});
		
			return deferred;
		}
	};

	/* downloads appender active log-file */	
	var logsDownload = {
		name: "logs download",
		description: "Provides an active log-file download link for the given appender. If none provided, the default appender will be used.",
		returnType: "string",
		parameters: [{
			name: "appender-name",
			type: "string",
			description: "Appedner name which active log-file download link should be provided.",
			defaultValue: null
		}]
	};

	provider.registerServiceProvider("orion.shell.command",
		logsDownloadImpl, logsDownload);
		
	function getAppenderJSON(appenderName){
		var deferred = new Deferred();
		callLogService(createLocation(require.toUrl(LOG_API_SCOPE))).then(function(resp){
				
			if(resp.Children.length === 0){
				var errorMessage = i18nUtil.formatMessage("ERROR: No file appenders were found in the current logger context.",
					resp.Children.length);
						
				deferred.reject(errorMessage);
				return; // failed
			}
			
			var appender = undefined;
			
			/* there's only one appender, provide metada */
			if(resp.Children.length === 1){
				var child = resp.Children[0];
				
				/* provide the default one */
				appender = child;
			}
				
			/* get appender metadata */
			for(var i=0; i<resp.Children.length; ++i){
				var child = resp.Children[i];
				if(child.Name === appenderName){
					appender = child;
				}
			}
			
			if(appender){
				callLogService(appender.Location).then(function(response){
					deferred.resolve(response);
				}, function(error){
					deferred.reject("ERROR: " + error);
				});
				return;
			}
					
			/* no suitable appender could be found */
			var errorMessage = i18nUtil.formatMessage("ERROR: No file appender named ${0} found in the current logger context.",
				appenderName);
								
			deferred.reject(errorMessage);
			return; // failed
			
		}, function(error){
			deferred.reject("Error: " + error);
		});
			
		return deferred;
	}
	
	/* determines whether the given variable is a JSON or not */
	function _isJSON(object){
		return object !== null && typeof object === 'object';
	}
	
	/* appenders the text with tab symbols for pretty print */
	function _appendTabs(text, k){
		if(k === 0){ return text; }
		else { return "\t" + _appendTabs(text, k - 1); }
	}
	
	/* used for better JSON responses representation */
	function prettyPrint(json, tabs){
		var result = "";
		
		for (var property in json) {
		    var value = json[property];
		    
		    if(value === undefined) {
				continue;
		    }
		    
		    if(_isJSON(value)){ result += prettyPrint(value, tabs + 1); }
		    else { result += _appendTabs(property + " : " + value + "\n", tabs); }
		}
		
		return result;
	}
		
	/* shows appenders in current logger context */
    var logsShowImpl = {
		callback: function(args){
			var deferred = new Deferred();
			var appenderName = args['appender-name'];
			
			if(!appenderName){
				/* list all appender names */
				callLogService(createLocation(require.toUrl(LOG_API_SCOPE))).then(function(resp){
					var names = [];
					for(var i=0; i<resp.Children.length; ++i){
						var child = resp.Children[i];
						names.push(child.Name);
					}
					
					deferred.resolve(names.join("\n"));
				}, function(error){
					deferred.reject("ERROR: " + error);
				});
				
				return deferred;
			}
			
			getAppenderJSON(appenderName).then(function(appender){
				/* spare the user appender log-file history at this point */
				appender.ArchivedLogFiles = undefined;
				deferred.resolve(prettyPrint(appender, 0));
			}, function(errorMessage){
				/* pass error message */
				deferred.reject(errorMessage);
			});
			
			return deferred;
		}
    };
    
    /* shows appenders in current logger context */
	var logsShow = {
		name: "logs show",
		description: "Provides metadata for the given appender. If none provided, lists all file-based appender names in the current logger context.",
		returnType: "string",
		parameters: [{
			name: "appender-name",
			type: "string",
			description: "Appedner name which metadata should be provided.",
			defaultValue: null
		}]
	};
	
	provider.registerServiceProvider("orion.shell.command",
		logsShowImpl, logsShow);
		
	/* shows appender history */
    var logsHistoryImpl = {
		callback: function(args){
			var deferred = new Deferred();
			var appenderName = args['appender-name'];
			
			 getAppenderJSON(appenderName).then(function(appender){

				if(!appender.ArchivedLogFiles){
					var errorMessage = i18nUtil.formatMessage("ERROR: ${0} does not support log-file history access.",
						appenderName);
							
					deferred.reject(errorMessage);
					return; // failed
				}
				
				if(appender.ArchivedLogFiles.length === 0){
					var errorMessage = i18nUtil.formatMessage("ERROR: ${0} has no log-file history.",
						appenderName);
							
					deferred.reject(errorMessage);
					return; // failed
				}

				var names = [];
				for(var i=0; i<appender.ArchivedLogFiles.length; ++i){
					var log = appender.ArchivedLogFiles[i];
					names.push(log.Name + " : " + qualifyURL(log.DownloadLocation));
				}
				
				deferred.resolve(names.join("\n"));
				
			 }, function(errorMessage){
				/* pass error message */
				deferred.reject(errorMessage);
			 });
			
			return deferred;
		}
	};
	
	/* shows appender history */
    var logsHistory = {
		name: "logs history",
		description: "Provides a list of archived log-file download links for the given appender.",
		returnType: "string",
		parameters: [{
			name: "appender-name",
			type: "string",
			description: "Appedner name which archived log-file download links should be provided."
		}]
    };
    
    provider.registerServiceProvider("orion.shell.command",
		logsHistoryImpl, logsHistory);
	
	provider.connect();
});