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
  'dojo/text!./LayerSearchSymEdit.html',
  'dojo/dom-style'
],
function(declare, lang, html, on, json, SymbolPicker, TabContainer, jsonUtils, SimpleMarkerSymbol, PictureMarkerSymbol, SimpleLineSymbol,
  CartographicLineSymbol, SimpleFillSymbol, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  template, domStyle) {
  return declare([_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
    baseClass: 'eSearch-layer-symbol-setting',
    templateString:template,
    nls:null,
    config:null,
    searchSetting:null,
    _sym:null,
    widget:null,
    geomType: null,

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
      //console.info(this.config);
      if(!this.config){
        return;
      }
      this._sym = this.config.symbology;
      if(this.geomType === 'esriGeometryPoint'){
        domStyle.set(this.PointSymbolRow, 'display', 'table-row');
        domStyle.set(this.PolySymbolRow, 'display', 'none');
        domStyle.set(this.LineSymbolRow, 'display', 'none');
        if(this._sym && this._sym.type === 'esriPMS'){
          var pms = lang.clone(this._sym);
          pms.url = this.widget.folderUrl + pms.url;
          this.defaultPointSymbolPicker.showBySymbol(jsonUtils.fromJson(pms));
        }
        if(this._sym && this._sym.type === 'esriSMS'){
          this.defaultPointSymbolPicker.showBySymbol(jsonUtils.fromJson(this._sym));
        }
        if(!this._sym){
          this.defaultPointSymbolPicker.showByType("marker");
        }
      }
      if(this.geomType === 'esriGeometryPolyline'){
        domStyle.set(this.PointSymbolRow, 'display', 'none');
        domStyle.set(this.PolySymbolRow, 'display', 'none');
        domStyle.set(this.LineSymbolRow, 'display', 'table-row');
        if(this._sym){
          this.defaultLineSymbolPicker.showBySymbol(jsonUtils.fromJson(this._sym));
        }else{
          this.defaultLineSymbolPicker.showByType("line");
        }
      }
      if(this.geomType === 'esriGeometryPolygon'){
        domStyle.set(this.PointSymbolRow, 'display', 'none');
        domStyle.set(this.PolySymbolRow, 'display', 'table-row');
        domStyle.set(this.LineSymbolRow, 'display', 'none');
        if(this._sym){
          this.defaultPolySymbolPicker.showBySymbol(jsonUtils.fromJson(this._sym));
        }else{
          this.defaultPolySymbolPicker.showByType("fill");
        }
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
      this.config = this._sym;
      return this.config;
    },

    _onPointSymbolChange:function(newSymbol){
      //if(newSymbol.type == "simplemarkersymbol"){
        this._sym = newSymbol.toJson();
      //}
    },

    _onLineSymbolChange:function(newSymbol){
      if(newSymbol.type == "simplelinesymbol"){
        this._sym = newSymbol.toJson();
      }
    },

    _onPolySymbolChange:function(newSymbol){
      if(newSymbol.type == "simplefillsymbol"){
        this._sym = newSymbol.toJson();
      }
    }
  });
});
