define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    'dojo/_base/html',
    "dojo/on",
    "dojo/dom-attr",
    "dijit/_WidgetsInTemplateMixin",
    "jimu/BaseWidgetSetting",
    'esri/geometry/Extent',
    'jimu/dijit/ExtentChooser',
    'jimu/utils',
    "dojo/text!./Edit.html"
  ],
  function(
    declare,
    lang,
    html,
    on,
    domAttr,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Extent,
    ExtentChooser,
    utils,
    template
    ){
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: "eBookmark-Edit",
      templateString: template,
      extent:  {},
      portalUrl: null,
      itemId: null,

      postCreate: function(){
        this.inherited(arguments);
        this.own(on(this.name, 'Change', lang.hitch(this, '_onNameChange')));
      },

      setConfig: function(bookmark){
        if (bookmark.name){
          this.name.set('value', bookmark.name);
        }
        if (bookmark.extent){
          this.extentChooser = new ExtentChooser({
            portalUrl : this.portalUrl,
            itemId: this.itemId,
            initExtent: new Extent(bookmark.extent)
          }, this.extentChooserNode);
        }else{
          this.extentChooser = new ExtentChooser({
            portalUrl : this.portalUrl,
            itemId: this.itemId
          }, this.extentChooserNode);
        }

        this.own(on(this.extentChooser, 'extentChange', lang.hitch(this, this._onExtentChange)));
      },

      getConfig: function(){
        var bookmark = {
          name: this.name.get("value"),
          extent: this.extentChooser.getExtent().toJson(),
          useradded: true
        };
        return bookmark;
      },

      _onNameChange: function(){
        this._checkRequiredField();
      },

      _onExtentChange: function(extent){
        this.currentExtent = extent;
      },

      _checkRequiredField: function(){
        if (!this.name.get('value')){
          if (this.popup){
            this.popup.disableButton(0);
          }
        }else{
          if (this.popup){
            this.popup.enableButton(0);
          }
        }
      }
    });
  });
