///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eLocate Widget
///////////////////////////////////////////////////////////////////////////
/*global define, setTimeout*/

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
    './SymbologyEdit',
    './UnitEdit',
    './DisableTabEdit',
    'dojo/keys',
    'dijit/form/NumberSpinner',
    'dijit/form/Select',
    './LocatorSourceSetting'
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
    SymbologyEdit,
    UnitEdit,
    DisableTabEdit,
    keys,
    NumberSpinner,
    Select,
    LocatorSourceSetting) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'widget-elocate-setting',
      popupsymedit: null,
      popupunitedit: null,
      popupDisableTabedit: null,
      popup: null,
      popup2: null,
      popup3: null,
      popupState: null,
      disabledTabs: [],
      _currentLocatorSetting: null,

      postCreate:function(){
        this.inherited(arguments);
        this._bindEvents();
        this.setConfig(this.config);
        this._initLocator(this.config.locator, {});
      },

      _initLocator: function (setting, definition) {
        this._currentLocatorSetting = new LocatorSourceSetting({
          nls: this.nls
        });
        this._currentLocatorSetting.placeAt(this.locatorSettingNode);
        this._currentLocatorSetting.setDefinition(definition);
        this._currentLocatorSetting.setConfig({
          url: setting.url || "",
          name: setting.name || "",
          singleLineFieldName: setting.singleLineFieldName || "",
          countryCode: setting.countryCode || ""
        });
      },

      _bindEvents: function() {
        this.own(on(this.btnSymLocate,'click',lang.hitch(this,function(){
          this._openSymEdit(this.nls.editDefaultSym);
        })));

        this.own(on(this.btnAddUnit,'click',lang.hitch(this,function(){
          var args = {
            config: null
          };
          this.popupState = 'ADD';
          var tr = this._createUnit(args);
          if (tr) {
            this._openUnitEdit(this.nls.addUnit, tr);
          }
        })));

        this.own(on(this.btnDisableTabs,'click',lang.hitch(this,function(){
          this._openDTEdit(this.nls.editdisabledtaboptions, this.disabledTabs);
        })));

        this.own(on(this.unitList,'actions-edit',lang.hitch(this,function(tr){
          var editUnit = tr.singleUnit;
          this.popupState = 'EDIT';
          this._openUnitEdit(this.nls.editUnit + ': ' + editUnit.name , tr);
        })));
        this.own(on(this.unitList,'row-delete',lang.hitch(this,function(tr){
          delete tr.singleUnit;
        })));
      },

      setConfig: function(config) {
        //hack the 'Learn more about this widget link'
        setTimeout(function(){
          var helpLink = query('.help-link');
          helpLink[0].href = 'http://gis.calhouncounty.org/WAB/V1.2/widgets/eLocate/help/eLocate_Help.htm';
          html.setStyle(helpLink[0],'display','block');
        },600);
        this.config = config;
        this.keepactiveCbx.setValue(this.config.keepinspectoractive);
        this.autoClose.set('value', (parseInt(this.config.infoautoclosemilliseconds)/1000));
        this.mouseOverGraCbx.setValue(this.config.enablemouseovergraphicsinfo);
        this.mouseOverResultCbx.setValue(this.config.enablemouseoverrecordinfo);
        this.forceScaleCbx.setValue(this.config.forcescale);
        this.zoomScale.set('value',this.config.zoomscale);
        if(this.config.hasOwnProperty('disabledtabs')){
          this.disabledTabs = this.config.disabledtabs;
        }
        if(this.config.initialView){
          this.selectInitialView.set('value', this.config.initialView);
        }
        this.limitToMapExtentCbx.setValue(this.config.limitsearchtomapextentbydefault || false);
        this._initUnitsTable();
      },

      getConfig: function() {
        if(this.autoClose.get('value')){
          this.config.infoautoclosemilliseconds = parseInt(this.autoClose.get('value')) * 1000;
        }else{
          delete this.config.infoautoclosemilliseconds;
        }
        this.config.enablemouseovergraphicsinfo = this.mouseOverGraCbx.getValue();
        this.config.enablemouseoverrecordinfo = this.mouseOverResultCbx.getValue();
        this.config.zoomscale = this.zoomScale.get('value');
        this.config.initialView = this.selectInitialView.get('value');
        if(this.disabledTabs && this.disabledTabs.length > 0){
          this.config.disabledtabs = this.disabledTabs;
        }else{
          delete this.config.disabledtabs;
        }
        this.config.forcescale = this.forceScaleCbx.getValue();
        this.config.keepinspectoractive = this.keepactiveCbx.getValue();
        this.config.pointunits.pointunit =  this._getAllUnits();
        var locatorSettings = this._currentLocatorSetting.getConfig();
        this.config.locator.url = locatorSettings.url;
        this.config.locator.singleLineFieldName = locatorSettings.singleLineFieldName;
        this.config.locator.countryCode = locatorSettings.countryCode;
        this.config.locator.name = locatorSettings.name;
        this.config.limitsearchtomapextentbydefault = this.limitToMapExtentCbx.getValue();
        return this.config;
      },

      _openUnitEdit: function(title, tr) {
        this.popupunitedit = new UnitEdit({
          nls: this.nls,
          config: (this.popupState === 'ADD') ? null : tr.singleUnit,
          tr: tr,
          layerInfoCache: this.layerInfoCache,
          adding: (this.popupState === 'ADD')
        });

        this.popup2 = new Popup({
          titleLabel: title,
          autoHeight: true,
          content: this.popupunitedit,
          container: 'main-page',
          buttons: [{
            label: this.nls.ok,
            key: keys.ENTER,
            onClick: lang.hitch(this, '_onUnitEditOk')
          }, {
            label: this.nls.cancel,
            key: keys.ESCAPE
          }],
          onClose: lang.hitch(this, '_onUnitEditClose')
        });
        this.popupunitedit.startup();
      },

      _onUnitEditOk: function() {
        var unitConfig = this.popupunitedit.getConfig();
        console.info(unitConfig);

        if (unitConfig.length < 0) {
          new Message({
            message: this.nls.warning
          });
          return;
        }
        if(this.popupState === 'ADD'){
          this.unitList.editRow(unitConfig[1], {
            name: unitConfig[0].name,
            example: unitConfig[0].example,
            xlabel: unitConfig[0].xlabel,
            ylabel: unitConfig[0].ylabel,
            wkid: unitConfig[0].wkid,
            wgs84option: unitConfig[0].wgs84option
          });
          unitConfig[1].singleUnit = unitConfig[0];
          this.popupState = '';
        }else{
          this.unitList.editRow(unitConfig[1], {
            name: unitConfig[0].name,
            example: unitConfig[0].example,
            xlabel: unitConfig[0].xlabel,
            ylabel: unitConfig[0].ylabel,
            wkid: unitConfig[0].wkid,
            wgs84option: unitConfig[0].wgs84option
          });
          unitConfig[1].singleUnit = unitConfig[0];
        }

        this.popup2.close();
        this.popupState = '';
      },

      _onUnitEditClose: function() {
        var unitConfig = this.popupunitedit.getConfig();
        if(this.popupState === 'ADD'){
          this.unitList.deleteRow(unitConfig[1]);
        }
        this.popupunitedit = null;
        this.popup2 = null;
      },

      _openSymEdit: function(title) {
        this.popupsymedit = new SymbologyEdit({
          nls: this.nls,
          config: this.config || {},
          widget: this
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

      _onSymEditOk: function() {
        this.config.symbols = this.popupsymedit.getConfig().symbols;
        this.popup.close();
        this.popupState = '';
      },

      _onSymEditClose: function() {
        this.popupsymedit = null;
        this.popup = null;
      },

      _getAllUnits: function () {
        var trs = this.unitList._getNotEmptyRows();
        var allUnits = array.map(trs, lang.hitch(this, function (item) {
          return item.singleUnit;
        }));
        return allUnits;
      },

      _initUnitsTable: function() {
        this.unitList.clear();
        var units = this.config && this.config.pointunits.pointunit;
        array.forEach(units, lang.hitch(this, function(unitConfig, index) {
          var args = {
            config: unitConfig,
            unitindex: index
          };
          this._createUnit(args);
        }));
      },

      _createUnit: function(args) {
        args.setting = this;
        args.nls = this.nls;
        var rowData = {
          name: (args.config && args.config.name) || '',
          example: (args.config && args.config.example) || '',
          xlabel: (args.config && args.config.xlabel) || '',
          ylabel: (args.config && args.config.ylabel) || '',
          wkid: (args.config && args.config.wkid) || '',
          wgs84option: (args.config && args.config.wgs84option) || ''
        };

        var result = this.unitList.addRow(rowData);
        if(!result.success){
          return null;
        }
        result.tr.singleUnit = args.config;
        return result.tr;
      },

      _onUnitItemRemoved: function (tr) {
        delete tr.singleUnit;
      },

      _onUnitItemSelected: function (tr) {
        console.info(tr.singleUnit);
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
        this.popup3.close();
      },

      _onDTEditClose: function() {
        this.popupDisableTabedit = null;
        this.popup3 = null;
      },

      _openDTEdit: function(title, disTabs) {
        this.popupDisableTabedit = new DisableTabEdit({
          nls: this.nls,
          config: disTabs || {}
        });

        this.popup3 = new Popup({
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
        html.addClass(this.popup3.domNode, 'widget-setting-popup');
        this.popupDisableTabedit.startup();
      }

    });
  });
