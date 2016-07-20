/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *	 IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, node*/
var electron = require('electron');
var dragSrcEl = null;
var contextSrcEl = null;

function redrawButtons() {
	var bar = document.querySelector("#bar");
	var buttons = document.createElement("span");
	buttons.classList.add("tabButtons");
	var back = document.createElement("button");
	back.textContent = "<";
	back.classList.add("tabButton");

	function historyBack() {
		var active = getActiveTab();
		if (!active) return;
		active.contentWindow.history.back();
	}

	function historyForward() {
		var active = getActiveTab();
		if (!active) return;
		active.contentWindow.history.forward();
	}
	back.addEventListener("click", historyBack);
	buttons.appendChild(back);
	var forward = document.createElement("button");
	forward.textContent = ">";
	forward.classList.add("tabButton");
	forward.addEventListener("click", historyForward);
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
	_globalShortcut.register('Alt+Right', historyForward);
	_globalShortcut.register('Alt+Left', historyBack);
}

function addNewTab(id, iframe) {
	var bar = document.querySelector("#bar");
	var tabParent = bar.querySelector("ul");
	if (!tabParent) {
		tabParent = document.createElement("ul");
		bar.appendChild(tabParent);
	}
	var tab = document.createElement("li");
	var title = iframe.contentDocument.title;
	tab.setAttribute('id', "tab" + id);
	tab.setAttribute('draggable', true);
	tab.classList.add("tabItem");
	var text = document.createElement("span");
	text.classList.add("tabLabel");
	text.textContent = title;
	tab.appendChild(text);
	tab.title = title;

	var closeBt = document.createElement("span");
	closeBt.classList.add("close");
	closeBt.textContent = "x";
	tab.appendChild(closeBt);
	closeBt.addEventListener("click", function(evt) {
		iframe.parentNode.removeChild(iframe);
		tab.parentNode.removeChild(tab);
		update();
		evt.preventDefault();
		evt.stopPropagation();
	});

	function setActive() {
		var currentTabcontents = document.querySelectorAll(".tabContent");
		var tabbuttons = document.querySelectorAll(".tabItem");
		for (var j = 0; j < tabbuttons.length; j++) {
			tabbuttons[j].classList.remove("active");
			currentTabcontents[j].classList.remove("active");
		}
		tab.classList.add("active");
		iframe.classList.add("active");
	}

	tab.addEventListener("click", function(evt) {
		setActive();
		evt.preventDefault();
		evt.stopPropagation();
		var menu = document.querySelector("#context-menu");
		menu.classList.remove('context-menu-items-open');
	});

	tab.addEventListener('dragstart', function(evt) {
		setActive();
		dragSrcEl = tab;
		var crt = this.cloneNode(true);
		crt.style.display = "none";
		evt.dataTransfer.setDragImage(crt, 0, 0);
		evt.dataTransfer.effectAllowed = "move";
	});
	tab.addEventListener('dragenter', function(evt) {
		if (evt.preventDefault) {
			evt.preventDefault(); // Necessary. Allows us to drop.
		}
		if (dragSrcEl) {
			if (tab.isSameNode(dragSrcEl.previousSibling)) {
				// drag forward
				var replacedTab1 = tabParent.replaceChild(dragSrcEl, tab);
				tabParent.insertBefore(replacedTab1, dragSrcEl.nextSibling);
			} else {
				// drag back
				var replacedTab2 = tabParent.replaceChild(dragSrcEl, tab);
				tabParent.insertBefore(replacedTab2, dragSrcEl);
			}
		}
		return false;
	});
	tab.addEventListener('dragover', function(evt) {
		if (evt.preventDefault) {
			evt.preventDefault(); // Necessary. Allows us to drop.
		}
		return false;
	});
	tab.addEventListener('drop', function(evt) {
		if (evt.stopPropagation) {
			evt.stopPropagation(); // stops the browser from redirecting.
		}
		return false;
	});
	tab.addEventListener("contextmenu", function(evt) {
		var menu = document.querySelector("#context-menu");
		var activeClassName = "context-menu-items-open";
		contextSrcEl = tab;
		evt.preventDefault();
		menu.classList.remove(activeClassName); // Close old one 
		positionMenu(evt);	// calculate new pisition
		menu.classList.add(activeClassName); // Open new One
	});
	tabParent.appendChild(tab);
	update();
}

function setTabLabel(id, str) {
	var tab = document.getElementById("tab" + id);
	var text = tab.querySelector(".tabLabel");
	tab.title = text.textContent = str;
}

