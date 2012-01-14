/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global define console */

define(function(){
	function Literal(text) {
		this._text = text;
	}

	Literal.prototype = {
		expand: function(vars) {
			return encodeURI(this._text);
		}
	};
	
	var operator = {};
	operator.NUL = {first:"", sep:",", named: false, ifemp: "", allow: "U"};
	operator["+"] = {first:"", sep:",", named: false, ifemp: "", allow: "U+R"};
	operator["."] = {first:".", sep:",", named: false, ifemp: "", allow: "U"};
	operator["/"] = {first:"/", sep:"/", named: false, ifemp: "", allow: "U"};
	operator[";"] = {first:";", sep:";", named: true, ifemp: "", allow: "U"};
	operator["?"] = {first:"?", sep:"&", named: true, ifemp: "=", allow: "U"};
	operator["&"] = {first:"&", sep:"&", named: true, ifemp: "=", allow: "U"};
	operator["#"] = {first:"#", sep:",", named: false, ifemp: "", allow: "U+R"};



	var VARSPEC_REGEXP = /^((?:(?:[a-zA-Z0-9_])|(?:%[0-9A-F][0-9A-F]))(?:(?:[a-zA-Z0-9_.])|(?:%[0-9A-F][0-9A-F]))*)(?:(\*)|:([0-9]+))?$/;

	function parseVarSpecs(text) {
		var result = [];
		var rawSpecs = text.split(",");
		for (var i=0; i < rawSpecs.length; i++) {
			var match = rawSpecs[i].match(VARSPEC_REGEXP);
			if (match === null) {
				throw new Error("Bad VarSpec: " + text);
			}
			result.push({
				name: match[1], 
				explode: !!match[2], 
				prefix: match[3] ? parseInt(match[3], 10) : -1
			}); 
		}
		return result;
	}
	
	function Expression(text) {
		if (text.length === 0) {
			throw new Error("Invalid Expression: 0 length expression");
		}
		
		this._operator = operator[text[0]];
		if (this._operator) {
			text = text.substring(1);
		} else {
			this._operator = operator.NUL;
		}
		
		this._varSpecList = parseVarSpecs(text);
	}
	
	Expression.prototype = {
		expand: function(params) {
			var result = [];
			for (var i=0; i < this._varSpecList.length; i++) {
				var name = this._varSpecList[i].name;

				var value = expandVarSpecValue();
				if (value !== null) {
					var resultText = result.length === 0 ? this._operator.first: this._operator.sep;
					
					if (this._operator.named) {
						resultText += encodeURI(name);
						var resultValue = 
					}
				}
			}
			return result.join("");
		}
	};

	function parseTemplate(text) {
		var result = [];
		var current = 0;
		
		var curlyStartIndex = text.indexOf("{", current);
		while (curlyStartIndex !== -1) {
			result.push(new Literal(text.substring(current, curlyStartIndex)));
			var curlyEndIndex = text.indexOf("}", curlyStartIndex + 1);
			if (curlyEndIndex === -1) {
				throw new Error("Invalid template: " + text);
			}
			result.push(new Literal(text.substring(curlyStartIndex + 1, curlyEndIndex)));
			current = curlyEndIndex + 1;
			curlyStartIndex = text.indexOf("{", current);			
		}
		result.push(new Literal(text.substring(current)));
		return result;
	}

	function URITemplate(template) {
		this._templateComponents = parseTemplate(template);
	}
	
	URITemplate.prototype = {
		expand: function(vars) {
			var result = [];
			for (var i = 0; i < this._templateComponents.length; i++) {
				result.push(this._templateComponents[i].expand(vars));
			}
			return result.join("");
		}
	};

	return URITemplate;
});