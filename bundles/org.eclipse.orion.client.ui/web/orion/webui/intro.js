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
		"text!orion/webui/intro.html",
		"i18n!orion/nls/messages"], 
		function(lib, IntroTemplate, messages) {
		
	function Intro() {
	}

	Intro.prototype = /** @lends orion.webui.Intro.prototype */ {
		
		MAX_CONCORRENT_TUTORIALS: 5,
		
		TUTORIALS: [
			{
				"id":"source_outline",
				"title":"Source Outline",
				"desc":"Source Outline: open source outline slideout to see the structure of the the code",
				"steps":[
					{"url" : "http://localhost:8083/img/tuto_slideout_1.png","desc":"Open the View Mene"},
					{"url" : "http://localhost:8083/img/tuto_slideout_2.png","desc":"Hover onto slideout then Click source outline"}
				 ],
				"isNew": true,
				"targetSeletor":"#viewActions"
			},
			{
				"id":"reference",
				"title":"Reference",
				"desc":"Reference: find the most likely references of current selection, can be used on functions, variabals and constructors",
				"steps":[
					{"url" : "http://localhost:8083/img/tuto_reference_1.PNG","desc":"Open Tools Menu Tab"}
				 ],
				"isNew": true,
				"targetSeletor":"#toolsActions"
			},
			{
				"id":"site",
				"title":"Site",
				"desc":"Site: create a site for a web server",
				"steps":[
					{"url" : "http://localhost:8083/img/tuto_site_1.PNG","desc":"Clike Create"}
				 ],
				"isNew": true,
				"targetSeletor":"#sideMenu>ul>li>a[aria-label=Sites]"
			}
		],
		/*
		 * Internal. Initializing tutorial modal when user want to see the tutorial detail.
		 */
		initializeTutorialModal: function(id) {
			var parent = document.body;
			this.$frameParent = parent;
			var range = document.createRange();
			range.selectNode(parent);
			var frameFragment = range.createContextualFragment(IntroTemplate);
			parent.appendChild(frameFragment);
			this.$frame = parent.lastChild;
			this.$close = lib.$("#tutorialSkip", this.$frame);//$NON-NLS-0$
			var self = this;
			this.$close.addEventListener("click", function(event){  //$NON-NLS-0$
				self.hide();
				var currentTutorialID = event.target.currentTutorialId;
				self.handleTutorialSkip(currentTutorialID);
			}, false); 
			this.$tutorialBackButton = lib.$("#tutorialBack", this.$frame); //$NON-NLS-0$
			this.$tutorialForwardButton = lib.$("#tutorialForward", this.$frame); //$NON-NLS-0$
			this.$tutorialImg = lib.$("#tutorialImg", this.$frame); //$NON-NLS-0$
			this.$turorialProgressDiv = lib.$("#turorialProgress", this.$tutorialGuidePart); //$NON-NLS-0$ 
			this.$tutorialDescription = lib.$("#tutorialDescription", this.$frame); //$NON-NLS-0$ 
			this.$tutorialTitle = lib.$("#tutorialTitle", this.$frame); //$NON-NLS-0$ 
			this.registerButtonsAndInitialImg(id);
		},
		/*
		 * Internal. Skip of finish corrent tutorial by saving necessary data to localstorage and remove unnecessary elements.
		 */
		handleTutorialSkip:function(currentTutorialID){
			var self = this;
			if(currentTutorialID){
				var seenTutorialIDs = JSON.parse(localStorage.getItem("seenTutorials")) || [];
				if(seenTutorialIDs.indexOf(currentTutorialID) === -1){
					seenTutorialIDs.push(currentTutorialID);	
				}
				localStorage.setItem("seenTutorials", JSON.stringify(seenTutorialIDs));
			}
			// TODO this local storage is keep growing if no clean up?
			var finishedTutorialNotification = self.$notifications.find(function(element){
				return element.tutorialID === currentTutorialID;
			});
			self.$notifyFrame.removeChild(finishedTutorialNotification);
			finishedTutorialNotification = undefined;
			if(self.$notifyFrame.children.length === 0){
				self.$frameParent.removeChild(self.$notifyFrame);
				self.$notifyFrame = undefined;
			}
		},
		/*
		 * Internal.  Feed specified tutorial data to tutorial modal and register events.
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
			handleForwardButton(0);
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
				handleForwardButton(nextStepIndex);
			}
			function handleForwardButton(nextStepIndex){
				if(nextStepIndex === tutorial.steps.length -1){
					self.$tutorialForwardButton.style.display="none";
					self.$close.classList.add("tutorialForwardPosition");
				}else{
					self.$tutorialForwardButton.style.display="";
					self.$close.classList.remove("tutorialForwardPosition");
				}
			}
			function updateSlideButtons(index){
				Array.prototype.forEach.call(self.$slideButtons, function(each) {
					each.classList.remove("currentSlideButton");
				});
				self.$slideButtons[index].classList.add("currentSlideButton");
			}
		},
		/*
		 * External. show new feature notifications at maximum of 5 (MAX_CONCORRENT_TUTORIALS) concurrently.
		 */
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
			notSeenTutorials.length = self.MAX_CONCORRENT_TUTORIALS;
			// Initializing notifications
			var thisparent = document.body;
			var range = document.createRange();
			range.selectNode(thisparent);
			var TUTORIAL_NOTIFICATION_TEMPLATE = "<div class=\"tutoNotifications\"></div>";//$NON-NLS-0$
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
		/*
		 * Internal. Create tutorial notification pulse effect on the screen on top of specified element.
		 */
		registerTutorialNotification:function(tutorial){
			var self = this;
			var currentTutorial = tutorial;
			var notification = document.createElement("div");
			var pulseRays = document.createElement("div");
			notification.classList.add("tutoNotification");
			notification.classList.add("pulse");
			notification.classList.add("tutoNotification_default_Z");
			notification.tutorialID = tutorial.id;
			var targetElementID = tutorial.targetSeletor;
			var targetPlaceElement = document.querySelector(targetElementID);
			if(targetPlaceElement){
				var rect = lib.bounds(targetPlaceElement);
				notification.style.top = rect.top - 4 + "px"; //$NON-NLS-0$
				notification.style.left = rect.left + 8 + "px"; //$NON-NLS-0$ 
			}
			notification.addEventListener("mouseenter", function(e){
				var id = e.target.tutorialID;
				var rect = lib.bounds(e.target);
				self.showNotificationToolTip(id, rect, currentTutorial);
				Array.prototype.forEach.call(self.$notifications, function(each) {
					each.classList.add("tutoNotification_toolTip_opened_Z");
				});
				e.target.classList.remove("tutoNotification_toolTip_opened_Z");
				e.target.classList.add("tutoNotification_default_Z");
			});
			notification.addEventListener("click", function(e){
				var id = e.target.tutorialID;
				self.deleteNotificationTooltip();
				self.initializeTutorialModal(id);
			});
			return notification;
		},
		/*
		 * Internal. remove the totification tooltip
		 */
		deleteNotificationTooltip:function(){
			if(this.$notifyFrame && this.$notificationToolTip){
				this.$notifyFrame.removeChild(this.$notificationToolTip);
				this.$notificationToolTip = undefined;
			}
		},
		/*
		 * Internal. show a special made tooltip behind the notification pulse.
		 */
		showNotificationToolTip:function(id, rect, currentTutorial){
			var self = this;
			var currentID = id;
			self.$notificationToolTip = document.createElement("div");
			self.$notificationToolTip.classList.add("tutoNotificationToolTip");
			self.$notificationToolTip.style.top = rect.top -5 + "px";
			self.$notificationToolTip.style.left = rect.left - 5 + "px";
			var tooltipHeader = document.createElement("div"); //$NON-NLS-0$
			var tooltipPulse = document.createElement("div"); //$NON-NLS-0$
			var tooltipTitle = document.createElement("div"); //$NON-NLS-0$
			var tooltipMessage = document.createElement("div"); //$NON-NLS-0$
			var tooltipFooter = document.createElement("div"); //$NON-NLS-0$
			var tooltipClick = document.createElement("div"); //$NON-NLS-0$
			var tooltipSkip = document.createElement("div"); //$NON-NLS-0$
			tooltipHeader.classList.add("notification_tooltip_header");
			tooltipPulse.classList.add("notification_tooltip_pulse");
			tooltipTitle.classList.add("notification_tooltip_title");
			tooltipMessage.classList.add("notification_tooltip_message");
			tooltipFooter.classList.add("notification_tooltip_footer");
			tooltipClick.classList.add("notification_tooltip_click");
			tooltipSkip.classList.add("notification_tooltip_skip");
			tooltipSkip.innerHTML = messages.Skip;
			tooltipTitle.innerHTML = currentTutorial.isNew ? messages.NewFeature : messages.NewChanges;
			tooltipMessage.innerHTML = currentTutorial.desc;
			tooltipClick.innerHTML = messages.ClicktoSee;
			tooltipHeader.appendChild(tooltipPulse);
			tooltipHeader.appendChild(tooltipTitle);
			tooltipFooter.appendChild(tooltipClick);
			tooltipFooter.appendChild(tooltipSkip);
			self.$notificationToolTip.appendChild(tooltipHeader);
			self.$notificationToolTip.appendChild(tooltipMessage);
			self.$notificationToolTip.appendChild(tooltipFooter);
			self.$notificationToolTip.addEventListener("mouseleave", function(e){
				// handle remove tooltip here is because the tooltip is containing the notification in it.
				self.deleteNotificationTooltip();
			});
			self.$notificationToolTip.addEventListener("click", function(e){
				if(e.target !== tooltipSkip){
					self.deleteNotificationTooltip();
					self.initializeTutorialModal(currentID);
				}
			}, true);
			tooltipSkip.addEventListener("click", function(event){  //$NON-NLS-0$
				self.handleTutorialSkip(currentID);
				self.deleteNotificationTooltip();
			}, false);
			self.$notifyFrame.appendChild(self.$notificationToolTip);
		},
		/*
		 * Internal.  Hides the tutorial modal. 
		 */
		hide: function() {
			var activeElement = document.activeElement;
			var hasFocus = this.$frameParent === activeElement || (this.$frameParent.compareDocumentPosition(activeElement) & 16) !== 0;
			var originalFocus = this.$originalFocus;
			if (hasFocus && originalFocus && document.compareDocumentPosition(originalFocus) !== 1) {
				originalFocus.focus();
			}
			var self = this;
			window.setTimeout(function() { self.destroy(); }, 0);
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