function update() {
	var bar = document.querySelector("#bar");
	if (!bar) return;
	var ul = bar.querySelector("ul");
	if (!ul) return;
	var items = ul.querySelectorAll("li");
	// Activate first tab if none is active
	if (!getActiveTab() && items.length) {
		document.querySelectorAll(".tabContent")[0].classList.add("active");
		items[0].classList.add("active");
	}
	// Hide close if only one tab is shown
	Array.prototype.forEach.call(items, function(tab) {
		tab.querySelector(".close").style.display = "";
	});
	if (items.length === 1) {
		items[0].querySelector(".close").style.display = "none";
	}
	// Shrink tabs if necessary
	Array.prototype.forEach.call(items, function(tab) {
		tab.style.flexBasis = "";
	});
	if (bar.getBoundingClientRect().right < ul.lastChild.getBoundingClientRect().right) {
		Array.prototype.forEach.call(items, function(tab) {
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
			update();
		}, 50);
	});
	registerContextMenu();
}

function createTab(url) {
	var iframe = document.createElement("iframe");
	iframe.frameBorder = "0";
	iframe.classList.add("tabContent");
	iframe.src = url;
	var id = Date.now();
	iframe.id = "iframe" + id;
	iframe.addEventListener("load", function() {
		iframe.contentWindow.confirm = window.confirm;
		iframe.contentWindow.alert = window.alert;
		iframe.contentWindow.__electron = electron;

		var target = iframe.contentDocument.querySelector('head > title');
		if (target) {
			var observer = new window.WebKitMutationObserver(function(mutations) {
				if (mutations) {
					setTabLabel(id, iframe.contentDocument.title);
				}
			});
			observer.observe(target, {
				subtree: true,
				characterData: true,
				childList: true
			});
		}
		setTabLabel(id, iframe.contentDocument.title);
		iframe.contentWindow.addEventListener("click", function() {
			var menu = document.querySelector("#context-menu");
			var activeClassName = "context-menu-items-open";
			menu.classList.remove(activeClassName);
		});
	});
	document.body.appendChild(iframe);
	addNewTab(id, iframe);
}

function registerContextMenu() {
	var menu = document.querySelector("#context-menu");
	var menuitem = document.querySelector(".context-menu-item");
	menuitem.addEventListener("mouseover", function(){
		menuitem.classList.add('context-menu-item-selected');
	});
	menuitem.addEventListener("mouseleave", function(){
		menuitem.classList.remove('context-menu-item-selected');
	});
	// Register on document to make sure click on empty spaces after the tab buttons can close the context menu as well.
	document.addEventListener("click", function(evt) { 
		if (clickInsideElement(evt, 'context-menu-item')) {
			var correspondingiframeId = 'iframe' + contextSrcEl.id.substr(3);
			var corrspondingiframe = document.querySelector('#'+correspondingiframeId);
			// Remove all the other tab buttons first
			var allTabButtons = document.querySelectorAll('.tabs > ul > li');
			var alliframes = document.querySelectorAll('.tabContent');
			if(allTabButtons.length > 1){
				Array.prototype.forEach.call(allTabButtons, function(eachOne) {
					if(eachOne.id !== contextSrcEl.id){
						console.log(eachOne);
						contextSrcEl.parentNode.removeChild(eachOne);
					}
				});
				Array.prototype.forEach.call(alliframes, function(eachOne) {
					if(eachOne.nodeName === 'IFRAME' && eachOne.id !== correspondingiframeId){
						 corrspondingiframe.parentNode.removeChild(eachOne);
					}
				});
				update();
				evt.preventDefault();
				evt.stopPropagation();
			}
		}
		menu.classList.remove('context-menu-items-open');
	});
}
function clickInsideElement(e, className) {
	var el = e.srcElement || e.target;
	if (el.classList.contains(className)) {
		return el;
	}
	while (el) {
		if (el.classList && el.classList.contains(className)) {
			return el;
		}
		el = el.parentNode;
	}
	return false;
}

function positionMenu(e) {
	var menu = document.querySelector("#context-menu");
	var menuWidth;
	var menuHeight;
	var windowWidth;
	var windowHeight;
	var clickCoords;
	var clickCoordsX;
	var clickCoordsY;
	clickCoords = getPosition(e);
	clickCoordsX = clickCoords.x;
	clickCoordsY = clickCoords.y;

	menuWidth = menu.offsetWidth + 4;
	menuHeight = menu.offsetHeight + 4;
	windowWidth = window.innerWidth;
	windowHeight = window.innerHeight;

	if ((windowWidth - clickCoordsX) < menuWidth) {
		menu.style.left = windowWidth - menuWidth + "px";
	} else {
		menu.style.left = clickCoordsX + "px";
	}
	if ((windowHeight - clickCoordsY) < menuHeight) {
		menu.style.top = windowHeight - menuHeight + "px";
	} else {
		menu.style.top = clickCoordsY + "px";
	}
}
function getPosition(e) {
	var posx = 0;
	var posy = 0;
	if (!e) var e = window.event;
	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	} else if (e.clientX || e.clientY) {
		posx = e.clientX + document.body.scrollLeft +
			document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop +
			document.documentElement.scrollTop;
	}
	return {
		x: posx,
		y: posy
	};
}