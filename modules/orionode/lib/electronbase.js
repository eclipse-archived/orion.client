/*eslint-env browser, node*/
	var electron = require('electron');
	function addClose(tab, tabContent) {
		var closeBt = document.createElement("span");
		closeBt.classList.add("close");
		closeBt.textContent = "x";
		tab.appendChild(closeBt);
		closeBt.addEventListener("click", function(evt) {
			tabContent.parentNode.removeChild(tabContent);
			redrawTabs();
			evt.preventDefault();
			evt.stopPropagation();
		});
	}
	
	function redrawButtons() {
		var bar = document.querySelector("#bar");
		var buttons = document.createElement("span");
		buttons.classList.add("tabButtons");
		var back = document.createElement("button");
		back.textContent = "<";
		back.classList.add("tabButton");	
		function historyBack(){
			var active = getActiveTab();
			if (!active) return;
			active.contentWindow.history.back();
		}
		function historyForward(){
			var active = getActiveTab();
			if (!active) return;
			active.contentWindow.history.forward();
		}	
		back.addEventListener("click", historyBack);
		buttons.appendChild(back);
		var forward = document.createElement("button");
		forward.textContent = ">";
		forward.classList.add("tabButton");
		forward.addEventListener("click",historyForward);
		buttons.appendChild(forward);
		var refresh = document.createElement("button");
		refresh.textContent = "\u27F2";
		refresh.classList.add("tabButton");
		refresh.addEventListener("click", function() {
			var active = getActiveTab();
			if (!active) return;
			active.contentWindow.location.reload();
		});
		buttons.appendChild(refresh);
		bar.appendChild(buttons);
		
		var _globalShortcut = electron.remote.globalShortcut;	
		_globalShortcut.unregister('Alt+Right');
		_globalShortcut.unregister('Alt+Left');
		_globalShortcut.register('Alt+Right',historyForward);	
		_globalShortcut.register('Alt+Left',historyBack);
	}
	
	function redrawTabs() {
		var bar = document.querySelector("#bar");
		var oldTabs = bar.querySelector("ul");
		if (oldTabs) {
			oldTabs.parentNode.removeChild(oldTabs);
		}
		var ul = document.createElement("ul");
		var tabs = document.querySelectorAll(".tabContent");
		if (!getActiveTab() && tabs.length) {
			tabs[0].classList.add("active");
		}
		var dragSrcEl = null;
		var count = 0;
		Array.prototype.forEach.call(tabs, function(tabContent) {
			var currentTabId = count++;
			var title = tabContent.contentDocument.title;
			var tab = document.createElement("li");
			var draggableAttribute = document.createAttribute('draggable');
			draggableAttribute.value = true;
			tab.setAttributeNode(draggableAttribute);
			var active = window.getComputedStyle(tabContent, null).visibility === "visible";
			tab.className = active ? "active" : "";
			var text = document.createElement("span");
			text.classList.add("tabLabel");
			text.textContent = title;
			tab.appendChild(text);
			tab.title = title;
			tab.tabId = currentTabId;
			tabContent.tabId = currentTabId; 
			text.tabId = currentTabId;
			tab.addEventListener("click", function(evt) {
				var tabs1 = document.querySelectorAll(".tabContent");
				var items1 = document.querySelectorAll("li");
				var indexOftabToActivate;
				for (var j=0; j<tabs1.length; j++) {
					if(tabs1[j].tabId === evt.target.tabId){
						tabs1[j].classList.add("active");
					}else{
						tabs1[j].classList.remove("active");
					}
					items1[j].classList.remove("active");
					if(items1[j].tabId === evt.target.tabId){
						indexOftabToActivate = j;
					}
				}
				items1[indexOftabToActivate].classList.add("active");
				activateTarget(tabs1,evt.target.tabId);
				activateTarget(items1,evt.target.tabId);
				evt.preventDefault();
				evt.stopPropagation();
			});
			tab.addEventListener('dragstart', function(evt){
				if(evt.target.nodeName === "LI"){
					dragSrcEl = evt.target;
				}else if(evt.target.nodeName === "SPAN"){
					dragSrcEl = evt.target.parentNode;
				}
			});
			tab.addEventListener('dragenter', function(evt){
				if (evt.preventDefault) {
					evt.preventDefault(); // Necessary. Allows us to drop.
				}
				if(evt.target.nodeName === "LI"){
					if(evt.target.isSameNode(dragSrcEl.previousSibling)){
						// drag forward
						console.log("drag forward,replace "+ dragSrcEl.previousSibling.innerText);
						var replacedTab = ul.replaceChild(dragSrcEl, evt.target);
						ul.insertBefore(replacedTab, dragSrcEl.nextSibling);
					}else{
						// drag back
						console.log("drag back,replace "+ dragSrcEl.nextSibling.innerText);
						var replacedTab = ul.replaceChild(dragSrcEl, evt.target);
						ul.insertBefore(replacedTab, dragSrcEl);
					}
				}
	  			return false;
			});
			tab.addEventListener('dragover', function(evt){
				if (evt.preventDefault) {
					evt.preventDefault(); // Necessary. Allows us to drop.
				}
	  			return false;
			});
			tab.addEventListener('drop', function(evt){
				if (evt.stopPropagation) {
					evt.stopPropagation(); // stops the browser from redirecting.
				}
				var that = this;
				return false;
			});
			if (tabs.length > 1) {
				addClose(tab, tabContent);
			}
			ul.appendChild(tab);
		});
		bar.appendChild(ul);
		checkWidth();
	}
	
	function checkWidth(reset) {
		var bar = document.querySelector("#bar");
		var ul = bar.querySelector("ul");
		if (!bar || !ul) return;
		var items2 = ul.querySelectorAll("li");
		if (reset) {
			Array.prototype.forEach.call(items2, function(tab) {
				tab.style.flexBasis = "";
			});
		}
		if (bar.getBoundingClientRect().right < ul.lastChild.getBoundingClientRect().right) {
			Array.prototype.forEach.call(items2, function(tab) {
				tab.style.flexBasis = "0";
			});
		}
	}
	
	function getActiveTab() {
		return document.querySelector(".tabContent.active");
	}
	
	function activateTarget(elements, targetId){
		
	}
	
	function load() {
		redrawButtons();
		createTab(window.location.hash.substr(1));
		window.addEventListener("resize", function() {
			if (this.timeout) window.clearTimeout(this.timeout);
			this.timeout = window.setTimeout(function() {
				checkWidth(true);
			}, 50);
		});
	}
	
	var count = 0;
	function createTab(url) {
		count++
		var iframe = document.createElement("iframe");
		iframe.frameBorder = "0";
		iframe.classList.add("tabContent");
		iframe.src = url;
		var __dialogModule = electron.remote.dialog;
		var __clipboardModule = electron.clipboard;
		
		iframe.addEventListener("load", function() {
			
			iframe.contentWindow.confirm = window.confirm;
			iframe.contentWindow.alert = window.alert;
			iframe.contentWindow.__dialogModule = __dialogModule;
			iframe.contentWindow.__clipboardModule = __clipboardModule;
			
			var target = iframe.contentDocument.querySelector('head > title');
			
			if (target) {
				var observer = new window.WebKitMutationObserver(function(mutations) {
					mutations.forEach(function() {
						redrawTabs();
					});
				});
				observer.observe(target, { subtree: true, characterData: true, childList: true });
			}
			redrawTabs();
		});
		document.body.appendChild(iframe);
		redrawTabs();
	}