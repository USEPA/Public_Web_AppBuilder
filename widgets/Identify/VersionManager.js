define([
  'jimu/shared/BaseVersionManager'
],
function(
  BaseVersionManager
  ) {
  function VersionManager(){
    this.versions = [{
      version: '1.0',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '1.1',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '1.2',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    },{
      version: '1.2.0.1',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    },{
      version: '1.2.0.2',
      upgrader: function(oldConfig){
        var newConfig = oldConfig;
        newConfig.symbols.picturemarkersymbol.url = "images/i_info.png";
        return newConfig;
      }
    },{
      version: '1.2.0.3',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    },{
      version: '1.2.0.4',
      upgrader: function(oldConfig){
        var newConfig = oldConfig;
        newConfig.resultFormat = {
          "attTitlesymbol": {
            "bold": false,
            "italic": true,
            "underline": false,
            "color": [
              0,
              0,
              0,
              1
            ]
          },
          "attValuesymbol": {
            "bold": false,
            "italic": false,
            "underline": false,
            "color": [
              0,
              0,
              0,
              1
            ]
          }
        };
        return newConfig;
      }
    },{
      version: '1.3',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    },{
      version: '1.3.0.1',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }];
  }

  VersionManager.prototype = new BaseVersionManager();
  VersionManager.prototype.constructor = VersionManager;
  return VersionManager;
});
