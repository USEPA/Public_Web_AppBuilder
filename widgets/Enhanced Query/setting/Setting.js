
define([
  'dojo/_base/declare',
  'jimu/BaseWidgetSetting'
],
function(declare, BaseWidgetSetting) {

  return declare([BaseWidgetSetting], {
    baseClass: 'jimu-widget-EnhancedQuery-setting',

    postCreate: function(){
      //the config object is passed in
      this.setConfig(this.config);
    },

    setConfig: function(config){
      this.textNode.value = config.configText;
      this.textNode2.value = config.configText2;

    },

    getConfig: function(){
      //WAB will get config object through this method
      return {
          configText: this.textNode.value,
          configText2: this.textNode2.value

      };
    },

     


  });
});