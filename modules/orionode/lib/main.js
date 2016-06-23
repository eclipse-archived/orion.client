/*eslint-env browser, node*/
	var electron = require('electron');
	var dragSrcEl = null;
	function addClose(tab) {
		var closeBt = document.createElement("span");
		closeBt.classList.add("close");
		closeBt.textContent = "x";
		var id = tab.id.slice(3)
		var tabContent = document.getElementById("iframe"+id);
		tab.appendChild(closeBt);
		closeBt.addEventListener("click", function(evt) {
			tabContent.parentNode.removeChild(tabContent);
			tab.parentNode.removeChild(tab);
			resetActiveAfterclose();
			checkWidth();
			adjustFirstTabChildren();
			evt.preventDefault();
			evt.stopPropagation();
		});
	}
	
	function resetActiveAfterclose(){
		var tabcontents = document.querySelectorAll(".tabContent");
		var tabbuttons = document.querySelectorAll("li");
		if (!getActiveTab() && tabcontents.length) {
			tabcontents[0].classList.add("active");
			tabbuttons[0].classList.add("active");
		}
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
	
	function addNewtab(id , iframe){
		var bar = document.querySelector("#bar");
		var tabParent = bar.querySelector("ul");	
		if(!tabParent){
			var initializing = true;
			tabParent = document.createElement("ul");
		}
		var tabcontents = document.querySelectorAll(".tabContent");   // Only used for number counting to adjust tab's width
		if (!getActiveTab() && tabcontents.length) {
			tabcontents[0].classList.add("active");
		}
		var tab = document.createElement("li");
		var title = iframe.contentDocument.title;
		tab.setAttribute('id', "tab"+id);
		tab.setAttribute('draggable', true);
		tab.className = initializing ? 'active':'';
		var text = document.createElement("span");
		text.classList.add("tabLabel");
		if (tabcontents.length > 1) {
			text.classList.add("tabLabelmoreItem");  
		}
		text.textContent = title;
		tab.appendChild(text);
		tab.title = title;
		tab.addEventListener("click", function(evt) {
			var currentTabcontents = document.querySelectorAll(".tabContent"); 
			var tabbuttons = document.querySelectorAll("li");
			for (var j=0; j<tabbuttons.length; j++) {
				tabbuttons[j].classList.remove("active");
				currentTabcontents[j].classList.remove("active");
			}
			this.classList.add("active");
			iframe.classList.add("active");
			evt.preventDefault();
			evt.stopPropagation();
		});
		
		tab.addEventListener('dragstart', function(evt){
			dragSrcEl = getClosestLi(evt.target);
			var crt = this.cloneNode(true);
		    crt.style.display = "none";
		    evt.dataTransfer.setDragImage(crt, 0, 0);
		});
		tab.addEventListener('dragenter', function(evt){
			if (evt.preventDefault) {
				evt.preventDefault(); // Necessary. Allows us to drop.
			}
			var targerTabElement = getClosestLi(evt.target);
			if(dragSrcEl){
				if(getClosestLi(evt.target).isSameNode(dragSrcEl.previousSibling)){
					// drag forward
					var replacedTab1 = tabParent.replaceChild(dragSrcEl, targerTabElement);
					tabParent.insertBefore(replacedTab1, dragSrcEl.nextSibling);
				}else{
					// drag back
					var replacedTab2 = tabParent.replaceChild(dragSrcEl, targerTabElement);
					tabParent.insertBefore(replacedTab2, dragSrcEl);
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
			return false;
		});
		tabParent.appendChild(tab);
		if (tabcontents.length > 1) {
			addClose(tab);
		}
		if(initializing){
			bar.appendChild(tabParent);
		}
		
		checkWidth();
	}
	
	function redrawTabLabel(id, iframe){
		var tabs = document.querySelectorAll("li"); 
		var targetTab = document.getElementById("tab"+id);
		var oldTablabel =  targetTab.querySelector(".tabLabel");
		var closeButton =  targetTab.querySelector(".close");
		if (targetTab) {
			targetTab.removeChild(oldTablabel);
		}
		var text = document.createElement("span");
		text.classList.add("tabLabel");
		if (tabs.length > 1) {
			text.classList.add("tabLabelmoreItem");  
		}
		var title = iframe.contentDocument.title;
		text.textContent = title;
		if(closeButton){
			targetTab.appendChild(text);
		}else{
			targetTab.insertBefore(text, closeButton);
		}
	}
	
	function getClosestLi(el) {
		while (el) {
	        if (el.nodeName === "LI") {
	            return el;
	        }
        	el = el.parentElement;
    	}
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
	
	function createTab(url) {
		var iframe = document.createElement("iframe");
		iframe.frameBorder = "0";
		iframe.classList.add("tabContent");
		iframe.src = url;
		var __dialogModule = electron.remote.dialog;
		var __clipboardModule = electron.clipboard;
		var __autoUpdaterModule = electron.remote.autoUpdater;
		var id = Date.now();
		iframe.id = "iframe"+ id;
		iframe.addEventListener("load", function() {
			
			iframe.contentWindow.confirm = window.confirm;
			iframe.contentWindow.alert = window.alert;
			iframe.contentWindow.__dialogModule = __dialogModule;
			iframe.contentWindow.__clipboardModule = __clipboardModule;
			if (__autoUpdaterModule.updateURL) {
				iframe.contentWindow.__autoUpdaterModule = __autoUpdaterModule;
			}
			
			var target = iframe.contentDocument.querySelector('head > title');
			
			if (target) {
				var observer = new window.WebKitMutationObserver(function(mutations) {
					if(mutations){
						redrawTabLabel(id,iframe);
					}
				});
				observer.observe(target, { subtree: true, characterData: true, childList: true });
			}
			redrawTabLabel(id,iframe);
		});
		document.body.appendChild(iframe);
		addNewtab(id, iframe);
		adjustFirstTabChildren();
	}
	
	function adjustFirstTabChildren(){
		var tabbuttons = document.querySelectorAll("li");
		var firstTab = tabbuttons[0];
		var text = firstTab.querySelector(".tabLabel");
		if(tabbuttons.length === 1){
			// This section only useful to remove close button and class from initial tab when others tabs are closed
			var closeButton1 =  firstTab.querySelector(".close");
			if(closeButton1){
				firstTab.removeChild(closeButton1);
				text.classList.remove('tabLabelmoreItem');
			}
		}else if(tabbuttons.length > 1){
			// This section only useful to add the class and close button to initial tab when second tab is created.
			var closeButton2 =  firstTab.querySelector(".close");
			if(!closeButton2){
				addClose(firstTab);
			}
			text.classList.add('tabLabelmoreItem');
		}
	}