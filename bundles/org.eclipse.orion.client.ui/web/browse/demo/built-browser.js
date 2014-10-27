/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define(['browse/builder/browse'],
function(mFileBrowser) {
	new mFileBrowser(
		"fileBrowser",
		//"https://github.com/eclipse/orion.client.git&token=3bbaae0679391edd086b665627fbbe5b7168ff50",
		"https://github.com/libingw/test1.git",
		//"https://beta3.hub.jazz.net/project/mwilson/Notes",
		//"https://beta3.hub.jazz.net/project/libingw/testReadonlyWidget",
		//"https://hub.jazz.net/project/chrisg65/JEANPolls",
		//"https://qa.hub.jazz.net/git/gheorghe/testGerritDeploy",
		//"https://github.com/eclipse/orion.client.git",
		//"https://hub.jazz.net/git/libingw/testGerrit",
		//"https://hub.jazz.net/git/libingw/test.gerrit.0627.space",
		//"https://beta3.hub.jazz.net/project/libingw/testCCM1",
		//"https://hub.jazz.net/project/rschoon/Jazz%20In%20Flight",
		//"https://beta3.hub.jazz.net/project/libingw/Test%20Long%20SCM%20project%20name%20with%20space",
		//"https://hub.jazz.net/git/mwilson/PDF.in.the.README",
		//"https://github.com/libingw/test1.git&token=3bbaae0679391edd086b665627fbbe5b7168ff50",
		//"https://hub.jazz.net/git/spirit/My.Cool.Project",
		//"https://github.com/theMcQ/private-for-libing.git&token=3bbaae0679391edd086b665627fbbe5b7168ff50",
		//"https://qa.hub.jazz.net/git/libingw/testHostedGitRelativeURL",
		//"https://github.com/theMcQ/myprivaterepo.git",
		//"https://hub.jazz.net/project/libingw/testJazzSCM1213",
		//"https://hub.jazz.net/project/libingw/testRTC0714",
		//"https://hub.jazz.net/ccm03", 
		//"https://beta3.hub.jazz.net/ccm01",
		//"https://beta3.hub.jazz.net/ccm02",
		null /*,
		{maxLine: 20, fileURL: "https://api.github.com/repos/libingw/test1/contents!testBranch/demo.html", start: 23, end: 192}
		null ,
		{maxLine: 20, originalHref:"http://libingw.orion.eclipse.org:8080/browse/demo/demoBrowse.html?shareSnippet=true#https://api.github.com/repos/libingw/test1/contents!master/sampleLeft.js,start=599,end=760",
		fileURL: "https://api.github.com/repos/libingw/test1/contents!testBranch/demo.html", start: 23, end: 192}*/
	); 
});
