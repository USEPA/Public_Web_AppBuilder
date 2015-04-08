///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define, dojo, setTimeout*/
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
  './SingleSearchEdit',
  './DefaultSearchSymEdit',
  './DefaultBufferEdit',
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
          SimpleTable,SingleSearchEdit,DefaultSearchSymEdit,DefaultBufferEdit,SpatialRelationshipsEdit,
          Message,Popup,keys,NumberTextBox,TextBox,Select,esriRequest,domAttr) {/*jshint unused: false*/
  return declare([BaseWidgetSetting,_WidgetsInTemplateMixin], {
    baseClass: 'widget-esearch-setting',
    ds: null,
    layerUniqueCache: null,
    layerInfoCache: null,
    bufferDefaults:null,
    spatialrelationships:null,
    popup: null,
    popup2: null,
    popup3: null,
    popup4: null,
    popup5: null,
    popupSRedit: null,
    defaultBufferedit: null,
    defaultSingleSearchedit: null,
    defaultSearchSymedit: null,

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
      config.layers = this._getAllLayers();
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

    _getAllLayers: function () {
      var trs = this.searchesTable._getNotEmptyRows();
      var allLayers = array.map(trs, lang.hitch(this, function (item) {
        return item.singleSearch;
      }));
      return allLayers;
    },

    _onSREditOk: function() {
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
      this.popup2.close();
    },

    _onSREditClose: function() {
      this.popupSRedit = null;
      this.popup2 = null;
    },

    _openSREdit: function(title, spatrels) {
      this.popupSRedit = new SpatialRelationshipsEdit({
        nls: this.nls,
        config: spatrels || {}
      });

      this.popup2 = new Popup({
        titleLabel: title,
        autoHeight: true,
        content: this.popupSRedit,
        container: 'main-page',
        width: 640,
        height: 485,
        buttons: [{
          label: this.nls.ok,
          key: keys.ENTER,
          onClick: lang.hitch(this, '_onSREditOk')
        }, {
          label: this.nls.cancel,
          key: keys.ESCAPE
        }],
        onClose: lang.hitch(this, '_onSREditClose')
      });
      html.addClass(this.popup2.domNode, 'widget-setting-popup');
      this.popupSRedit.startup();
    },

    _onBufferEditOk: function() {
      var bConfig = this.defaultBufferedit.getConfig();

      if (bConfig.length < 0) {
        new Message({
          message: this.nls.warning
        });
        return;
      }
      this.config.bufferDefaults = bConfig;
      this.popup3.close();
    },

    _onBufferEditClose: function() {
      this.defaultBufferedit = null;
      this.popup3 = null;
    },

    _openBufferEdit: function(title, dBuffer) {
      this.defaultBufferedit = new DefaultBufferEdit({
        nls: this.nls,
        config: dBuffer || {}
      });

      this.popup3 = new Popup({
        titleLabel: title,
        autoHeight: true,
        content: this.defaultBufferedit,
        container: 'main-page',
        height: 485,
        buttons: [{
          label: this.nls.ok,
          key: keys.ENTER,
          onClick: lang.hitch(this, '_onBufferEditOk')
        }, {
          label: this.nls.cancel,
          key: keys.ESCAPE
        }],
        onClose: lang.hitch(this, '_onBufferEditClose')
      });
      html.addClass(this.popup3.domNode, 'widget-setting-popup');
      this.defaultBufferedit.startup();
    },

    _onSymbolEditOk: function() {
      var sConfig = this.defaultSearchSymedit.getConfig();

      if (sConfig.length < 0) {
        new Message({
          message: this.nls.warning
        });
        return;
      }
      this.config.symbols = sConfig;
      this.popup4.close();
    },

    _onSymbolEditClose: function() {
      this.defaultSearchSymedit = null;
      this.popup4 = null;
    },

    _openSymbolEdit: function(title, dSym) {
      this.defaultSearchSymedit = new DefaultSearchSymEdit({
        nls: this.nls,
        config: dSym || {}
      });

      this.popup4 = new Popup({
        titleLabel: title,
        autoHeight: true,
        content: this.defaultSearchSymedit,
        container: 'main-page',
        buttons: [{
          label: this.nls.ok,
          key: keys.ENTER,
          onClick: lang.hitch(this, '_onSymbolEditOk')
        }, {
          label: this.nls.cancel,
          key: keys.ESCAPE
        }],
        onClose: lang.hitch(this, '_onSymbolEditClose')
      });
      html.addClass(this.popup4.domNode, 'widget-setting-popup');
      this.defaultSearchSymedit.startup();
    },

    _onSingleSearchEditOk: function() {
      var sConfig = this.defaultSingleSearchedit.getConfig();

      if (sConfig.length < 0) {
        new Message({
          message: this.nls.warning
        });
        return;
      }

      if(this.popupState === 'ADD'){
        this.searchesTable.editRow(this.defaultSingleSearchedit.tr, {
          name: sConfig.name
        });
        this.defaultSingleSearchedit.tr.singleSearch = sConfig;
        this.popupState = '';
      }else{
        this.searchesTable.editRow(this.defaultSingleSearchedit.tr, {
          name: sConfig.name
        });
        this.defaultSingleSearchedit.tr.singleSearch = sConfig;
      }

      this.popup5.close();
      this.popupState = '';
    },

    _onSingleSearchEditClose: function() {
      if(this.popupState === 'ADD'){
        this.searchesTable.deleteRow(this.defaultSingleSearchedit.tr);
      }
      this.defaultSearchSymedit = null;
      this.popup5 = null;
    },

    _openSingleSearchEdit: function(title, tr) {
      this.defaultSingleSearchedit = new SingleSearchEdit({
        nls: this.nls,
        config: tr.singleSearch || {},
        searchSetting: this,
        layerUniqueCache: this.layerUniqueCache,
        layerInfoCache: this.layerInfoCache,
        tr: tr
      });

      this.popup5 = new Popup({
        titleLabel: title,
        autoHeight: true,
        content: this.defaultSingleSearchedit,
        container: 'main-page',
        buttons: [{
          label: this.nls.ok,
          key: keys.ENTER,
          onClick: lang.hitch(this, '_onSingleSearchEditOk')
        }, {
          label: this.nls.cancel,
          key: keys.ESCAPE
        }],
        onClose: lang.hitch(this, '_onSingleSearchEditClose')
      });
      html.addClass(this.popup5.domNode, 'widget-setting-popup');
      this.defaultSingleSearchedit.startup();
    },

    _bindEvents:function(){
      this.own(on(this.btnAddSearch,'click',lang.hitch(this,function(){
        var args = {
          config:null
        };
        this.popupState = 'ADD';
        var tr = this._createSingleSearch(args);
        if(tr){
          this._showSingleSearchEdit(tr);
        }
      })));
      this.own(on(this.btnSymSearch,'click',lang.hitch(this,function(){
        this._openSymbolEdit(this.nls.editDefaultSym, this.config);
      })));
      this.own(on(this.btnBufferSearch,'click',lang.hitch(this,function(){
        this._openBufferEdit(this.nls.updateBuffer, this.config);
      })));
      this.own(on(this.btnSpatialSearch,'click',lang.hitch(this,function(){
        this._openSREdit(this.nls.addspatalrelationships, this.spatialrelationships.spatialrelationship);
      })));
      this.own(on(this.searchesTable,'actions-edit',lang.hitch(this,function(tr){
        this.popupState = 'EDIT';
        this._showSingleSearchEdit(tr);
      })));
      this.own(on(this.searchesTable,'row-delete',lang.hitch(this,function(tr){
        delete tr.singleSearch;
      })));
    },

    reset:function(){
      this.zoomScale.set('value',10000);
      this.searchesTable.clear();
    },

    _showSingleSearchEdit: function (tr) {
      this._openSingleSearchEdit(this.nls.updateSearch, tr);
    },

    _initSearchesTable:function(){
      this.searchesTable.clear();
      var layers = this.config && this.config.layers;
      array.forEach(layers, lang.hitch(this, function(layerConfig, index) {
        /*var args = {
          config:layerConfig,
          layerindex: index
        };*/
        this._createSingleSearch(layerConfig);
      }));
    },

    _createSingleSearch:function(args){
      var rowData = {
        name: (args && args.name)||''
      };
      var result = this.searchesTable.addRow(rowData);
      if(!result.success){
        return null;
      }
      result.tr.singleSearch = args;
      return result.tr;
    }
  });
});
