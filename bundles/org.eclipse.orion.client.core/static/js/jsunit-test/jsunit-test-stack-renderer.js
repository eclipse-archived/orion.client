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
eclipse = eclipse || {};
eclipse.TestStackRenderer = (function() {
	function StackRenderer(options) {
		this._StackDivId  = eclipse.uTestUtils.getOptionValue(options , "stackDivId" , eclipse.uTestConsts.RESULT_STACK_DTAILS);
	}
	StackRenderer.prototype = {
		update: function(failureStack){
			var stackDetailsDiv = dojo.byId(this._StackDivId);
			if(stackDetailsDiv !== undefined){
				stackDetailsDiv.innerHTML = "";
				if(failureStack !== null && failureStack !== undefined){
					var stacks = failureStack.split('\n');
					var stackLen = stacks.length;
					for(var i = 0; i <stackLen ; i++){
						this._parseLine(stacks[i]  , stackDetailsDiv);
					}
				} 
			}
		},

		_parseLine: function(stack , stackDetailsDiv){
			//var regExp=/((http|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+\.[^#?\s]+)(#[\w\-]+)?/;
			var hasFileUrl = stack.match(/(\.js|\.css)/);
			if(hasFileUrl){//e.g.  "at fail (http://localhost:8080/javascript/runner.js:234:13)" 
				var parts1 = stack.split(/(\.js|\.css)/);
				if(parts1.length === 3){
					var parts2 = parts1[0].split(/(http|https)/);
					if(parts2.length === 3){
						var parts3 = parts1[2].split(":");
						if(parts3.length > 1){
							var anchorPart = parts2[1]+parts2[2]+parts1[1]+parts3[0]+":"+parts3[1];
							var others = stack.split(anchorPart);
							if(others.length === 2){
								var href = "/coding.html#file=" + parts2[1]+parts2[2]+parts1[1] + "&line=" +parts3[1];
								var linkPart = dojo.create("span");
								var link = dojo.create("a", {href: href, target: "_blank"});
								dojo.place(link, linkPart, "last");
								dojo.place(document.createTextNode(anchorPart), link);
								
								stackDetailsDiv.innerHTML = stackDetailsDiv.innerHTML
										+ document.createTextNode(others[0]).textContent
										+ linkPart.innerHTML
										+ document.createTextNode(others[1]).textContent + "<br>";
								return;
							}
						}
					}
				}
			}
			stackDetailsDiv.innerHTML = stackDetailsDiv.innerHTML + stack + "<br>";
		}
		
	};
	return StackRenderer;
}());