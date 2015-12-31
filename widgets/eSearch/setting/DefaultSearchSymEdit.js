///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define*/
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/on',
  'dojo/json',
  'jimu/dijit/SymbolPicker',
  'jimu/dijit/TabContainer',
  'esri/symbols/jsonUtils',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/PictureMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/CartographicLineSymbol',
  'esri/symbols/SimpleFillSymbol',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./DefaultSearchSymEdit.html'
],
function(declare, lang, html, on, json, SymbolPicker, TabContainer, jsonUtils, SimpleMarkerSymbol, PictureMarkerSymbol, SimpleLineSymbol,
  CartographicLineSymbol, SimpleFillSymbol, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  template) {
  return declare([_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
    baseClass: 'eSearch-default-symbol-setting',
    templateString:template,
    nls:null,
    config:null,
    searchSetting:null,
    _symbols:null,
    widget:null,

    postCreate:function(){
      this.inherited(arguments);
      this.own(on(this.defaultPointSymbolPicker,'change',lang.hitch(this,this._onPointSymbolChange)));
      this.own(on(this.defaultLineSymbolPicker,'change',lang.hitch(this,this._onLineSymbolChange)));
      this.own(on(this.defaultPolySymbolPicker,'change',lang.hitch(this,this._onPolySymbolChange)));
      this.setConfig(this.config);
    },

    startup: function(){
      this.inherited(arguments);
    },

    setConfig:function(config){
      this.config = config;
      console.info(this.config);
      if(!this.config){
        return;
      }
      this._symbols = this.config.symbols;
      if(this._symbols.picturemarkersymbol){
        var pms = lang.clone(this._symbols.picturemarkersymbol);
        pms.url = this.widget.folderUrl + pms.url;
        console.info(pms);
        this.defaultPointSymbolPicker.showBySymbol(jsonUtils.fromJson(pms));
      }
      if(this._symbols.simplemarkersymbol){
        this.defaultPointSymbolPicker.showBySymbol(jsonUtils.fromJson(this._symbols.simplemarkersymbol));
      }
      if(this._symbols.simplelinesymbol){
        this.defaultLineSymbolPicker.showBySymbol(jsonUtils.fromJson(this._symbols.simplelinesymbol));
      }else{
        this.defaultLineSymbolPicker.showByType("line");
      }
      if(this._symbols.simplefillsymbol){
        this.defaultPolySymbolPicker.showBySymbol(jsonUtils.fromJson(this._symbols.simplefillsymbol));
      }else{
        this.defaultPolySymbolPicker.showByType("fill");
      }
    },

    _cloneSymbol:function(symbol){
      if(!symbol){
        return null;
      }
      var jsonSym = symbol.toJson();
      var clone = jsonUtils.fromJson(jsonSym);
      return clone;
    },

    getConfig:function(){
      /*var config = {
        symbols: this._symbols
      };*/

      this.config = this._symbols;
      return this.config;
    },

    _onPointSymbolChange:function(newSymbol){
      if(newSymbol.type == "simplemarkersymbol"){
        this._symbols.simplemarkersymbol = newSymbol.toJson();
        this._symbols.picturemarkersymbol = null;
      }else{
        this._symbols.picturemarkersymbol = newSymbol.toJson();
        this._symbols.simplemarkersymbol = null;
      }
    },

    _onLineSymbolChange:function(newSymbol){
      if(newSymbol.type == "simplelinesymbol"){
        this._symbols.simplelinesymbol = newSymbol.toJson();
      }
    },

    _onPolySymbolChange:function(newSymbol){
      if(newSymbol.type == "simplefillsymbol"){
        this._symbols.simplefillsymbol = newSymbol.toJson();
      }
    }
  });
});
