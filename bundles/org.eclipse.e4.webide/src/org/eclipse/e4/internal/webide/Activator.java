/*******************************************************************************
 * Copyright (c) 2009, 2010 IBM Corporation and others 
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors:
 * IBM Corporation - initial API and implementation
 *******************************************************************************/
package org.eclipse.e4.internal.webide;

import org.osgi.framework.*;
import org.osgi.service.http.*;
import org.osgi.util.tracker.ServiceTracker;

public class Activator implements BundleActivator {

	public static final String PI_SERVER_CORE = "org.eclipse.e4.webide"; //$NON-NLS-1$

	private ServiceTracker<HttpService, HttpService> httpServiceTracker;
	public static volatile BundleContext bundleContext;
	static Activator singleton;

	public static Activator getDefault() {
		return singleton;
	}

	public BundleContext getContext() {
		return bundleContext;
	}

	public void start(BundleContext context) throws Exception {
		singleton = this;
		bundleContext = context;
		httpServiceTracker = new HttpServiceTracker(context);
		httpServiceTracker.open();
	}

	public void stop(BundleContext context) throws Exception {
		httpServiceTracker.close();
		httpServiceTracker = null;
		bundleContext = null;
	}

	private class HttpServiceTracker extends ServiceTracker<HttpService, HttpService> {

		private static final String WEB_EDITOR_BUNDLE = "org.eclipse.e4.webeditor";//$NON-NLS-1$
		private static final String DOJO_BUNDLE = "org.dojotoolkit";//$NON-NLS-1$
		private static final String OPENAJAX_BUNDLE = "org.openajax";//$NON-NLS-1$

		public HttpServiceTracker(BundleContext context) {
			super(context, HttpService.class.getName(), null);
		}

		public HttpService addingService(ServiceReference<HttpService> reference) {
			HttpService httpService = super.addingService(reference); // calls context.getService(reference);
			if (httpService == null)
				return null;

			HttpContext httpContext = new BundleEntryHttpContext(context.getBundle());
			Bundle dojoBundle = getBundle(DOJO_BUNDLE);
			HttpContext dojoHttpContext = new BundleEntryHttpContext(dojoBundle);
			Bundle webEditorBundle = getBundle(WEB_EDITOR_BUNDLE);
			HttpContext webEditorContext = new BundleEntryHttpContext(webEditorBundle);
			Bundle openAjaxBundle = getBundle(OPENAJAX_BUNDLE);
			HttpContext openAjaxContext = new BundleEntryHttpContext(openAjaxBundle);

			try {
				httpService.registerResources("/webeditor", "/web", webEditorContext);//$NON-NLS-1$ //$NON-NLS-2$
				httpService.registerResources("/org.dojotoolkit", "/", dojoHttpContext);//$NON-NLS-1$ //$NON-NLS-2$
				httpService.registerResources("/", "/static", httpContext);//$NON-NLS-1$ //$NON-NLS-2$
				httpService.registerResources("/openajax", "/", openAjaxContext);//$NON-NLS-1$ //$NON-NLS-2$
			} catch (NamespaceException e) {
				e.printStackTrace();
			}
			return httpService;
		}

		private Bundle getBundle(String id) {
			Bundle[] bundles = context.getBundles();
			for (int i = 0; i < bundles.length; i++) {
				if (bundles[i].getSymbolicName().equals(id))
					return bundles[i];
			}
			throw new IllegalStateException("Couldn't find the " + id + " bundle.");
		}

		public void removedService(ServiceReference<HttpService> reference, HttpService httpService) {
			httpService.unregister("/webeditor"); //$NON-NLS-1$
			httpService.unregister("/org.dojotoolkit");//$NON-NLS-1$
			httpService.unregister("/");//$NON-NLS-1$
			httpService.unregister("/openajax");//$NON-NLS-1$

			super.removedService(reference, httpService); // calls context.ungetService(reference);
		}
	}
}
