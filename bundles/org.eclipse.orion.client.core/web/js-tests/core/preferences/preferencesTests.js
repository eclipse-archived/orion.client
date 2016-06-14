/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env browser, amd, mocha*/
/* eslint-disable missing-nls */
define([
	"chai/chai",
	"orion/Deferred",
	"mocha/mocha"
], function(chai, Deferred) {
	var assert = chai.assert;

	function saveStorage(storage) {
		storage = storage || localStorage;
		var stash = [], i, len, key;
		for (i = 0, len = storage.length; i < len; i++) {
			key = storage.key(i);
			stash.push({key:key, value:storage.getItem(key)});
		}
		return stash;
	}

	function restoreStorage(stash, storage) {
		var i, len;
		storage = storage || localStorage;
		for (i = 0, len = stash.length; i < len; i++) {
			storage.setItem(stash[i].key, stash[i].value);
		}
	}

	describe("preferences", function() {
		it("localStorage", function() {
			var stash = saveStorage();
			try {
				assert.equal(localStorage.getItem("test localStorage"), null);
				localStorage.setItem("test localStorage", true);
				assert.ok(localStorage.getItem("test localStorage"));
				assert.equal(localStorage.length, stash.length + 1);

//	These commented out tests are what I was using to figure out how null and undefined are handled
//	The answer... inconsistently so really truly use strings only.

//				storage.setItem("test localStorage", undefined);
//				assert.equal(localStorage.getItem("test localStorage"), "undefined");
//				localStorage.setItem("test localStorage", "undefined");
//				assert.equal(localStorage.getItem("test localStorage"), "undefined");
//				localStorage.setItem("test localStorage", null);
//				assert.equal(localStorage.getItem("test localStorage"), "null");
//				localStorage.setItem("test localStorage", "null");
//				assert.equal(localStorage.getItem("test localStorage"), "null");

				assert.equal(localStorage.length, stash.length + 1);
				localStorage.removeItem("test localStorage");

				assert.equal(localStorage.length, stash.length);

				localStorage.clear();
				assert.equal(localStorage.length, 0);
			} finally {
				restoreStorage(stash);
			}
		});

		describe.skip("DISABLING FOR NOW test storage eventing", function() {
			var d = new Deferred();	
			function handleStorage(evnt) {
				evnt = evnt || window.event;
				if (!evnt.key) {
					return;
				}
				console.log("key=" + evnt.key + ", oldValue=" + evnt.oldValue + ", newValue=" + evnt.newValue);
				if (evnt.newValue === null) {
					d.resolve(true);
				}
			}

			window.addEventListener("storage", handleStorage, false);

			top.localStorage.setItem("test", "test-value");
			top.localStorage.removeItem("test");
			return d;
		});
	});
});