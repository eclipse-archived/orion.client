#!/bin/bash
ORION_VERSION=`curl -s https://hudson.eclipse.org/orion/job/orion-node/lastSuccessfulBuild/api/json | jq -r '.id'`
NODE_VERSION=4.4.1
# Docker image for old code
cf ic build --build-arg ORION_VERSION=$ORION_VERSION --build-arg NODE_VERSION=$NODE_VERSION -f DockerfileLatest -t registry.ng.bluemix.net/alston/orionode_prod .
cf ic build --build-arg ORION_VERSION=$ORION_VERSION --build-arg NODE_VERSION=$NODE_VERSION -f Dockerfile -t registry.ng.bluemix.net/alston/orionode .

# Volume
cf ic volume rm orionode
cf ic volume create orionode
