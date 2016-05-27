// Initial Release: Pass in the current version with command line argument 'ver'
// Example: grunt create-windows-installer --ver=1.0.0

module.exports = function(grunt) {
 grunt.initConfig({
   'create-windows-installer': {
     ia32: {
       appDirectory: './Orion',
       outputDirectory: 'singleinst',
       name: 'Orion',
       description: 'Orion',
       authors: 'IBM',
       exe: 'Orion.exe',
       noMsi: true,
       // remoteReleases: 'http://orion-update.mybluemix.net/download/' + grunt.option('ver'),
       loadingGif: './Orion/orionLogo.gif'
     }
   }
 });
 grunt.loadNpmTasks('grunt-electron-installer');
};
