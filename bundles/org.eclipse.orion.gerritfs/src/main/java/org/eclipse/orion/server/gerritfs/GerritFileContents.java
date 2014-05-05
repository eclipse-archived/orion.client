/*******************************************************************************
 * Copyright (c) 2010, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

package org.eclipse.orion.server.gerritfs;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jgit.lib.Config;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.treewalk.filter.PathFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gerrit.extensions.annotations.Export;
import com.google.gerrit.httpd.WebSession;
import com.google.gerrit.reviewdb.client.Project.NameKey;
import com.google.gerrit.server.AccessPath;
import com.google.gerrit.server.account.AccountCache;
import com.google.gerrit.server.account.AccountState;
import com.google.gerrit.server.config.GerritServerConfig;
import com.google.gerrit.server.git.GitRepositoryManager;
import com.google.gerrit.server.project.NoSuchProjectException;
import com.google.gerrit.server.project.ProjectControl;
import com.google.inject.Inject;
import com.google.inject.Provider;
import com.google.inject.Singleton;

@Export("/contents/*")
@Singleton
public class GerritFileContents  extends HttpServlet {
	private final GitRepositoryManager repoManager;
	private final ProjectControl.Factory projControlFactory;
	private final Provider<WebSession> session;
	private final AccountCache accountCache;
	private final Config config;
	
	private static Logger log = LoggerFactory
			.getLogger(GerritFileContents.class);
	@Inject
	public GerritFileContents(final GitRepositoryManager repoManager, final ProjectControl.Factory project, Provider<WebSession> session, AccountCache accountCache,
		    @GerritServerConfig Config config) {
		this.repoManager = repoManager;
		this.projControlFactory = project;
		this.session = session;
		this.accountCache = accountCache;
		this.config = config;
	}
	
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		final ServletOutputStream out = resp.getOutputStream();
		ByteArrayOutputStream baos;
		
		String username = req.getRemoteUser();
		if (username != null) {
			 if (config.getBoolean("auth", "userNameToLowerCase", false)) {
			      username = username.toLowerCase(Locale.US);
		    }
			log.debug("User name: " + username);
		 	final AccountState who = accountCache.getByUsername(username);
		 	log.debug("AccountState " + who);
		 	if (who != null && who.getAccount().isActive()) {
		 		log.debug("Not anonymous user");
		 		WebSession ws = session.get();
		 		ws.setUserAccountId(who.getAccount().getId());
		 		ws.setAccessPathOk(AccessPath.REST_API, true);
		    } else {
		    	log.debug("Anonymous user");
		    }
		}
		try {
			String pathInfo = req.getPathInfo();
			Pattern pattern = Pattern.compile("/([^/]*)(?:/([^/]*)(?:/(.*))?)?");
			Matcher matcher = pattern.matcher(pathInfo);
			matcher.matches();
			String projectName = null;
			String refName = null;
			String filePath = null;
			if (matcher.groupCount() > 0) {
				projectName = matcher.group(1);
				refName = matcher.group(2);
				filePath = matcher.group(3);
				if (projectName == ""  || projectName == null) {
					projectName = null;
				} else {
					projectName = java.net.URLDecoder.decode(projectName, "UTF-8");
				}
				if (refName == ""  || refName == null) {
					refName = null;
				} else {
					refName = java.net.URLDecoder.decode(refName, "UTF-8");
				}
				if (filePath == "" || filePath == null) {
					filePath = null;
				} else {
					filePath = java.net.URLDecoder.decode(filePath, "UTF-8");
				}
			}
			if (projectName != null) {
				NameKey projName = NameKey.parse(projectName);
				ProjectControl control;
				try {
					control = projControlFactory.controlFor(projName);
					if (!control.isVisible()) {
						log.debug("Project not visible!");
						resp.sendError(HttpServletResponse.SC_UNAUTHORIZED, "You need to be logged in to see private projects");
						return;
					}
				} catch (NoSuchProjectException e1) {
					resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "No such project exists.");
				}
			}
			if (projectName == null || refName == null || filePath == null) {
				resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "You need to provide a projectName, refName and filePath.");
				return;
			} else {
				NameKey projName = NameKey.parse(projectName);
				Repository repo = repoManager.openRepository(projName);
				Ref head = repo.getRef(refName);
				RevWalk walk = new RevWalk(repo);
				RevCommit commit = walk.parseCommit(head.getObjectId());
				RevTree tree = commit.getTree();

				TreeWalk treeWalk = new TreeWalk(repo);
				treeWalk.addTree(tree);
				treeWalk.setRecursive(true);
				treeWalk.setFilter(PathFilter.create(filePath));
				if (!treeWalk.next()){
					throw new IllegalStateException("No file found");
				}
				
				ObjectId objId = treeWalk.getObjectId(0);
				ObjectLoader loader = repo.open(objId);
				resp.setHeader("Cache-Control", "no-cache");
				resp.setHeader("ETag", "\"" + tree.getId().getName() + "\"");
				resp.setContentType("application/octet-stream");
				loader.copyTo(out);
				walk.release();
				treeWalk.release();
			}
		} finally {
			out.close();
		}
	}

}
