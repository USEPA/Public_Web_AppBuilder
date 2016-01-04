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
        var newConfig = oldConfig;
        newConfig.bufferDefaults.addtolegend = false;
        for(var l = 0; l < newConfig.layers.length; l++){
          var lay = newConfig.layers[l];
          delete lay.showattachments;
        }
        return newConfig;
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
        newConfig.exportsearchurlchecked = true;
        return newConfig;
      }
    },{
      version: '1.2.0.3',
      upgrader: function(oldConfig){
        var newConfig = oldConfig;
        newConfig.enablePopupsOnResultClick = true;
        return newConfig;
      }
    },{
      version: '1.2.0.4',
      upgrader: function(oldConfig){
        var newConfig = oldConfig;
        newConfig.graphicalsearchoptions.keepgraphicalsearchenabled = oldConfig.oldConfig;
        newConfig.graphicalsearchoptions.toleranceforpointgraphicalselection = oldConfig.toleranceforpointgraphicalselection;
        newConfig.graphicalsearchoptions.addpointtolerancechecked = oldConfig.addpointtolerancechecked;
        newConfig.graphicalsearchoptions.multipartgraphicsearchchecked = oldConfig.multipartgraphicsearchchecked;
        newConfig.graphicalsearchoptions.buffercheckedbydefaultgraphicaloption = false;
        newConfig.graphicalsearchoptions.showmultigraphicsgraphicaloption = true;
        newConfig.graphicalsearchoptions.showaddtolerancegraphicaloption = true;
        newConfig.graphicalsearchoptions.showaddsqltextgraphicaloption = true;
        newConfig.graphicalsearchoptions.showbuffergraphicaloption = true;
        return newConfig;
      }
    },{
      version: '1.2.0.5',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    },{
      version: '1.2.0.6',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    },{
      version: '1.2.0.7',
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
    }];
  }

  VersionManager.prototype = new BaseVersionManager();
  VersionManager.prototype.constructor = VersionManager;
  return VersionManager;
});
