#!/bin/bash
# This script transforms the Orion client repo into a form suitable for publishing Orionode to npm.
#
# Usage: ./make-publish publish_dir
#
# Where 'publish_dir' is the target folder for the publishable Orionode. If the script
# completes with no errors, you should be able to run `npm publish` from publish_dir
# to update Orionode.
#
# Requirements:
#  Node in your PATH, for running the build
#  Mocha, for running the server sanity test
#
die() {
    echo >&2 "$@"
    exit 1
}

ensure_dir() {
	if [ ! -d "$1" ]; then
		echo mkdir $1
		mkdir "$1" || die "Failed to create folder: $1"
	fi
}

export SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
USAGE=$(printf "Usage: publish [dir]\n\nWhere [dir] is the temporary directory to use for publishing.\nThe contents of [dir] will be cleared first, so don't use an important folder.")

# Set args
REPO=${SCRIPT_DIR}/../../../
REPO=$( cd $REPO; pwd)
STAGING=$(cd $1; pwd)

echo Repo directory: ${REPO}
echo Publish directory: ${STAGING}

# Validate args
[ "$#" -eq 1 ] || die "$USAGE"
! [ -d "$STAGING"/.git ] || die "publish dir appears to contain a Git repo -- refusing to overwrite."
# This is unnecessary
#! [ "$STAGING" -ef "$REPO" ] || die "publish dir appears to be your repo directory -- refusing to overwrite."

# Start the build
ensure_dir "$STAGING"

# TODO -- Purge publish dir -- this often hangs on Windows
#echo Clearing "$STAGING"...
#rm -rf "$STAGING"/*

# Copy bundles to staging
echo Copying $REPO/bundles to $STAGING
ensure_dir "$STAGING"/bundles
cp -r "$REPO"/bundles/* "$STAGING"/bundles/

# Copy modules/orionode/* to staging, but omit unwanted node_modules
echo Copying $REPO/modules/orionode to $STAGING
for f in "$REPO"/modules/orionode/* ; do
	cp -r "$f" "$STAGING"
done
# The * construct above omits things whose name begins with dot (.)
# But we need .gitignore, it's important for npm, so copy it over.
cp "$REPO"/modules/orionode/.gitignore $STAGING
# Add an additional line to prevent npm from publishing the releng folder
echo lib/orion.client/releng/ >> "$STAGING"/.gitignore

# unnecessary: these are ignored via .gitignore
# delete .workspace/
# delete build/.temp/

# Remove unneeded bundles
echo Removing unneeded bundles and files
rm -rf "$STAGING"/bundles/org.eclipse.orion.client.git.greasemonkey

# Move bundles/ into lib/orion.client/
ensure_dir "$STAGING"/lib/orion.client
ensure_dir "$STAGING"/lib/orion.client/bundles
cp -r "$STAGING"/bundles/* "$STAGING"/lib/orion.client/bundles
rm -rf "$STAGING"/bundles/

# Copy client releng, required by build.js
mkdir "$STAGING"/lib/orion.client/releng
cp -r "$REPO"/releng/org.eclipse.orion.client.releng "$STAGING"/lib/orion.client/releng

# install orion node dependencies, required for minification if they haven't been installed yet
echo Installing Orion node modules...
pushd ${STAGING}
npm install
popd

# Minify the client-side code
if hash node 2> /dev/null; then
	NODE=node
else
	echo "Could not find node. Can't minify :("
fi
if [ -n "$NODE" ]; then 
	echo Minifying client-side code
	node "$STAGING"/build/build.js "$STAGING"/lib/orion.client/bundles
	node "$STAGING"/build/build.js "$STAGING"/lib/orion.client/bundles
fi

echo Rewriting ORION_CLIENT path in index.js
# All we want to do is find the ORION_CLIENT line and replace '../../' with './lib/orion.client/' but unfortunately we are using sh and sed
# Tried breaking it into parts but string quoting makes this fail:
	#FIND="ORION_CLIENT = path.normalize(path.join(__dirname, '\''..\/..\/'\''))"
	#REPLACE="ORION_CLIENT = path.normalize(path.join(__dirname, '\''.\/lib\/orion.client\/'\''))"
	# sed -e 's/${FIND2}/${REPLACE2}/' index.js > sjs.tmp && mv sjs.tmp index.js
sed -e 's/ORION_CLIENT = path.normalize(path.join(__dirname, '\''..\/..\/'\''))/ORION_CLIENT = path.normalize(path.join(__dirname, '\''.\/lib\/orion.client\/'\''))/' "$STAGING"/index.js > "$STAGING"/sjs.tmp && mv "$STAGING"/sjs.tmp "$STAGING"/index.js

echo Sanity check: running server tests
if hash mocha 2> /dev/null; then
	MOCHA=mocha
elif [ -f "$STAGING"/node_modules/mocha/bin/mocha ]; then
	MOCHA="$STAGING"/node_modules/mocha/bin/mocha
else
	echo "Could not find mocha. Can't run sanity check :("
fi

if [ -n "$MOCHA" ]; then
	$MOCHA "$STAGING"/test/test-server
fi

echo "^^^^^ if the sanity tests finished without errors, run this command to publish to npm:"
echo "cd ${STAGING} && npm publish"
echo Done.
