#!/bin/sh
# This script transforms the Orion client repo into a form suitable for publishing Orionode to npm.
#
# Usage: ./make-publish repo_dir publish_dir
#
# Where repo_dir is the folder where your orion.client repository lives and publish_dir is 
# the target folder for the publishable Orionode. If the script completes with no errors, you 
# should be able to run `npm publish` from publish_dir to update Orionode.
#
die() {
    echo >&2 "$@"
    exit 1
}

ensure_dir() {
	if [ ! -d "$1" ]; then
		echo mkdir $1
		mkdir "$1"
	fi
}

USAGE="Usage: publish [repo dir] [publish dir]"
[ "$#" -eq 2 ] || die "$USAGE"
[ "$1" != "$2" ] || die "repo dir and publish dir must be different."

REPO=$1
STAGING=$2

ensure_dir "$STAGING"

# Copy bundles and modules to staging (we omit the other top-level junk like .git/)
echo Copying $REPO to $STAGING
cp -r "$REPO"/bundles "$STAGING"
cp -r "$REPO"/modules "$STAGING"

# Move orionode to top level
echo Promoting "$STAGING"/modules/orionode to $STAGING
cp -r "$STAGING"/modules/orionode/* "$STAGING"
# Copy the stuff starting with . (like .gitignore, which is important)
cp -r "$STAGING"/modules/orionode/.[^.]* "$STAGING"
rm -rf "$STAGING"/modules

# unnecessary: these are ignored via .gitignore
# delete .workspace/
# delete build/.temp/

# Remove unneeded bundles
echo Removing unneeded bundles
rm -rf "$STAGING"/bundles/org.eclipse.orion.client.git
rm -rf "$STAGING"/bundles/org.eclipse.orion.client.git.greasemonkey
rm -rf "$STAGING"/bundles/org.eclipse.orion.client.users

# Move bundles/ into lib/orion.client/
ensure_dir "$STAGING"/lib/orion.client
cp -r "$STAGING"/bundles/ "$STAGING"/lib/orion.client/
rm -rf "$STAGING"/bundles/

echo Rewriting ORION_CLIENT path in server.js
# All we want to do is find the ORION_CLIENT line and replace '../../' with './lib/orion.client/' but unfortunately we are using sh and sed
# Tried breaking it into parts but string quoting makes this fail:
	#FIND="ORION_CLIENT = path.normalize(path.join(__dirname, '\''..\/..\/'\''))"
	#REPLACE="ORION_CLIENT = path.normalize(path.join(__dirname, '\''.\/lib\/orion.client\/'\''))"
	# sed -e 's/${FIND2}/${REPLACE2}/' server.js > sjs.tmp && mv sjs.tmp server.js
sed -e 's/ORION_CLIENT = path.normalize(path.join(__dirname, '\''..\/..\/'\''))/ORION_CLIENT = path.normalize(path.join(__dirname, '\''.\/lib\/orion.client\/'\''))/' "$STAGING"/server.js > "$STAGING"/sjs.tmp && mv "$STAGING"/sjs.tmp "$STAGING"/server.js
echo Done.
