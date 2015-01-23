 /*******************************************************************************
 * @license
 * Copyright (c) 2014, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
/* global doctrine */
define([
'orion/objects',
'orion/URITemplate',
'webtools/util',
'csslint' //for colour object
], function(Objects, URITemplate, Util, CSSLint) {
	
	/**
	 * @name webtools.CSSHover
	 * @description creates a new instance of the hover support
	 * @constructor
	 * @public
	 * @param {Object} resolver The backing file resolver
	 * @param {Object} cssResultManager The back result manager
	 * @since 8.0
	 */
	function CSSHover(resolver, cssResultManager) {
	    this.resolver = resolver;
	    this.cssResultManager = cssResultManager;
	}
	
	Objects.mixin(CSSHover.prototype, /** @lends webtools.CSSHover.prototype*/ {
		
		/**
		 * @name computeHover
		 * @description Callback from the editor to compute the hover
		 * @function
		 * @public 
		 * @memberof webtools.CSSHover.prototype
		 * @param {Object} editorContext The current editor context
		 * @param {Object} ctxt The current selection context
		 */
		computeHoverInfo: function computeHover(editorContext, ctxt) {
			var that = this;
			return that.cssResultManager.getResult(editorContext, that._emptyRuleSet()).then(function(results) {
			    if(results) {
    			    var token = Util.findToken(ctxt.offset, results.tokens);
    				if (token){
    				    if(that.hasPreviousToken(token, results.tokens, 'IMPORT_SYM')) {
    				        return that._getFileHover(token);
    				    }
    				    if(that.hasPreviousToken(token, results.tokens, 'IDENT', 'background-image')) {
    				        return that._getImageHover(token);
    				    }
    				    var tok = that._isRgbLike(token, results.tokens);
    				    if(tok) {
    				        var color = that._collectColorId(tok, results.tokens);
    		                if(color) {
    		                    return that._getColorHover(color);    
    		                }
    				    }
    					if (CSSLint.Colors[token.value]){
    						return that._getColorHover(token.value);
    					}
    					if (/\#[0-9A-Fa-f]{1,6}/.test(token.value)){
    						return that._getColorHover(token.value);	
    					}
    				}
				}
				return null;
			});
		},
		
		_emptyRuleSet: function() {
		    var config = Object.create(null);
		    config.getRuleSet = function() {return null;};
		    return config;
		},
		
		_isColorFnName: function _isColorFnName(name) {
		    var val = name.toLowerCase();
		    return val === 'rgba(' || val === 'rgb(' || val === 'hsl(' || val === 'hsla(';
		},
 		
		_isRgbLike: function _isRgbLike(token, tokens) {
		    if(token.type === 'FUNCTION') {
		        if(this._isColorFnName(token.value.toLowerCase())) {
		            return token;
		        }
		    } 
		    var tok = this._isRgbLikeBody(token, tokens);
		    if(tok) {
		        return tok;
		    }
		    return null;
		},
		
		_isRgbLikeBody: function _isRgbLikeBody(token, tokens) {
		    if(token && tokens) {
		        for(var i = token.index; i > -1; i--) {
		            var tok = tokens[i];
		            if(tok.type === 'NUMBER' || tok.type === 'COMMA' || tok.type === 'PERCENTAGE') {
		                continue;
		            } else if(tok.type === 'FUNCTION') {
		                if(this._isColorFnName(tok.value)) {
		                    tok.index = i;
		                    return tok;
		                } else {
		                    return null;
		                }
		            } else {
		                break;
		            }
		        }
		    }
		    return null;
		},
		
		_collectColorId: function _collectColorId(token, tokens) {
		    if(token && tokens) {
		        var id = token.value;
		        var next = null;
		        var idx = token.index;
		        for(var i = idx+1; i < tokens.length; i++) {
		            next = tokens[i];
		            if(next.type === 'COMMA' || next.type === 'NUMBER' || next.type === 'PERCENTAGE') {
		                id += next.value;
		                continue;
		            }
		            if(next.type === 'RPAREN') {
		                id += next.value;
		                return id;
		            } else {
		                break;
		            }
		        }
		    }
		    return null;
		},
		
		hasPreviousToken: function hasPreviousToken(token, tokens, name, id) {
		    if(token && tokens) {
		        switch(token.type) {
		            case 'URI': 
		            case 'STRING': {
		                if(token.index > 0) {
		                    var prev = null;
		                    for(var i = token.index-1; i >= 0; i--) {
		                        prev = tokens[i];
		                        if(prev.type === 'COLON' || prev.type === 'STRING' || prev.type === 'URI' || prev.type === 'COMMA') {
		                            continue;
		                        } else {
		                            break;
		                        }
		                    }
		                    if(id && prev && prev.type === name) {
		                       return id === prev.value;
    		                } else {
    		                  return prev && prev.type === name;
    		                }
		                }
		            }
		        }
            }
            return false;
		},
		
		_getFileHover: function _getFileHover(token) {
		    var path = this._getPathFromToken(token);
		    if(path) {
    	        if(/^http/i.test(path)) {
    	            return this._formatFilesHover(path);
    	        } else {
        	        var that = this;
        	        return that.resolver.getWorkspaceFile(path, {ext:'css', type:'CSS', icon:'../webtools/images/css.png'}).then(function(files) {
        		        if(files) {
        		            return that._formatFilesHover(path, files);
        		        }
        	        });
    	        }
	        }
		    return null;
		},
		
		_getPathFromToken: function _getPathFromToken(token) {
		    var path = token.value;
		    switch(token.type) {
		        case 'STRING': {
		            path = token.value.slice(1, token.value.length-1); //peel off the quotes
		            break;
		        }
		        case 'URI': {
		            var val = /^\s*(?:url)\s*\(\s*(.*)\s*\)/i.exec(token.value);
    		        if(val) {
    		            path = val[1];
    		            var c = path.charAt(0);
    		            if(c === '\'' || c === '"') {
    		                path = path.slice(1);
    		            }
    		            c = path.charAt(path.length-1);
    		            if(c === '\'' || c === '"') {
    		                path = path.slice(0, path.length-1);
    		            }
    		        } else {
    		            return null;
    		        }
		        }
		    }
		    return path;
		},
		
		/**
    	 * @description Formats the list of files as links for the hover
    	 * @function
    	 * @private
    	 * @param {String} path The path we are navigating to
    	 * @param {Array.<javascript.ScriptResolver.File>} files The array of files to linkify
    	 * @returns {String} The mardown to show in the hover
    	 */
    	_formatFilesHover: function _formatFilesHover(path, files) {
    	    if(path) {
    	        var title = '###Open file for \''+path+'\'###';
    	        var hover = '';
    	        if(Array.isArray(files)) {  
        	        for(var i = 0; i < files.length; i++) {
        	            var file = files[i];
        	            if(file.name && file.path && file.contentType) {
        	                hover += '[';
        	                if(file.contentType.icon) {
        	                    hover += '!['+file.contentType.name+']('+file.contentType.icon+')';
        	                }
        	                var href = new URITemplate("#{,resource,params*}").expand(
        		                      {
        		                      resource: file.location, 
        		                      params: {}
        		                      }); //$NON-NLS-0$
        	                hover += file.name + ']('+href+') - '+file.path+'\n\n';
        	            }
        	            
        	        }
    	        } else {
    	            var name = path.slice(path.lastIndexOf('/')+1);
    	            title = '###Open file for \''+name+'\'###';
	                hover += '[!['+name+'](../webtools/images/css.png)';
	                hover += name + ']('+path+') - '+path+'\n\n';
    	        }
    	        if(hover !== '') {
    	           return {title: title, content: hover, type:'markdown'};
    	        }
    	    }
    	    return null;
    	},
		
		_getImageHover: function _getImageHover(token) {
		      var path = this._getPathFromToken(token);
		      if(path) {
		          if(/^http/i.test(path) || /^data:image.*;base64/i.test(path)) {
    		          var html = '<html><body style="margin:1px;"><img src="'+path+'" style="width:100%;height:100%;"/></body></html>'; //$NON-NLS-0$  //$NON-NLS-1$
    			      return {type: "html", content: html, width: "100px", height: "100px"};  //$NON-NLS-0$  //$NON-NLS-1$  //$NON-NLS-2$
		          }
		      }
		},
		
		_getColorHover: function _getColorHover(colorID){
			var html = '<html><body style=\"background-color: ' + colorID + ';\"></html>'; //$NON-NLS-0$  //$NON-NLS-1$
			return {type: "html", content: html, width: "50px", height: "25px"};  //$NON-NLS-0$  //$NON-NLS-1$  //$NON-NLS-2$
		}
		
	});

	CSSHover.prototype.contructor = CSSHover;
	
	return {
		CSSHover: CSSHover
	};
});
