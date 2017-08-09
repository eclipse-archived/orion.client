/*******************************************************************************
 * Copyright (c) 2017 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env mocha */
var assert = require("assert"),
	express = require("express"),
	supertest = require("supertest"),
	path = require("path"),
	testdata = require("../support/test_data"),
	middleware = require("../../index.js");

var WORKSPACE = path.join(__dirname, ".test_workspace");

var orion = function(options) {
	// Ensure tests run in 'single user' mode
	var opts = options || {};
	opts.workspaceDir = WORKSPACE;
	opts.configParams = { "orion.single.user": true };
	return middleware(opts);
};

describe("Gitapi endpoint", function() {
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitAddTest.java
	 */
	describe("Git add tests", function() {
		it("testAddChanged");
		it("testAddMissing");
		it("testAddAll");
		it("testAddFolder");
		it("testAddFolderAndCheckGit");
		it("testAddAllWhenInFolder");
		it("testAddSelected");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitApplyPatchTest.java
	 */
	describe("Git patch tests", function() {
		it("testApplyPatch_addFile");
		it("testApplyPatch_deleteFile");
		it("testApplyPatch_modifyFile");
		it.skip("testApplyPatch_modifyFileFormatError");
		it("testApplyPatch_modifyFileApplyError");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitBlameTest.java
	 */
	describe("Git blame tests", function() {
		it("testBlameNoCommits");
		it("testBlameOneCommit");
		it("testBlameMultiCommit");
		it("testBlameMultiFile");
		it("testFolderBlame");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitBranchTest.java
	 */
	describe("Git branch tests", function() {
		it("testListBranches");
		it("testAddRemoveBranch");
		it("testCreateTrackingBranch");
		it("testCheckoutAmbiguousName");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitCheckoutTest.java
	 */
	describe("Git checkout tests", function() {
		it("testCheckoutAllPaths");
		it.skip("testCheckoutDotPath");
		it("testCheckoutFolderPath");
		it("testCheckoutEmptyPaths");
		it("testCheckoutPathInUri");
		it("testCheckoutWrongPath");
		it("testCheckoutUntrackedFile");
		it("testCheckoutAfterResetByPath");
		it("testCheckoutInFolder");
		it("testCheckoutFileOutsideCurrentFolder");
		it("testCheckoutBranch");
		it("testCheckoutEmptyBranchName");
		it("testCheckoutInvalidBranchName");
		it("testCheckoutAborted");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitCherryPickTest.java
	 */
	describe("Git cherry-pick tests", function() {
		it("testCherryPick");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitCloneTest.java
	 */
	describe("Git clone tests", function() {
		it("testClone");
		it("testGetCloneEmpty");
		it("testGetClone");
		it("testCloneAndCreateProjectByName");
		it("testCloneIntoNewProjectWithDuplicateCloneName");
		it("testCloneAndCreateFolderByPath");
		it("testCloneEmptyPath");
		it("testCloneEmptyPathBadUrl");
		it("testCloneBadUrl");
		it("testCloneBadUrlBadScpUri");
		it("testCloneLocalFilePath");
		it("testCloneEmptySchemeAndHost");
		it("testCloneEmptySchemeAndPath");
		it("testCloneValidScpSshUri");
		it("testCloneMissingUserInfo");
		it("testCloneNotGitRepository");
		it("testCloneAndLink");
		it("testCloneAndLinkToFolder");
		it("testLinkToFolderWithDefaultSCM");
		it("testCloneOverSshWithNoKnownHosts");
		it("testCloneOverSshWithNoPassword");
		it("testCloneOverSshWithBadPassword");
		it("testCloneOverSshWithPassword");
		it("testCloneOverSshWithPassphraseProtectedKey");
		it("testDeleteInProject");
		it("testDeleteInFolder");
		it("testDeleteInWorkspace");
		it("testGetCloneAndPull");
		it("testGetNonExistingClone");
		it("testGetEmptyPath");
		it("testGetOthersClones");
		it("testCloneAlreadyExists");
		it("testCloneOverSshWithPassword");
		it("testCloneOverSshWithPassword");
		it("testCloneOverSshWithPassword");
		it("testCloneOverSshWithPassword");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitCommitTest.java
	 */
	describe("Git commit tests", function() {
		it("testCommitOnly");
		it("testCommitNoComment");
		it("testCommitEmptyComment");
		it("testCommitAll");
		it("testCommitAmend");
		it("testCommitHeadContent");
		it.skip("testCommitContentBySha");
		it("testCommitAllInFolder");
		it("testCommitWithCommiterOverwritten");
		it("testCommitWithAuthorOverwritten");
		it("testCommitterAndAuthorFallback");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitConfigTest.java
	 */
	describe("Git config tests", function() {
		it.skip("testClonedRepoConfigUsingUserProfile");
		it.skip("testInitializedRepoConfigUsingUserProfile");
		it("testGetListOfConfigEntries");
		it("testAddConfigEntry");
		it("testGetSingleConfigEntry");
		it("testUpdateConfigEntryUsingPOST");
		it("testUpdateConfigEntryUsingPUT");
		it("testDeleteConfigEntry");
		it("testCreateInvalidConfigEntry");
		it("testUpdateNonExistingConfigEntryUsingPUT");
		it("testRequestWithMissingArguments");
		it("testGetConfigEntryForNonExistingRepository");
		it("testKeyToSegmentsMethod");
		it("testSegmentsToKeyMethod");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitDiffTest.java
	 */
	describe("Git diff tests", function() {
		it("testNoDiff");
		it("testDiffAlreadyModified");
		it("testDiffModifiedByOrion");
		it("testDiffFilter");
		it("testDiffPaths");
		it("testDiffCached");
		it("testDiffCommits");
		it("testDiffCommitWithWorkingTree");
		it("testDiffBranchWithWorkingTree");
		it("testDiffPost");
		it("testDiffParts");
		it("testDiffUntrackedUri");
		it("testDiffWithCommonAncestor");
		it("testDiffForBranches");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitFetchTest.java
	 */
	describe("Git fetch tests", function() {
		it("testFetchRemoteBranchUpToDate");
		it("testFetchRemoteUpToDate");
		it("testPushCommitAndFetch");
		it("testPushAndFetchWithPrivateKeyAndPassphrase");
		it("testFetchRemote");
		it("testFetchRemoteBranch");
		it("testForcedFetch");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitIndexTest.java
	 */
	describe("Git index tests", function() {
		it("testIndexModifiedByOrion");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitInitTest.java
	 */
	describe("Git init tests", function() {
		it("testInit");
		it("testInitAndCreateProjectByName");
		it("testInitAndCreateFolderByPath");
		it("testInitWithoutNameAndFilePath");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitLogTest.java
	 */
	describe("Git log tests", function() {
		it("testLog");
		it.skip("testLogOrionServerLinked");
		it("testLogRemoteBranch");
		it("testLogWithTag");
		it("testLogWithBranch");
		it("testLogWithParents");
		it("testLogFolder");
		it("testLogFile");
		it("testLogNewFile");
		it("testLogNewBranch");
		it("testDiffFromLog");
		it("testToRefKey");
		it("testFromRefKey");
		it("testRefPropertiesForCommits");
		it("testGetNonExistingCommit");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitMergeSquashTest.java
	 */
	describe("Git merge / squash tests", function() {
		it("testMergeSquashSelf");
		it("testMergeSquash");
		it("testMergeSquashAlreadyUpToDate");
		it("testMergeSquashConflict");
		it("testMergeSquashIntoLocalFailedDirtyWorkTree");
		it("testMergeSquashFailedDirtyWorkTree");
		it("testMergeSquashRemote");
		it("testMergeSquashRemovingFolders");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitMergeTest.java
	 */
	describe("Git merge tests", function() {
		it("testMergeSelf");
		it("testMerge");
		it("testMergeAlreadyUpToDate");
		it("testMergeConflict");
		it("testMergeIntoLocalFailedDirtyWorkTree");
		it("testMergeFailedDirtyWorkTree");
		it("testMergeRemote");
		it("testMergeRemovingFolders");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitPullTest.java
	 */
	describe("Git pull tests", function() {
		it("testPullRemoteUpToDate");
		it("testPullRemote");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitPushTest.java
	 */
	describe("Git push tests", function() {
		it("testPushNoBody");
		it("testPushHead");
		it("testPushHeadSshWithPrivateKeyPassphrase");
		it("testPushBranch");
		it("testPushToDelete");
		it("testPushFromLog");
		it("testPushRejected");
		it("testPushRemoteRejected");
		it("testForcedPush");
		it("testPushTags");
		it("testPushNewBranchToSecondaryRemote");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitRebaseTest.java
	 */
	describe("Git rebase tests", function() {
		it("testRebaseSelf");
		it("testRebase");
		it("testRebaseStopOnConflictAndAbort");
		it("testRebaseStopOnConflictAndContinue");
		it("testRebaseStopOnConflictAndSkipPatch");
		it("testRebaseInvalidOperation");
		it("testRebaseOnRemote");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitRemoteTest.java
	 */
	describe("Git remote tests", function() {
		it("testGetNoRemote");
		it("testGetOrigin");
		it("testGetUnknownRemote");
		it("testGetRemoteCommits");
		it("testGetRemoteBranches");
		it("testAddRemoveRemote");
		it("testRemoteProperties");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitResetTest.java
	 */
	describe("Git reset tests", function() {
		it("testResetChanged");
		it("testResetChangedWithPath");
		it("testResetNull");
		it("testResetNotImplemented");
		it("testResetBadType");
		it("testResetMixedAll");
		it.skip("testResetAutocrlfTrue");
		it("testResetToRemoteBranch");
		it("testResetPathsAndRef");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitRevertTest.java
	 */
	describe("Git revert tests", function() {
		it("testRevert");
		it("testRevertFailure");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitStashTest.java
	 */
	describe("Git stash tests", function() {
		it("testEmptyStashList");
		it("testStashListPagination");
		it("testStashCreateWithUntracked");
		it("testStashCreateWithUntrackedAndIndex");
		it("testStashApply");
		it("testStashDrop");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitStatusTest.java
	 */
	describe("Git status tests", function() {
		it("testStatusCleanClone");
		it("testStatusCleanLink");
		it("testStatusAdded");
		it.skip("testStatusAssumeUnchanged");
		it("testStatusChanged");
		it("testStatusChangedAndModified");
		it.skip("testStatusMissing");
		it("testStatusModified");
		it("testStatusRemoved");
		it("testStatusUntracked");
		it("testStatusWithPath");
		it("testStatusLocation");
		it("testStatusDiff");
		it("testStatusSubfolderDiff");
		it("testStatusCommit");
		it("testConflict");
		it("testFileLogFromStatus");
		it("testCloneAndBranchNameFromStatus");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitSubmoduleTest.java
	 */
	describe("Git submodule tests", function() {
		it("testGetSubmodulesLocation");
		it("testAddSubmodule");
		it("testSyncSubmodule");
		it("testUpdateSubmodule");
		it("testRemoveSubmodule");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitTagTest.java
	 */
	describe("Git tag tests", function() {
		it("testTag");
		it("testListDeleteTags");
		it("testTagFailed");
		it("testTagFromLogAll");
		it("testCheckoutTag");
		it("testListOrionServerTags");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitUriTest.java
	 */
	describe("Git URI tests", function() {
		it("testGitUrisAfterLinkingToExistingClone");
		it("testGitUrisInContentLocation");
		it("testGitUrisForEmptyDir");
		it("testGitUrisForFile");
		it("testGitUrisForRepositoryClonedIntoSubfolder");
	});
	/**
	 * From: org.eclipse.orion.server.tests.servlets.git.GitUtilsTest.java
	 */
	describe("Git utils tests", function() {
		it("testGitDirPathNoGit");
		it("testGitDirPathLinked");
		it("testGitDirPathLinkedToSubfolder");
		it("testGitDirEmptyPath");
		it("testGetGitDirWorkspaceIsInRepo");
		it("testGitDirsNoGit");
		it("testGitDirPathLinkedRemovedFile");
		it.skip("testGitDirsLinked");
		it("testGitDirsCloned");
		it("testGitDirsClonedIntoSubfolder");
		it("testGetRelativePath");
	});
});