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
        var newConfig = oldConfig;

        var chart = null, types = null, colors = null, mode = null;
        var fixedMultiColors = ['#5d9cd3', '#eb7b3a', '#a5a5a5', '#febf29', '#4673c2', '#72ad4c'];

        for(var i = 0; i < newConfig.charts.length; i++){
          chart = newConfig.charts[i];
          mode = chart.mode;
          types = chart.types;
          colors = chart.colors;
          delete chart.types;
          delete chart.colors;

          if(mode === 'feature' || mode === 'category'){
            if(chart.valueFields.length === 1){
              //if one field selected, should show single color section
              colors = [colors[0]];
            }
            else{
              //if none or more than two fields selected, should show multiple color section
              colors = fixedMultiColors;
            }
          }
          else{
            //chart only supports single color for count and field mode
            colors = [colors[0]];
          }

          if(types.indexOf('column') >= 0){
            chart.column = {
              horizontalAxis: true,
              verticalAxis: true,
              colors: colors
            };
          }
          if(types.indexOf('bar') >= 0){
            chart.bar = {
              horizontalAxis: true,
              verticalAxis: true,
              colors: colors
            };
          }
          if(types.indexOf('line') >= 0){
            chart.line = {
              horizontalAxis: true,
              verticalAxis: true,
              colors: colors
            };
          }
          if(types.indexOf('pie') >= 0){
            chart.pie = {
              label: true,
              colors: fixedMultiColors
            };
          }
        }

        return newConfig;
      }
    }, {
      version: '1.2',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '1.3',
      upgrader: function(oldConfig){
        return oldConfig;
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