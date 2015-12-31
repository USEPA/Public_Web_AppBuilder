///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB Identify Widget
///////////////////////////////////////////////////////////////////////////
/*global define, setTimeout, window*/

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
    './ResultFormatEdit',
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
    ResultFormatEdit,
    IdentifyLayerEdit,
    ExcludeLayerEdit) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'widget-identify-setting',
      dnls: null,
      popupsymedit: null,
      popupformatedit: null,
      popuplayeredit: null,
      popupexcludelayeredit: null,
      popup: null,
      popup2: null,
      popup3: null,
      popup4: null,
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
        this.own(on(this.btnFormatResults,'click',lang.hitch(this,function(){
          this._openFormatEdit(this.nls.editResultFormat);
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
          helpLink[0].href = 'http://gis.calhouncounty.org/WAB/V1.3/widgets/Identify/help/identify_Help.htm';
          html.setStyle(helpLink[0],'display','block');
        },600);
        this.config = config;
        this.onlyTheseCbx.setValue(this.config.layers.onlythese);
        this.zoomScale.set('value',this.config.defaultzoomscale);
        this.selectIdentifyOption.set('value', this.config.identifylayeroption);
        this.identTolerance.set('value',this.config.identifytolerance);
        this.keepActiveCbx.setValue(this.config.keepidentifyactive);
        this.returnGeomCbx.setValue(this.config.returngeometryforzoom);

        this.enableLineCbx.setValue(this.config.enablelineselect);
        this.enablePolyLineCbx.setValue(this.config.enablepolylineselect);
        this.enableFHLineCbx.setValue(this.config.enablefreehandlineselect);
        this.enableExtentCbx.setValue(this.config.enableextentselect);
        this.enableCircleCbx.setValue(this.config.enablecircleselect);
        this.enableEllipseCbx.setValue(this.config.enableellipseselect);
        this.enablePolygonCbx.setValue(this.config.enablepolyselect);
        this.enableFHPolygonCbx.setValue(this.config.enablefreehandpolyselect);
        this.enableTriangleCbx.setValue(this.config.enabletriangleselect);

        this.mouseOverGraCbx.setValue(this.config.enablemouseovergraphicsinfo);
        this.mouseOverResultCbx.setValue(this.config.enablemouseoverrecordinfo);
        this.useMapTimeCbx.setValue(this.config.usemaptime);
        this.replaceNullCbx.setValue(this.config.replacenullswithemptystring);
        this.disableLayerDDCbx.setValue(this.config.disablelayerdropdown);
        this.disableAllLayersChoiceCbx.setValue(this.config.disablealllayerschoice);
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
        this.config.disablealllayerschoice = this.disableAllLayersChoiceCbx.getValue();

        this.config.enablemouseovergraphicsinfo = this.mouseOverGraCbx.getValue();
        this.config.enablemouseoverrecordinfo = this.mouseOverResultCbx.getValue();
        this.config.usemaptime = this.useMapTimeCbx.getValue();
        this.config.replacenullswithemptystring = this.replaceNullCbx.getValue();
        this.config.disablelayerdropdown = this.disableLayerDDCbx.getValue();

        this.config.enablelineselect = this.enableLineCbx.getValue();
        this.config.enablepolylineselect = this.enablePolyLineCbx.getValue();
        this.config.enablefreehandlineselect = this.enableFHLineCbx.getValue();
        this.config.enableextentselect = this.enableExtentCbx.getValue();
        this.config.enablecircleselect = this.enableCircleCbx.getValue();
        this.config.enableellipseselect = this.enableEllipseCbx.getValue();
        this.config.enablepolyselect = this.enablePolygonCbx.getValue();
        this.config.enablefreehandpolyselect = this.enableFHPolygonCbx.getValue();
        this.config.enabletriangleselect = this.enableTriangleCbx.getValue();

        this.config.defaultzoomscale = this.zoomScale.get('value');
        this.config.identifylayeroption = this.selectIdentifyOption.get('value');
        this.config.identifytolerance = this.identTolerance.get('value');
        this.config.keepidentifyactive = this.keepActiveCbx.getValue();
        this.config.returngeometryforzoom = this.returnGeomCbx.getValue();

        this.config.layers.layer =  this._getAllLayers();
        this.config.layers.excludelayer =  this._getAlleLayers();
        this.config.layers.onlythese = this.onlyTheseCbx.getValue();

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

      _openSymEdit: function(title) {
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

      _onFormatEditOk: function() {
        this.config.resultFormat = this.popupformatedit.getConfig().format;
        this.popup4.close();
        this.popupState = '';
      },

      _onFormatEditClose: function() {
        this.popupfromatedit = null;
        this.popup4 = null;
      },

      _openFormatEdit: function(title) {
        this.popupformatedit = new ResultFormatEdit({
          nls: this.nls,
          config: this.config || {}
        });

        this.popup4 = new Popup({
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
        html.addClass(this.popup4.domNode, 'widget-setting-format');
        this.popupformatedit.startup();
      },

      _onILEditOk: function() {
        var layerConfig = this.popuplayeredit.getConfig();
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
        this.popupexcludelayeredit.startup();
      }

    });
  });
