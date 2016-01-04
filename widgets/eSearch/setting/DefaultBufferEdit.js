///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define*/
define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/_base/html",
    "dojo/on",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "jimu/BaseWidgetSetting",
    "jimu/dijit/Message",
    "esri/symbols/jsonUtils",
    "dojo/text!./DefaultBufferEdit.html",
    "./BufferUnitEdit",
    "jimu/dijit/Popup",
    "dojo/keys",
    "dijit/form/ValidationTextBox"
  ],
  function (
    declare,
    lang,
    array,
    html,
    on,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Message,
    jsonUtils,
    template,
    BufferUnitEdit,
    Popup,
    keys) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'widget-esearch-defaultbuffer-setting',
      templateString:template,
      nls:null,
      config:null,
      searchSetting:null,
      _bufferDefaults:null,
      popupunitedit: null,
      popup: null,
      popup2: null,
      popupState: "", // ADD or EDIT

      postCreate:function(){
        this.inherited(arguments);
        this.own(on(this.layerSymbolPicker,'change',lang.hitch(this,this._onPolySymbolChange)));
        this._bindEvents();
        this.setConfig(this.config);
      },

      startup: function () {
        this.inherited(arguments);
      },

      setConfig:function(config){
        this.config = config;
        if(!this.config){
          return;
        }
        this._bufferDefaults = this.config.bufferDefaults;
        this.defaultBufferValue.set('value',this._bufferDefaults.bufferDefaultValue || 2);
        this.defaultBufferWKID.set('value',this._bufferDefaults.bufferWKID || 102003);
        this.addToLegendCbx.setValue(this._bufferDefaults.addtolegend || false);
        if(this._bufferDefaults.simplefillsymbol){
          this.layerSymbolPicker.showBySymbol(jsonUtils.fromJson(this._bufferDefaults.simplefillsymbol));
        }else{
          this.layerSymbolPicker.showByType("fill");
        }
        this._initBufferUnitTable();
      },

      getConfig:function(){
        this._bufferDefaults.bufferDefaultValue = parseFloat(this.defaultBufferValue.get('value'));
        this._bufferDefaults.bufferWKID = parseInt(this.defaultBufferWKID.get('value'));
        this._bufferDefaults.addtolegend = this.addToLegendCbx.getValue();
        this._bufferDefaults.bufferUnits.bufferUnit = this._getAllBufferUnits();
        var config = {
          bufferDefaults:this._bufferDefaults
        };

        this.config = config;
        return this.config;
      },

      _onPolySymbolChange:function(newSymbol){
        if(newSymbol.type == "simplefillsymbol"){
          this._bufferDefaults.simplefillsymbol = newSymbol.toJson();
        }
      },

      _initBufferUnitTable:function(){
        this.bufferUnitsTable.clear();
        var bUnits = this.config && this.config.bufferDefaults && this.config.bufferDefaults.bufferUnits.bufferUnit;
        array.forEach(bUnits, lang.hitch(this, function(bufferunit) {
          var args = {
            config:bufferunit
          };
          this._createBufferUnit(args);
        }));
      },

      _createBufferUnit:function(args){
        args.searchSetting = this;
        args.nls = this.nls;
        var rowData = {
          name: (args.config && args.config.label)||''
        };
        var result = this.bufferUnitsTable.addRow(rowData);
        if(!result.success){
          return null;
        }
        result.tr.bufferUnit = args.config;
        return result.tr;
      },

      _getAllBufferUnits:function(){
        var trs = this.bufferUnitsTable._getNotEmptyRows();
        var allBufferUnits = array.map(trs,lang.hitch(this,function(item){
          return item.bufferUnit;
        }));
        return allBufferUnits;
      },

      _onEditOk: function () {
        var bufferUnits = this.popupunitedit.getConfig();

        if (bufferUnits.length < 0) {
          new Message({
            message: this.nls.warning
          });
          return;
        }
        this.config.bufferDefaults.bufferUnits.bufferUnit = bufferUnits;
        this._initBufferUnitTable();

        this.popup2.close();
        this.popupState = "";
      },

      _onEditClose: function () {
        this.popupunitedit = null;
        this.popup2 = null;
      },

      _openEdit: function (title, bufferDefaults) {
        this.popupunitedit = new BufferUnitEdit({
          nls: this.nls,
          config: bufferDefaults || {}
        });

        this.popup2 = new Popup({
          titleLabel: title,
          autoHeight: true,
          content: this.popupunitedit,
          container: 'main-page',
          width: 640,
          height: 420,
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
        html.addClass(this.popup2.domNode, 'widget-setting-popup');
        this.popupunitedit.startup();
      },

      _bindEvents:function(){
        this.own(on(this.btnAddBufferUnit,'click',lang.hitch(this,function(){
          this._openEdit(this.nls.addbufferunit, this._bufferDefaults);
        })));
        this.own(on(this.bufferUnitsTable,'row-delete',lang.hitch(this,function(tr){
          delete tr.bufferUnit;
        })));
      }
    });
  });
