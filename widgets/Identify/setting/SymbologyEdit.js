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
      baseClass: 'symbology-edit',
      templateString: template,
      config: null,
      flinfo: null,
      nls: null,
      _symbols: null,

      postCreate: function() {
        this.inherited(arguments);
        this.own(on(this.defaultPointSymbolPicker,'change',lang.hitch(this,this._onPointSymbolChange)));
        this.own(on(this.defaultLineSymbolPicker,'change',lang.hitch(this,this._onLineSymbolChange)));
        this.own(on(this.defaultPolySymbolPicker,'change',lang.hitch(this,this._onPolySymbolChange)));
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

        if(this._symbols.simplemarkersymbol){
          this.defaultPointSymbolPicker.showBySymbol(jsonUtils.fromJson(this._symbols.simplemarkersymbol));
        }else{
          this.defaultPointSymbolPicker.showByType('point');
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
        this._symbols.simplemarkersymbol = newSymbol.toJson();
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
        var config = {
          symbols:this._symbols
        };

        this.config = config;
        return this.config;
      }
    });
  });
