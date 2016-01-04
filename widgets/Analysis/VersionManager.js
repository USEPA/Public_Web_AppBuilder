define(['jimu/shared/BaseVersionManager'], function(BaseVersionManager) {

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
    }, {
      version: '1.3',
      upgrader: function(oldConfig){
        var configItemArray = [],
            configItem, toolConfig, i, len = oldConfig.analysisTools.length;

        for(i = 0; i < len; i++){
          toolConfig = oldConfig.analysisTools[i];
          configItem = {
            name: toolConfig.name,
            showHelp: true,
            showCredits: true,
            showChooseExtent: true,
            showReadyToUseLayers: true
          };
          configItemArray.push(configItem);
        }

        return {
          analysisTools: configItemArray
        };
      }
    }];
  }

  VersionManager.prototype = new BaseVersionManager();
  VersionManager.prototype.constructor = VersionManager;
  return VersionManager;
});