define(['dojo/_base/declare', 'dojo/_base/lang', 'jimu/BaseWidget'],
function(declare, lang, BaseWidget) {
  return declare([BaseWidget], {

    baseClass: 'jimu-widget-widgeta',

    i: 0,
    j: 0,

    _onPublishClick: function() {
      this.publishData({
        message: 'I am widget A.'
      });
      this.i ++;
      this.pubInfoNode.innerText = 'Publish ' + this.i;
    },

    _onPublishHisClick: function() {
      this.publishData({
        message: 'I am widget A.'
      }, true);
      this.j ++;
      this.pubHisInfoNode.innerText = 'Publish ' + this.j;
    },

    _onLoadWidgetBClick: function(){
      var widgets = this.appConfig.getConfigElementsByName('WidgetB');
      if(widgets.length === 0){
        this.loadWidgetBInfoNode.innerText = 'Widget B is not configured.';
        return;
      }

      var widgetId = widgets[0].id;
      if(this.widgetManager.getWidgetById(widgetId)){
        this.loadWidgetBInfoNode.innerText = 'Widget B has been loaded.';
        return;
      }
      this.openWidgetById(widgetId).then(lang.hitch(this, function(widget){
        this.loadWidgetBInfoNode.innerText = widget.name + ' is loaded';
      }));
    }
  });
});