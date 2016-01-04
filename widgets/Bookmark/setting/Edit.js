define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    'dojo/_base/html',
    "dojo/on",
    "dijit/_WidgetsInTemplateMixin",
    "jimu/BaseWidgetSetting",
    'esri/geometry/Extent',
    'jimu/dijit/ImageChooser',
    'jimu/dijit/ExtentChooser',
    'jimu/utils',
    "dojo/text!./Edit.html"
  ],
  function(
    declare,
    lang,
    html,
    on,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Extent,
    ImageChooser,
    ExtentChooser,
    utils,
    template
    ){
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: "jimu-Bookmark-Edit",
      ImageChooser: null,
      templateString: template,
      extent:  {},
      portalUrl: null,
      itemId: null,
      isInWebmap: false,
      mapOptions: null,

      postCreate: function(){
        this.inherited(arguments);
        this.imageChooser = new ImageChooser({
          cropImage: true,
          defaultSelfSrc: this.folderUrl + "images/thumbnail_default.png",
          showSelfImg: true,
          format: [ImageChooser.GIF, ImageChooser.JPEG, ImageChooser.PNG],
          goldenWidth: 100,
          goldenHeight: 60
        });
        this.own(on(this.name, 'Change', lang.hitch(this, '_onNameChange')));
        html.addClass(this.imageChooser.domNode, 'img-chooser');
        html.place(this.imageChooser.domNode, this.imageChooserBase, 'replace');
      },

      setConfig: function(bookmark){
        var args = {
          portalUrl : this.portalUrl,
          itemId: this.itemId
        };

        if (bookmark.name){
          this.name.set('value', bookmark.name);
        }
        if (bookmark.thumbnail){
          var thumbnailValue = utils.processUrlInWidgetConfig(bookmark.thumbnail, this.folderUrl);
          this.imageChooser.setDefaultSelfSrc(thumbnailValue);
        }
        if (bookmark.extent){
          args.initExtent = new Extent(bookmark.extent);
        }
        if(this.mapOptions && this.mapOptions.lods){
          args.lods = this.mapOptions.lods;
        }
        if(bookmark.isInWebmap){
          this.isInWebmap = true;
        }

        this.extentChooser = new ExtentChooser(args, this.extentChooserNode);
        this.own(on(this.extentChooser, 'extentChange', lang.hitch(this, this._onExtentChange)));
      },

      getConfig: function(){
        var bookmark = {
          name: this.name.get("value"),
          extent: this.extentChooser.getExtent(),
          thumbnail: this.imageChooser.imageData,
          isInWebmap: this.isInWebmap
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