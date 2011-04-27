/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
eclipse = eclipse || {};
eclipse.TestIndicator = (function() {
	function Indicator(options) {
		this._testNumberId  = eclipse.uTestUtils.getOptionValue(options , "testNumberId" , eclipse.uTestConsts.STATE_TEST_NUMBER_ID);
		this._testFailureId  = eclipse.uTestUtils.getOptionValue(options , "testFailureId" , eclipse.uTestConsts.STATE_TEST_FAILURE_ID);
		this._testIndicatorId  = eclipse.uTestUtils.getOptionValue(options , "testIndicatorId" , eclipse.uTestConsts.STATE_TEST_INDICATOR_ID);
	}
	Indicator.prototype = {
		update: function(testNumber , failNumber){
			var testRuns = dojo.byId(this._testNumberId);
			if(testRuns !== undefined){
				dojo.place(document.createTextNode(testNumber), testRuns, "only");
			}
			var failures = dojo.byId(this._testFailureId);
			if(failures !== undefined){
				dojo.place(document.createTextNode(failNumber), failures, "only");
			}
			var testState = dojo.byId(this._testIndicatorId);
			if(testState !== undefined){
				if(testNumber === 0)
					testState.color = "#eeeeee";
				else
					testState.color = failNumber === 0 ? "green" : "red";
				/*
				if(testNumber === 0){
					if(testState.children && testState.children.length > 0)
						testState.removeChild(testState.children[0]);
					testState.innerHTML = "";
				} else {
					var indicator = document.createElement('hr');
					indicator.color = failNumber === 0 ? "green" : "red";
					indicator.width = "50px";
					testState.appendChild(indicator);
					
				}*/
			}
		}
	};
	return Indicator;
}());