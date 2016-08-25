/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define(["orion/webui/littlelib",
		"orion/Deferred",
		"text!orion/webui/intro.html"], 
		function(lib, Deferred, IntroTemplate) {
		
	function Intro() {
	}

	Intro.prototype = /** @lends orion.webui.Intro.prototype */ {
		
		TUTORIALS: [
			{
				"id":"source_outline",
				"steps":["http://localhost:8083/img/tuto_slideout_1.png","http://localhost:8083/img/tuto_slideout_2.png"],
				"isNew": true
			}
		],
		/* 
		 * Called by clients once the dialog template has been bound to the TEMPLATE variable, and any additional options (title, buttons,
		 * messages, modal) have been set.
		 */
		_initialize: function() {
			var parent = document.body;
			this.$frameParent = parent;
			var range = document.createRange();
			range.selectNode(parent);
			var frameFragment = range.createContextualFragment(IntroTemplate);
			parent.appendChild(frameFragment);
			this.$frame = parent.lastChild;
			this.$close = lib.$("#tutorialSkip", this.$frame);//$NON-NLS-0$
			var self = this;
			this.$close.addEventListener("click", function(event) { //$NON-NLS-0$
				self.hide();
				// TODO save this tutorial's id in local storage
			}, false);
						
			this.$tutorialBackButton = lib.$("#tutorialBack", this.$frame); //$NON-NLS-0$
			this.$tutorialForwardButton = lib.$("#tutorialForward", this.$frame); //$NON-NLS-0$
			this.$tutorialImg = lib.$("#tutorialImg", this.$frame); //$NON-NLS-0$
			this.$turorialProgressDiv = lib.$("#turorialProgress", this.$tutorialGuidePart); //$NON-NLS-0$
			this.registerButtonsAndInitialImg("source_outline");
			
			// hook key handlers.  This must be done after _makeButtons so that the default callback (if any)
			// is established.
			this.$frame.addEventListener("keydown", function (e) { //$NON-NLS-0$
				if(e.keyCode === lib.KEY.ESCAPE) {
					self.hide();
				} else if (e.keyCode === lib.KEY.ENTER && (typeof self._defaultCallback) === "function") { //$NON-NLS-0$
					self._defaultCallback();
				}
			}, false);
		},
		
		/*
		 * Internal.  Generates any specified buttons.
		 */
		registerButtonsAndInitialImg: function(id) {
			var self = this;
			var tutorial = this.TUTORIALS.find(function(each){
				return each.id === id;
			});
			self.$tutorialImg.src = tutorial.steps[0];
			self.$tutorialImg.tutorialImgIndex = 0;
			for(var k = 0; k < tutorial.steps.length ; k++ ){
				var button = document.createElement("button");
				button.tutorialImgIndex = k;
				button.addEventListener("click", function(e){
					self.$tutorialImg.src = tutorial.steps[e.target.tutorialImgIndex];
					self.$tutorialImg.tutorialImgIndex = e.target.tutorialImgIndex;
					e.target.classList.add("currentTutorial");
					// remove currentTutorial from others
				});
				self.$turorialProgressDiv.appendChild(button);
			}
			self.$tutorialForwardButton.addEventListener("click", function(e){
				var nextStepIndex = self.$tutorialImg.tutorialImgIndex + 1;
				if(nextStepIndex <= tutorial.steps.length -1){
					self.$tutorialImg.src = tutorial.steps[nextStepIndex];
					self.$tutorialImg.tutorialImgIndex = nextStepIndex;
					// TODO update slide buttons
				}
			});
			self.$tutorialBackButton.addEventListener("click", function(e){
				var nextStepIndex = self.$tutorialImg.tutorialImgIndex - 1;
				if(nextStepIndex >= 0){
					self.$tutorialImg.src = tutorial.steps[nextStepIndex];
					self.$tutorialImg.tutorialImgIndex = nextStepIndex;
					// TODO update slide buttons
				}
			});
		},
			
		/*
		 * Internal.  Hides the dialog.  Clients should use the before and after
		 * hooks (_beforeHiding, _afterHiding) to do any work related to hiding the dialog, such
		 * as destroying resources.
		 */
		hide: function() {
			var activeElement = document.activeElement;
			var hasFocus = this.$frameParent === activeElement || (this.$frameParent.compareDocumentPosition(activeElement) & 16) !== 0;
			var originalFocus = this.$originalFocus;

			if (typeof this._beforeHiding === "function") { //$NON-NLS-0$
				this._beforeHiding();
			}

			if (typeof this._afterHiding === "function") { //$NON-NLS-0$
				this._afterHiding();
			}
			if (hasFocus && originalFocus && document.compareDocumentPosition(originalFocus) !== 1) {
				originalFocus.focus();
			}
			var self = this;
			if (!this.keepAlive) {
				window.setTimeout(function() { self.destroy(); }, 0);
			}
		}, 
		
		/*
		 * Internal.  Shows the dialog.  Clients should use the before and after
		 * hooks (_beforeShowing, _afterShowing) to do any work related to showing the dialog,
		 * such as setting initial focus.
		 */
		show: function() {
			if (typeof this._beforeShowing === "function") { //$NON-NLS-0$
				this._beforeShowing();
			}
			this.$lastFocusedElement = this.$originalFocus = document.activeElement;
			if (typeof this._afterShowing === "function") { //$NON-NLS-0$
				this._afterShowing();
			}
		},
		
		_getFirstFocusField: function() {
			return lib.firstTabbable(this.$tutorialsSelection) || 
				this._defaultButton ||
				lib.firstTabbable(this.$buttonContainer) ||
				this.$close;
		},
		
		/*
		 * Internal.  Cleanup and remove dom nodes.
		 */
		destroy: function() {
			if (!this.$frame) {
				return;
			}
			lib.setFramesEnabled(true);
			this.$frameParent.removeChild(this.$frame);
			this.$frame = undefined;
			this.$tutorialsSelection = undefined;
		}
	};
	
	Intro.prototype.constructor = Intro;

	//return the module exports
	return {Intro: Intro};
});
