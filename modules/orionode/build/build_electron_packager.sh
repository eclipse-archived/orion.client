#!/bin/bash
#build_electron.sh -build <build timestamp> 

pushd () {
    command pushd "$@" > /dev/null
}

popd () {
    command popd "$@" > /dev/null
}

while [ $# -gt 0 ]
do
        case "$1" in
                "-build")
                        BUILD="$2"; shift;;

                 *) break;;      # terminate while loop
        esac
        shift
done

echo "Setting up build directories"

export PATH=$PATH://home/data/users/gheorghe/nodejs/node-v4.4.1-linux-x64/bin/

rm -rf buildTemp

mkdir -p buildTemp/mac
mkdir -p buildTemp/linux
mkdir -p buildTemp/windows

currentVersion=$(head -n 1 electron/version)

#copy over nodegit binary to workaround in memory ssh limitation
cp ~/downloads/orion/orionode/nodegit/v0.13.0/electron/mac/nodegit.node buildTemp/mac/
cp ~/downloads/orion/orionode/nodegit/v0.13.0/electron/linux/nodegit.node buildTemp/linux/
cp ~/downloads/orion/orionode/nodegit/v0.13.0/electron/windows/nodegit.node buildTemp/windows/

pushd buildTemp/
echo "Copying over orionode_$BUILD build"
cp /home/data/httpd/download.eclipse.org/orion/orionode/orionode_$BUILD.tar.gz .

echo "MAC BUILD -----"
pushd mac
echo "Extracting build"
tar -xzf ../orionode_$BUILD.tar.gz
echo "Cleaning up node modules" 
rm orionode/node_modules/nodegit/build/Release/nodegit.node
rm -rf orionode/node_modules/passport*
rm -rf orionode/node_modules/mongoose
rm -rf orionode/node_modules/mongodb
rm -rf orionode/node_modules/nodemailer
cp  nodegit.node orionode/node_modules/nodegit/build/Release/
echo "Setting up Electron"
mv orionode app
VERSION=`cat app/package.json | awk -F"[,:}]" '{for(i=1;i<=NF;i++){if($i~/\042'version'\042/){print $(i+1)}}}' | tr -d '"' | sed -n ${1}p | sed 's/ //g'`
pushd app
sed -i 's/\"plugins\/consolePlugin.html\"\:true\,//' lib/orionode.client/defaults.pref 
popd
../../packager/node_modules/.bin/electron-packager app/ Orion --platform=darwin --build-version=$VERSION.$BUILD --arch=x64 --icon=../../electron/mac/orion.icns --version=0.36.7
echo "Tar"
mv Orion-darwin-x64/ Orion
echo $BUILD > Orion/build_id.txt
tar -czf orion.tar.gz Orion
echo "Copy to download dir"
cp orion.tar.gz  /home/data/httpd/download.eclipse.org/orion/orionode/electron/mac/
popd

echo "LINUX BUILD -----"
pushd linux 
echo "Extracting build"
tar -xzf ../orionode_$BUILD.tar.gz
echo "Cleaning up node modules" 
rm orionode/node_modules/nodegit/build/Release/nodegit.node
rm -rf orionode/node_modules/passport*
rm -rf orionode/node_modules/mongoose
rm -rf orionode/node_modules/mongodb
rm -rf orionode/node_modules/nodemailer
cp nodegit.node orionode/node_modules/nodegit/build/Release/
echo "Setting up Electron"
mv orionode app
pushd app
sed -i 's/\"plugins\/consolePlugin.html\"\:true\,//' lib/orionode.client/defaults.pref 
popd
../../packager/node_modules/.bin/electron-packager app/ Orion --platform=linux --arch=x64 --version=0.36.7
echo "Tar"
mv Orion-linux-x64/ Orion
echo $BUILD > Orion/build_id.txt
tar -czf orion.tar.gz Orion 
echo "Copy to download dir"
cp orion.tar.gz  /home/data/httpd/download.eclipse.org/orion/orionode/electron/linux/
popd

echo "WINDOWS BUILD -----"
pushd windows 
echo "Extracting build"
tar -xzf ../orionode_$BUILD.tar.gz
echo "Cleaning up node modules" 
rm orionode/node_modules/nodegit/build/Release/nodegit.node
rm -rf orionode/node_modules/passport*
rm -rf orionode/node_modules/mongoose
rm -rf orionode/node_modules/mongodb
rm -rf orionode/node_modules/nodemailer
cp nodegit.node orionode/node_modules/nodegit/build/Release/
echo "Setting up Electron"
mv orionode app
pushd app
sed -i 's/\"plugins\/consolePlugin.html\"\:true\,//' lib/orionode.client/defaults.pref
popd
#../../packager/node_modules/.bin/electron-packager app/ Orion --platform=win32 --arch=x64 --icon=../../electron/windows/orion.ico --version=0.36.7
cp ../../prebranded/windows/orion.tar.gz .
tar -xzf orion.tar.gz
mv app Orion-win32-x64/resources/
echo "Tar"
mv Orion-win32-x64/ Orion
echo $BUILD > Orion/build_id.txt
tar -czf orion.tar.gz Orion
echo "Copy to download dir"
cp orion.tar.gz  /home/data/httpd/download.eclipse.org/orion/orionode/electron/windows/
popd

echo "Done"
