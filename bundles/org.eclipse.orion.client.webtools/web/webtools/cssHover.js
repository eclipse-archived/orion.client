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
], function(Objects, URITemplate) {
	
	/**
	 * @name webtools.CSSHover
	 * @description creates a new instance of the hover support
	 * @constructor
	 * @public
	 * @since 8.0
	 */
	function CSSHover(resolver) {
	    this.resolver = resolver;
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
			var result = editorContext.getText().then(function(text){
				var token = that._getToken(text, ctxt.offset);
				if (token){
				    if(that._isImport(text, ctxt.offset, token)) {
				        return that._getFileHover(token);
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
			return result;
		},

		_getToken: function _getToken(text, offset, regexp){
			var start = offset;
			var regex = regexp ? regexp : /[0-9A-Za-z\-\@\.\#\/]/;
			while (start && regex.test(text.charAt(start-1))) {
				start--;
			}
			var end = offset;
			while (end < text.length && regex.test(text.charAt(end))) {
				end++;
			}
			if (end - start){
			    var tok = Object.create(null);
			    tok.start = start;
			    tok.end = end;
			    tok.value = text.substring(start, end);
				return tok;
			}
			return null;
		},
		
		_isImport: function _isImport(text, offset, token) {
		    if(token && text && offset > -1) {
		        var tok = this._getToken(text, token.start-1, /[0-9A-Za-z\-\@\.\#\(\/]/);
		        if(tok && /url\(/ig.test(tok.value)) {
		            return true;
		        }
		        var start = token.start-1;
                if(!tok || /\s/.test(tok.value)) {
		            while(/\s/.test(text.charAt(start-1))) {
    			        start--;
    			    }
		        }
	            tok = this._getToken(text, start);
			    if(tok && /\@import/i.test(tok.value)) {
                    return true;
                }
            }
            return false;
		},
		
		_getFileHover: function _getFileHover(token) {
		    if(token) {
		        if(/^http/i.test(token.value)) {
		                 
		        }
		        var that = this;
		        return that.resolver.getWorkspaceFile(token.value, {ext:'css', type:'CSS', icon:'../webtools/images/css.png'}).then(function(files) {
    		        if(files) {
    		            return that._formatFilesHover(token.value, files);
    		        }
		        });
		    }
		    return null;
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
    	        } /*else if(typeof files === 'string') {
    	            var name = path.slice(path.lastIndexOf('/'));
    	            title = '###Open file for \''+name+'\'###';
	                hover += '[!['+name+'](../webtools/images/css.png)';
	                hover += name + ']('+path+') - '+path+'\n\n';
    	        } */
    	        if(hover !== '') {
    	           return {title: title, content: hover, type:'markdown'};
    	        }
    	    }
    	    return null;
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
