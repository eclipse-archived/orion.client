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
/*eslint-env node*/
var split = require("split");

/**
 * @param {number} maxLines
 * @returns A writeable stream that buffers the last `maxLines` lines written to it.
 */
function Tailer(maxLines) {
	maxLines = typeof maxLines === "number" && maxLines > 0 ? maxLines : 200;
	var lines = [];

	var stream = split()
		.on("data", function(line) {
			while (lines.length >= maxLines) {
				lines.shift();
			}
			lines.push(line);
		});
	/**
	 * @param {String} [enc="utf8"] The encoding to decode lines as. If <tt>null</tt>, raw Buffers are returned.
	 * @returns {String[]|Buffer[]} The lines.
	 */
	stream.getLines = function(enc) {
		enc = typeof enc === "undefined" ? "utf8" : enc;
		return enc === null ? lines : lines.map(function(buffer) {
			return buffer.toString(enc);
		});
	};
	return stream;
}

module.exports = Tailer;