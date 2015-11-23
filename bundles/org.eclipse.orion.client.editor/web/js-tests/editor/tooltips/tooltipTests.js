/*******************************************************************************
 * @license
 * Copyright (c) 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, browser, mocha*/
/* eslint-disable missing-nls */
define([
	'chai/chai',
	'orion/editor/textView',
	'orion/editor/tooltip'
], function(chai, mTextView, mTooltip) {
	var assert = chai.assert;
	
	/*
	 * WARNING: The tooltips test require tooltip.css from the editor plug-in to be available.
	 */
	describe("Tooltip Tests", function() {
		
		var tooltip;
		
		before(function() {
			var body = document.getElementsByTagName("body")[0];
			var divParent = document.getElementById("divParent");
			if (!divParent) {
				divParent = document.createElement("div");
				divParent.id = "divParent";
				divParent.style.border = "1px solid gray;";
				divParent.style.backgroundColor = 'magenta';
				divParent.style.width = "500px";
				divParent.style.height = "300px";
				body.appendChild(divParent);
			}
			var view = new mTextView.TextView({parent: divParent});
			tooltip = mTooltip.Tooltip.getTooltip(view);
		});

		after(function() {
//			var divParent = document.getElementById("divParent");
//			if (divParent) {
//				divParent.parentNode.removeChild(divParent);
//			}
//			tooltip.hide();
		});
		
		/**
		 * @name checkTooltipArea
		 * @description 12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
		 * @param area
		 * @param left
		 * @param top
		 * @param width
		 * @param height
		 * @returns returns
		 */
		function checkTooltipArea(area, left, top, width, height){
			var documentElement = tooltip._tooltipDiv.ownerDocument.documentElement;
			var viewBounds = (tooltip._view._rootDiv ? tooltip._view._rootDiv : documentElement).getBoundingClientRect();
			assert(area, "Tooltip area was not computed");
			// Adjust for area outside text view
			var aleft = Math.round(area.left)-Math.round(viewBounds.left);
			var atop = Math.round(area.top)-Math.round(viewBounds.top);
			// IE created divs with floating point size, 499.999969
			var awidth = Math.round(area.width);
			var aheight = Math.round(area.height);
			var result = "\n" + "Tooltip Area (left, top, width, height)\nActual: " + aleft + ", " + atop + ", " + awidth + ", " + aheight + "\nExpected: " + left + ", " + top + ", " + width + ", " + height + "\n";
			assert.equal(aleft, left, result);
			assert.equal(atop, top, result);
			assert.equal(awidth, width, result);
			assert.equal(aheight, height, result);
			// IE will create a text view with a floating point, 499.99969
			var remainingViewHeight = Math.round(viewBounds.height-area.top+viewBounds.top);
			var remainingViewWidth = Math.round(viewBounds.width-area.left+viewBounds.left);
			assert.equal(Math.round(area.maxHeight), remainingViewHeight, "Max height should be remaining view area" + result);
			assert.equal(Math.round(area.maxWidth), remainingViewWidth, "Max width should be remaining view area" + result);
		}
		
		function checkAnchorArea(area, left, top, width, height){
			assert(area, "Anchor area was not computed");
			var aleft = area.left;
			var atop = area.top;
			var awidth = area.width;
			var aheight = area.height;
			var result = "\n" + "Anchor Area (left, top, width, height)\nActual: " + aleft + ", " + atop + ", " + awidth + ", " + aheight + "\nExpected: " + left + ", " + top + ", " + width + ", " + height + "\n";
			assert.equal(aleft, left, result);
			assert.equal(atop, top, result);
			assert.equal(awidth, width, result);
			assert.equal(aheight, height, result);
		}
		
		it("Check text view area", function(){
			var documentElement = tooltip._tooltipDiv.ownerDocument.documentElement;
			var viewBounds = (tooltip._view._rootDiv ? tooltip._view._rootDiv : documentElement).getBoundingClientRect();
			// IE will sometimes return a floating point 499.999969
			var width = Math.round(viewBounds.width);
			var height = Math.round(viewBounds.height);
			assert.equal(width, 500, "Text view was not sized properly");
			assert.equal(height, 300, "Text view was not sized properly");
		});
		
		it("Open tooltips are visible", function(){
			var info = {
				getTooltipInfo: function(){
					return {
						contents: "Simple String"
					};
				}
			};
			assert.notEqual(tooltip._tooltipDiv.style.visibility, "visible", "Tooltip should not be visible");
			assert(!tooltip.isVisible(), "Tooltip should know it is not visible");
			tooltip.show(info);
			assert.equal(tooltip._tooltipDiv.style.visibility, "visible", "Tooltip should be visible");
			assert(tooltip.isVisible(), "Tooltip should know it is visible");
			tooltip.hide();
			assert.notEqual(tooltip._tooltipDiv.style.visibility, "visible", "Tooltip should not be visible");
			assert(!tooltip.isVisible(), "Tooltip should know it is not visible");
		});
		
		/*
		 * TODO
		 * 
		 * Check show/hide on onHover call
		 * - with focus
		 * - with locked
		 * Check behaviour of update call
		 * - with justPosition
		 * 
		 * Minimum size
		 * Maximum size
		 * All above with non-zero anchor area
		 * Specified size and place
		 * Zoom levels?
		 * 
		 * Hover contents?
		 * - annotations
		 * - rulers
		 * - contributed providers
		 * 
		 */
		
		
		it("Tooltip within editor border", function(){
			var info = {
				getTooltipInfo: function(){
					return {
						contents: "Simple String"
					};
				}
			};
			tooltip.show(info);
			var divBounds = tooltip._tooltipDiv.getBoundingClientRect();
			checkAnchorArea(tooltip._anchorArea, 0, 0, 0, 0);
			// IE will sometimes return a floating point 499.999969
			var width = Math.round(divBounds.width);
			var height = Math.round(divBounds.height);
			checkTooltipArea(tooltip._tooltipArea, 0, 0, width, height);
			tooltip.hide();
		});
		
		it("Long tooltips default to half editor width", function(){
			var info = {
				getTooltipInfo: function(){
					return {
						contents: "12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"
					};
				}
			};
			tooltip.show(info);
			
			var documentElement = tooltip._tooltipDiv.ownerDocument.documentElement;
			var viewBounds = (tooltip._view._rootDiv ? tooltip._view._rootDiv : documentElement).getBoundingClientRect();
			// IE will sometimes return a floating point 499.999969
			var viewWidth = Math.round(viewBounds.width);
			var divBounds = tooltip._tooltipDiv.getBoundingClientRect();
			var width = Math.round(viewWidth/2);
			// TODO The contents are not being scrolled, so tooltip height remains at 56px
			var height = Math.round(divBounds.height);
			
			checkAnchorArea(tooltip._anchorArea, 0, 0, 0, 0);
			checkTooltipArea(tooltip._tooltipArea, 0, 0, width, height);
			tooltip.hide();
		});
		
		it("Long tooltips with allowFullWidth reach editor width", function(){
			var info = {
				getTooltipInfo: function(){
					return {
						allowFullWidth: true,
						contents: "12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"
					};
				}
			};
			tooltip.show(info);
			
			var documentElement = tooltip._tooltipDiv.ownerDocument.documentElement;
			var viewBounds = (tooltip._view._rootDiv ? tooltip._view._rootDiv : documentElement).getBoundingClientRect();
			// IE will sometimes return a floating point 499.999969
			var viewWidth = Math.round(viewBounds.width);
			var divBounds = tooltip._tooltipDiv.getBoundingClientRect();
			var width = Math.round(viewWidth);
			// TODO The contents are not being scrolled, so tooltip height remains at 56px
			var height = Math.round(divBounds.height);
			
			checkAnchorArea(tooltip._anchorArea, 0, 0, 0, 0);
			checkTooltipArea(tooltip._tooltipArea, 0, 0, width, height);
			tooltip.hide();
		});
		
		it("Multiple line tooltips default to half editor height", function(){
			var paragraph = document.createElement('p');
			paragraph.innerHTML = '1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>';
			var info = {
				getTooltipInfo: function(){
					return {
						contents: paragraph
					};
				}
			};
			tooltip.show(info);
			
			var documentElement = tooltip._tooltipDiv.ownerDocument.documentElement;
			var viewBounds = (tooltip._view._rootDiv ? tooltip._view._rootDiv : documentElement).getBoundingClientRect();
			// IE will sometimes return a floating point 499.999969
			var viewHeight = Math.round(viewBounds.height);
			var divBounds = tooltip._tooltipDiv.getBoundingClientRect();
			var width = Math.round(divBounds.width);
			var height = Math.round(viewHeight/2);
			
			checkAnchorArea(tooltip._anchorArea, 0, 0, 0, 0);
			checkTooltipArea(tooltip._tooltipArea, 0, 0, width, height);
			tooltip.hide();
		});
		
		it("Multiple line tooltips with allowFullWidth reach editor height", function(){
			var paragraph = document.createElement('p');
			paragraph.innerHTML = '1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>1<br/>';
			var info = {
				getTooltipInfo: function(){
					return {
						allowFullWidth: true,
						contents: paragraph
					};
				}
			};
			tooltip.show(info);
			
			var documentElement = tooltip._tooltipDiv.ownerDocument.documentElement;
			var viewBounds = (tooltip._view._rootDiv ? tooltip._view._rootDiv : documentElement).getBoundingClientRect();
			// IE will sometimes return a floating point 499.999969
			var viewHeight = Math.round(viewBounds.height);
			var divBounds = tooltip._tooltipDiv.getBoundingClientRect();
			var width = Math.round(divBounds.width);
			var height = Math.round(viewHeight);
			
			checkAnchorArea(tooltip._anchorArea, 0, 0, 0, 0);
			checkTooltipArea(tooltip._tooltipArea, 0, 0, width, height);
			tooltip.hide();
		});
		
		it("Anchored tooltip position below", function(){
			var documentElement = tooltip._tooltipDiv.ownerDocument.documentElement;
			var viewBounds = (tooltip._view._rootDiv ? tooltip._view._rootDiv : documentElement).getBoundingClientRect();
			var viewLeft = Math.round(viewBounds.left);
			var viewTop = Math.round(viewBounds.top);
			var viewWidth = Math.round(viewBounds.width);
			var viewHeight = Math.round(viewBounds.height);
			
			var anchorArea = {left: viewLeft + Math.round(viewWidth / 3), top: viewTop + Math.round(viewHeight / 3), width: 10, height: 10};
			
			var info = {
				getTooltipInfo: function(){
					return {
						anchorArea: anchorArea,
						position: 'below',
						contents: "Test"
					};
				}
			};
			tooltip.show(info);
			
			var divBounds = tooltip._tooltipDiv.getBoundingClientRect();
			var left = Math.round(anchorArea.left-viewBounds.left);
			var top = Math.round(anchorArea.top-viewBounds.top+anchorArea.height); // Position below aligns to bottom left of anchor
			var width = Math.round(divBounds.width);
			var height = Math.round(divBounds.height);
			checkAnchorArea(tooltip._anchorArea, anchorArea.left, anchorArea.top, anchorArea.width, anchorArea.height);
			checkTooltipArea(tooltip._tooltipArea, left, top, width, height);
			tooltip.hide();
		});
		
		it("Anchored tooltip position above", function(){
			var documentElement = tooltip._tooltipDiv.ownerDocument.documentElement;
			var viewBounds = (tooltip._view._rootDiv ? tooltip._view._rootDiv : documentElement).getBoundingClientRect();
			var viewLeft = Math.round(viewBounds.left);
			var viewTop = Math.round(viewBounds.top);
			var viewWidth = Math.round(viewBounds.width);
			var viewHeight = Math.round(viewBounds.height);
			
			var anchorArea = {left: viewLeft + Math.round(viewWidth / 3), top: viewTop + Math.round(viewHeight / 3), width: 10, height: 10};
			
			var info = {
				getTooltipInfo: function(){
					return {
						anchorArea: anchorArea,
						position: 'above',
						contents: "Test"
					};
				}
			};
			tooltip.show(info);
			
			var divBounds = tooltip._tooltipDiv.getBoundingClientRect();
			var width = Math.round(divBounds.width);
			var height = Math.round(divBounds.height);
			var left = Math.round(anchorArea.left-viewBounds.left);
			var top = Math.round(anchorArea.top-viewBounds.top-height); // Position above aligns to top left of anchor
			checkAnchorArea(tooltip._anchorArea, anchorArea.left, anchorArea.top, anchorArea.width, anchorArea.height);
			checkTooltipArea(tooltip._tooltipArea, left, top, width, height);
			tooltip.hide();
		});
		
		it("Anchored tooltip position right", function(){
			var documentElement = tooltip._tooltipDiv.ownerDocument.documentElement;
			var viewBounds = (tooltip._view._rootDiv ? tooltip._view._rootDiv : documentElement).getBoundingClientRect();
			var viewLeft = Math.round(viewBounds.left);
			var viewTop = Math.round(viewBounds.top);
			var viewWidth = Math.round(viewBounds.width);
			var viewHeight = Math.round(viewBounds.height);
			
			var anchorArea = {left: viewLeft + Math.round(viewWidth / 3), top: viewTop + Math.round(viewHeight / 3), width: 10, height: 10};
			
			var info = {
				getTooltipInfo: function(){
					return {
						anchorArea: anchorArea,
						position: 'right',
						contents: "Test"
					};
				}
			};
			tooltip.show(info);
			
			var divBounds = tooltip._tooltipDiv.getBoundingClientRect();
			var left = Math.round(anchorArea.left-viewBounds.left+anchorArea.width); // Position right aligns to top left of anchor
			var top = Math.round(anchorArea.top-viewBounds.top); 
			var width = Math.round(divBounds.width);
			var height = Math.round(divBounds.height);
			checkAnchorArea(tooltip._anchorArea, anchorArea.left, anchorArea.top, anchorArea.width, anchorArea.height);
			checkTooltipArea(tooltip._tooltipArea, left, top, width, height);
			tooltip.hide();
		});
		
		it("Anchored tooltip position left", function(){
			var documentElement = tooltip._tooltipDiv.ownerDocument.documentElement;
			var viewBounds = (tooltip._view._rootDiv ? tooltip._view._rootDiv : documentElement).getBoundingClientRect();
			var viewLeft = Math.round(viewBounds.left);
			var viewTop = Math.round(viewBounds.top);
			var viewWidth = Math.round(viewBounds.width);
			var viewHeight = Math.round(viewBounds.height);
			
			var anchorArea = {left: viewLeft + Math.round(viewWidth / 3), top: viewTop + Math.round(viewHeight / 3), width: 10, height: 10};
			
			var info = {
				getTooltipInfo: function(){
					return {
						anchorArea: anchorArea,
						position: 'left',
						contents: "Test"
					};
				}
			};
			tooltip.show(info);
			
			var divBounds = tooltip._tooltipDiv.getBoundingClientRect();
			var width = Math.round(divBounds.width);
			var height = Math.round(divBounds.height);
			var left = Math.round(anchorArea.left-viewBounds.left-width); // Position right aligns to top left of anchor
			var top = Math.round(anchorArea.top-viewBounds.top); 
			checkAnchorArea(tooltip._anchorArea, anchorArea.left, anchorArea.top, anchorArea.width, anchorArea.height);
			checkTooltipArea(tooltip._tooltipArea, left, top, width, height);
			tooltip.hide();
		});
		
		// Increase size at all positions
		// Increase size at all positions to maxWidth
		
		// Anchor via info.context.offsetStart, offsetEnd
		
	});

}); //define