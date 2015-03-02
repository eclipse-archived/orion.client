/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define(['domReady', 'orion/xhr', 'orion/PageUtil', 'orion/PageLinks', 'orion/xsrfUtils', 'orion/webui/littlelib', './common'], function(domReady, xhr, PageUtil, PageLinks, xsrfUtils, lib, common) {

	function confirmLogin(e, username, password) {
		e.preventDefault();

		if (!username) {
			username = document.getElementById('username').value.trim();
			password = document.getElementById('password').value;
		}

		if (username.length > 0 && password.length > 0){

			var mypostrequest = new XMLHttpRequest();
			mypostrequest.onreadystatechange = function() {
				if (mypostrequest.readyState === 4) {
					if (mypostrequest.status !== 200 && window.location.href.indexOf("http") !== -1) {
						var responseObject = JSON.parse(mypostrequest.responseText);
						common.showStatusMessage(responseObject.error);
					} else {
						finishLogin(username, password);
					}
				}
			};

			var parameters = "username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password);
			mypostrequest.open("POST", "../login/form", true);
			mypostrequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			mypostrequest.setRequestHeader("Orion-Version", "1");
			xsrfUtils.addCSRFNonce(mypostrequest);
			mypostrequest.send(parameters);
		}
	}

	function finishLogin() {
		var redirect = getRedirect();
		var username = document.getElementById('username').value.trim();
		var	password = document.getElementById('password').value;
		redirect = redirect === null ? PageLinks.getOrionHome() : redirect;

		if (redirect !== null) {
			redirect = decodeURIComponent(redirect);
			if(PageUtil.validateURLScheme(redirect)) {
				window.location = redirect;
				return;
			}
		}
		window.close();

	}

	function getRedirect() {
		var regex = new RegExp('[\\?&]redirect=([^&#]*)');
		var results = regex.exec(window.location.href);
		return results === null ? null : results[1];
	}

	function setUpLoginPage () {
		document.getElementById("signInBtn").addEventListener("click", confirmLogin, false);

		document.getElementById("username").addEventListener("keypress", function(event) {
			if (event.keyCode === lib.KEY.ENTER) {
				confirmLogin();
				lib.stop(event);
			}
		});

		document.getElementById("password").addEventListener("keypress", function(event) {
			if (event.keyCode === lib.KEY.ENTER) {
				confirmLogin();
				lib.stop(event);
			}
		});

		xhr("GET", "../server-status.json", { //$NON-NLS-0$
			timeout: 15000,
			responseType: "json"
		}).then(function(result) {
			var messages = result.response.messages;
			if (messages.length > 0) {
				var currentDate = new Date();
				var startDate = new Date(messages[0].startdate);
				startDate.setHours(0, 0, 0, 0);
				if (startDate > currentDate) { return; }
				var endDate = new Date(messages[0].enddate);
				endDate.setHours(23, 59, 59);
				if (endDate <= currentDate)  { return; }
				document.getElementById("orionInfoArea").className = "orion-info";
				document.getElementById("orionInfoMessage").textContent = messages[0].title;
			}
		}, function(error) {
		});
	}

	domReady(function() {
		/* initialize metrics collection for this page */
		var url = new URL("../metrics", window.location); //$NON-NLS-0$
		xhr("GET", url.href, { //$NON-NLS-0$
			headers: {
				"Orion-Version": "1" //$NON-NLS-1$ //$NON-NLS-0$
			},
			log: false
		}).then(
			function(result) {
				result = JSON.parse(result.response);
				if (result.tid) {
					(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
					(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
					m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
					})(window,document,'script','//www.google-analytics.com/analytics.js',GA_ID);

					var args = {};
					if (result.siteSpeedSampleRate) {
						args.siteSpeedSampleRate = result.siteSpeedSampleRate;
					}
					window[GA_ID]("create", result.tid, args); //$NON-NLS-0$
					window[GA_ID]("send", "pageview"); //$NON-NLS-1$ //$NON-NLS-0$
				}
			}
		);

		var error = common.getParam("error");
		if (error) {
			var errorMessage = common.decodeBase64(error);

			common.showStatusMessage(errorMessage);
		}

		var oauth = common.getParam("oauth");
		if (oauth) {
			var oauthMessage = common.decodeBase64(oauth);

			var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1);
			var url = window.location.href;
			var redirectURL = url.replace("LoginWindow", "register");
			console.log(hashes);
			console.log(redirectURL);
			window.location.replace(redirectURL);
		}

		// FIX the hrefs of the various forms here.
		document.getElementById("signInWithGoogle").href = common.createOAuthLink("google");
		document.getElementById("signInWithGitHub").href = common.createOAuthLink("github");

		setUpLoginPage();
	});
});