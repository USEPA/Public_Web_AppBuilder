///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin - Map Progress Indicator
///////////////////////////////////////////////////////////////////////////
/*global define, setTimeout, clearTimeout*/
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/on',
    'jimu/BaseWidget',
    'esri/dijit/util/busyIndicator',
    'jimu/utils',
    'dijit/registry',
    'dojo/dom-style'
  ],
  function(
    declare,
    lang,
    on,
    BaseWidget,
    busyUtil,
    utils,
    registry,
    domStyle) {
    var clazz = declare([BaseWidget], {
      handle: null,
      name: 'MapProgress',
      timer: null,

      startup: function() {
        var busyURL = utils.processUrlInWidgetConfig(this.config.mapprogressimage, this.folderUrl);
        this.handle = busyUtil.create({
          target: "map",
          imageUrl: busyURL,
          backgroundOpacity: 0.01
        });

        this.own(on(this.map, 'update-start', lang.hitch(this, function(){
          this.timer = setTimeout(lang.hitch(this, function () {
            this.timeoutClose();
          }), 5000);
          this.handle.show();
        })));

        this.own(on(this.map, 'update-end', lang.hitch(this, function(){
          clearTimeout(this.timer);
          this.handle.hide();
        })));
        this.inherited(arguments);
        var busyDom = registry.byId('dojox_widget_Standby_0').domNode;
        if(busyDom.childNodes[0]){
          domStyle.set(busyDom.childNodes[0], 'cursor', 'default');
        }
        if(busyDom.childNodes[1]){
          domStyle.set(busyDom.childNodes[1], 'cursor', 'default');
        }
      },

      onClose: function(){
        if(this.handle){
          this.handle.destory();
        }
      },

      /*In case the map hangs and the update-end never fires*/
      timeoutClose: function(){
        console.info("got here");
        if(this.handle){
          this.handle.hide();
        }
      }

    });

    return clazz;
  });
