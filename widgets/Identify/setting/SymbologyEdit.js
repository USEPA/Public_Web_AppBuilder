/*global define*/
define(
  ['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/on',
    'jimu/dijit/SymbolPicker',
    'jimu/dijit/ImageChooser',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/Message',
    'dojo/text!./SymbologyEdit.html',
    'esri/symbols/jsonUtils',
    'jimu/utils',
    'dojo/dom-attr',
    'dijit/form/TextBox'
  ],
  function(
    declare,
    lang,
    array,
    html,
    on,
    SymbolPicker,
    ImageChooser,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Message,
    template,
    jsonUtils,
    jimuUtils,
    domAttr,
    TextBox
    ) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'symbology-edit',
      templateString: template,
      config: null,
      flinfo: null,
      nls: null,
      _symbols: null,
      _defaultPMS: null,

      postCreate: function() {
        this.inherited(arguments);
        this.own(on(this.defaultPointSymbolPicker,'change',lang.hitch(this,this._onPointSymbolChange)));
        this.own(on(this.defaultLineSymbolPicker,'change',lang.hitch(this,this._onLineSymbolChange)));
        this.own(on(this.defaultPolySymbolPicker,'change',lang.hitch(this,this._onPolySymbolChange)));
        this._defaultPMS = {
          url: '/widgets/Identify/images/i_info.png',
          height: '20',
          width: '20',
          type: 'esriPMS',
          angle: '0'
        };
        this.setConfig(this.config);
      },

      startup: function() {
        this.inherited(arguments);
      },

      setConfig:function(config){
        this.config = config;
        if(!this.config){
          return;
        }
        this._symbols = this.config.symbols;
        var pmsUrl;
        if(this._symbols.picturemarkersymbol && this._symbols.picturemarkersymbol.url){
          pmsUrl = jimuUtils.processUrlInWidgetConfig(this._symbols.picturemarkersymbol.url, this.folderUrl);
        }else{
          pmsUrl = jimuUtils.processUrlInWidgetConfig('/widgets/Identify/images/i_info.png', this.folderUrl);
        }
        domAttr.set(this.showImageChooser, 'src', pmsUrl);
        this.imageChooser = new ImageChooser({
          displayImg: this.showImageChooser,
          goldenWidth: 20,
          goldenHeight: 20
        });

        html.addClass(this.imageChooser.domNode, 'img-chooser');
        html.place(this.imageChooser.domNode, this.imageChooserBase);

        if(this._symbols.simplemarkersymbol){
          this.defaultPointSymbolPicker.showBySymbol(jsonUtils.fromJson(this._symbols.simplemarkersymbol));
        }else{
          this.defaultLineSymbolPicker.showByType('point');
        }
        if(this._symbols.simplelinesymbol){
          this.defaultLineSymbolPicker.showBySymbol(jsonUtils.fromJson(this._symbols.simplelinesymbol));
        }else{
          this.defaultLineSymbolPicker.showByType('line');
        }
        if(this._symbols.simplefillsymbol){
          this.defaultPolySymbolPicker.showBySymbol(jsonUtils.fromJson(this._symbols.simplefillsymbol));
        }else{
          this.defaultPolySymbolPicker.showByType('fill');
        }
      },

      _onPointSymbolChange:function(newSymbol){
        if(newSymbol.type == 'simplemarkersymbol'){
          this._symbols.simplemarkersymbol = newSymbol.toJson();
        }
      },

      _onLineSymbolChange:function(newSymbol){
        if(newSymbol.type == 'simplelinesymbol'){
          this._symbols.simplelinesymbol = newSymbol.toJson();
        }
      },

      _onPolySymbolChange:function(newSymbol){
        if(newSymbol.type == 'simplefillsymbol'){
          this._symbols.simplefillsymbol = newSymbol.toJson();
        }
      },

      getConfig: function() {
        this._defaultPMS.url = this.imageChooser.imageData;
        this._symbols.picturemarkersymbol = this._defaultPMS;
        var config = {
          symbols:this._symbols
        };

        this.config = config;
        return this.config;
      }
    });
  });
