#!/bin/bash

function die () {
    echo "Error:" "$1" >&2
    exit 1
}

if [ -z "$DOWNLOADS" ]; then
	DOWNLOADS=/home/data/httpd/download.eclipse.org
fi

NODEGIT_VERSION=v0.19.0
rm -rf ../node_modules
($NPM_ARGS npm install --no-optional) || die "Failed to install dependencies, consult the npm log to find out why."
(../node_modules/.bin/grunt ${GRUNT_TASK}) || die "Failed to minify client code."
(npm prune --production) || die "Failed to install dependencies, consult the npm log to find out why."
if [ -d "$DOWNLOADS" ]; then
	if [ -f "${DOWNLOADS}/orion/orionode/nodegit/${NODEGIT_VERSION}/linux/nodegit.node" ]; then
		cp ${DOWNLOADS}/orion/orionode/nodegit/${NODEGIT_VERSION}/linux/nodegit.node ../node_modules/nodegit/build/Release
	fi
else
	scp genie.orion@projects-storage.eclipse.org:${DOWNLOADS}/orion/orionode/nodegit/${NODEGIT_VERSION}/linux/nodegit.node ../node_modules/nodegit/build/Release
fi
rm -rf ../node_modules/node-pty
rm -rf ../node_modules/nodegit/vendor
rm -rf ../node_modules/nodegit/build/Release/obj.target
rm -rf ../target
cd ../..

# Update build ID
sed -i "s/orion\.buildId\=/orion\.buildId\=${1}/" orionode/orion.conf
sed -i "s/var BUILD_ID \= \"unknown\"\;/var BUILD_ID \= \"${1}\"\;/" orionode/lib/version.js

tar -czf "orionode_$1.tar.gz" orionode/
if [ -d "$DOWNLOADS" ]; then
	cp "orionode_$1.tar.gz" ${DOWNLOADS}/orion/orionode/
else
	scp "orionode_$1.tar.gz" genie.orion@projects-storage.eclipse.org:${DOWNLOADS}/orion/orionode/
fi
