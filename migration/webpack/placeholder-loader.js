module.exports = function(src){
  // Because raw-loader doesnt work for some reason (seriously)
  return ("module.exports = " + JSON.stringify(src.trim()));
};
