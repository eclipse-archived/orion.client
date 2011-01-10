/*******************************************************************************
 * Copyright (c) 2010 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package org.eclipse.e4.internal.webide.application;

import org.eclipse.e4.internal.webide.Activator;

import org.eclipse.equinox.app.IApplication;
import org.eclipse.equinox.app.IApplicationContext;
import org.osgi.framework.*;
import org.osgi.service.http.HttpService;
import org.osgi.service.packageadmin.PackageAdmin;
import org.osgi.util.tracker.ServiceTracker;

public class WebApplication implements IApplication {
    private static final String EQUINOX_HTTP_JETTY = "org.eclipse.equinox.http.jetty"; //$NON-NLS-1$
    private static final String EQUINOX_HTTP_REGISTRY = "org.eclipse.equinox.http.registry"; //$NON-NLS-1$
    private IApplicationContext appContext = null;
    private ServiceTracker packageAdminTracker;

    public Object start(IApplicationContext context) throws Exception {
        appContext = context;

        ServiceReference serviceRef = Activator.bundleContext.getServiceReference(HttpService.class.getName());
        if (serviceRef == null) {
            //HTTP service not running, start it up
            ensureBundleStarted(EQUINOX_HTTP_JETTY);
        }
        ensureBundleStarted(EQUINOX_HTTP_REGISTRY);
        return IApplicationContext.EXIT_ASYNC_RESULT;
    }

    public void stop() {
        if (packageAdminTracker != null) {
            packageAdminTracker.close();
            packageAdminTracker = null;
        }

        if (appContext != null)
            appContext.setResult(EXIT_OK, this);
    }

    private PackageAdmin getPackageAdmin() {
        if (packageAdminTracker == null) {
            if (Activator.bundleContext == null)
                return null;
            packageAdminTracker = new ServiceTracker(Activator.bundleContext, PackageAdmin.class.getName(), null);
            packageAdminTracker.open();
        }
        return (PackageAdmin) packageAdminTracker.getService();
    }

    private Bundle getBundle(String symbolicName) {
        PackageAdmin packageAdmin = getPackageAdmin();
        if (packageAdmin == null)
            return null;
        Bundle[] bundles = packageAdmin.getBundles(symbolicName, null);
        if (bundles == null)
            return null;
        //Return the first bundle that is not installed or uninstalled
        for (int i = 0; i < bundles.length; i++) {
            if ((bundles[i].getState() & (Bundle.INSTALLED | Bundle.UNINSTALLED)) == 0) {
                return bundles[i];
            }
        }
        return null;
    }

    private void ensureBundleStarted(String symbolicName) throws BundleException {
        Bundle bundle = getBundle(symbolicName);
        if (bundle != null) {
            if (bundle.getState() == Bundle.RESOLVED || bundle.getState() == Bundle.STARTING) {
                bundle.start();
            }
        }
    }

}
