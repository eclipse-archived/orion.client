/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global require describe it setTimeout*/
var assert = require('assert');
var mocha = require('mocha');
var async = require('../lib/async');
var Deferred = require('deferred-fs').Deferred;

describe('async', function() {
	describe('#sequence', function() {
		it('calls functions in the right order', function(done) {
			var events = [0, 0, 0];
			async.sequence([
				function() {
					assert.deepEqual(events, [0, 0, 0]);
					events[0] = 1;
					var d = new Deferred();
					setTimeout(function() {
						assert.deepEqual(events, [1, 0, 0]);
						events[1] = 1;
						d.resolve();
					}, 50);
					return d;
				},
				function() {
					assert.deepEqual(events, [1, 1, 0]);
					events[2] = 1;
					return;
				},
				function() {
					assert.deepEqual(events, [1, 1, 1]);
					done();
				}
			]);
		});
		it('supplies the initialValue', function(done) {
			async.sequence([
				function(val) {
					assert.equal(val, 'zot');
					done();
				}
			], 'zot');
		});
		it('propagates result to the next function in the list', function(done) {
			async.sequence([
				function() {
					return 'hello';
				},
				function(val) {
					assert.equal(val, 'hello');
					var d = new Deferred();
					setTimeout(d.resolve.bind(null, 'world'), 50);
					return d;
				},
				function(val) {
					assert.equal(val, 'world');
					done();
				}
			]);
		});
	});
});