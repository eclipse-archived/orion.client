#!/bin/bash

## WARNING do not run with sudo, it will break wine and cause many permission issues
# Example usage ***** REMOVE LAST EXAMPLE BEFORE COMMITTING *****
# ./uploadRelease.sh --build <build timestamp> --certificate <certificate name> --description <Github release description>--token <Github API token> --user <Github user> --repo <repo>
# ./uploadRelease.sh -b <build timestamp> -c <certificate name> -d <Github release description> -t <Github API token> -u <Github user> -r <repo>
# ./uploadRelease.sh --build 2016-06-01_16-31-18 --certificate "IBM" --description "this desc was passed via cmd line" --token b4515ae8e2fdcafb869e11cce08e57e85c4fb480 --user mzmousa --repo Orion-Update

pushd () {
    command pushd "$@" > /dev/null
}

popd () {
    command popd "$@" > /dev/null
}

# parse command line arguments
while [[ $# > 1 ]]
do
key="$1"

case $key in
    -t|--token)
    GITHUB_TOKEN="$2"
    shift # past argument
    ;;
    -d|--description)
    description="$2"
    shift # past argument
    ;;
    -u|--user)
    user="$2"
    shift # past argument
    ;;
    -r|--repo)
	repo="$2"
	shift # past argument
	;;
	-c|--certificate)
	CSC_NAME="$2"
	shift # past argument
	;;
	-b|--build)
	BUILD="$2"
	shift
	;;
    *)
    # fall through any other options
    ;;
esac
shift # past argument or value
done

# environment variables
export GITHUB_TOKEN # required for uploading Github releases
export CSC_NAME # required for OSX autoUpdater-functional builds

# constants
pkg_version=$(grep -m1 "version" ../package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
vpkg_version="v${pkg_version}"
name=$(grep -m1 "name" ../package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')

# functions

# upload a file under the specified github release
# $1: file name/path
upload () {
	echo $1
	github-release upload --user "${user}" --repo "${repo}" --tag "${vpkg_version}" --name $1 --file $1
}

# create a new release
# $1: String for release description
new_release() {
	github-release release --user "${user}" --repo "${repo}" --tag "${vpkg_version}" --name "${vpkg_version}" --description "${description}"
}

# node module clean up
cleanup_nodemodules() {
	echo "Cleaning up node modules" 
	rm -rf orionode/node_modules/passport*
	rm -rf orionode/node_modules/mongoose
	rm -rf orionode/node_modules/mongodb
	rm -rf orionode/node_modules/nodemailer
	rm orionode/node_modules/nodegit/build/Release/nodegit.node
}
echo "Setting up build directories"

rm -rf ../buildTemp
mkdir ../buildTemp

pushd ../buildTemp
echo "Copying over orionode_${BUILD} build"
cp ~/downloads/orion/orionode/orionode_${BUILD}.tar.gz .

new_release

# ---------------------------------------- OSX BUILD ----------------------------------------

echo "----- OSX build -----"
mkdir osx
pushd osx
echo "Extracting build"
tar -xzf ../orionode_${BUILD}.tar.gz

cleanup_nodemodules

# copy over nodegit binary to workaround in memory ssh limitation
cp ~/downloads/nodegit/osx/nodegit.node ./orionode/node_modules/nodegit/build/Release

pushd orionode

cp ../../../package.json .
cp ../../../build/icons/icon.icns ./build
cp ../../../build/icons/orionLogo.gif ./build

# generates osx artifacts: dmg, -mac.zip
npm run dist:osx
echo "osx artifacts generated"

upload "${name}-${pkg_version}.dmg"
upload "${name}-${pkg_version}-mac.zip"

popd # pop orionode
popd # pop osx

# ---------------------------------------- WINDOWS BUILD ----------------------------------------

echo "----- WIN build -----"
mkdir win
pushd win
echo "Extracting build"
tar -xzf ../orionode_2016-06-01_16-31-18.tar.gz

cleanup_nodemodules

# copy over nodegit binary to workaround in memory ssh limitation
cp ~/downloads/nodegit/win/nodegit.node orionode/node_modules/nodegit/build/Release

pushd orionode

cp ../../../package.json .
cp ../../../build/icons/orion.ico build
cp ../../../build/icons/orionLogo.gif build

# generates windows artifacts: -full.nupkg, -delta.nupkg, .exe, RELEASES
npm run dist:win
echo "windows artifacts generated"

pushd dist/win

mv "${name} Setup ${pkg_version}.exe" "${name}-${pkg_version}-setup.exe"

nupkg="${name}-${pkg_version}-full.nupkg"
setup="${name}-${pkg_version}-setup.exe"

upload "RELEASES"
upload "${name}-${pkg_version}-full.nupkg"
upload "${name}-${pkg_version}-setup.exe"

popd # pop dist/win
popd # pop orionode
popd # pop win

# ---------------------------------------- LINUX BUILD ----------------------------------------

echo "----- LINUX build -----"
mkdir linux
pushd linux
echo "Extracting build"
tar -xzf ../orionode_2016-06-01_16-31-18.tar.gz 

cleanup_nodemodules
# copy over nodegit binary to workaround in memory ssh limitation
cp ~/downloads/nodegit/linux/nodegit.node orionode/node_modules/nodegit/build/Release

pushd orionode

cp ../../../package.json .
cp ../../../build/icons/icon.icns build
cp ../../../build/icons/orionLogo.gif build

# generates linux artifacts: .rpm, .tar.gz, .deb
npm run dist:linux
echo "linux artifacts generated"

pushd dist
mv "Orion-${pkg_version}.deb" "Orion-${pkg_version}.rpm" "Orion-${pkg_version}.tar.gz" linux

pushd linux

# upload linux artifacts to new release
upload "${name}-${pkg_version}.deb"
upload "${name}-${pkg_version}.rpm"
upload "${name}-${pkg_version}.tar.gz"

popd # pop linux
popd # pop dist
popd # pop orionode
popd # pop linux

popd # pop buildTemp

