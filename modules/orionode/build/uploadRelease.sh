#!/bin/bash

# TODO follow flow of orionode_build.sh
# TODO change Orion-Setup-x.x.x.exe to Orion-x.x.x-setup.exe
# TODO pass user, repo, dist_path as parameters in bash
# TODO modularize
# TODO change for loops

pushd () {
    command pushd "$@" > /dev/null
}

popd () {
    command popd "$@" > /dev/null
}

while [ $# -gt 0 ] # while positional parameters > 0
do
    case "$1" in 
                "-build") # if first argument is -build, 
                        BUILD="$2"; shift;;
                 *) break;;      # terminate while loop (case needs double semi at end of last command in each pattern block) *) is default case
        esac
        shift
done

export GITHUB_TOKEN="b4515ae8e2fdcafb869e11cce08e57e85c4fb480"
export CSC_NAME="IBM"	

# pass these as parameters later
user="mzmousa"
repo="Orion-Update"

# constants
description=$(grep "description" ../package.json | awk -F: '{ print $2 }' | sed 's/[",]//g' | sed 's/^[ \t]*//') # remove quotes, then remove leading spaces
update_url_base="orion-update.mybluemix.net/download"
name=$(grep "name" ../package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
	
npm version patch # increments version patch, e.g., 1.0.0 -> 1.0.1  
old_pkg_version=$(grep "version" ../package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
pkg_version=$(grep "version" ../package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
vpkg_version="v${pkg_version}"

# update URL for autoUpdater
old_update_url="${update_url_base}/${old_pkg_version}"
new_update_url="${update_url_base}/${pkg_version}"

echo "Setting up build directories"

rm -rf ../buildTemp
mkdir buildTemp
mkdir -p ../buildTemp/osx
mkdir -p ../buildTemp/win

pushd ../buildTemp
echo "Copying over orionode_$BUILD build"
cp ~/downloads/orionode_2016-06-01_16-31-18.tar.gz .

echo "OSX build -----"
pushd osx
echo "Extracting build"
tar -xzf ../orionode_2016-06-01_16-31-18.tar.gz

echo "Cleaning up node modules" 
rm -rf orionode/node_modules/passport*
rm -rf orionode/node_modules/mongoose
rm -rf orionode/node_modules/mongodb
rm -rf orionode/node_modules/nodemailer
rm orionode/node_modules/nodegit/build/Release/nodegit.node

# copy over nodegit binary to workaround in memory ssh limitation
cp ~/downloads/nodegit/osx/nodegit.node orionode/node_modules/nodegit/build/Release

pushd orionode

cp ../../../package.json .
cp ../../../build/icon.icns build
cp ../../../build/icon.ico build
cp ../../../build/orionLogo.gif build

# create a new, formal release
~/Downloads/github-release release --user "${user}" --repo "${repo}" --tag "${vpkg_version}" --name "${vpkg_version}" --description "${description}"

# path to distributable files (pass as cmd line arg)
dist_path="./dist"

# generates osx artifacts: .dmg, -mac.zip, .app, versions, LICENSES, LICEN
npm run dist:osx
echo "osx artifacts generated"

# path to osx artifacts
dist_path_osx="${dist_path}/osx"

# put all osx files into array
osx_files=("${dist_path_osx}/"*)    

# upload all distributables to the new release
for ((i=0; i<${#osx_files[@]}; i++)); do	
    file_path="${osx_files[$i]}"
    file_name="${file_path#$dist_path_osx/}" # remove leading dirs, e.g., ./dist/win/app.exe -> app.exe
    file_name="${file_name// /-}" # if the name has whitespace, replace with dashes
    new_path="${dist_path_osx}/${file_name}"
    mv "${file_path}" "${new_path}"
    necessary_file=$(echo ${file_name} | grep -e "\.dmg" -e "\.zip" || echo 0 ) # if filename is not Orion-x.x.x-osx.(dmg|zip) exclude it
    if [[ $necessary_file != "0" ]] ; then
        ~/Downloads/github-release upload --user "${user}" --repo "${repo}" --tag "${vpkg_version}" --name "${file_name}" --file "${new_path}"
        echo "uploaded ${file_name}"
    else
        # rm $file_path
        echo "${file_name} was not uploaded"
    fi
done

popd
popd

echo "WIN build -----"
mkdir win
pushd win
echo "Extracting build"
tar -xzf ../orionode_2016-06-01_16-31-18.tar.gz

echo "Cleaning up node modules" 
rm -rf orionode/node_modules/passport*
rm -rf orionode/node_modules/mongoose
rm -rf orionode/node_modules/mongodb
rm -rf orionode/node_modules/nodemailer
rm orionode/node_modules/nodegit/build/Release/nodegit.node

# copy over nodegit binary to workaround in memory ssh limitation
cp ~/downloads/nodegit/win/nodegit.node orionode/node_modules/nodegit/build/Release

pushd orionode

cp ../../../package.json .
cp ../../../build/icon.icns build
cp ../../../build/icon.ico build
cp ../../../build/orionLogo.gif build

# generates windows artifacts: -full.nupkg, -delta.nupkg, .exe, RELEASES
npm run dist:win
popd
echo "windows artifacts generated"  

rm -rf win-unpacked

# path to windows artifacts
dist_path_win="${dist_path}/win"

# put all win files into array
win_files=("${dist_path_win}/"*)

# upload all win64 distributables to the new release
for ((i=0; i<${#win_files[@]}; i++)); do
    file_path="${win_files[$i]}"
    file_name="${file_path#$dist_path_win/}" # remove leading dirs, e.g., ./dist/win/app.exe -> app.exe
    file_name="${file_name// /-}" # if the name has whitespace, replace with dashes
    new_path="${dist_path_win}/${file_name}"
    mv "${file_path}" "${new_path}" # rename our file to remove spaces
    necessary_file=$(echo ${file_name} | grep -e "${pkg_version}" -e "RELEASES" || echo 0 ) # only upload files with correct version
    if [[ $necessary_file != "0" ]] ; then
        ~/Downloads/github-release upload --user "${user}" --repo "${repo}" --tag "${vpkg_version}" --name "${file_name}" --file "${new_path}"
        echo "uploaded ${file_name}"
    else
        # rm $file_path
        echo "${file_name} was not uploaded"
    fi
done

popd
popd

echo "LINUX build -----"
mkdir linux
pushd linux
echo "Extracting build"
tar -xzf ../orionode_2016-06-01_16-31-18.tar.gz

echo "Cleaning up node modules" 
rm -rf orionode/node_modules/passport*
rm -rf orionode/node_modules/mongoose
rm -rf orionode/node_modules/mongodb
rm -rf orionode/node_modules/nodemailer
rm orionode/node_modules/nodegit/build/Release/nodegit.node

# copy over nodegit binary to workaround in memory ssh limitation
cp ~/downloads/nodegit/linux/nodegit.node orionode/node_modules/nodegit/build/Release

pushd orionode

cp ../../../package.json .
cp ../../../build/icon.icns build
cp ../../../build/icon.ico build
cp ../../../build/orionLogo.gif build

# generates linux artifacts: .rpm, .tar.gz, .deb
npm run dist:linux
rm -rf ./dist/linux
pushd ./dist
mv "Orion-${pkg_version}.deb" "Orion-${pkg_version}.rpm" "Orion-${pkg_version}.tar.gz" linux

echo "linux artifacts generated"

popd

# path to linux artifacts
dist_path_linux="${dist_path}/linux"

# put all linux files into array
linux_files=("${dist_path_linux}/"*)

# upload all linux distributables to the new releases
for ((i=0; i<${#linux_files[@]}; i++)); do
    file_path="${linux_files[$i]}"
    file_name="${file_path#$dist_path_linux/}" # remove leading dirs, e.g., ./dist/win/app.exe -> app.exe
    file_name="${file_name// /-}" # if the name has whitespace, replace with dashes
    new_path="${dist_path_linux}/${file_name}"
    mv "${file_path}" "${new_path}" # rename our file to not have spaces
    necessary_file=$(echo ${file_name} | grep -e "\.deb" -e "\.rpm" -e "\.tar.gz" || echo 0 ) # only upload deb rpm and tar.gz filetypes
    if [[ $necessary_file != "0" ]] ; then
        ~/Downloads/github-release upload --user "${user}" --repo "${repo}" --tag "${vpkg_version}" --name "${file_name}" --file "${new_path}"
        echo "uploaded ${file_name}"
    else
        # rm $file_path
        echo "${file_name} was not uploaded"
    fi
done

restore remoteReleases URL to current version for future builds
sed -i -e "s@${old_update_url}@${new_update_url}@g" package.json

echo $(cat package.json | grep remoteReleases)

popd
popd

