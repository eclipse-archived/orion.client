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
/* eslint-env amd */
define([
'javascript/lru',
'javascript/compilationUnit'
], function(LRU, CU) {

	var _cache = new LRU(10);
	var inputChanged = null;

	/**
	 * @description fetches or creates a compilation unit for the given information
	 * @param {Array.<object>} sourceblocks The blocks of source
	 * @param {Object} metadata The file metadata
	 * @param {orion.editor.EditorContext} editorContext The editor context
	 * @returns {javascript.CompilationUnit} The compilation unit for the given information
	 */
	function getCompilationUnit(sourceblocks, metadata, editorContext) {
		var cu = _cache.get(metadata.location);
		if(cu) {
			return cu;
		}
		cu = new CU(sourceblocks, metadata, editorContext);
		_cache.put(metadata.location, cu);
		return cu;
	}

	/**
	 * Callback from the orion.edit.model service
	 * @param {Object} event An <tt>orion.edit.model</tt> event.
	 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
	 */
	function onModelChanging(evnt) {
	    if(inputChanged) {
	        //TODO haxxor, eat the first model changing event which immediately follows
	        //input changed
	        inputChanged = null;
	    } else {
	        _cache.remove(_getKey(evnt.file));
	    }
	}

	/**
	 * Returns the key to use when caching
	 * @param {Object} metadata The file infos
	 * @since 8.0
	 */
	function _getKey(metadata) {
      if(!metadata || !metadata.location) {
          return 'unknown'; //$NON-NLS-1$
      }
      return metadata.location;
	}

	/**
	 * Callback from the orion.edit.model service
	 * @param {Object} event An <tt>orion.edit.model</tt> event.
	 * @see https://wiki.eclipse.org/Orion/Documentation/Developer_Guide/Plugging_into_the_editor#orion.edit.model
	 */
	function onInputChanged(evnt) {
	    inputChanged = evnt;
	}

	return {
		getCompilationUnit: getCompilationUnit,
		onModelChanging: onModelChanging,
		onInputChanged: onInputChanged
	};
});