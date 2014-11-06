/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
/**
 * @see http://wiki.eclipse.org/Orion/Dependency_resolution
 */
define([
'orion/objects',
'orion/Deferred',
'javascript/lru',
'orion/fileMap',
'orion/fileClient'
], function(Objects, Deferred, LRU, FileMap, FileClient) {
    
    /**
     * @name ScriptResolver
     * @description Creates a new script resolver for finding 
     * @param {orion.Bootstrap} bootstrap The bootstrap object
     * @constructor 
     * @since 8.0
     */
    function ScriptResolver(bootstrap) {
        this.bootstrap = bootstrap;
        this.cache = new LRU.LRU(10);
    }
    
    Objects.mixin(ScriptResolver.prototype, {
       /**
        * @name getWorkspaceFile
        * @description Tries to find the workspace file for the given logical name and options
        * @function
        * @param {String} logicalName The name of the file to look up, for example, 'orion/objects'
        * @param {Object} options The map of search options
        * @returns {File | null} The found file or <code>null</code>
        */
       getWorkspaceFile : function getWorkspaceFile(logicalName, options) {
          if(logicalName) {
              return this._getFile(logicalName, options);
          }
          return new Deferred().resolve(null);
       },
       
       _getFile : function _getFile(name /*, options*/) {
           var files = this.cache.get(name);
           if(files) {
               return new Deferred().resolve(files);
           }
           //first check the file map
           var file = FileMap.getWSPath(name+'.js'); //TODO haxxor, for now we always look up .js files, might expand
           if(file) {
               files = [this._newFileObj(name, null, file)];
               this.cache.put(name, files);
               return new Deferred().resolve(files);
           }
           
           //fall back to looking for it
           var idx = name.lastIndexOf('/');
           var searchname = name.slice(idx+1);
           var that = this;
           return this._getFileClient().then(function(fileClient) {
               return fileClient.search(
                    {
                        'resource': this.fileClient.fileServiceRootURL(),
                        'keyword': searchname,
                        'sort': 'Name asc',
                        'nameSearch': true,
                        'fileType': 'js',
                        'start': 0,
                        'rows': 30
                    }
               ).then(function(res) {
                   var r = res.response;
                   var len = r.docs.length;
                   if(r.numFound > 0) {
                       files = [];
                       var testname = name.replace(/(?:\.?\.\/)*/, '');
                       testname = testname.replace(/\.js$/, '');
                       testname = testname.replace(/\//, "\\/");
                       for(var i = 0; i < len; i++) {
                           var file = r.docs[i];
                           //TODO haxxor - only keep ones that end in the logical name
                           //or the mapped logical name
                           var regex = ".*(?:"+testname+")$";
                           if(new RegExp(regex).test(file.Location.slice(0, file.Location.length-3))) {
                               files.push(that._newFileObj(file.Name, file.Location, that._trimName(file.Path)));
                           }
                       }
                       if(files.length > 0) {
                           that.cache.put(name, files);
                           return files;
                       }
                   }
                   return null;
               });
           });
       },
       
       _trimName: function _trimeName(name) {
           //TODO haxxor - we don't need to see the root client path
           return name.replace(/^org\.eclipse\.orion\.client\/bundles\//, '');
       },
       
       _newFileObj: function _newFileObj(name, location, path) {
           var meta = Object.create(null);
           meta.name = name;
           meta.loc = location;
           meta.path = path;
           meta.contentType = Object.create(null);
           meta.contentType.icon = '/javascript/images/javascript.png';
           meta.contentType.name = 'JavaScript';
           return meta;
       },
       
       _getFileClient: function _getFileClient(){
           if(this.fileClient) {
               return new Deferred.resolve(this.fileClient);
           }
           return this.bootstrap.startup().then(function(core) {
                this.fileClient = new FileClient.FileClient(core.serviceRegistry);
                return this.fileClient;
           });
       }
    });
    
    return {
        ScriptResolver: ScriptResolver
    };
});