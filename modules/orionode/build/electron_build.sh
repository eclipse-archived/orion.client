#!/bin/bash

## WARNING do not run with sudo, it will break wine and cause many permission issues
# Example usage
# ./electron_build.sh --build <build timestamp> --certificate <certificate name> --description <Github release description>--token <Github API token> --user <Github user> --repo <repo>
# ./electron_build.sh -b <build timestamp> -c <certificate name> -d <Github release description> -t <Github API token> -u <Github user> -r <repo>

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
export GITHUB_TOKEN=${GITHUB_TOKEN} # required for uploading Github releases
export CSC_NAME=${CSC_NAME} # required for OSX autoUpdater-functional builds

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

# update orion.conf and package.json
update_config_files() {
	pkg_version=$(grep -m1 "version" orionode/package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
	old_version=${pkg_version}
	pkg_version=`echo ${pkg_version} | sed 's/.0$/.'"${BUILD_NUMBER}"'/'`
	update_url="http\:\/\/orion\-update\.mybluemix\.net\/update" # for autoUpdater
	download_url="http\:\/\/orion\-update\.mybluemix\.net\/download" # for remoteReleases
	vpkg_version="v${pkg_version}"
	name=$(grep -m1 "name" orionode/package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
	sed -i .bak 's/\"version\": \"'"${old_version}"'\"/\"version\"\:\ \"'"${pkg_version}"'\"/' orionode/package.json
	sed -i .bak 's/orion\.autoUpdater\.url\=/orion\.autoUpdater\.url\='"${update_url}"'/' orionode/orion.conf
}

# set Windows remoteReleases URL to latest successful build # for delta files
update_remote_releases() {
	latest_build=$(curl -s http://orion-update.mybluemix.net/api/version/latest | jsawk 'return this.tag')
	sed -i .bak "s/.*remoteReleases.*/\"remoteReleases\": \"${download_url}\/v${latest_build}\"/" package.json
}

echo "Setting up build directories"

rm -rf buildTemp
mkdir buildTemp

pushd buildTemp
echo "Copying over orionode_${BUILD} build"
cp ${BUILD_ZIP} .

# ---------------------------------------- OSX BUILD ----------------------------------------

echo "----- OSX build -----"
mkdir osx
pushd osx
echo "Extracting build"
tar -xzf ../orionode_${BUILD}.tar.gz

cleanup_nodemodules
update_config_files

# copy over nodegit binary to workaround in memory ssh limitation
cp ~/downloads/orion/orionode/nodegit/v0.13.0/electron/mac/nodegit.node ./orionode/node_modules/nodegit/build/Release

pushd orionode

# generates osx artifacts: dmg, -mac.zip
npm run dist:osx
echo "osx artifacts generated"

popd # pop orionode
popd # pop osx

# ---------------------------------------- WINDOWS BUILD ----------------------------------------

echo "----- WIN build -----"
mkdir win
pushd win
echo "Extracting build"
tar -xzf ../orionode_${BUILD}.tar.gz

cleanup_nodemodules
update_config_files

# copy over nodegit binary to workaround in memory ssh limitation
cp ~/downloads/orion/orionode/nodegit/v0.13.0/electron/windows/nodegit.node orionode/node_modules/nodegit/build/Release

pushd orionode
update_remote_releases

# generates windows artifacts: -full.nupkg, -delta.nupkg, .exe, RELEASES
npm run dist:win
echo "windows artifacts generated"

pushd dist/win

# rename file for consistency
mv "${name} Setup ${pkg_version}.exe" "${name}-${pkg_version}-setup.exe"

popd # pop dist/win
popd # pop orionode
popd # pop win

# ---------------------------------------- LINUX BUILD ----------------------------------------

echo "----- LINUX build -----"
mkdir linux
pushd linux
echo "Extracting build"
tar -xzf ../orionode_${BUILD}.tar.gz

cleanup_nodemodules
update_config_files

# copy over nodegit binary to workaround in memory ssh limitation
cp ~/downloads/orion/orionode/nodegit/v0.13.0/electron/linux/nodegit.node orionode/node_modules/nodegit/build/Release

pushd orionode

# generates linux artifacts: .rpm, .tar.gz, .deb
npm run dist:linux
echo "linux artifacts generated"

pushd dist
mv "Orion-${pkg_version}.deb" "Orion-${pkg_version}.rpm" "Orion-${pkg_version}.tar.gz" linux

pushd linux

# ---------------------------------------- GITHUB RELEASE/UPLOAD ----------------------------------------

new_release

# upload linux artifacts to new release
upload "${name}-${pkg_version}.deb"
upload "${name}-${pkg_version}.rpm"
upload "${name}-${pkg_version}.tar.gz"

popd # pop linux
popd # pop dist
popd # pop orionode
popd # pop linux

pushd osx/orionode/dist/osx

# upload osx artifacts to new release
upload "${name}-${pkg_version}.dmg"
upload "${name}-${pkg_version}-mac.zip"

popd # pop osx/orionode/dist/osx
pushd win/orionode/dist/win

# upload windows artifacts to new release
upload "RELEASES"
upload "${name}-${pkg_version}-full.nupkg"
upload "${name}-${pkg_version}-delta.nupkg"
upload "${name}-${pkg_version}-setup.exe"

popd # pop win/orionode/dist/win
popd # pop buildTemp
