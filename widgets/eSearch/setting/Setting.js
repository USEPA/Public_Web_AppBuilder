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
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/_base/query',
  'dojo/on',
  'dojo/json',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'jimu/dijit/SimpleTable',
  './SingleSearch',
  './DefaultSearchSym',
  './DefaultSearchBuffer',
  './SpatialRelationshipsEdit',
  'jimu/dijit/Message',
  'jimu/dijit/Popup',
  'dojo/keys',
  'dijit/form/NumberTextBox',
  'dijit/form/TextBox',
  'dijit/form/Select',
  'esri/request',
  'dojo/dom-attr'
],
function(declare, lang, array, html, query, on,json, _WidgetsInTemplateMixin,BaseWidgetSetting,
          SimpleTable,SingleSearch,DefaultSearchSym,DefaultSearchBuffer,SpatialRelationshipsEdit,
          Message,Popup,keys,NumberTextBox,TextBox,Select,esriRequest,domAttr) {/*jshint unused: false*/
  return declare([BaseWidgetSetting,_WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-search-setting',
    ds: null,
    layerUniqueCache: null,
    layerInfoCache: null,
    bufferDefaults:null,
    spatialrelationships:null,
    popup: null,
    popupSRedit: null,

    postCreate:function(){
      this.inherited(arguments);
      this.layerUniqueCache = {};
      this.layerInfoCache = {};
      this._bindEvents();
      this.setConfig(this.config);
    },

    setConfig:function(config){
      //hack the 'Learn more about this widget link'
      setTimeout(function(){
        var helpLink = dojo.query('.help-link');
        helpLink[0].href = 'http://gis.calhouncounty.org/WAB/V1.1/widgets/eSearch/help/eSearch_Help.htm';
        html.setStyle(helpLink[0],'display','block');
      },600);
      this._showSearchesSection();
      this.config = config;
      this.reset();
      if(!this.config){
        return;
      }
      this._initSearchesTable();
      this.shareCbx.checked = this.config.shareResult === true;
      this.multiCbx.checked = this.config.multipartgraphicsearchchecked === true;
      this.toleranceCbx.checked = this.config.addpointtolerancechecked === true;
      if(this.config.toleranceforpointgraphicalselection){
        this.pointTolerance.set('value',parseInt(this.config.toleranceforpointgraphicalselection,10));
      }else{
        this.pointTolerance.set('value',6);
      }
      this.autoZoomCbx.checked = this.config.autozoomtoresults || true;
      this.keepGraphicalEnabledCbx.checked = this.config.keepgraphicalsearchenabled || false;
      if(this.config.zoomScale){
        this.zoomScale.set('value',parseInt(this.config.zoomScale,10));
      }
      if(this.config.initialView){
        this.selectInitialView.set('value', this.config.initialView);
      }
      this.bufferDefaults = this.config.bufferDefaults;
      this.spatialrelationships = this.config.spatialrelationships;
    },

    getConfig:function(){
      var config = {};
      var allSingleSearches = this._getAllSingleSearches();
      var valid = this.validate();
      if(!valid){
        return false;
      }
      var layers = array.map(allSingleSearches,lang.hitch(this,function(item){
        return item.getConfig();
      }));
      config.layers = layers;
      config.zoomScale = parseInt(this.zoomScale.get('value'),10);
      config.shareResult = this.shareCbx.checked;
      config.initialView = this.selectInitialView.get('value');
      config.multipartgraphicsearchchecked = this.multiCbx.checked;
      config.addpointtolerancechecked = this.toleranceCbx.checked;
      config.keepgraphicalsearchenabled = this.keepGraphicalEnabledCbx.checked;
      config.autozoomtoresults = this.autoZoomCbx.checked;
      config.toleranceforpointgraphicalselection = parseInt(this.pointTolerance.get('value'),10);
      config.bufferDefaults = this.bufferDefaults;
      config.spatialrelationships = this.spatialrelationships;
      config.symbols = {};
      if(this.config.symbols){
        config.symbols = lang.mixin({},this.config.symbols);
      }
      this.config = lang.mixin({},config);
      return config;
    },
    
    _onEditOk: function() {
      var SRs = this.popupSRedit.getConfig();
      
      if (SRs.length < 0) {
        new Message({
          message: this.nls.warning
        });
        return;
      }
      var obj = {};
      obj.spatialrelationship = SRs;
      this.spatialrelationships = obj;
      this.popup.close();
    },

    _onEditClose: function() {
      this.popupSRedit = null;
      this.popup = null;
    },
    
    _openEdit: function(title, spatrels) {
      this.popupSRedit = new SpatialRelationshipsEdit({
        nls: this.nls,
        config: spatrels || {}
      });

      this.popup = new Popup({
        titleLabel: title,
        autoHeight: true,
        content: this.popupSRedit,
        container: 'main-page',
        width: 640,
        height: 485,
        buttons: [{
          label: this.nls.ok,
          key: keys.ENTER,
          onClick: lang.hitch(this, '_onEditOk')
        }, {
          label: this.nls.cancel,
          key: keys.ESCAPE
        }],
        onClose: lang.hitch(this, '_onEditClose')
      });
      html.addClass(this.popup.domNode, 'widget-setting-popup');
      this.popupSRedit.startup();
    },

    _bindEvents:function(){
      this.own(on(this.btnAddSearch,'click',lang.hitch(this,function(){
        var args = {
          config:null
        };
        var tr = this._createSingleSearch(args);
        if(tr){
          var ss = tr.singleSearch;
          this._showSingleSearchSection(ss);
        }
      })));
      this.own(on(this.btnSymSearch,'click',lang.hitch(this,function(){
        var args = {
          config:this.config
        };
        if(this.ds){
          this._showDefaultSymbologySection();
        }else{
          this.ds = this._createSearchDefaultSym(args);
          this._showDefaultSymbologySection();
        }
      })));
      this.own(on(this.btnBufferSearch,'click',lang.hitch(this,function(){
        var args = {
          config:this.config
        };
        if(this.bs){
          this._showDefaultBufferSection();
        }else{
          this.bs = this._createSearchDefaultBuffer(args);
          this._showDefaultBufferSection();
        }
      })));
      this.own(on(this.btnSpatialSearch,'click',lang.hitch(this,function(){
        console.info(this.spatialrelationships);
        this._openEdit(this.nls.addspatalrelationships, this.spatialrelationships.spatialrelationship);
      })));
      this.own(on(this.searchesTable,'actions-edit',lang.hitch(this,function(tr){
        var singleSearch = tr.singleSearch;
        if(singleSearch){
          this._showSingleSearchSection(singleSearch);
        }
      })));
      this.own(on(this.searchesTable,'row-delete',lang.hitch(this,function(tr){
        var singleSearch = tr.singleSearch;
        if(singleSearch){
          singleSearch.destroy();
        }
        delete tr.singleSearch;
      })));
      this.own(on(this.searchesTable,'rows-clear',lang.hitch(this,function(trs){
        array.forEach(trs,lang.hitch(this,function(tr){
          var singleSearch = tr.singleSearch;
          if(singleSearch){
            singleSearch.destroy();
          }
          delete tr.singleSearch;
        }));
      })));
    },

    reset:function(){
      this.zoomScale.set('value',10000);
      this.searchesTable.clear();
    },

    validate:function(){
      if(!this.zoomScale.validate()){
        return false;
      }
      var allSingleSearches = this._getAllSingleSearches();
      var valid = array.every(allSingleSearches,lang.hitch(this,function(item){
        return item.validate(false);
      }));
      return valid;
    },

    _showSearchesSection:function(){
      html.setStyle(this.searchesSection,'display','block');
      html.setStyle(this.defaultSymSection,'display','none');
      html.setStyle(this.singleSearchSection,'display','none');
      html.setStyle(this.defaultBufferSection,'display','none');
    },

    _showSingleSearchSection:function(singleSearch){
      this._hideSingleSearches(singleSearch);
      html.setStyle(this.searchesSection,'display','none');
      html.setStyle(this.defaultSymSection,'display','none');
      html.setStyle(this.singleSearchSection,'display','block');
      html.setStyle(this.defaultBufferSection,'display','none');
    },
    
    _showDefaultSymbologySection:function(){
      html.setStyle(this.searchesSection,'display','none');
      html.setStyle(this.defaultSymSection,'display','block');
      html.setStyle(this.singleSearchSection,'display','none');
      html.setStyle(this.defaultBufferSection,'display','none');
    },
    
    _showDefaultBufferSection:function(){
      html.setStyle(this.searchesSection,'display','none');
      html.setStyle(this.defaultSymSection,'display','none');
      html.setStyle(this.singleSearchSection,'display','none');
      html.setStyle(this.defaultBufferSection,'display','block');
    },

    _initSearchesTable:function(){
      this.searchesTable.clear();
      var layers = this.config && this.config.layers;
      array.forEach(layers, lang.hitch(this, function(layerConfig, index) {
        var args = {
          config:layerConfig,
          layerindex: index
        };
        this._createSingleSearch(args);
      }));
    },

    _createSingleSearch:function(args){
      args.searchSetting = this;
      args.nls = this.nls;
      args.layerUniqueCache = this.layerUniqueCache;
      args.layerInfoCache = this.layerInfoCache;
      var rowData = {
        name: (args.config && args.config.name)||''
      };
      var result = this.searchesTable.addRow(rowData);
      if(!result.success){
        return null;
      }
      var singleSearch = new SingleSearch(args);
      singleSearch.placeAt(this.singleSearchSection);
      singleSearch.startup();
      html.setStyle(singleSearch.domNode,'display','none');
      result.tr.singleSearch = singleSearch;
      this.own(on(singleSearch,'Add',lang.hitch(this,function(config){
        var name = config.name||'';
        this.searchesTable.editRow(result.tr,{name:name});
        this._showSearchesSection();
      })));
      this.own(on(singleSearch,'Update',lang.hitch(this,function(config){
        var name = config.name||'';
        this.searchesTable.editRow(result.tr,{name:name});
        this._showSearchesSection();
      })));
      this.own(on(singleSearch,'AddCancel',lang.hitch(this,function(){
        delete result.tr.singleSearch;
        this.searchesTable.deleteRow(result.tr);
        singleSearch.destroy();
        this._showSearchesSection();
      })));
      this.own(on(singleSearch,'UpdateCancel',lang.hitch(this,function(){
        this._showSearchesSection();
      })));
      return result.tr;
    },
    
    _createSearchDefaultSym:function(args){
      args.searchSetting = this;
      args.nls = this.nls;
      var defaultSearchSym = new DefaultSearchSym(args);
      defaultSearchSym.placeAt(this.defaultSymSection);
      defaultSearchSym.startup();
      this.own(on(defaultSearchSym,'Add',lang.hitch(this,function(config){
        this.config.symbols = config.symbols;
        this._showSearchesSection();
      })));
      this.own(on(defaultSearchSym,'Update',lang.hitch(this,function(config){
        this.config.symbols = config.symbols;
        this._showSearchesSection();
      })));
      this.own(on(defaultSearchSym,'AddCancel',lang.hitch(this,function(){
        this._showSearchesSection();
      })));
      this.own(on(defaultSearchSym,'UpdateCancel',lang.hitch(this,function(){
        this._showSearchesSection();
      })));
      return defaultSearchSym;
    },
    
    _createSearchDefaultBuffer:function(args){
      args.searchSetting = this;
      args.nls = this.nls;
      var defaultSearchBuffer = new DefaultSearchBuffer(args);
      defaultSearchBuffer.placeAt(this.defaultBufferSection);
      defaultSearchBuffer.startup();
      this.own(on(defaultSearchBuffer,'Add',lang.hitch(this,function(config){
        this.config.bufferDefaults = config.bufferDefaults;
        this._showSearchesSection();
      })));
      this.own(on(defaultSearchBuffer,'Update',lang.hitch(this,function(config){
        this.config.bufferDefaults = config.bufferDefaults;
        this._showSearchesSection();
      })));
      this.own(on(defaultSearchBuffer,'AddCancel',lang.hitch(this,function(){
        this._showSearchesSection();
      })));
      this.own(on(defaultSearchBuffer,'UpdateCancel',lang.hitch(this,function(){
        this._showSearchesSection();
      })));
      return defaultSearchBuffer;
    },

    _hideSingleSearches:function(ignoredSingleSearch){
      var allSingleSearches = this._getAllSingleSearches();
      array.forEach(allSingleSearches,lang.hitch(this,function(item){
        html.setStyle(item.domNode,'display','none');
      }));
      if(ignoredSingleSearch){
        html.setStyle(ignoredSingleSearch.domNode,'display','block');
      }
    },

    _getAllSingleSearches:function(){
      var trs = this.searchesTable._getNotEmptyRows();
      var allSingleSearches = array.map(trs,lang.hitch(this,function(item){
        return item.singleSearch;
      }));
      return allSingleSearches;
    }
  });
});