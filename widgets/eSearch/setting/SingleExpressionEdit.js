///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define, setTimeout*/
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/_base/query',
  'dojo/on',
  'dojo/json',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/Tooltip',
  'dojo/text!./SingleExpressionEdit.html',
  'dijit/form/TextBox',
  'jimu/dijit/Popup',
  'jimu/dijit/LayerFieldChooser',
  'jimu/dijit/SimpleTable',
  'esri/request',
  './SingleValueEdit',
  'dojo/keys'
],
function(declare, lang, array, html, query, on, json, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  Tooltip, template, TextBox, Popup, LayerFieldChooser, SimpleTable, esriRequest, SingleValueEdit, keys) {/*jshint unused: false*/
  return declare([_WidgetBase,_TemplatedMixin, _WidgetsInTemplateMixin], {
    baseClass: 'widget-esearch-singleexpression-setting',
    templateString: template,
    nls: null,
    config: null,
    tr: null,
    searchSetting: null,
    layerURL: null,
    layerDef: null,
    layerUniqueCache: null,
    layerInfoCache: null,
    singleValueedit: null,
    lastOperator: '',

    postCreate:function(){
      this.inherited(arguments);
      this._bindEvents();
      this.setConfig(this.config);
    },

    setConfig:function(config){
      if(!config){
        return;
      }
      this.config = config;
      this.resetAll();
      this.searchLabel.set('value', lang.trim(this.config.textsearchlabel || ''));
      this.expressionAlias.set('value', lang.trim(this.config.alias || ''));
      if(this.config.values){
        this._initValuesTable();
      }
    },

    getConfig:function(){
      if(!this.validate(false)){
        return false;
      }
      var allSingleValues =  this._getAllSingleValues();
      var config = {
        alias:lang.trim(this.expressionAlias.get('value')),
        textsearchlabel:lang.trim(this.searchLabel.get('value')),
        values:{
          value:[]
        }
      };
      config.values.value = allSingleValues;
      this.config = config;
      return this.config;
    },

    _initValuesTable:function(){
      this.valuesTable.clear();
      var Values = this.config && this.config.values.value;
      var valLen = 1;
      array.forEach(Values, lang.hitch(this, function(valueConfig) {
        var args = {
          config:valueConfig,
          len:valLen
        };
        if(valueConfig.operator){
          this.lastOperator = valueConfig.operator;
        }
        this._createSingleValue(args);
        valLen++;
      }));
    },

    _getSingleValueCount: function(){
      return this.valuesTable.getRows();
    },

    _createSingleValue:function(args){
      var rowData = {
        sqltext: (args.config && args.config.sqltext)||'',
        operator: (args.config && args.config.operator) || ''
      };
      var result = this.valuesTable.addRow(rowData);
      if(!result.success){
        return null;
      }
      result.tr.singleValue = args.config;
      result.tr.len = args.len;
      result.tr.operator = this.lastOperator;
      return result.tr;
    },

    resetAll:function(){
      this.expressionAlias.set('value', '');
      this.searchLabel.set('value', '');
    },

    _bindEvents:function(){
      this.own(on(this.btnAddValue,'click',lang.hitch(this,function(){
        var args = {
          config:null,
          len:this._getSingleValueCount().length + 1
        };
        var tr = this._createSingleValue(args);
        if(tr){
          this.popupState = 'ADD';
          this._showSingleValuesSection(tr);
        }
      })));
      this.own(on(this.valuesTable,'actions-edit',lang.hitch(this,function(tr){
        this.popupState = 'EDIT';
        this._showSingleValuesSection(tr);
      })));
      this.own(on(this.valuesTable,'row-delete',lang.hitch(this,function(tr){
        delete tr.singleValue;
      })));
    },

    validate:function(showTooltip){
      if(lang.trim(this.expressionAlias.get('value')) === ''){
        if(showTooltip){
          this._showTooltip(this.expressionAlias.domNode,"Please input value.");
        }
        return false;
      }
      if(lang.trim(this.searchLabel.get('value')) === ''){
        if(showTooltip){
          this._showTooltip(this.searchLabel.domNode,"Please input value.");
        }
        return false;
      }
      return true;
    },

    _showTooltip:function(aroundNode, content, time){
      this._scrollToDom(aroundNode);
      Tooltip.show(content,aroundNode);
      time = time ? time : 2000;
      setTimeout(function(){
        Tooltip.hide(aroundNode);
      },time);
    },

    _scrollToDom:function(dom){
      var scrollDom = this.searchSetting.domNode.parentNode;
      var y1 = html.position(scrollDom).y;
      var y2 = html.position(dom).y;
      scrollDom.scrollTop = y2 - y1;
    },

    _showSingleValuesSection:function(tr){
      this._openSingleValueEdit((this.popupState === 'EDIT')?this.nls.updateExpressionValue:this.nls.addExpressionValue, tr);
    },

    _getAllSingleValues:function(){
      var trs = this.valuesTable._getNotEmptyRows();
      var allSingleValues = array.map(trs,lang.hitch(this,function(item){
        return item.singleValue;
      }));
      return allSingleValues;
    },

    _openSingleValueEdit: function (name, tr) {
      this.singleValueedit = new SingleValueEdit({
        nls: this.nls,
        tr: tr,
        searchSetting: this,
        layerURL: this.layerURL,
        layerDef: this.layerDef,
        layerUniqueCache: this.layerUniqueCache,
        layerInfoCache: this.layerInfoCache,
        len: tr.len,
        operator: tr.operator
      });
      this.singleValueedit.setConfig(tr.singleValue || {});
      this.popup2 = new Popup({
        titleLabel: name,
        autoHeight: true,
        content: this.singleValueedit,
        container: 'main-page',
        buttons: [
          {
            label: this.nls.ok,
            key: keys.ENTER,
            onClick: lang.hitch(this, '_onSingleValueEditOk')
          }, {
            label: this.nls.cancel,
            key: keys.ESCAPE
          }
        ],
        onClose: lang.hitch(this, '_onSingleValueEditClose')
      });
      html.addClass(this.popup2.domNode, 'widget-setting-popup');
      this.singleValueedit.startup();
    },

    _onSingleValueEditOk: function () {
      var edits = {};
      var valConfig = this.singleValueedit.getConfig();
      edits.sqltext = valConfig.sqltext;
      edits.operator = valConfig.operator || '';
      if(valConfig.operator){
        this.lastOperator = valConfig.operator;
      }
//      console.info(valConfig);
      this.singleValueedit.tr.singleValue = valConfig;
      this.valuesTable.editRow(this.singleValueedit.tr, edits);
      this.popupState = '';
      this.popup2.close();
    },

    _onSingleValueEditClose: function () {
      if(this.popupState === 'ADD'){
        this.valuesTable.deleteRow(this.singleValueedit.tr);
      }
      this.singleValueedit = null;
      this.popup2 = null;
    }
  });
});
