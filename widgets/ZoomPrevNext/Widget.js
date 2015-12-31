define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/dom-class',
  'dojo/on',
  'dojo/topic',
  'dijit/_WidgetsInTemplateMixin',
  'esri/toolbars/navigation',
  'jimu/BaseWidget'
], function(
  declare, 
  lang, 
  domClass,
  on, 
  topic,
  _WidgetsInTemplateMixin,
  Navigation,
  BaseWidget
) {
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-zoom-prev-next',
    
    startup: function() {
      this.inherited(arguments);
      
      var navToolbar = new Navigation(this.map);
      on(navToolbar, 'extent-history-change', lang.hitch(this, function() {
        domClass.toggle(this.leftArrow, 'zoom-prev-disabled', navToolbar.isFirstExtent());
        domClass.toggle(this.rightArrow, 'zoom-next-disabled', navToolbar.isLastExtent());
      }));

      on(this.zoomPrevButton, 'click', function() {
        navToolbar.zoomToPrevExtent();
      });

      on(this.zoomNextButton, 'click', function() {
        navToolbar.zoomToNextExtent();
      });
      
      // Listen to topics published by the WelWhatDisHelpAbout Help tab
      topic.subscribe('ZoomPrevNext', function(e) {
        if (e === 'prev') {
          navToolbar.zoomToPrevExtent();
        } else if (e === 'next') {
          navToolbar.zoomToNextExtent();
        }
      });
    }
  });
});
