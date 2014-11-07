/*******************************************************************************
 * @license Copyright (c) 2014 IBM Corporation and others. All rights
 *          reserved. This program and the accompanying materials are made
 *          available under the terms of the Eclipse Public License v1.0
 *          (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse
 *          Distribution License v1.0
 *          (http://www.eclipse.org/org/documents/edl-v10.html).
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*eslint-env browser, amd*/

define([
	'i18n!orion/search/nls/messages',
	'orion/i18nUtil',
	'orion/explorers/explorer',
	'orion/webui/littlelib',
	'orion/explorers/navigationUtils',
	'orion/objects',
	'orion/Deferred'
], function(messages, i18nUtil, mExplorer, lib, mNavUtils, objects, Deferred) {
	
    /* Internal wrapper functions*/
    function _connect(nodeOrId, event, eventHandler) {
        var node = lib.node(nodeOrId);
        if (node) {
            node.addEventListener(event, eventHandler, false);
        }
    }

    function _place(ndoeToPlace, parent, position) {
        var parentNode = lib.node(parent);
        if (parentNode) {
            if (position === "only") { //$NON-NLS-0$
                lib.empty(parentNode);
            }
            parentNode.appendChild(ndoeToPlace);
        }
    }

    function _createElement(elementTag, classNames, id, parent) {
        var element = document.createElement(elementTag);
        if (classNames) {
            if (Array.isArray(classNames)) {
                for (var i = 0; i < classNames.length; i++) {
                    element.classList.add(classNames[i]);
                }
            } else if (typeof classNames === "string") { //$NON-NLS-0$
                element.className = classNames;
            }
        }
        if (id) {
            element.id = id;
        }
        var parentNode = lib.node(parent);
        if (parentNode) {
            parentNode.appendChild(element);
        }
        return element;
    }

    function _createSpan(classNames, id, parent, spanName) {
        var span = _createElement('span', classNames, id, parent); //$NON-NLS-0$
        if (spanName) {
            span.appendChild(document.createTextNode(spanName));
        }
        return span;
    }

	function getFullPathPref(preferences, prefName, properties) {
    	return preferences.getPreferences(prefName).then(function(prefs) { //$NON-NLS-0$
			var returnVal = [];
			properties.forEach(function(property){
				var value = prefs.get(property);
				if (value === undefined) {
					value = false;
					prefs.put(property, value); //$NON-NLS-0$
				}
		        returnVal.push(value);
			});
	        return new Deferred().resolve(returnVal);
		}, function(/*err*/){
			return new Deferred().resolve(false);
		});
	}
    
    function showFullPath(parentNode, show) {
		if (show) {
        	parentNode.classList.add("showFullPath"); //$NON-NLS-0$
        } else {
        	parentNode.classList.remove("showFullPath"); //$NON-NLS-0$
        }
    }

    function switchFullPathPref(preferences, prefName, properties) {
    	return preferences.getPreferences(prefName).then(function(prefs) { //$NON-NLS-0$
			var returnVal = [];
			properties.forEach(function(property){
				var value = !prefs.get(property);
		        prefs.put(property, value);
		        returnVal.push(value);
			});
	        return new Deferred().resolve(returnVal);
		}, function(/*err*/){
			return new Deferred().resolve();
		});
    }

	function FileDetailRenderer(options, explorer) {
		mExplorer.SelectionRenderer.call(this, options, explorer);
	}
	FileDetailRenderer.prototype = Object.create(mExplorer.SelectionRenderer.prototype);
	objects.mixin(FileDetailRenderer.prototype, {
	    // Overrides Explorer.SelectionRenderer.prototype.renderRow
	    renderRow: function(item, tableRow) {
	    	mExplorer.SelectionRenderer.prototype.renderRow.call(this, item, tableRow);
	    	if (item.type !== "file") { //$NON-NLS-0$
	    		tableRow.classList.add("searchDetailRow"); //$NON-NLS-0$
	    	}
	    },
	    getCellHeaderElement: function(/*col_no*/) {
	        return null;
	    },
	    focus: function() {
	        var resultParentDiv = lib.node(this.explorer.getParentDivId());
	        window.setTimeout(function() {
	            resultParentDiv.focus();
	        }, 10);
	    },
	    _getFileRenderName: function(item) {
	    	var renderName;
	    	if (item.totalMatches) {
	    		renderName = this.explorer.model.getFileName(item) + " (" + i18nUtil.formatMessage(messages["${0} matches"], item.totalMatches) + ")"; //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	    	} else {
	    		renderName = this.explorer.model.getFileName(item);
	    	}
	    	return renderName;
	    },
	    _getFileNameElement: function(item) {
	    	var renderName = this._getFileRenderName(item);
	    	var fileSpan = document.createElement("span"); //$NON-NLS-0$
	    	fileSpan.classList.add("fileNameSpan"); //$NON-NLS-0$
			fileSpan.appendChild(document.createTextNode(renderName));
			return fileSpan;
	    },
	    renderFileElement: function(item, spanHolder, resultModel) {
			var link = this.generateFileLink(resultModel, item);
			mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
			
			var scopeParams = resultModel.getScopingParams(item);
			var folders = decodeURIComponent(scopeParams.name).split("/"); //$NON-NLS-0$
			var parentFolder = folders.pop();
			parentFolder = parentFolder;
			
			if (0 < folders.length) {
				var fullPathSpan = document.createElement("span"); //$NON-NLS-0$
				fullPathSpan.classList.add("fullPathSpan"); //$NON-NLS-0$
				
				var fullPathText = folders.join("/"); //$NON-NLS-0$
				
				fullPathSpan.appendChild(document.createTextNode(fullPathText + "/")); //$NON-NLS-0$
				link.appendChild(fullPathSpan);
				
				var ellipsisSpan = document.createElement("span"); //$NON-NLS-0$
				ellipsisSpan.classList.add("ellipsisSpan"); //$NON-NLS-0$
				ellipsisSpan.appendChild(document.createTextNode(".../")); //$NON-NLS-0$
				link.appendChild(ellipsisSpan);
			}
					
			// create a direct parent folder span and prepend to link		
			var parentSpan = document.createElement("span"); //$NON-NLS-0$
			parentSpan.classList.add("fileParentSpan"); //$NON-NLS-0$
			parentSpan.appendChild(document.createTextNode(parentFolder + "/")); //$NON-NLS-0$
			link.appendChild(parentSpan);
					
			var fileSpan = this._getFileNameElement(item);
			link.appendChild(fileSpan);
	
			//trigger a click on the span when the link is clicked to set the selection cursor
			link.addEventListener("click", function(){ //$NON-NLS-0$
				spanHolder.click();
			});
	
			// append link to parent span
	        spanHolder.appendChild(link);
	        spanHolder.classList.add("filePathSpan"); //$NON-NLS-0$
	    },
	    _generateDetailSegments: function(detailModel) {
	        var detailInfo = this.explorer.model.getDetailInfo(detailModel);
	        var startIndex = 0;
	        var segments = [];
	        for (var i = 0; i < detailInfo.matches.length; i++) {
	            if (startIndex >= detailInfo.lineString.length) {
					break;
	            }
	            if (this.enableCheckbox(detailModel)) {
	                if (i !== detailInfo.matchNumber) {
	                    continue;
	                }
	            }
	            if (startIndex !== detailInfo.matches[i].startIndex) {
	                segments.push({name: detailInfo.lineString.substring(startIndex, detailInfo.matches[i].startIndex), startIndex: startIndex, bold: false, highlight: false});
	            }
	            var  gap = detailInfo.matches[i].length;
	            segments.push({name: detailInfo.lineString.substring(detailInfo.matches[i].startIndex, detailInfo.matches[i].startIndex + gap), startIndex: detailInfo.matches[i].startIndex, bold: true, highlight: false});
	            startIndex = detailInfo.matches[i].startIndex + gap;
	            if (this.enableCheckbox(detailModel)) {
	                break;
	            }
	        }
	        if (startIndex < (detailInfo.lineString.length - 1)) {
	            segments.push({name: detailInfo.lineString.substring(startIndex), startIndex: startIndex, bold: false, highlight: false});
	        }
	        return segments;
	    },
	    _mergesingleSegment: function(segments, range) {
			var newSegments = [];
			
			segments.forEach(function(segment) {
				var startIndex = segment.startIndex;
				var endIndex = segment.startIndex + segment.name.length;
				if(range.start > startIndex && range.end < endIndex){
					newSegments.push({name: segment.name.substring(0, range.start - startIndex), startIndex: segment.startIndex, bold: segment.bold, highlight: false});
					newSegments.push({name: segment.name.substring(range.start - startIndex, range.end - startIndex), startIndex: range.start, bold: segment.bold, highlight: true});
					newSegments.push({name: segment.name.substring(range.end - startIndex), startIndex: range.end, bold: segment.bold, highlight: false});
				} else if(range.start > startIndex && range.start < endIndex){
					newSegments.push({name: segment.name.substring(0, range.start - startIndex), startIndex: segment.startIndex, bold: segment.bold, highlight: false});
					newSegments.push({name: segment.name.substring(range.start - startIndex), startIndex: range.start, bold: segment.bold, highlight: true});
				} else if( startIndex >= range.start && endIndex <= range.end) {
					segment.highlight = true;
					newSegments.push(segment);
				} else if(range.end > startIndex && range.end < endIndex){
					newSegments.push({name: segment.name.substring(0, range.end - startIndex), startIndex: segment.startIndex, bold: segment.bold, highlight: true});
					newSegments.push({name: segment.name.substring(range.end - startIndex), startIndex: range.end, bold: segment.bold, highlight: false});
				} else {
					newSegments.push(segment);
				}
			}.bind(this));
			return newSegments;
	    },
	   	_renderSegments: function(segments, parentSpan) {
			segments.forEach(function(segment) {
				if(segment.bold){
					var matchSegBold = _createElement('b', null, null, parentSpan); //$NON-NLS-0$
					if(segment.highlight) {
						matchSegBold.classList.add("search-filter-text");
					}
					_place(document.createTextNode(segment.name), matchSegBold, "only"); //$NON-NLS-0$				
				} else {
					var matchSpan = _createElement('span', null, null, parentSpan); //$NON-NLS-0$
					if(segment.highlight) {
						matchSpan.classList.add("search-filter-text");
					}
		           _place(document.createTextNode(segment.name), matchSpan, "only"); //$NON-NLS-0$
				}
			}.bind(this));
	    },
	    generateDetailHighlight: function(detailModel, parentSpan) {
	        var segments = this._generateDetailSegments(detailModel);
	        this._renderSegments(segments, parentSpan);
	    },
	    renderDetailElement: function(item, spanHolder) {
			this.generateDetailDecorator(item, spanHolder);
	        var linkSpan = this.getDetailElement(item, spanHolder);
	        this.generateDetailHighlight(item, linkSpan);
	    },
	    renderDetailLineNumber: function(item, spanHolder) {
			var detailInfo = this.explorer.model.getDetailInfo(item);
			var lineNumber = detailInfo.lineNumber + 1;
	        if (!this.enableCheckbox(item) || detailInfo.matches.length <= 1) {
	            _place(document.createTextNode(lineNumber + ":"), spanHolder, "last"); //$NON-NLS-1$ //$NON-NLS-0$
	        } else {
				var matchNumber = detailInfo.matchNumber + 1;
	            _place(document.createTextNode(lineNumber + "(" + matchNumber + "):"), spanHolder, "last"); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
	        }
	    },
	    getDetailElement: function(item, spanHolder) {
	    	var link = this.generateDetailLink(item);
	        spanHolder.appendChild(link);
	        link.classList.add("searchDetailLink"); //$NON-NLS-0$
	       
	       	mNavUtils.addNavGrid(this.explorer.getNavDict(), item, link);
	       	//trigger a click on the span when the link is clicked to set the selection cursor
	       	_connect(link, "click", function() { //$NON-NLS-0$
	       		spanHolder.click();
	        });
	        
	        var span = _createElement('span', null, null, link); //$NON-NLS-0$
	        return span;
	    },
	    enableCheckbox: function(item) {
	    	return (typeof this.explorer.model.enableCheckbox === "function" && this.explorer.model.enableCheckbox(item)); //$NON-NLS-0$
	    },
	    generateDetailDecorator: function(/*item, col*/) {
	    },
	   	getCellElement: function(col_no, item, tableRow) {
	        var col = null;
	        var span;
	        switch (col_no) {
	            case 0:
	                if (item.type === "file") { //$NON-NLS-0$
	                	col = _createElement('td'); //$NON-NLS-0$
	                    col.noWrap = true;
						span = _createSpan(null, this.getFileIconId ? this.getFileIconId(item) : null, col, null);                    
						this._lastFileIconDom = span;
	                    
	                    if(typeof this.explorer.model.disableExpand === "function" && this.explorer.model.disableExpand(item)){ //$NON-NLS-0$
	                        //var decorateImage = _createSpan(null, null, col, null);
	                        //decorateImage.classList.add('imageSprite'); //$NON-NLS-0$
	                        //decorateImage.classList.add('core-sprite-file'); //$NON-NLS-0$
	                    } else {
	                        this.getExpandImage(tableRow, span); //$NON-NLS-0$
	                    }
	                } else {
	                	if (typeof this.explorer.model.enableCheckbox === "function" && this.explorer.model.enableCheckbox(item)) { //$NON-NLS-0$
	                		col = mExplorer.ExplorerRenderer.prototype.getCheckboxColumn.call(this, item, tableRow);
	                	} else {
	                		col = _createElement('td'); //$NON-NLS-0$
	                		span = _createSpan(null, null, col, null);
	                		this.renderDetailLineNumber(item, span);
	                	}
	                }
	                break;
	            case 1:
					col = _createElement('td'); //$NON-NLS-0$
	                if (item.type === "file") { //$NON-NLS-0$
	                	span = _createSpan(null, this.getFileSpanId(item), col, null);
	                    this.renderFileElement(item, span, this.explorer.model);
	                    
	                    //render file location
	                    if (item.parentLocation) {
							var scopeParams = this.explorer.model.getScopingParams(item);
							tableRow.title = decodeURI(scopeParams.name + "/" + item.name); //$NON-NLS-0$
	                    }
	                } else {
	                	if (this.enableCheckbox(item)) {
	                		this.renderDetailLineNumber(item, col);
	                	}
	                    this.renderDetailElement(item, col);
	                }
	                break;
				case 20: //TODO fix look and feel, re-enable
					if (item.type === "file") { //$NON-NLS-0$
						col = _createElement('td'); //$NON-NLS-0$
	                    var button = _createElement("button", ["imageSprite", "core-sprite-delete", "dismissButton", "deleteSearchRowButton"], null, col); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
						button.title = messages["Remove from search results"]; //$NON-NLS-0$
	                    button.addEventListener("click", function(){ //$NON-NLS-0$
	                    //TODO fix behavior in replace preview mode
	                    	var model = this.explorer.model;
	                    	model.removeChild(item.parent, item);
	                    	this.explorer.getNavHandler().refreshModel(this.explorer.getNavDict(), model, model.children);
	            			this.explorer.getNavHandler().cursorOn(null, true);
	            			tableRow.parentNode.removeChild(tableRow);
	            			
	            			if (item.children) {
	            				item.children.forEach(function(child){
		            				var childRow = this.explorer.getRow(child);
		            				childRow.parentNode.removeChild(childRow);
		            			}, this);
	            			}
	            			
	            			//TODO update match count, maybe...
	                    }.bind(this));
	                }
					break;
	        }
	        
	        return col;
	    },
	    //This is an optional function for explorerNavHandler. It provides the div with the "href" attribute.
	    //The explorerNavHandler hooked up by the explorer will check if the href exist as the attribute and react on enter key press.
	    getRowActionElement: function(tableRowId) {
	        return lib.node(this.getItemLinkId(tableRowId));
	    },
	    getFileSpanId: function(item) {
	        return this.explorer.model.getId(item) + "_fileSpan"; //$NON-NLS-0$
	    },
	    getFileIconId: function(item) {
	        return this.explorer.model.getId(item) + "_fileIcon"; //$NON-NLS-0$
	    },
	    getItemLinkId: function(itemOrId) {
	        if (typeof itemOrId === "string") { //$NON-NLS-0$
	            return itemOrId + "_itemLink"; //$NON-NLS-0$
	        }
	        return this.explorer.model.getId(itemOrId) + "_itemLink"; //$NON-NLS-0$
	    },
	    getPrimColumnStyle: function(item) {
	        if(item && item.type === "file") { //$NON-NLS-0$
	        	return "search_primaryColumn"; //$NON-NLS-0$
	        } else {
	        	return  "search_primaryColumn_Details"; //$NON-NLS-0$
	        }
	    },
	    getSecondaryColumnStyle: function() {
	        return "search_secondaryColumn"; //$NON-NLS-0$
	    }
	});
	
	return {
		FileDetailRenderer: FileDetailRenderer,
		switchFullPathPref: switchFullPathPref,
		getFullPathPref: getFullPathPref,
		showFullPath: showFullPath
	};

});
