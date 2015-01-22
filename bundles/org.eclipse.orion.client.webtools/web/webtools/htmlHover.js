 /*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
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
	 * @description creates a new instance of the hover support
	 * @constructor
	 * @public
	 * @param {Object} htmlAstManager The shared AST manager for HTML DOMs
	 * @param {Object} resolver The shared script resolver
	 * @since 8.0
	 */
	function HTMLHover(htmlAstManager, resolver) {
	    this.htmlAstManager = htmlAstManager;
	    this.resolver = resolver;
	}
	
	Objects.mixin(HTMLHover.prototype, /** @lends webtools.HTMLHover.prototype*/ {
		
		/**
		 * @description Callback from the editor to compute the hover
		 * @function
		 * @public 
		 * @memberof webtools.HTMLHover.prototype
		 * @param {Object} editorContext The current editor context
		 * @param {Object} ctxt The current selection context
		 * @callback
		 */
		computeHoverInfo: function computeHover(editorContext, ctxt) {
			var that = this;
			return that.htmlAstManager.getAST(editorContext).then(function(ast) {
			    if(ast) {
			        return editorContext.getLineAtOffset(ctxt.offset).then(function(line) {
			            if(line > -1) {
			                return editorContext.getLineStart(line).then(function(start) {
			                    if(start > -1) {
			                        var col = ctxt.offset - start;
			                        return editorContext.getLineStart(line+1).then(function(end){
			                        	// TODO Hack to get around the lack of ranges and not show hover when user is at end of line, could also regex for end of line whitespace
			                        	end -= 3; // 2 for \r\n, 1 for second last position
			                        	if (ctxt.offset < end){
					                        // Visit the AST and find the node at line + col
					                        var node = that._findNode(ast, line+1, col, ast[0]);
					                        if(node && node.type === 'tag' && node.attributes) { //$NON-NLS-0$
//				                            	var opts = {ext:'htm', type:'HTML', icon:'../webtools/images/html.png'};
//												var opts = {ext: 'js', type:'JavaScript', '../javascript/images/javascript.pn'}
												var opts = {};  // Defaults to JS
					                            switch (node.name) {
					                            	case 'link': //$NON-NLS-0$
					                            		// TODO Link nodes don't include the attributes for unknown reason
//					                            		return that._getFileHover(node.attributes.href, opts);
					                                case 'script': //$NON-NLS-0$
//					                                	return that._getFileHover(node.attributes.src, opts);
					                            }
					                            
					                        }
					                	}
			                        });
			                    }
			                });
			            }
			            return null;
			        });
			    }
			    return null; 
			});
		},

        /**
		 * Returns the DOM node corresponding to the line and column number 
		 * or null if no such node could be found.
		 */
		_findNode: function(dom, line, col, last) {
			//recursively walk the dom looking for a body element
			var node = null;
			for (var i = 0; i < dom.length; i++) {
			    node = dom[i];
                var loc = node.location;
                if (loc.line === line){
                	if (!node.children){
                		return node;
                	}
                	if (loc.col > col){
                		return last;
                	}
                }
				if (node.children) {
					var result = this._findNode(node.children, line, col, node);
					if (result) {
						return result;
					}
				}
			}
			return null;
		},
		
		_getFileHover: function _getFileHover(path, opts) {
		    if(path) {
		        var that = this;
		        return that.resolver.getWorkspaceFile(path, opts).then(function(files) {
    		        if(files) {
    		            return that._formatFilesHover(path, files);
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

	HTMLHover.prototype.contructor = HTMLHover;
	
	return {
		HTMLHover: HTMLHover
	};
});
