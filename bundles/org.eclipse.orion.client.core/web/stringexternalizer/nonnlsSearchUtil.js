/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
define(['dojo'], function(dojo){
	
	function NonNlsSearch(fileClient, root){
		this.fileClient = fileClient;
		this.root = root;
	}
	
	NonNlsSearch.prototype.getNonNls = function(){
		return this.parseDirectory(this.root);
	};
	
	NonNlsSearch.prototype.parseDirectory = function(root){
		var deferred = new dojo.Deferred();
		var self = this;
			
		this.fileClient.read(root, true).then(function(jsonData){
			dojo.hitch(self, self.parseDirectoryData)(jsonData).then(function(result){
				deferred.callback(result);
			},
			function(error) {
				deferred.errback(error);
			});
		}, function(error){
			deferred.errback(error);
		});
		
		return deferred;
	};
	
	NonNlsSearch.prototype.parseDirectoryData = function(jsonData){
		var deferred = new dojo.Deferred();
		var self = this;
		if(jsonData.Directory){
			if(jsonData.Children){
				var deferreds = [];
				for(var i=0; i<jsonData.Children.length; i++){
					var child = jsonData.Children[i];
					deferreds.push(dojo.hitch(self, self.parseDirectoryData)(child));
				}
				var deferredsList = new dojo.DeferredList(deferreds);
				deferredsList.then(function(results){
					var ret = {Children: []};
					for(var i=0; i<results.length; i++){
						if(results[i][1]){
							ret.Children = ret.Children.concat(results[i][1].Children);
						}
					}
					deferred.callback(ret);
				});
			} else {
				dojo.hitch(self, self.parseDirectory)(jsonData.ChildrenLocation).then(function(result){
					deferred.callback(result);
				},
				function(error) {
					deferred.errback(error);
				});
			}
		} else {
			if(jsonData.Name.lastIndexOf(".js")===(jsonData.Name.length-3)){
				self.fileClient.read(jsonData.Location, true).then(function(jsonData){
					self.fileClient.read(jsonData.Location, false).then(function(contents){
						jsonData.nonnls = dojo.hitch(self, self.parseFile)(contents);
						var ret;
						if(jsonData.nonnls.length>0){
							ret = {Children: [jsonData]};
						} else {
							ret = {Children: []};
						}
						deferred.callback(ret);
					});					
				});
			} else {
				deferred.callback({Children:[]});
			}
		}
		return deferred;
	};
	
	NonNlsSearch.prototype.parseFile = function(contents){
	     function getExcluded(exlRegExp){
				var ret = [];
				var match = exlRegExp.exec(contents);
				while(match){
					ret.push(match);
					match = exlRegExp.exec(contents);
				}
				return ret;
		     }
	     
		     function isInExcluded(excluded, match, offset){
				for(var i=0; i<excluded.length; i++){
					if((match.index + offset) > excluded[i].index && (match.index + offset) < (excluded[i].index + excluded[i][0].length)){
						return true;
					}
				}
				return false;
		     }

		var excluded = getExcluded(new RegExp("/\\x2a((\\x2a[^/]*)|[^*/]|[^*]/)*\\x2a/", "gm"), contents);
		excluded = excluded.concat(getExcluded(new RegExp("//.*\\r?\\n*", "gm")), contents);
		excluded = excluded.concat(getExcluded(new RegExp("define\\(\\[[^\\]]*\\]", "gm")), contents);
		excluded = excluded.concat(getExcluded(new RegExp("define\\([\"\'][^\"\']*[\"\'], *\\[[^\\]]*\\]", "gm")), contents);
		excluded = excluded.concat(getExcluded(new RegExp("messages\\[[^\\]]*\\]", "gmi")), contents);
	     
	       var nonnlsstrings = [];
	       var stringRegExp = /("(\\"|[^"])+")|('(\\'|[^'])+')/g;
	       var nonnlsRegExp = /\/\/\$NON-NLS-[0-9]+\$/g;
	       var lines = contents.split(/\r?\n/);
	       for (var i=0; i < lines.length; i++) {
	         var line = lines[i];
			var lineOffset = contents.indexOf(line);
	         var match = stringRegExp.exec(line);
	         var strings = [];
	         while (match) {
				if(!isInExcluded(excluded, match, lineOffset)){
						strings.push(match);
					}
				match = stringRegExp.exec(line);
	         }
	         if(strings.length>0){
		         var nonnls = {};
		         match = nonnlsRegExp.exec(line);
		         while(match){
					nonnls[parseInt(match[0].substring(11, match[0].length-1))] = true;
					match = nonnlsRegExp.exec(line);
		         }
		         
		         for(var j=0; j<strings.length; j++){
					if(!nonnls[j]){
						nonnlsstrings.push({
						 lineNum: i,
			             line: lines[i],
			             string: strings[j][0],
			             character: strings[j].index + 1,
			             end: strings[j].index + strings[j][0].length
			             });
					}
		         }
				}
	         }
	       return nonnlsstrings;
	};
	
	NonNlsSearch.prototype.constructor = NonNlsSearch;
	
	function compareNls(a, b){
		  if (a.character < b.character)
			     return -1;
			  if (a.character > b.character)
			    return 1;
			  return 0;
	}
	
	function addMessagesModule(contents, module){
		var match = new RegExp("define\\(\\[[^\\]]*\\],[\\s\\r\\n]*function\\(", "gm").exec(contents);
		if(!match){
			match = new RegExp("define\\([\"\'][^\"\']*[\"\'], *\\[[^\\]]*\\],[\\s\\r\\n]*function\\(", "gm").exec(contents);
		}
		if(!match || match[0].indexOf(module)>0){
			return contents;
		}
		var modules = new RegExp("\\[[^\\]]*\\]", "gm").exec(match[0]);
		if(modules[0].match(new RegExp("\\[\\s*\\]", "gm"))){
			contents = contents.replace(match[0], match[0]+"messages");
			contents = contents.replace(modules[0], modules[0][0] + "'" + module + "'" + modules[0].substring(1));			
		}else{
			contents = contents.replace(match[0], match[0]+"messages, ");
			contents = contents.replace(modules[0], modules[0][0] + "'" + module + "', " + modules[0].substring(1));
		}
		return contents;
	}
	
	function replaceNls(contents, nls, config, saveMessages){
		if(!config){
			config = {};
		}
		if(!config.messages){
			config.messages = {};
		}
		var messages;
		if(saveMessages){
			messages = config.messages;
		} else {
			messages = {};
			for(var message in config.messages){
				messages[message] = config.messages[message];
			}
		}
		var stringRegExp = /("(\\"|[^"])+")|('(\\'|[^'])+')/g;
		 var lines = contents.split(/\r?\n/);
		 var lineStructure = {};
		 for(var i=0; i<nls.length; i++){
			 var nlsitem = nls[i];
			 if(!lineStructure[nlsitem.lineNum]){
				 lineStructure[nlsitem.lineNum] = [];
			 }
			 lineStructure[nlsitem.lineNum].push(nlsitem);
		 }
		 var stringExternalized = false;
		 for(var lineNum in lineStructure){
			 lineStructure[lineNum].sort(compareNls);
			 for(var i=lineStructure[lineNum].length-1; i>=0; i--){
				 var change = lineStructure[lineNum][i];
				 var line = lines[lineNum];
				 if(change.checked){
					 stringExternalized = true;
					 var strippedString = unescapeQuotes(change.string);
					 if(messages && messages[strippedString]){
						 change.replace = "messages['" + escapeQuotes(messages[strippedString]) + "']";						 
					 } else {
						 change.replace = "messages[" + change.string + "]";
						 if(!messages) messages = {};
						 messages[strippedString] = strippedString;
					 }
					 var moveCharacters = change.replace.length - change.string.length;
					 change.newcharacter = change.character;
					 lines[lineNum] = line.substring(0, change.character-1) + change.replace + line.substring(change.end);
					 for(var j=i+1; j<lineStructure[lineNum].length; j++){
						 lineStructure[lineNum][j].newcharacter += moveCharacters;
					 }
				 } else if(config.marknls){
					 var foundStrings = line.substring(0, change.character-1).match(stringRegExp);
					 var stringNo = foundStrings ? foundStrings.length : 0;
					 change.replace = " \/\/$NON-NLS-"+stringNo+"$";
					 change.newcharacter = line.length;
					 lines[lineNum] += change.replace;
				 } else {
					 delete change.replace;
					 change.newcharacter = change.character;
				 }
			 }
		 }
		 var newlineRegExp = /\r?\n/g;
		 var ret = "";
		 try{
		 for(var i=0; i<lines.length; i++){
			 var newline = newlineRegExp.exec(contents);
			 ret+=lines[i];
			 if(newline){
				 ret+=newline[0];
			 }
		 }
		 }catch (e) {
			contents.error(e);
		}
		 if(stringExternalized && config.module){
			return addMessagesModule(ret, config.module);
		 }
		 return ret;
	}
	
	function escapeQuotes(message){
		message = message.replace(/\"/g, "\\\"");
		message = message.replace(/\'/g, "\\\'");
		return message;
	}
	
	function unescapeQuotes(message){
		message = message.substring(1, message.length-1);
		message = message.replace(/\\\"/g, "\"");
		message = message.replace(/\\\'/g, "\'");
		return message;
	}
	
	function stringify(messages){
		var ret = "{";
		var isFirst = true;
		for(var message in messages){
			if(!isFirst){
				ret+=",";
			}
			ret += "\n\t\"";
			ret += escapeQuotes(message);
			ret += "\": \"";
			ret += escapeQuotes(messages[message]);
			ret += "\"";
			isFirst = false;
		}
		ret +="\n}";
		return ret;
	}
	
	function writeMessagesFile(fileClient, config, messages){
		var deferred = new dojo.Deferred();
		var keyToMessage = {};
		for(var message in messages){
			keyToMessage[messages[message]] = message;
		}
		fileClient.read(config.fileLocation).then(function(contents){
			var match = new RegExp("define\\(\\{(.*\\r?\\n*)*\\}\\);", "gmi").exec(contents);
			if(match){
				var messagesString = match[0].substring("define(".length, match[0].length-");".length);
				contents = contents.replace(messagesString, stringify(keyToMessage));
			} else {
				contents = "define(" + stringify(keyToMessage)+");";
			}
			fileClient.write(config.fileLocation, contents).then(
					function(){
						deferred.resolve();
					},
					function(error){
						deferred.reject(error);
					});
		},function(error){
			if(error.status===404){
				function create(){
					fileClient.createFolder(config.directory.Location, "root").then(
							function(metadata){
								fileClient.createFile(metadata.Location, config.file).then(
									function(metadata){
										fileClient.write(metadata.Location, "define(" + stringify(keyToMessage)+");").then(
												function(){
													deferred.resolve();
												},
												function(error){
													deferred.reject(error);
												});
									},
									function(error){
										deferred.reject(error);
									});
								},
							function(error){deferred.reject(error);});
				}
				fileClient.read(config.directory.Location, true).then(function(metadata){
					create();
				}, function(error){
					if(error.status===404){
						fileClient.createFolder(config.directory.Parents[0].Location, config.directory.Name).then(function(metadata){
							create();
						}, function(error){
							deferred.reject(error);
						});
					}
				});

			} else {
				deferred.reject(error);
			}
		});
		return deferred;
	}
	
	return {
		NonNlsSearch: NonNlsSearch,
		replaceNls: replaceNls,
		writeMessagesFile: writeMessagesFile
	};
});