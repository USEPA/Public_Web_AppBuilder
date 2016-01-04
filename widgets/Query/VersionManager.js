define(['jimu/shared/BaseVersionManager'],
function(BaseVersionManager) {

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
        var newConfig = oldConfig;
        var query = null;
        for(var i = 0; i < newConfig.queries.length; i++){
          query = newConfig.queries[i];
          query.orderByFields = [];
          query.popup.fields = this._updatePopupFields(query.popup.fields);
        }
        return newConfig;
      },

      _updatePopupFields: function(popupFields){
        var result = [];
        var item = null;
        for(var i = 0; i < popupFields.length; i++){
          item = popupFields[i];
          if(item.showInInfoWindow){
            result.push({
              name: item.name,
              alias: item.alias,
              specialType: item.specialType
            });
          }
        }
        return result;
      }
    }, {
      version: '1.4',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }];
  }

  VersionManager.prototype = new BaseVersionManager();
  VersionManager.prototype.constructor = VersionManager;
  return VersionManager;
});