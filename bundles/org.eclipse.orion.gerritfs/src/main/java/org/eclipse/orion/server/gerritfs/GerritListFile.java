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

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.Config;
import org.eclipse.jgit.lib.FileMode;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.CanonicalTreeParser;
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

@Export("/list/*")
@Singleton
public class GerritListFile extends HttpServlet {
	private final GitRepositoryManager repoManager;
	private final ProjectControl.Factory projControlFactory;
	private final Provider<WebSession> session;
	private final AccountCache accountCache;
	private final Config config;
	
	private static Logger log = LoggerFactory
			.getLogger(GerritListFile.class);

	@Inject
	public GerritListFile(final GitRepositoryManager repoManager, final ProjectControl.Factory project, Provider<WebSession> session, AccountCache accountCache,
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
		    
		final PrintWriter out = resp.getWriter();
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
				if (projectName == "" || projectName == null) {
					projectName = null;
				} else {
					projectName = java.net.URLDecoder.decode(projectName, "UTF-8");
				}
				if (refName == "" || refName == null) {
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
				if (filePath == null)
					filePath = "";
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
				}
				Repository repo = repoManager.openRepository(projName);
				if (refName == null) {
					ArrayList<HashMap<String, String>> contents = new ArrayList<HashMap<String, String>>();
					List<Ref> call;
					try {
						call = new Git(repo).branchList().call();
						for (Ref ref : call) {
							HashMap<String, String> jsonObject = new HashMap<String, String>();
							jsonObject.put("name", ref.getName());
							jsonObject.put("type", "ref");
							jsonObject.put("size", "0");
							jsonObject.put("path", "");
							jsonObject.put("project", projectName);
							jsonObject.put("ref", ref.getName());
							contents.add(jsonObject);
						}
						String response = JSONUtil.write(contents);
						resp.setContentType("application/json");
						resp.setHeader("Cache-Control", "no-cache");
						resp.setHeader("ETag", "W/\"" + response.length() + "-" + response.hashCode() + "\"");
						log.debug(response);
						out.write(response);
					} catch (GitAPIException e) {
					}
				} else {
					Ref head = repo.getRef(refName);
					if (head == null) {
						ArrayList<HashMap<String, String>> contents = new ArrayList<HashMap<String, String>>();
						String response = JSONUtil.write(contents);
						resp.setContentType("application/json");
						resp.setHeader("Cache-Control", "no-cache");
						resp.setHeader("ETag", "W/\"" + response.length() + "-" + response.hashCode() + "\"");
						log.debug(response);
						out.write(response);
						return;
					}
					RevWalk walk = new RevWalk(repo);
					// add try catch to catch failures
					RevCommit commit = walk.parseCommit(head.getObjectId());
					RevTree tree = commit.getTree();
					TreeWalk treeWalk = new TreeWalk(repo);
					treeWalk.addTree(tree);
					treeWalk.setRecursive(false);
					if (!filePath.equals("")) {
						PathFilter pathFilter = PathFilter.create(filePath);
						treeWalk.setFilter(pathFilter);
					}
					if (!treeWalk.next()) {
						CanonicalTreeParser canonicalTreeParser = treeWalk
								.getTree(0, CanonicalTreeParser.class);
						ArrayList<HashMap<String, String>> contents = new ArrayList<HashMap<String, String>>();
						if (canonicalTreeParser != null) {
							while (!canonicalTreeParser.eof()) {
								String path = canonicalTreeParser
										.getEntryPathString();
								FileMode mode = canonicalTreeParser
										.getEntryFileMode();
								HashMap<String, String> jsonObject = new HashMap<String, String>();
								jsonObject.put("name", path);
								jsonObject
										.put("type",
												mode.equals(FileMode.TREE) ? "dir"
														: "file");
								jsonObject.put("size", "0");
								jsonObject.put("path", path);
								jsonObject.put("project", projectName);
								jsonObject.put("ref", head.getName());
								contents.add(jsonObject);
								canonicalTreeParser.next();
							}
						}
						String response = JSONUtil.write(contents);
						resp.setContentType("application/json");
						resp.setHeader("Cache-Control", "no-cache");
						resp.setHeader("ETag", "\"" + tree.getId().getName() + "\"");
						log.debug(response);
						out.write(response);
					} else {
						// if (treeWalk.isSubtree()) {
						// treeWalk.enterSubtree();
						// }
						ArrayList<HashMap<String, String>> contents = new ArrayList<HashMap<String, String>>();
						do {
							if (treeWalk.isSubtree()) {
								if (treeWalk.getPathLength() > filePath
										.length()) {
									HashMap<String, String> jsonObject = new HashMap<String, String>();
									jsonObject.put("name",
											treeWalk.getNameString());
									jsonObject.put("type", "dir");
									jsonObject.put("size", "0");
									jsonObject.put("path",
											treeWalk.getPathString());
									jsonObject.put("project", projectName);
									jsonObject.put("ref", head.getName());
									contents.add(jsonObject);
								}
								if (treeWalk.getPathLength() <= filePath
										.length()) {
									treeWalk.enterSubtree();
								}
							} else {
								ObjectId objId = treeWalk.getObjectId(0);
								ObjectLoader loader = repo.open(objId);
								long size = loader.getSize();
								HashMap<String, String> jsonObject = new HashMap<String, String>();
								jsonObject
										.put("name", treeWalk.getNameString());
								jsonObject.put("type", "file");
								jsonObject.put("size", Long.toString(size));
								jsonObject
										.put("path", treeWalk.getPathString());
								jsonObject.put("project", projectName);
								jsonObject.put("ref", head.getName());
								contents.add(jsonObject);
							}
						} while (treeWalk.next());
						String response = JSONUtil.write(contents);
						resp.setContentType("application/json");
						resp.setHeader("Cache-Control", "no-cache");
						resp.setHeader("ETag", "\"" + tree.getId().getName() + "\"");
						log.debug(response);
						out.write(response);
					}
					walk.release();
					treeWalk.release();
				}
			}
		} finally {
			out.close();
		}
	}
}
