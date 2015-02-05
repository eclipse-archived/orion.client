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

define(['domReady', 'orion/xhr', 'orion/xsrfUtils', './common'], function(domReady, xhr, xsrfUtils, common) {
	var userCreationEnabled;
	var registrationURI;
	var forceUserEmail;

	function confirmCreateUser(e) {
		e.preventDefault();

		var mypostrequest = new XMLHttpRequest();
		var username = document.getElementById("username").value;
		var password = document.getElementById("password").value;
		var email =  document.getElementById("email").value;
		mypostrequest.onreadystatechange = function() {
			if (mypostrequest.readyState === 4) {
				if (mypostrequest.status !== 200 && window.location.href.indexOf("http") !== -1) {
					if (!mypostrequest.responseText) {
						return;
					}
					var responseObject = JSON.parse(mypostrequest.responseText);
					common.showErrorMessage(responseObject.Message);
					if(mypostrequest.status === 201){
						common.showErrorMessage(mypostrequest.statusText);
					}
				}
			}
		};

		var formData = {
			UserName : username,
			Password : password,
			Email: email
		};
		mypostrequest.open("POST", "../../users", true);
		mypostrequest.setRequestHeader("Content-type", "application/json;charset=UTF-8");
		mypostrequest.setRequestHeader("Orion-Version", "1");
		xsrfUtils.addCSRFNonce(mypostrequest);
		mypostrequest.send(JSON.stringify(formData));
	}

	function setUpRegisterPage() {
		document.getElementById("password").addEventListener("keyup", function() {
			common.copyText("password", "repeatPassword");
		});

		document.getElementById("repeatPassword").addEventListener("keyup", function() {
			common.copyText("repeatPassword", "password");
		});

		document.getElementById("signUpBtn").addEventListener("click", confirmCreateUser, false);
		document.getElementById("show-password").addEventListener("click", common.passwordSwitcher);
		document.getElementById("hide-password").addEventListener("click", common.passwordSwitcher);
	}

	domReady(function() {
		/* initialize metrics collection for this page */
		var url = new URL("../../metrics", window.location); //$NON-NLS-0$
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

		setUpRegisterPage();
	});
});