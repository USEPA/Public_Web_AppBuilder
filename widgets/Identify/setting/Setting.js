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

define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/_base/query',
    'dojo/on',
    'dojo/json',
    'jimu/dijit/SimpleTable',
    'jimu/dijit/Message',
    'jimu/dijit/Popup',
    'dojo/keys',
    'dijit/form/NumberSpinner',
    'dijit/form/Select',
    './SymbologyEdit',
    './IdentifyLayerEdit',
    './ExcludeLayerEdit'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    lang,
    array,
    html,
    query,
    on,
    json,
    SimpleTable,
    Message,
    Popup,
    keys,
    NumberSpinner,
    Select,
    SymbologyEdit,
    IdentifyLayerEdit,
    ExcludeLayerEdit) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'widget-identify-setting',
      dnls: null,
      popupsymedit: null,
      popuplayeredit: null,
      popupexcludelayeredit: null,
      popup: null,
      popup2: null,
      popup3: null,
      popupState: null,
      layerInfoCache: null,

      postMixInProperties:function(){
        this.dnls = window.jimuNls.drawBox;
      },

      postCreate:function(){
        this.inherited(arguments);
        this.layerInfoCache = {};
        this._bindEvents();
        this.setConfig(this.config);
      },

      _bindEvents: function() {
        this.own(on(this.btnSymIdentify,'click',lang.hitch(this,function(){
          this._openSymEdit(this.nls.editDefaultSym);
        })));
        this.own(on(this.btnAddLayer,'click',lang.hitch(this,function(){
          var args = {
            config: null
          };
          this.popupState = 'ADD';
          var tr = this._createLayer(args);
          if (tr) {
            this._openILEdit(this.nls.addLayer, tr);
          }
        })));
        this.own(on(this.btnAddExcludeLayer,'click',lang.hitch(this,function(){
          var args = {
            config: {}
          };
          this.popupState = 'ADD';
          var tr = this._createELayer(args);
          if (tr) {
            this._openIELEdit(this.nls.addExcludeLayer, tr);
          }
        })));
        this.own(on(this.LayersTable,'actions-edit',lang.hitch(this,function(tr){
          var editLayer = tr.singleLayer;
          this.popupState = 'EDIT';
          this._openILEdit(this.nls.editLayer + ': ' + editLayer.name , tr);
        })));
        this.own(on(this.LayersTable,'row-delete',lang.hitch(this,function(tr){
          delete tr.singleLayer;
        })));
        this.own(on(this.ExcludeLayersTable,'actions-edit',lang.hitch(this,function(tr){
          var editLayer = tr.singleLayer;
          this.popupState = 'EDIT';
          var label;
          if(editLayer.hasOwnProperty('name')){
            label = editLayer.name;
          }else if(editLayer.hasOwnProperty('url') && editLayer.hasOwnProperty('id')){
            label = editLayer.url + '/' + editLayer.id;
          }else if(editLayer.hasOwnProperty('url')){
            label = editLayer.url;
          }
          this._openIELEdit(this.nls.editExcludeLayer + ': ' + label , tr);
        })));
        this.own(on(this.ExcludeLayersTable,'row-delete',lang.hitch(this,function(tr){
          delete tr.singleLayer;
        })));
      },

      setConfig: function(config) {
        //hack the 'Learn more about this widget link'
        setTimeout(function(){
          var helpLink = query('.help-link');
          helpLink[0].href = 'http://gis.calhouncounty.org/WAB/V1.1/widgets/Identify/help/identify_Help.htm';
          html.setStyle(helpLink[0],'display','block');
        },600);
        this.config = config;
        this.onlyTheseCbx.checked = this.config.layers.onlythese;
        this.zoomScale.set('value',this.config.defaultzoomscale);
        this.selectIdentifyOption.set('value', this.config.identifylayeroption);
        this.identTolerance.set('value',this.config.identifytolerance);
        this.keepActiveCbx.checked = this.config.keepidentifyactive;
        this.returnGeomCbx.checked = this.config.returngeometryforzoom;

        this.enableLineCbx.checked = this.config.enablelineselect;
        this.enablePolyLineCbx.checked = this.config.enablepolylineselect;
        this.enableFHLineCbx.checked = this.config.enablefreehandlineselect;
        this.enableExtentCbx.checked = this.config.enableextentselect;
        this.enableCircleCbx.checked = this.config.enablecircleselect;
        this.enableEllipseCbx.checked = this.config.enableellipseselect;
        this.enablePolygonCbx.checked = this.config.enablepolyselect;
        this.enableFHPolygonCbx.checked = this.config.enablefreehandpolyselect;
        this.enableTriangleCbx.checked = this.config.enabletriangleselect;

        this.mouseOverGraCbx.checked = this.config.enablemouseovergraphicsinfo;
        this.mouseOverResultCbx.checked = this.config.enablemouseoverrecordinfo;
        this.useMapTimeCbx.checked = this.config.usemaptime;
        this.replaceNullCbx.checked = this.config.replacenullswithemptystring;
        this.disableLayerDDCbx.checked = this.config.disablelayerdropdown;
        this.disableAllLayersChoiceCbx.checked = this.config.disablealllayerschoice;
        this.autoClose.set('value', (parseInt(this.config.infoautoclosemilliseconds)/1000));
        this.selectDefaultTool.set('value',this.config.autoactivatedtool || 'none');

        this._initLayersTable();
        this._initELayersTable();
      },

      getConfig: function() {
        if(this.selectDefaultTool.get('value') !== 'none'){
          this.config.autoactivatedtool = this.selectDefaultTool.get('value');
        }else{
          delete this.config.autoactivatedtool;
        }
        this.config.infoautoclosemilliseconds = parseInt(this.autoClose.get('value')) * 1000;
        this.config.disablealllayerschoice = this.disableAllLayersChoiceCbx.checked;

        this.config.enablemouseovergraphicsinfo = this.mouseOverGraCbx.checked;
        this.config.enablemouseoverrecordinfo = this.mouseOverResultCbx.checked;
        this.config.usemaptime = this.useMapTimeCbx.checked;
        this.config.replacenullswithemptystring = this.replaceNullCbx.checked;
        this.config.disablelayerdropdown = this.disableLayerDDCbx.checked;

        this.config.enablelineselect = this.enableLineCbx.checked;
        this.config.enablepolylineselect = this.enablePolyLineCbx.checked;
        this.config.enablefreehandlineselect = this.enableFHLineCbx.checked;
        this.config.enableextentselect = this.enableExtentCbx.checked;
        this.config.enablecircleselect = this.enableCircleCbx.checked;
        this.config.enableellipseselect = this.enableEllipseCbx.checked;
        this.config.enablepolyselect = this.enablePolygonCbx.checked;
        this.config.enablefreehandpolyselect = this.enableFHPolygonCbx.checked;
        this.config.enabletriangleselect = this.enableTriangleCbx.checked;

        this.config.defaultzoomscale = this.zoomScale.get('value');
        this.config.identifylayeroption = this.selectIdentifyOption.get('value');
        this.config.identifytolerance = this.identTolerance.get('value');
        this.config.keepidentifyactive = this.keepActiveCbx.checked;
        this.config.returngeometryforzoom = this.returnGeomCbx.checked;

        this.config.layers.layer =  this._getAllLayers();
        this.config.layers.excludelayer =  this._getAlleLayers();
        this.config.layers.onlythese = this.onlyTheseCbx.checked;

        return this.config;
      },

      _getAllLayers: function () {
        var trs = this.LayersTable._getNotEmptyRows();
        var allLayers = array.map(trs, lang.hitch(this, function (item) {
          return item.singleLayer;
        }));
        return allLayers;
      },

      _getAlleLayers: function () {
        var trs = this.ExcludeLayersTable._getNotEmptyRows();
        var allLayers = array.map(trs, lang.hitch(this, function (item) {
          return item.singleLayer;
        }));
        return allLayers;
      },

      _initLayersTable: function() {
        this.LayersTable.clear();
        var layers = this.config && this.config.layers.layer;
        array.forEach(layers, lang.hitch(this, function(layerConfig, index) {
          var args = {
            config: layerConfig,
            layerindex: index
          };
          this._createLayer(args);
        }));
      },

      _initELayersTable: function() {
        this.ExcludeLayersTable.clear();
        var layers = this.config && this.config.layers.excludelayer;
        array.forEach(layers, lang.hitch(this, function(layerConfig, index) {
          var args = {
            config: layerConfig,
            layerindex: index
          };
          this._createELayer(args);
        }));
      },

      _createLayer: function(args) {
        args.layerSetting = this;
        args.nls = this.nls;
        var rowData = {
          name: (args.config && args.config.name) || ''
        };

        var result = this.LayersTable.addRow(rowData);
        if(!result.success){
          return null;
        }
        result.tr.singleLayer = args.config;
        return result.tr;
      },

      _createELayer: function(args) {
        args.layerSetting = this;
        args.nls = this.nls;
        var label;
        if(args.config.name){
          label = args.config.name;
        }else if(args.config.url && args.config.hasOwnProperty('id')){
          label = args.config.url + '/' + args.config.id;
        }else if(args.config.url){
          label = args.config.url;
        }
        var rowData = {
          name: label || ''
        };
        var result = this.ExcludeLayersTable.addRow(rowData);
        if(!result.success){
          return null;
        }
        result.tr.singleLayer = args.config;
        return result.tr;
      },

      _onSymEditOk: function() {
        this.config.symbols = this.popupsymedit.getConfig().symbols;
        this.popup.close();
        this.popupState = '';
      },

      _onSymEditClose: function() {
        this.popupsymedit = null;
        this.popup = null;
      },

      _openSymEdit: function(title, tr) {
        this.popupsymedit = new SymbologyEdit({
          nls: this.nls,
          config: this.config || {}
        });

        this.popup = new Popup({
          titleLabel: title,
          autoHeight: true,
          content: this.popupsymedit,
          container: 'main-page',
          width: 540,
          buttons: [{
            label: this.nls.ok,
            key: keys.ENTER,
            onClick: lang.hitch(this, '_onSymEditOk')
          }, {
            label: this.nls.cancel,
            key: keys.ESCAPE
          }],
          onClose: lang.hitch(this, '_onSymEditClose')
        });
        html.addClass(this.popup.domNode, 'widget-setting-symbology');
        this.popupsymedit.startup();
      },

      _onILEditOk: function() {
        var layerConfig = this.popuplayeredit.getConfig();
//        console.info(layerConfig);

        if (layerConfig.length < 0) {
          new Message({
            message: this.nls.warning
          });
          return;
        }
        if(this.popupState === 'ADD'){
          this.LayersTable.editRow(layerConfig[1], {
            name: layerConfig[0].name
          });
          layerConfig[1].singleLayer = layerConfig[0];
          this.popupState = '';
        }else{
          this.LayersTable.editRow(layerConfig[1], {
            name: layerConfig[0].name
          });
          layerConfig[1].singleLayer = layerConfig[0];
        }

        this.popup2.close();
        this.popupState = '';
      },

      _onILEditClose: function() {
        var layerConfig = this.popuplayeredit.getConfig();
        if(this.popupState === 'ADD'){
          this.LayersTable.deleteRow(layerConfig[1]);
        }
        this.popuplayeredit = null;
        this.popup2 = null;
      },

      _openILEdit: function(title, tr) {
        this.popuplayeredit = new IdentifyLayerEdit({
          nls: this.nls,
          config: (this.popupState === 'ADD') ? null : tr.singleLayer,
          tr: tr,
          layerInfoCache: this.layerInfoCache,
          adding: (this.popupState === 'ADD')
        });

        this.popup2 = new Popup({
          titleLabel: title,
          autoHeight: true,
          content: this.popuplayeredit,
          container: 'main-page',
          buttons: [{
            label: this.nls.ok,
            key: keys.ENTER,
            onClick: lang.hitch(this, '_onILEditOk')
          }, {
            label: this.nls.cancel,
            key: keys.ESCAPE
          }],
          onClose: lang.hitch(this, '_onILEditClose')
        });
        this.popuplayeredit.startup();
      },

      _onIELEditOk: function() {
        var layerConfig = this.popupexcludelayeredit.getConfig();
//        console.info(layerConfig[0]);

        if (layerConfig.length < 0) {
          new Message({
            message: this.nls.warning
          });
          return;
        }

        var label;
        if(layerConfig[0].name){
          label = layerConfig[0].name;
        }else if(layerConfig[0].url && layerConfig[0].hasOwnProperty('id')){
          label = layerConfig[0].url + '/' + layerConfig[0].id;
        }else if(layerConfig[0].url){
          label = layerConfig[0].url;
        }

        if(this.popupState === 'ADD'){
          this.ExcludeLayersTable.editRow(layerConfig[1], {
            name: label
          });
          layerConfig[1].singleLayer = layerConfig[0];
          this.popupState = '';
        }else{
          this.ExcludeLayersTable.editRow(layerConfig[1], {
            name: label
          });
          layerConfig[1].singleLayer = layerConfig[0];
        }

        this.popup3.close();
        this.popupState = '';
      },

      _onIELEditClose: function() {
        var layerConfig = this.popupexcludelayeredit.getConfig();
        if(this.popupState === 'ADD'){
          this.ExcludeLayersTable.deleteRow(layerConfig[1]);
        }
        this.popupexcludelayeredit = null;
        this.popup3 = null;
      },

      _openIELEdit: function(title, tr) {
        this.popupexcludelayeredit = new ExcludeLayerEdit({
          nls: this.nls,
          config: (this.popupState === 'ADD') ? null : tr.singleLayer,
          tr: tr,
          layerInfoCache: this.layerInfoCache
        });

        this.popup3 = new Popup({
          titleLabel: title,
          autoHeight: true,
          content: this.popupexcludelayeredit,
          container: 'main-page',
          buttons: [{
            label: this.nls.ok,
            key: keys.ENTER,
            onClick: lang.hitch(this, '_onIELEditOk')
          }, {
            label: this.nls.cancel,
            key: keys.ESCAPE
          }],
          onClose: lang.hitch(this, '_onIELEditClose')
        });
        //html.addClass(this.popup.domNode, 'widget-setting-symbology');
        this.popupexcludelayeredit.startup();
      }

    });
  });
