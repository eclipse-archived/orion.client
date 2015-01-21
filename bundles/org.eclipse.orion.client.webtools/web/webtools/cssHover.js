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
'webtools/util'
], function(Objects, URITemplate, Util) {
	
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
		
		colorValues: [
			"black", //$NON-NLS-0$
			"white", //$NON-NLS-0$
			"red", //$NON-NLS-0$
			"green", //$NON-NLS-0$
			"blue", //$NON-NLS-0$
			"magenta", //$NON-NLS-0$
			"yellow", //$NON-NLS-0$
			"cyan", //$NON-NLS-0$
			"grey", //$NON-NLS-0$
			"darkred", //$NON-NLS-0$
			"darkgreen", //$NON-NLS-0$
			"darkblue", //$NON-NLS-0$
			"darkmagenta", //$NON-NLS-0$
			"darkcyan", //$NON-NLS-0$
			"darkyellow", //$NON-NLS-0$
			"darkgray", //$NON-NLS-0$
			"lightgray" //$NON-NLS-0$
		],
		
		
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
			return that.cssResultManager.getResult(editorContext, {}).then(function(results) {
			    var token = Util.findToken(ctxt.offset, results.tokens);
				if (token){
				    if(that.hasPreviousToken(token, results.tokens, 'IMPORT_SYM')) {
				        return that._getFileHover(token);
				    }
				    if(that.hasPreviousToken(token, results.tokens, 'IDENT', 'background-image')) {
				        return that._getImageHover(token);
				    }
					if (that.colorValues.indexOf(token.value) > -1){
						return that._getColorHover(token.value);
					}
					if (/\#[0-9A-Fa-f]{1,6}/.test(token.value)){
						return that._getColorHover(token.value);	
					}
				}
				return null;
			});
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
