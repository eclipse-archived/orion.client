var ROOT = "http://localhost:8081/";

export default {
  toUrl: function(key){
    return ROOT + key;
  },
  specified: function(moduleName){
    return true;
  },
  defined: function(moduleName){
    return true;
  }
};
