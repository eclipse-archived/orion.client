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
		"text!orion/webui/intro.html"], 
		function(lib, IntroTemplate) {
		
	function Intro() {
	}

	Intro.prototype = /** @lends orion.webui.Intro.prototype */ {
		
		TUTORIALS: [
			{
				"id":"source_outline",
				"title":"Source Outline",
				"steps":[
					{"url" : "http://localhost:8083/img/tuto_slideout_1.png","desc":"Open the View Mene"},
					{"url" : "http://localhost:8083/img/tuto_slideout_2.png","desc":"Hover onto slideout then Click source outline"}
				 ],
				"isNew": true,
				"targetID":"viewActions"
			},
			{
				"id":"reference",
				"title":"Reference",
				"steps":[
					{"url" : "http://localhost:8083/img/tuto_reference_1.PNG","desc":"Open Tools Menu Tab"}
				 ],
				"isNew": true,
				"targetID":"toolsActions"
			}
		],
		/* 
		 * Called by clients once the dialog template has been bound to the TEMPLATE variable, and any additional options (title, buttons,
		 * messages, modal) have been set.
		 */
		initialize: function(id) {
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
				var currentTutorialID = event.target.currentTutorialId;
				if(currentTutorialID){
					var seenTutorialIDs = JSON.parse(localStorage.getItem("seenTutorials")) || [];
					if(seenTutorialIDs.indexOf(currentTutorialID) === -1){
						seenTutorialIDs.push(currentTutorialID);				
					}
					localStorage.setItem("seenTutorials", JSON.stringify(seenTutorialIDs));
					// TODO this local storage is keep growing if no clean up, but do we really want clean up compared to storage space?
					
					var finishedTutorialNotification = self.$notifications.find(function(element){
						return element.tutorialID === currentTutorialID;
					});
					
					self.$notifyFrame.removeChild(finishedTutorialNotification);
					finishedTutorialNotification = undefined;
					if(self.$notifyFrame.children.length === 0){
						self.$frameParent.removeChild(self.$notifyFrame);
						self.$notifyFrame = undefined;
					}
				}
			}, false);
						
			this.$tutorialBackButton = lib.$("#tutorialBack", this.$frame); //$NON-NLS-0$
			this.$tutorialForwardButton = lib.$("#tutorialForward", this.$frame); //$NON-NLS-0$
			this.$tutorialImg = lib.$("#tutorialImg", this.$frame); //$NON-NLS-0$
			this.$turorialProgressDiv = lib.$("#turorialProgress", this.$tutorialGuidePart); //$NON-NLS-0$ 
			this.$tutorialDescription = lib.$("#tutorialDescription", this.$frame); //$NON-NLS-0$ 
			this.$tutorialTitle = lib.$("#tutorialTitle", this.$frame); //$NON-NLS-0$ 
			this.registerButtonsAndInitialImg(id);
			
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
			if(tutorial.isNew){ // only do so if this is a required tutorial.
				self.$close.currentTutorialId = id;
			}
			self.$tutorialImg.src = tutorial.steps[0].url;
			self.$tutorialDescription.innerHTML = tutorial.steps[0].desc;
			self.$tutorialImg.tutorialImgIndex = 0;
			self.$tutorialTitle.innerHTML = tutorial.title;
			for(var k = 0; k < tutorial.steps.length ; k++ ){
				var button = document.createElement("button");
				button.tutorialImgIndex = k;
				button.classList.add("slideButtons");
				button.addEventListener("click", function(e){
					switchToTutorial(e.target.tutorialImgIndex);
				});
				self.$turorialProgressDiv.appendChild(button);
			}
			self.$slideButtons = document.querySelectorAll(".slideButtons");
			self.$slideButtons[0].classList.add("currentSlideButton");
			self.$tutorialForwardButton.addEventListener("click", function(e){
				var nextStepIndex = self.$tutorialImg.tutorialImgIndex + 1;
				if(nextStepIndex <= tutorial.steps.length -1){
					switchToTutorial(nextStepIndex);
				}
			});
			self.$tutorialBackButton.addEventListener("click", function(e){
				var nextStepIndex = self.$tutorialImg.tutorialImgIndex - 1;
				if(nextStepIndex >= 0){
					switchToTutorial(nextStepIndex);
				}
			});
			self.$tutorialImg.addEventListener("click", function(){
				var nextStepIndex = self.$tutorialImg.tutorialImgIndex + 1;
				if(nextStepIndex <= tutorial.steps.length -1){
					switchToTutorial(nextStepIndex);
				}
			});
			function switchToTutorial(nextStepIndex){
				self.$tutorialImg.src = tutorial.steps[nextStepIndex].url;
				self.$tutorialImg.tutorialImgIndex = nextStepIndex;
				self.$tutorialDescription.innerHTML = tutorial.steps[nextStepIndex].desc;
				updateSlideButtons(nextStepIndex);
			}
			function updateSlideButtons(index){
				Array.prototype.forEach.call(self.$slideButtons, function(each) {
					each.classList.remove("currentSlideButton");
				});
				self.$slideButtons[index].classList.add("currentSlideButton");
			}
		},
		
		showNotifications: function(){
			var self = this;
			// Check local storages, see which notifications to show.
			var seenTutorialIDs = JSON.parse(localStorage.getItem("seenTutorials")) || [];
			var notSeenTutorials =  self.TUTORIALS.map(function(tutorial){
				if(!seenTutorialIDs.some(function(seenId){
					return seenId === tutorial.id;				
				})){
					return tutorial;
				}	
			});
			// Initializing notifications
			var thisparent = document.body;
			var range = document.createRange();
			range.selectNode(thisparent);
			var TUTORIAL_NOTIFICATION_TEMPLATE = 	
			'<div class="tutoNotifications"></div>';//$NON-NLS-0$
			var notifyFrameFragment = range.createContextualFragment(TUTORIAL_NOTIFICATION_TEMPLATE);
			thisparent.appendChild(notifyFrameFragment);
			self.$notifyFrame = thisparent.lastChild;
			self.$notifications = [];
			notSeenTutorials.forEach(function(tutorial){
				if(tutorial){
					var notificationElement = self.registerTutorialNotification(tutorial);
					self.$notifications.push(notificationElement);
					self.$notifyFrame.appendChild(notificationElement);
				}
			});
		},
		
		registerTutorialNotification:function(tutorial){
			var self = this;
			var notification = document.createElement("div");
			var pulseRays = document.createElement("div");
			notification.classList.add("tutoNotification");
			notification.tutorialID = tutorial.id;
			var targetElementID = "#"+tutorial.targetID;
			var targetPlaceElement = document.querySelector(targetElementID);
			if(targetPlaceElement){
				var rect = lib.bounds(targetPlaceElement);
				notification.style.top = rect.top  + "px"; //$NON-NLS-0$
				notification.style.left = rect.left + "px"; //$NON-NLS-0$ 
			}
			notification.addEventListener("mouseenter", function(e){
				var id = e.target.tutorialID;
				var rect = lib.bounds(e.target);
				self.showNotificationToolTip(id, rect);
			});
			notification.addEventListener("mouseleave", function(e){
				self.$notifyFrame.removeChild(self.$notificationToolTip);
				self.$notificationToolTip = undefined;
			});
			notification.addEventListener("click", function(e){
				var id = e.target.tutorialID;
				self.initialize(id);
				self.show();
			});
			return notification;
		},
		
		showNotificationToolTip:function(id, rect){
			var self = this;
			self.$notificationToolTip = document.createElement("div");
			self.$notificationToolTip.classList.add("tutoNotificationToolTip");
			self.$notificationToolTip.style.top = rect.top + "px";
			self.$notificationToolTip.style.left = rect.left + "px";
			var tootipTutorialType = document.createElement("div");; //$NON-NLS-0$
			var tootipTutorialDesc = document.createElement("div");; //$NON-NLS-0$
			var skipThisTutorial = document.createElement("div");; //$NON-NLS-0$
			skipThisTutorial.classList.add("tutorialClose");
			skipThisTutorial.innerHTML = "Skip";
			tootipTutorialType.innerHTML = "New Function";
			tootipTutorialDesc.innerHTML = "SlideOut";
			self.$notificationToolTip.appendChild(tootipTutorialType);
			self.$notificationToolTip.appendChild(tootipTutorialDesc);
			self.$notificationToolTip.appendChild(skipThisTutorial);
			self.$notifyFrame.appendChild(self.$notificationToolTip);
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
			window.setTimeout(function() { self.destroy(); }, 0);
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
			this.$tutorialBackButton = undefined;
			this.$tutorialForwardButton = undefined;
			this.$tutorialImg = undefined;
			this.$turorialProgressDiv = undefined;
			this.$tutorialDescription = undefined;
			this.$tutorialTitle = undefined;
		}
	};
	
	Intro.prototype.constructor = Intro;

	//return the module exports
	return {Intro: Intro};
});
