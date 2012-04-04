/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

/*global define*/
// TEMPORARY
// likely to be removed in 0.5 (once Safari 5.1.4+ is support in current IOS versions)
// Please do not add to this file without talking to @skaegi
define(function() {
	if (!Function.prototype.bind) {
		Function.prototype.bind = function(context) {
			var fn = this,
				fixed = Array.prototype.slice.call(arguments, 1);
			if (fixed.length) {
				return function() {
					return arguments.length ? fn.apply(context, fixed.concat(Array.prototype.slice.call(arguments))) : fn.apply(context, fixed);
				};
			}
			return function() {
				return arguments.length ? fn.apply(context, arguments) : fn.call(context);
			};
		};
	}
});