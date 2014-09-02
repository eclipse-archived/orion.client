/*******************************************************************************
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env mocha, node*/
var assert = require("assert"),
    util = require("util"),
    streamtailer = require("../lib/streamtailer"),
    stream = require("stream"),
    Readable = stream.Readable;

function later(fn) {
	setTimeout(fn, 25);
}

describe("StreamTailer", function() {
	it("#getLines", function(done) {
		var s1 = new Readable();
		s1.push("line 0\nline 1\nli");
		s1.push("ne 2");
		s1.push(null);

		var tailer = streamtailer(2);
		s1.pipe(tailer);
		later(function() {
			var lines = tailer.getLines();
			assert.deepEqual(lines, ["line 1", "line 2"]);
			done();
		});
	});
	it("#getLines multiple sources", function(done) {
		var s1 = new Readable(), s2 = new Readable();
		var tailer = streamtailer(5);
		s1.push("line 0\nlin");
		s2.push("e 1\nline 2");
		s1.push(null);
		s2.push(null);
		s1.pipe(tailer);
		s2.pipe(tailer);
		later(function() {
			var lines = tailer.getLines();
			assert.equal(lines[0], "line 0");
			assert.equal(lines[1], "line 1");
			assert.equal(lines[2], "line 2");
			done();
		});
	});
});