#!/bin/bash

function die () {
    echo "Error:" "$1" >&2
    exit 1
}

DOWNLOADS=/home/data/httpd/download.eclipse.org

(npm install --no-optional) || die "Failed to install dependencies, consult the npm log to find out why."
cp ${DOWNLOADS}/orion/orionode/nodegit/v0.13.0/linux/nodegit.node ../node_modules/nodegit/build/Release
(../node_modules/.bin/grunt ${GRUNT_TASK}) || die "Failed to minify client code."
rm -rf ../node_modules
(npm install --production --no-optional) || die "Failed to install dependencies, consult the npm log to find out why."
cp ${DOWNLOADS}/orion/orionode/nodegit/v0.13.0/linux/nodegit.node ../node_modules/nodegit/build/Release
rm -rf ../node_modules/pty.js
rm -rf ../node_modules/nodegit/vendor
rm -rf ../node_modules/nodegit/build/Release/obj.target
rm -rf ../target
cd ../..

# Update build ID
sed -i "s/orion\.buildId\=/orion\.buildId\=${1}/" orionode/orion.conf
sed -i "s/var BUILD_ID \= \"unknown\"\;/var BUILD_ID \= \"${1}\"\;/" orionode/lib/version.js

tar -czf "orionode_$1.tar.gz" orionode/
cp "orionode_$1.tar.gz" ${DOWNLOADS}/orion/orionode/
