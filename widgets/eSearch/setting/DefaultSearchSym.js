///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
/*global define, dojo, dijit, require, esri, console, setTimeout*/
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
  'dojo/text!./DefaultSearchSym.html',
  'esri/request'
],
function(declare, lang, html, on, json, SymbolPicker, TabContainer, jsonUtils, SimpleMarkerSymbol, PictureMarkerSymbol, SimpleLineSymbol,
  CartographicLineSymbol, SimpleFillSymbol, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  template, esriRequest) {/*jshint unused: false*/
  return declare([_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-defaultsym-setting',
    templateString:template,
    nls:null,
    config:null,
    _isAddNow:true,
    searchSetting:null,
    _symbols:null,

    postCreate:function(){
      this.inherited(arguments);
      this.own(on(this.defaultPointSymbolPicker,'change',lang.hitch(this,this._onPointSymbolChange)));
      this.own(on(this.defaultLineSymbolPicker,'change',lang.hitch(this,this._onLineSymbolChange)));
      this.own(on(this.defaultPolySymbolPicker,'change',lang.hitch(this,this._onPolySymbolChange)));
      this._bindEvents();
      this.setConfig(this.config);
      this._isAddNow = this.config ? false : true;
      this.updateStatus(this._isAddNow);
    },
    
    startup: function(){
      this.inherited(arguments);
    },

    setConfig:function(config){
      this.config = config;
      if(!this.config){
        return;
      }
      this._symbols = this.config.symbols;
      if(this._symbols.picturemarkersymbol){
        /*if(this._symbols.picturemarkersymbol.url.substring(0,7) === 'images/'){
          var pre = '';
          this._symbols.picturemarkersymbol.url = pre + this._symbols.picturemarkersymbol.url;
        }*/
        this.defaultPointSymbolPicker.showBySymbol(jsonUtils.fromJson(this._symbols.picturemarkersymbol));
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
      var config = {
        symbols:this._symbols
      };
      
      this.config = config;
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
    },

    updateStatus:function(isAddNow){
      this._isAddNow = !!isAddNow;
      if(this._isAddNow){
        html.setStyle(this.btnAdd,'display','block');
        html.setStyle(this.btnUpdate,'display','none');
      }
      else{
        html.setStyle(this.btnUpdate,'display','block');
        html.setStyle(this.btnAdd,'display','none');
      }
    },

    onAdd:function(config){/*jshint unused: false*/},

    onUpdate:function(config){/*jshint unused: false*/},

    onAddCancel:function(){},

    onUpdateCancel:function(){},

    _bindEvents:function(){
      this.own(on(this.btnAdd,'click',lang.hitch(this,function(){
        var config = this.getConfig();
        if(config){
          this.setConfig(config);
          this.updateStatus(false);
          this.onAdd(config);
        }
      })));
      this.own(on(this.btnUpdate,'click',lang.hitch(this,function(){
        var config = this.getConfig();
        if(config){
          this.updateStatus(false);
          this.onUpdate(config);
        }
      })));
      this.own(on(this.btnCancel,'click',lang.hitch(this,function(){
        if(this._isAddNow){
          this.onAddCancel();
        }
        else{
          this.setConfig(this.config);
          this.onUpdateCancel();
        }
      })));
    }
  });
});