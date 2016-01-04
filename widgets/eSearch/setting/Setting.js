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
  './GraphicalEdit',
  './DisableTabEdit',
  './ResultFormatEdit',
  'jimu/dijit/Message',
  'jimu/dijit/Popup',
  'dojo/keys',
  'dijit/form/NumberTextBox',
  'dijit/form/TextBox',
  'dijit/form/Select',
  'esri/request',
  'dojo/dom-attr'
],
function(declare, lang, array, html, query, on,json, _WidgetsInTemplateMixin, BaseWidgetSetting,
          SimpleTable, SingleSearchEdit, DefaultSearchSymEdit, DefaultBufferEdit, SpatialRelationshipsEdit,
          GraphicalEdit, DisableTabEdit, ResultFormatEdit, Message, Popup, keys, NumberTextBox, TextBox,
          Select, esriRequest, domAttr) {/*jshint unused: false*/
  return declare([BaseWidgetSetting,_WidgetsInTemplateMixin], {
    baseClass: 'widget-esearch-setting',
    ds: null,
    layerUniqueCache: null,
    layerInfoCache: null,
    bufferDefaults:null,
    spatialrelationships:null,
    graphicalsearchoptions:null,
    disabledTabs: null,
    popup: null,
    popup2: null,
    popup3: null,
    popup4: null,
    popup5: null,
    popup6: null,
    popup7: null,
    popup8: null,
    popupSRedit: null,
    popupGOedit: null,
    popupDisableTabedit: null,
    defaultBufferedit: null,
    defaultSingleSearchedit: null,
    defaultSearchSymedit: null,
    popupformatedit: null,

    postCreate:function(){
      this.inherited(arguments);
      this.layerUniqueCache = {};
      this.layerInfoCache = {};
      this._bindEvents();
      this.setConfig(this.config);
    },

    setConfig:function(config){
      console.info(this);
      //hack the 'Learn more about this widget link'
      setTimeout(function(){
        var helpLink = dojo.query('.help-link');
        helpLink[0].href = 'http://gis.calhouncounty.org/WAB/V1.3/widgets/eSearch/help/eSearch_Help.htm';
        html.setStyle(helpLink[0],'display','block');
      },600);

      this.config = config;
      this.reset();
      if(!this.config){
        return;
      }
      this.graphicalsearchoptions = this.config.graphicalsearchoptions;
      this._initSearchesTable();
      this.enablePopupsCbx.setValue(this.config.enablePopupsOnResultClick);
      this.limit2MapExtCbx.setValue(this.config.limitsearch2mapextentchecked);
      this.exportSearchURLCbx.setValue(this.config.exportsearchurlchecked);
      var isAutoZoom = (this.config.hasOwnProperty('autozoomtoresults') && !this.config.autozoomtoresults)? false : true;
      this.autoZoomCbx.setValue(isAutoZoom);
      this.mouseOverGraphicsCbx.setValue(this.config.mouseovergraphics || false);
      if(this.config.hasOwnProperty('disabledtabs')){
        this.disabledTabs = this.config.disabledtabs;
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
      config.initialView = this.selectInitialView.get('value');
      if(this.disabledTabs && this.disabledTabs.length > 0){
        config.disabledtabs = this.disabledTabs;
      }
      config.enablePopupsOnResultClick = this.enablePopupsCbx.getValue();
      config.exportsearchurlchecked = this.exportSearchURLCbx.getValue();
      config.limitsearch2mapextentchecked = this.limit2MapExtCbx.getValue();
      config.autozoomtoresults = this.autoZoomCbx.getValue();
      config.mouseovergraphics = this.mouseOverGraphicsCbx.getValue();
      config.bufferDefaults = this.bufferDefaults;
      config.spatialrelationships = this.spatialrelationships;
      config.graphicalsearchoptions = this.graphicalsearchoptions;
      config.symbols = {};
      if(this.config.symbols){
        config.symbols = lang.mixin({},this.config.symbols);
      }
      config.resultFormat = this.config.resultFormat;
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

    _onGOEditOk: function() {
      var config = this.popupGOedit.getConfig();

      if (config.length < 0) {
        new Message({
          message: this.nls.warning
        });
        return;
      }
      this.graphicalsearchoptions = config;
      this.popup5.close();
    },

    _onGOEditClose: function() {
      this.popupGOedit = null;
      this.popup5 = null;
    },

    _openGOEdit: function(title, config) {
      this.popupGOedit = new GraphicalEdit({
        nls: this.nls,
        config: config || {}
      });

      this.popup5 = new Popup({
        titleLabel: title,
        autoHeight: true,
        content: this.popupGOedit,
        container: 'main-page',
        width: 880,
        buttons: [{
          label: this.nls.ok,
          key: keys.ENTER,
          onClick: lang.hitch(this, '_onGOEditOk')
        }, {
          label: this.nls.cancel,
          key: keys.ESCAPE
        }],
        onClose: lang.hitch(this, '_onGOEditClose')
      });
      html.addClass(this.popup5.domNode, 'widget-setting-popup');
      this.popupGOedit.startup();
    },

    _onDTEditOk: function() {
      var DTs = this.popupDisableTabedit.getConfig();

      if (DTs.length < 0) {
        new Message({
          message: this.nls.warning
        });
        return;
      }
      this.disabledTabs = DTs;
      this.popup7.close();
    },

    _onDTEditClose: function() {
      this.popupDisableTabedit = null;
      this.popup7 = null;
    },

    _openDTEdit: function(title, disTabs) {
      this.popupDisableTabedit = new DisableTabEdit({
        nls: this.nls,
        config: disTabs || {}
      });

      this.popup7 = new Popup({
        titleLabel: title,
        autoHeight: true,
        content: this.popupDisableTabedit,
        container: 'main-page',
        width: 640,
        buttons: [{
          label: this.nls.ok,
          key: keys.ENTER,
          onClick: lang.hitch(this, '_onDTEditOk')
        }, {
          label: this.nls.cancel,
          key: keys.ESCAPE
        }],
        onClose: lang.hitch(this, '_onDTEditClose')
      });
      html.addClass(this.popup7.domNode, 'widget-setting-popup');
      this.popupDisableTabedit.startup();
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
        height: 505,
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
        config: dSym || {},
        widget:  this
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

      this.popup6.close();
      this.popupState = '';
    },

    _onSingleSearchEditClose: function() {
      if(this.popupState === 'ADD'){
        this.searchesTable.deleteRow(this.defaultSingleSearchedit.tr);
      }
      this.defaultSearchSymedit = null;
      this.popup6 = null;
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

      this.popup6 = new Popup({
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
      html.addClass(this.popup6.domNode, 'widget-setting-popup');
      this.defaultSingleSearchedit.startup();
    },

    _onFormatEditOk: function() {
      this.config.resultFormat = this.popupformatedit.getConfig().format;
      this.popup8.close();
      this.popupState = '';
    },

    _onFormatEditClose: function() {
      this.popupfromatedit = null;
      this.popup8 = null;
    },

    _openFormatEdit: function(title) {
      this.popupformatedit = new ResultFormatEdit({
        nls: this.nls,
        config: this.config || {}
      });

      this.popup8 = new Popup({
        titleLabel: title,
        autoHeight: true,
        content: this.popupformatedit,
        container: 'main-page',
        width: 540,
        buttons: [{
          label: this.nls.ok,
          key: keys.ENTER,
          onClick: lang.hitch(this, '_onFormatEditOk')
        }, {
          label: this.nls.cancel,
          key: keys.ESCAPE
        }],
        onClose: lang.hitch(this, '_onFormatEditClose')
      });
      html.addClass(this.popup8.domNode, 'widget-setting-format');
      this.popupformatedit.startup();
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
      this.own(on(this.btnFormatResults,'click',lang.hitch(this,function(){
        this._openFormatEdit(this.nls.editResultFormat);
      })));
      this.own(on(this.btnBufferSearch,'click',lang.hitch(this,function(){
        this._openBufferEdit(this.nls.updateBuffer, this.config);
      })));
      this.own(on(this.btnSpatialSearch,'click',lang.hitch(this,function(){
        this._openSREdit(this.nls.addspatalrelationships, this.spatialrelationships.spatialrelationship);
      })));
      this.own(on(this.btnGraphicalSearch,'click',lang.hitch(this,function(){
        this._openGOEdit(this.nls.addgraphicalsearchoptions, this.graphicalsearchoptions);
      })));
      this.own(on(this.btnDisableTabs,'click',lang.hitch(this,function(){
        this._openDTEdit(this.nls.editdisabledtaboptions, this.disabledTabs);
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
      /*this.zoomScale.set('value',10000);*/
      this.searchesTable.clear();
    },

    _showSingleSearchEdit: function (tr) {
      this._openSingleSearchEdit(this.nls.updateSearch, tr);
    },

    _initSearchesTable:function(){
      this.searchesTable.clear();
      var layers = this.config && this.config.layers;
      array.forEach(layers, lang.hitch(this, function(layerConfig, index) {
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
