/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2015 IBM Corporation and others.
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
     * @description Creates a new script resolver for finding workspace file based
     * on a given logical path and search options
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
        * @description Tries to find the workspace file for the given logical name and options
        * @function
        * @param {String} logicalName The name of the file to look up, for example, 'orion/objects'
        * @param {Object} options The map of search options.
        * 
        * >Supported options include:
        * >  * ext - the file extension type to look for, for example 'js'
        * >  * icon - the URL or relative path to the icon to describe found files
        * >  * type - the name to use for the content type of any found files
        * @returns {File | null} The found file or ```null```
        */
       getWorkspaceFile : function getWorkspaceFile(logicalName, options) {
          if(logicalName) {
              return this._getFile(logicalName, options);
          }
          return new Deferred().resolve(null);
       },
       
       _getFile : function _getFile(name, options) {
           var files = this.cache.get(name);
           if(files) {
               return new Deferred().resolve(files);
           }
           var that = this;
           return this._getFileClient().then(function(fileClient) {
               var opts = options ? options : Object.create(null);
               var ext = opts.ext ? opts.ext : 'js';
               var icon = opts.icon ? opts.icon : '../javascript/images/javascript.png';
               var type = opts.type ? opts.type : 'JavaScript';
               var dotext = '.'+ext;
               //first check the file map
               var file = FileMap.getWSPath(name);
               if(!file) {
                   file = FileMap.getWSPath(name+dotext);
               }
               if(file && file.indexOf(dotext) > -1) {
                   return fileClient.loadWorkspace().then(function(workspace) {
                       //TODO hack - right now we know the index always is talking about the orion client,could differ later
                       files = [that._newFileObj(name, '/file/'+workspace.Id+'/org.eclipse.orion.client/'+file, that._trimName(file), icon, type, fileClient)];
                       that.cache.put(name, files);
                       return files;
                   });
               }
               var filename = name.replace(/^i18n!/, '');
               var idx = filename.lastIndexOf('/');
               var searchname = filename.slice(idx+1);
               //fall back to looking for it
               return fileClient.search(
                    {
                        'resource': fileClient.fileServiceRootURL(),
                        'keyword': searchname,
                        'sort': 'Name asc',
                        'nameSearch': true,
                        'fileType': ext,
                        'start': 0,
                        'rows': 30
                    }
               ).then(function(res) {
                   var r = res.response;
                   var len = r.docs.length;
                   if(r.numFound > 0) {
                       files = [];
                       var testname = filename.replace(/(?:\.?\.\/)*/, '');
                       testname = testname.replace(new RegExp("\\"+dotext+"$"), '');
                       testname = testname.replace(/\//g, "\\/");
                       for(var i = 0; i < len; i++) {
                           file = r.docs[i];
                           //TODO haxxor - only keep ones that end in the logical name or the mapped logical name
                           var regex = ".*(?:"+testname+")$";
                           if(new RegExp(regex).test(file.Location.slice(0, file.Location.length-dotext.length))) {
                               files.push(that._newFileObj(file.Name, file.Location, that._trimName(file.Path), icon, type));
                           }
                       }
                       if(files.length > 0) {
                           that.cache.put(filename, files);
                           return files;
                       }
                   }
                   return null;
               });
           });
       },
       
       /**
        * @description Converts the given file object to a URL that can be opened in Orion
        * @param {Object} file
        * @function
        * @returns {String} The URL as a string or null if one could no be computed
        */
       convertToURL: function convertToURL(file) {
           if(file) {
               return 'https://orion.eclipse.org/edit/edit.html#'+file.location;
           }
           return null;
       },
       
       _trimName: function _trimeName(name) {
           //TODO haxxor - we don't need to see the root client path
           return name.replace(/^(?:org\.eclipse\.orion\.client)?(?:\/)?bundles\//, '');
       },
       
       _newFileObj: function _newFileObj(name, location, path, icon, type, fileClient) {
           var meta = Object.create(null);
           meta.name = name;
           meta.location = location ? location : fileClient.getServiceRootURL() + '/' + path;
           meta.path = path;
           meta.contentType = Object.create(null);
           if(icon) {
                meta.contentType.icon = icon;
           }
           if(type) {
                meta.contentType.name = type;
           }
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