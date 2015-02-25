/*global define, dojo, dijit, require, esri, console, setTimeout*/
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
  'dojo/text!./SingleExpression.html',
  'dijit/form/TextBox',
  'jimu/dijit/LayerFieldChooser',
  'jimu/dijit/SimpleTable',
  'esri/request',
  './SingleValue'
],
function(declare, lang, array, html, query, on,json,_WidgetBase,_TemplatedMixin, _WidgetsInTemplateMixin,
  Tooltip,template,TextBox,LayerFieldChooser,SimpleTable,esriRequest,SingleValue) {/*jshint unused: false*/
  return declare([_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-singleexpression-setting',
    templateString:template,
    nls:null,
    config:null,
    searchSetting:null,
    layerURL:null,
    layerDef:null,
    _isAddNow:true,
    layerUniqueCache: null,
    layerInfoCache: null,

    postCreate:function(){
      this.inherited(arguments);
      this._bindEvents();
      this.setConfig(this.config);
      this._isAddNow = this.config ? false : true;
      this.updateStatus(this._isAddNow);
    },
    
    setConfig:function(config){
      this.config = config;
      this.resetAll();
      if(!this.config){
        return;
      }
      this.searchLabel.set('value', lang.trim(this.config.textsearchlabel || ""));
      this.expressionAlias.set('value', lang.trim(this.config.alias || ""));
      this._initValuesTable();
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
      var Values = array.map(allSingleValues,lang.hitch(this,function(item){
        return item.getConfig();
      }));
      config.values.value = Values;
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
        this._createSingleValue(args);
        valLen++;
      }));
    },
    
    _getSingleValueCount: function(){
      return this.valuesTable.getRows();
    },
    
    _createSingleValue:function(args){
      args.searchSetting = this;
      args.nls = this.nls;
      args.layerUniqueCache = this.layerUniqueCache;
      args.layerInfoCache = this.layerInfoCache;
      args.layerURL = this.layerURL;
      args.layerDef = this.layerDef;
      var rowData = {
        sqltext: (args.config && args.config.sqltext)||'',
        operator: (args.config && args.config.operator) || ''
      };
      var result = this.valuesTable.addRow(rowData);
      if(!result.success){
        return null;
      }
      
      var singleValue = new SingleValue(args);
      singleValue.placeAt(this.singleValuesSection);
      singleValue.startup();
      html.setStyle(singleValue.domNode,'display','none');
      result.tr.singleValue = singleValue;
      this.own(on(singleValue,'Add',lang.hitch(this,function(config){
        var sqltext = config.sqltext || '';
        var operator = config.operator || '';
        this.valuesTable.editRow(result.tr,{sqltext:sqltext, operator:operator});
        this._showSingleExpressionsSection();
      })));
      this.own(on(singleValue,'Update',lang.hitch(this,function(config){
        var sqltext = config.sqltext||'';
        var operator = config.operator || '';
        this.valuesTable.editRow(result.tr,{sqltext:sqltext, operator:operator});
        this._showSingleExpressionsSection();
      })));
      this.own(on(singleValue,'AddCancel',lang.hitch(this,function(){
        delete result.tr.singleValue;
        this.valuesTable.deleteRow(result.tr);
        singleValue.destroy();
        this._showSingleExpressionsSection();
      })));
      this.own(on(singleValue,'UpdateCancel',lang.hitch(this,function(){
        this._showSingleExpressionsSection();
      })));
      return result.tr;
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
    
    resetAll:function(){
      this.expressionAlias.set('value', '');
      this.searchLabel.set('value', '');
    },

    onAdd:function(config){/*jshint unused: false*/},

    onUpdate:function(config){/*jshint unused: false*/},

    onAddCancel:function(){},

    onUpdateCancel:function(){},
    
    _bindEvents:function(){
      this.own(on(this.btnAddValue,'click',lang.hitch(this,function(){
        var args = {
          config:null,
          len:this._getSingleValueCount().length + 1
        };
        var tr = this._createSingleValue(args);
        if(tr){
          var sv = tr.singleValue;
          this._showSingleValuesSection(sv);
        }
      })));
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
      this.own(on(this.valuesTable,'actions-edit',lang.hitch(this,function(tr){
        var singleValue = tr.singleValue;
        if(singleValue){
          this._showSingleValuesSection(singleValue);
        }
      })));
      this.own(on(this.valuesTable,'row-delete',lang.hitch(this,function(tr){
        var singleValue = tr.singleValue;
        if(singleValue){
          singleValue.destroy();
        }
        delete tr.singleValue;
      })));
      this.own(on(this.valuesTable,'rows-clear',lang.hitch(this,function(trs){
        array.forEach(trs,lang.hitch(this,function(tr){
          var singleValue = tr.singleValue;
          if(singleValue){
            singleValue.destroy();
          }
          delete tr.singleValue;
        }));
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

    onBack:function(singleExpression,config){/*jshint unused: false*/},
    
    _showSingleValuesSection:function(singleValue){
      this._hideSingleValues(singleValue);
      html.setStyle(this.singleExpressionsSection,'display','none');
      html.setStyle(this.singleValuesSection,'display','block');
    },
    
    _showSingleExpressionsSection:function(){
      html.setStyle(this.singleExpressionsSection,'display','block');
      html.setStyle(this.singleValuesSection,'display','none');
    },
    
    _hideSingleValues:function(ignoredSingleValue){
      var allSingleValues = this._getAllSingleValues();
      array.forEach(allSingleValues,lang.hitch(this,function(item){
        html.setStyle(item.domNode,'display','none');
      }));
      if(ignoredSingleValue){
        //ignoredSingleValue._requestLayerInfo(this.layerURL);
        html.setStyle(ignoredSingleValue.domNode,'display','block');
      }
    },
    
    _getAllSingleValues:function(){
      var trs = this.valuesTable._getNotEmptyRows();
      var allSingleValues = array.map(trs,lang.hitch(this,function(item){
        return item.singleValue;
      }));
      return allSingleValues;
    }
  });
});