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
define([
	'orion/objects',
], function(Objects) {

    function node(key, value) {
        var n = Object.create(null);
        n._p = null;
        n._n = null;
        n._v = {key: key, value:value};
        return n;
    }

	/**
	 * @description Creates a new LRU cache with the given maximum size. If no size is given 
	 * an unbounded cache is created.
	 * 
	 * @constructor 
	 * @param {Number} size The maximum size of the LRU or -1 for an unbounded cache
	 * @returns {javascript.LRU} A new LRU instance
	 * @since 8.0
	 */
	function LRU(size) {
	    if(typeof size === 'undefined') {
	       this._max = -1;
	    } else {
	       this._max = size; 
	    }
	    this._start = this._end = null;
	    this._size = 0;
	    this._cache = Object.create(null);
	}
	
	Objects.mixin(LRU.prototype, /** @lends javascript.LRU.prototype */ {
		/**
		 * @description Clears the entire cache
		 * @function
		 */
		clear: function clear() {
		    this._cache = Object.create(null);
		    this._start = null;
		    this._end = null;
		    this._size = 0;
		},
		/**
		 * @description If the map contains the given key
		 * @function
		 * @param {String} key The key to check
		 * @returns {Boolean} If the map contains the key or not
		 */
		containsKey: function containsKey(key) {
		    return typeof this._cache[key] !== 'undefined';
		},
		/**
		 * @description Adds the given key / value pair to the map. If the addition is
		 * greater than the given maximum map size, the last entry will be removed 
		 * and the new entry added to the head of the map.
		 * 
		 * Putting a value that already exists in the map will move it to the head
		 * of the LRU discarding the existing value.
		 * 
		 * @function
		 * @param {String} key The key to map the given value to
		 * @param {*} value The value to map to the given key
		 */
		put: function put(key, value) {
		    if(this._max !== -1 && this._size+1 > this._max) {
		        //shuffle one off the end
		       this.remove(this._end._v.key);
		    }
		    this.remove(key);  //torch the existing value
		    var entry = node(key, value);
		    this._cache[key] = entry;
		    var n = this._start;
		    this._start = entry;
		    entry._n = n;
		    this._size++;
		},
		/**
		 * @description Gets the value from the map with the given key. Returns
		 * null if no mapping exists.
		 * @function
		 * @param {String} key The key to look up
		 * @returns {*} The value mapped to the given key
		 */
		get: function get(key) {
		    if(this._size > 0) {
		        var entry = this._cache[key];
		        return entry._v.value;
		    }
		    return null;
		},
 		/**
		  * @description Removes the key and mapped value from the map and returnns
		  * the removed value or null if nothign was removed.
		  * @function
		  * @param {String} key The key to remove
		  * @returns {*} The removed value or null
		  */
		 remove: function remove(key) {
 		    if(this._size === 0) {
 		        return null;
 		    }
 		    var entry = this._cache[key];
 		    if(entry) {
 		        var p = entry._p;
 		        var n = entry._n;
 		        p._n = n;
 		        if(n) {
 		            n._p = p;
 		        }
 		        delete this._cache[key];
 		        this._size--;
 		        return entry._v.value;
 		    }
 		    return null;
 		}
	});
	
	return {LRU : LRU};
});
