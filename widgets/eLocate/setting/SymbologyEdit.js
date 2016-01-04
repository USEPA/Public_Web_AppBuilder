/*global define*/
define(
  ['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/on',
    'jimu/dijit/SymbolPicker',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/Message',
    'dojo/text!./SymbologyEdit.html',
    'esri/symbols/jsonUtils'
  ],
  function(
    declare,
    lang,
    array,
    html,
    on,
    SymbolPicker,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Message,
    template,
    jsonUtils
    ) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'eLocate-default-symbol-setting',
      templateString: template,
      config: null,
      flinfo: null,
      nls: null,
      _symbols: null,
      widget:null,

      postCreate: function() {
        this.inherited(arguments);
        this.own(on(this.defaultAddressSymbolPicker,'change',lang.hitch(this,this._onAddressSymbolChange)));
        this.own(on(this.defaultCoordinateSymbolPicker,'change',lang.hitch(this,this._onCoordinateSymbolChange)));
        this.own(on(this.defaultReverseSymbolPicker,'change',lang.hitch(this,this._onReverseSymbolChange)));
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
        console.info(this.config.symbols);
        var pms;
        if(this._symbols.coordpicturemarkersymbol){

          pms = lang.clone(this._symbols.coordpicturemarkersymbol);
          if(pms.url.indexOf(this.widget.folderUrl) === -1){
            pms.url = this.widget.folderUrl + pms.url;
          }
          this.defaultCoordinateSymbolPicker.showBySymbol(jsonUtils.fromJson(pms));
        }else{
          this.defaultCoordinateSymbolPicker.showByType('point');
        }
        if(this._symbols.geopicturemarkersymbol){
          pms = lang.clone(this._symbols.geopicturemarkersymbol);
          if(pms.url.indexOf(this.widget.folderUrl) === -1){
            pms.url = this.widget.folderUrl + pms.url;
          }
          this.defaultReverseSymbolPicker.showBySymbol(jsonUtils.fromJson(pms));
        }else{
          this.defaultReverseSymbolPicker.showByType('point');
        }
        if(this._symbols.addresspicturemarkersymbol){
          pms = lang.clone(this._symbols.addresspicturemarkersymbol);
          if(pms.url.indexOf(this.widget.folderUrl) === -1){
            pms.url = this.widget.folderUrl + pms.url;
          }
          this.defaultAddressSymbolPicker.showBySymbol(jsonUtils.fromJson(pms));
        }else{
          this.defaultAddressSymbolPicker.showByType('point');
        }
      },

      _onAddressSymbolChange:function(newSymbol){
        this._symbols.addresspicturemarkersymbol = newSymbol.toJson();
      },

      _onCoordinateSymbolChange:function(newSymbol){
        this._symbols.coordpicturemarkersymbol = newSymbol.toJson();
      },

      _onReverseSymbolChange:function(newSymbol){
        this._symbols.geopicturemarkersymbol = newSymbol.toJson();
      },

      getConfig: function() {
        var config = {
          symbols:this._symbols
        };

        this.config = config;
        return this.config;
      }
    });
  });
