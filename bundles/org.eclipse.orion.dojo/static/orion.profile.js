/*
	Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


dependencies = {
	layers: [
		{
            name: "../orion/orion.js",
            resourceName: "orion.dojo",
            dependencies: [ "orion.layer" ],
			layerDependencies: [ "dojo._base" ]
        }
    ],

    prefixes: [
        [ "dojo", "/eclipse/build/dojo/org.dojotoolkit_1.5.0.v201101262320/dojo" ],
        [ "dijit", "/eclipse/build/dojo/org.dojotoolkit_1.5.0.v201101262320/dijit" ],
        [ "dojox", "/eclipse/build/dojo/org.dojotoolkit_1.5.0.v201101262320/dojox" ],
        [ "orion", "/eclipse/git/web/org.eclipse.orion.client/bundles/org.eclipse.orion.dojo/temp/layer" ]
    ]
}

