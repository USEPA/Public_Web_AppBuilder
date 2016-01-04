///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin - Map Progress Indicator Settings
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/html',
    'dojo/_base/lang',
    'dojo/on',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/dom-attr',
    'jimu/BaseWidgetSetting',
    './ImageChooser',
    'esri/dijit/util/busyIndicator',
    'jimu/utils',
    'dijit/registry',
    'dojo/dom-style'
  ],
  function(
    declare,
    html,
    lang,
    on,
    _WidgetsInTemplateMixin,
    domAttr,
    BaseWidgetSetting,
    ImageChooser,
    busyUtil,
    utils,
    registry,
    domStyle) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'mapprogress-setting',

      postCreate: function(){
        this.inherited(arguments);
        this.imageChooser = new ImageChooser({
          displayImg: this.showImageChooser,
          goldenWidth: 100,
          goldenHeight: 60
        });
        html.addClass(this.imageChooser.domNode, 'img-chooser');
        html.place(this.imageChooser.domNode, this.imageChooserBase, 'replace');
        domAttr.set(this.mappreview, 'src', this.folderUrl + "images/Map.jpg");
        this.own(on(this.imageChooser, 'change', lang.hitch(this, this.updateMapBusyImg)));
      },

      updateMapBusyImg: function(){
        this.handle.hide();
        this.handle.destroy();
        this.handle = busyUtil.create({
          target: this.mappreview,
          imageUrl: this.imageChooser.imageData,
          backgroundOpacity: 0.01
        });
        this.handle.show();
      },

      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;
        if (this.config.mapprogressimage){
          var thumbnailValue = utils.processUrlInWidgetConfig(this.config.mapprogressimage, this.folderUrl);
          html.setAttr(this.showImageChooser, 'src', thumbnailValue);
          this.imageChooser.imageData = thumbnailValue;
        }
        this.handle = busyUtil.create({
          target: this.mappreview,
          imageUrl: this.imageChooser.imageData,
          backgroundOpacity: 0.01
        });
        this.handle.show();
        var busyDom = registry.byId('dojox_widget_Standby_0').domNode;
        if(busyDom.childNodes[0]){
          domStyle.set(busyDom.childNodes[0], 'cursor', 'default');
        }
        if(busyDom.childNodes[1]){
          domStyle.set(busyDom.childNodes[1], 'cursor', 'default');
        }
      },

      getConfig: function() {
        this.config.mapprogressimage = this.imageChooser.imageData;
        return this.config;
      }

    });
  });
