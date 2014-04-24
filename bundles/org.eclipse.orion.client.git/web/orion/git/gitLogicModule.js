/******************************************************************************* 
 * @license
 * Copyright (c) 2011, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

define(['orion/git/logic/gitCommit','orion/git/logic/gitPush','orion/git/logic/gitCommon'], function(mGitCommit,mGitPush,mGitCommon) {
		return {
			commitLogic : mGitCommit,
			pushLogic : mGitPush
		};			
});