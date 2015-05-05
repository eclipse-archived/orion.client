 /*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
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
'javascript/finder', 
'javascript/signatures',
'javascript/compilationUnit',  
'orion/URITemplate',
'orion/Deferred',
'doctrine' //last, exports into global
], function(Objects, Finder, Signatures, CU, URITemplate, Deferred) {
	
	/**
	 * @description Formats the hover info as markdown text
	 * @param {Object} node The AST node or {@link Definition}
	 * @returns returns
	 */
	function formatMarkdownHover(node, offsetRange) {
	    if(!node) {
	        return null;
	    }
	    try {
	        var format = Object.create(null);
	        var comment = Finder.findCommentForNode(node);
	        if(typeof node === "string") {
	           comment.value = node;
	        }
	        if(comment) {
		        var doc = doctrine.parse(comment.value, {recoverable:true, unwrap : true});
		        format.params = [];
		        format.desc = (doc.description ? doc.description : '');
		        if(doc.tags) {
		            var len = doc.tags.length;
		            for(var i = 0; i < len; i++) {
		                var tag = doc.tags[i];
		                switch(tag.title) {
		                    case 'name': {
		                        if(tag.name) {
		                          format.name = tag.name; 
		                        }
		                        break;
		                    }
		                    case 'description': {
		                        if(tag.description !== null) {
		                          format.desc = (format.desc === '' ? tag.description : format.desc+'\n'+tag.description);
		                        }
		                        break;
		                    }
		                    case 'param': {
		                        format.params.push(_convertTagType(tag.type) +
		                                  (tag.name ? '__'+tag.name+'__ ' : '') + 
		                                  (tag.description ? tag.description+'\n' : ''));
		                        break;
		                    }
		                    case 'returns': 
		                    case 'return': {
		                        format.returns = _convertTagType(tag.type) +
		                              (tag.description ? tag.description+'\n' : '');
		                         break;
		                    }
		                    case 'since': {
		                        if(tag.description) {
		                          format.since = tag.description;
		                        }
		                        break;
		                    }
		                    case 'function': {
		                        format.isfunc = true;
		                        break;
		                    }
		                    case 'constructor': {
		                        format.iscon = true;
		                        break;
		                    }
		                    case 'private': {
		                        format.isprivate = true;
		                        break; 
		                    }
	                }
		            }
		        }
	        }
	        if(comment.node && typeof(comment.node) !== 'string') {
    	        var name = Signatures.computeSignature(comment.node);
    	        var title = '###';
    	        if(format.isprivate) {
    	            title += 'private ';
    	        }
    	        if(format.iscon) {
    	            title += 'constructor ';
    	        }
    	        title += name.sig+'###';
	        }
	        var hover = '';
	        if(format.desc !== '') {
	            hover += format.desc+'\n\n';
	        }
	        if(format.params.length > 0) {
	            hover += '__Parameters:__\n\n';
	            for(i = 0; i < format.params.length; i++) {
	                hover += '>'+format.params[i] + '\n\n';
	            }
	        }
	        if(format.returns) {
	            hover += '__Returns:__\n\n>' + format.returns + '\n\n';
	        }
	        if(format.since) {
	            hover += '__Since:__\n\n>'+format.since;
	        }
	        //TODO scope this to not show when you are on a decl
	        /**var href = new URITemplate("#{,resource,params*}").expand(
	                      {
	                      resource: metadata.location, 
	                      params: {start:node.range[0], end: node.range[1]}
	                      }); //$NON-NLS-0$
	        hover += '\n\n\n  [Jump to declaration]('+href+')';*/
	    }
	    catch(e) {
	        //do nothing, show what we have
	    }
	    var result = {content: hover, title: title, type:'markdown'};
	    if (offsetRange){
	    	result.offsetStart = offsetRange[0];
	    	result.offsetEnd = offsetRange[1];
	    }
	    return result;
	}
	
	/**
	 * @description Converts the doctrine tag type to a simple form to appear in the hover
	 * @private
	 * @param {Object} tag Teh doctrine tag object
	 * @returns {String} The simple name to display for the given doctrine tag type
	 */
	function _convertTagType(type) {
	    if(!type) {
	        return '';
	    }
        switch(type.type) {
            case 'NameExpression': {
                if(type.name) {
                  return '*('+type.name+')* ';
                }
                break;
            }
            case 'RecordType': {
                return '*(Object)* ';
            }
            case 'FunctionType': {
                return '*(Function)* ';
            }
            case 'NullableType': 
            case 'NonNullableType':
            case 'OptionalType':
            case 'RestType': {
                return _convertTagType(type.expression);
            }
            case 'TypeApplication': {
                //we only want to care about the first part i.e. Object[] vs. Object.<string, etc>
                if(type.expression.name === 'Array') {
                    //we need to grab the first application
                    if(type.applications && type.applications.length > 0) {
                        var val = type.applications[0];
                        if(val.name) {
                            //simple type
                            return '*('+val.name+'[])* ';
                        } else if(val.fields && val.fields.length > 0) {
                            return _convertTagType(val.fields[0]);
                        } else {
                            //fallback to trying to format the raw value
                            return _convertTagType(val);
                        }
	                    
	                }
                }
                return _convertTagType(type.expression);
            }
            case 'UnionType': 
            case 'ArrayType': {
                if(type.elements && type.elements.length > 0) {
                    //always just take the first type
                    return _convertTagType(type.elements[0]);
                }
                break;
            }
            case 'FieldType': {
                return _convertTagType(type.value);
            }
            default: return '';
        }
	}
	
	var deferred;
	
	/**
	 * @name javascript.JavaScriptHover
	 * @description creates a new instance of the hover
	 * @constructor
	 * @public
	 * @param {javascript.ASTManager} astManager
	 * @param {javascript.ScriptResolver} resolver
	 * @since 7.0
	 */
	function JavaScriptHover(astManager, resolver, ternWorker) {
		this.astManager = astManager;
		this.resolver = resolver;
		this.ternworker = ternWorker;
		this.ternworker.addEventListener('message', function(evnt) {
			if(typeof(evnt.data) === 'object') {
				var _d = evnt.data;
				var hover = '';
				if(_d.request === 'documentation') {
					if(_d.doc) {
						hover = formatMarkdownHover(_d.doc.doc);
					}
					deferred.resolve(hover);
				} 
			}
		});
	}
	
	Objects.mixin(JavaScriptHover.prototype, /** @lends javascript.JavaScriptHover.prototype*/ {
		
		/**
		 * @description Callback from the editor to compute the hover
		 * @function
		 * @public 
		 * @memberof javascript.JavaScriptOccurrences.prototype
		 * @param {Object} editorContext The current editor context
		 * @param {Object} ctxt The current selection context
		 */
		computeHoverInfo: function computeHoverInfo(editorContext, ctxt) {
		    if(ctxt.proposal) {
		        return ctxt.proposal.hover;
		    }
		    var that = this;
		    return editorContext.getFileMetadata().then(function(meta) {
		    	if (!meta){
		    		return null;
		    	}
		        if(meta && meta.contentType.id === 'application/javascript') {
		            return that.astManager.getAST(editorContext).then(function(ast) {
        				return that._doHover(ast, ctxt, meta);
        			});
		        }
		        return editorContext.getText().then(function(text) {
		            var blocks = Finder.findScriptBlocks(text);
		            if(blocks && blocks.length > 0) {
    		            var cu = new CU(blocks, meta);
    		            if(cu.validOffset(ctxt.offset)) {
        		            return that.astManager.getAST(cu.getEditorContext()).then(function(ast) {
                				return that._doHover(ast, ctxt, meta);
                			});
            			}
        			}
        			return null;
		        });
		    });
			
		},
		
		_doHover: function _doHover(ast, ctxt, meta) {
			var node = Finder.findNode(ctxt.offset, ast, {parents:true});
		    if(node && node.type === 'Literal') {
		    	//Symantic navigation
		    	if(ctxt.offset <= node.range[0] || ctxt.offset >= node.range[1]) {
                    //be a bit more precise than finder
                    return null;
                }
                var parents = node.parents;
                var parent = parents.pop();
                var that = this;
                if(parent.type === 'ArrayExpression') {
                    parent = parents.pop();
                    if(parent.type === 'CallExpression' && parent.callee.name === 'define') {
                        var path = node.value;
	                    return that.resolver.getWorkspaceFile(path).then(function(files) {
		                    return that._formatFilesHover(path, files);
		                });
                    }
                } else if(parent.type === 'CallExpression') {
                    var path = node.value;
                    switch(parent.callee.name) {
                        case 'require': {
                            var char = path.charAt(0);
                            if(char !== '.' && char !== '/') {
                                return that.resolver.getWorkspaceFile(path).then(function(files) {
    			                    return that._formatFilesHover(path, files);
    			                });
                            }
                        }
                        //$FALLTHROUGH$
                        case 'importScripts': {
                            var path = node.value;
	                        return that.resolver.getWorkspaceFile(path).then(function(files) {
	                            if(!/\.js$/.test(path)) {
	                                path += '.js';
	                            }
	                            var rels = that.resolver.resolveRelativeFiles(path, files, meta);
	                            if(rels && rels.length > 0) {
			                        return that._formatFilesHover(node.value, rels);
			                    }
			                });
                        }
                    }
                }
                return null;
		    } 
			deferred = new Deferred();
			var files = [{type: 'full', name: meta.location, text: ast.source}];
			this.ternworker.postMessage({request:'documentation', args:{params:{offset: ctxt.offset}, files: files, meta:{location: meta.location}}});
			return deferred;
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
		    if(path && files) {
		        var title = null;
		        if(files.length > 1) {
		             title = '###Open file for \''+path+'\'###';
		        }
		        var hover = '';
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
		        return {title: title, content: hover, type:'markdown'};
		    }
		    return null;
		}
	});
	
	JavaScriptHover.prototype.contructor = JavaScriptHover;
	
	return {
		JavaScriptHover: JavaScriptHover,
		formatMarkdownHover: formatMarkdownHover
		};
});
