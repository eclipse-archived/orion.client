/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/* Globals */
diffMock = [["--- cc1-origin.js       Wed Feb  9 10:16:06 2011\r\n" + 
		"+++ cc1-new.js  Wed Feb  9 15:39:17 2011\r\n" + 
		"@@ -1,7 +1,9 @@\r\n" + 
		"-/*******************************************************************************\r\n" + 
		"+//*******************************************************************************\r\n" + 
		"  * Copyright (c) 2010 IBM Corporation and others.\r\n" + 
		"- * All rights reserved. This program and the accompanying materials\r\n" + 
		"+ * Aall rights reserved. This program and the accompanying materials\r\n" + 
		"  * are made available under the terms of the Eclipse Public License v1.0\r\n" + 
		"+* are made available under the terms of the Eclipse Public License v1.0\r\n" + 
		"+* are made available under the terms of the Eclipse Public License v1.0\r\n" + 
		"  * which accompanies this distribution, and is available at\r\n" + 
		"  * http://www.eclipse.org/legal/epl-v10.html\r\n" + 
		"  *\r\n" + 
		"@@ -11,23 +13,24 @@\r\n" + 
		" eclipse = eclipse || {};\r\n" + 
		" eclipse.DiffParser = (function() {\r\n" + 
		"        function DiffParser(options) {\r\n" + 
		"-               this._StackDivId  = eclipse.uTestUtils.getOptionValue(options , \"stackDivId\" , eclipse.uTestConsts.RESULT_STACK_DTAILS);\r\n" + 
		"        }\r\n" + 
		"        DiffParser.prototype = {\r\n" + 
		"                parseAllLines: function(diffString){\r\n" + 
		"                        var lines = diffString.split(\'\\n\');\r\n" + 
		"                        var lineNumber = lines.length;\r\n" + 
		"                        var rangeSigns = [];\r\n" + 
		"-                       for(var i = 0; i <lineNumber ; i++){\r\n" + 
		"-                                               this._parseLine(stacks[i]  , stackDetailsDiv);\r\n" + 
		"+                       for(var i = 0; i <lineNumber ; ii++){\r\n" + 
		"+                                 var sign = this._parseLine(stacks[i]  , stackDetailsDiv);\r\n" + 
		"                        }\r\n" + 
		"                },\r\n" + 
		" \r\n" + 
		"-               _parseRangeSign: function(oneLine){\r\n" + 
		"-\r\n" + 
		"+               _parseRangeSign1: function(oneLine){\r\n" + 
		"+                       //dfgdsfgdsfgds\r\n" + 
		"+                       //dddfddgfd\r\n" + 
		"                },\r\n" + 
		"\r\n" + 
		"                _parseLine: function(stack , stackDetailsDiv){\r\n" + 
		"+               //dgtdthdtrd\r\n" + 
		"                        //var regExp=/((http|ftp):\\/)?\\/?([^:\\/\\s]+)((\\/\\w+)*\\/)([\\w\\-\\.]+\\.[^#?\\s]+)(#[\\w\\-]+)?/;\r\n" + 
		"                        var hasFileUrl = stack.match(/(\\.js|\\.css)/);\r\n" + 
		"                        if(hasFileUrl){//e.g.  \"at fail (http://localhost:8080/javascript/runner.js:234:13)\"",
		
		
		"/*******************************************************************************\r\n" + 
		" * Copyright (c) 2010 IBM Corporation and others.\r\n" + 
		" * All rights reserved. This program and the accompanying materials\r\n" + 
		" * are made available under the terms of the Eclipse Public License v1.0\r\n" + 
		" * which accompanies this distribution, and is available at\r\n" + 
		" * http://www.eclipse.org/legal/epl-v10.html\r\n" + 
		" *\r\n" + 
		" * Contributors:\r\n" + 
		" *     IBM Corporation - initial API and implementation\r\n" + 
		" *******************************************************************************/\r\n" + 
		"eclipse = eclipse || {};\r\n" + 
		"eclipse.DiffParser = (function() {\r\n" + 
		"	function DiffParser(options) {\r\n" + 
		"		this._StackDivId  = eclipse.uTestUtils.getOptionValue(options , \"stackDivId\" , eclipse.uTestConsts.RESULT_STACK_DTAILS);\r\n" + 
		"	}\r\n" + 
		"	DiffParser.prototype = {\r\n" + 
		"		parseAllLines: function(diffString){\r\n" + 
		"			var lines = diffString.split(\'\\n\');\r\n" + 
		"			var lineNumber = lines.length;\r\n" + 
		"			var rangeSigns = [];\r\n" + 
		"			for(var i = 0; i <lineNumber ; i++){\r\n" + 
		"						this._parseLine(stacks[i]  , stackDetailsDiv);\r\n" + 
		"			}\r\n" + 
		"		},\r\n" + 
		"		\r\n" + 
		"		_parseRangeSign: function(oneLine){\r\n" + 
		"			\r\n" + 
		"		},\r\n" + 
		"\r\n" + 
		"		_parseLine: function(stack , stackDetailsDiv){\r\n" + 
		"			//var regExp=/((http|ftp):\\/)?\\/?([^:\\/\\s]+)((\\/\\w+)*\\/)([\\w\\-\\.]+\\.[^#?\\s]+)(#[\\w\\-]+)?/;\r\n" + 
		"			var hasFileUrl = stack.match(/(\\.js|\\.css)/);\r\n" + 
		"			if(hasFileUrl){//e.g.  \"at fail (http://localhost:8080/javascript/runner.js:234:13)\" \r\n" + 
		"				var parts1 = stack.split(/(\\.js|\\.css)/);\r\n" + 
		"				if(parts1.length === 3){\r\n" + 
		"					var parts2 = parts1[0].split(/(http|https)/);\r\n" + 
		"					if(parts2.length === 3){\r\n" + 
		"						var parts3 = parts1[2].split(\":\");\r\n" + 
		"						if(parts3.length > 1){\r\n" + 
		"							var anchorPart = parts2[1]+parts2[2]+parts1[1]+parts3[0]+\":\"+parts3[1];\r\n" + 
		"							var others = stack.split(anchorPart);\r\n" + 
		"							if(others.length === 2){\r\n" + 
		"								var href = \"/coding.html#\" + parts2[1]+parts2[2]+parts1[1] + \"?line=\" +parts3[1];\r\n" + 
		"								var linkPart = dojo.create(\"span\");\r\n" + 
		"								var link = dojo.create(\"a\", {href: href, target: \"_blank\"});\r\n" + 
		"								dojo.place(link, linkPart, \"last\");\r\n" + 
		"								dojo.place(document.createTextNode(anchorPart), link);\r\n" + 
		"								\r\n" + 
		"								stackDetailsDiv.innerHTML = stackDetailsDiv.innerHTML\r\n" + 
		"										+ document.createTextNode(others[0]).textContent\r\n" + 
		"										+ linkPart.innerHTML\r\n" + 
		"										+ document.createTextNode(others[1]).textContent + \"<br>\";\r\n" + 
		"								return;\r\n" + 
		"							}\r\n" + 
		"						}\r\n" + 
		"					}\r\n" + 
		"				}\r\n" + 
		"			}\r\n" + 
		"			stackDetailsDiv.innerHTML = stackDetailsDiv.innerHTML + stack + \"<br>\";\r\n" + 
		"		}\r\n" + 
		"		\r\n" + 
		"	};\r\n" + 
		"	return DiffParser;\r\n" + 
		"}());"]
];


var diffParser;

window.onload = function() {
    diffParser = new eclipse.DiffParser();
    var len = diffMock.length;
    if(len === 0)
    	return;
    for (var i = 0 ; i < len ; i++){
    	diffParser.parseAllLines(diffMock[i][1],diffMock[i][0]);
    }
};
