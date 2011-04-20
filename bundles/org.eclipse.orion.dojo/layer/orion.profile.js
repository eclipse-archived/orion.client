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
        [ "dojo", "@DOJO_BUNDLE@/dojo" ],
        [ "dijit", "@DOJO_BUNDLE@/dijit" ],
        [ "dojox", "@DOJO_BUNDLE@/dojox" ],
        [ "orion", "@ORION_DOJO@/layer" ]
    ]
}

