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
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./SingleQuerySetting.html',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/on',
  'dojo/Evented',
  'jimu/utils',
  'jimu/dijit/TabContainer3',
  'jimu/dijit/Message',
  'jimu/dijit/_QueryableLayerSourcePopup',
  './PopupConfig',
  'esri/request',
  'esri/symbols/jsonUtils',
  'jimu/dijit/Filter',
  'jimu/dijit/SymbolPicker',
  'jimu/dijit/LoadingShelter',
  'dijit/form/ValidationTextBox'
],
function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, lang,
  array, html, on, Evented, jimuUtils, TabContainer3, Message, _QueryableLayerSourcePopup,
  PopupConfig, esriRequest, esriSymbolJsonUtils, Filter) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    baseClass: 'jimu-widget-single-query-setting',
    templateString: template,
    map: null,
    nls: null,
    tr: null,
    appConfig: null,

    _layerDefinition: null,//include url

    //public methods:
    //setNewLayerDefinition
    //setConfig
    //getConfig

    postCreate: function(){
      this.inherited(arguments);
      this._initSelf();
    },

    destroy: function(){
      this.tr = null;
      delete this.tr;
      this.inherited(arguments);
    },

    setConfig: function(config){
      this.config = config;
      if(!this._isObject(this.config)){
        return;
      }
      var url = config.url || '';
      var validUrl = url && typeof url === 'string';
      if(!validUrl){
        return;
      }

      if(this._layerDefinition && this._layerDefinition.url === url){
        this.tab.hideShelter();
        this._resetByConfig(this.config, this._layerDefinition);
      }
      else{
        this._layerDefinition = null;
        this.showBigShelter();
        var def = esriRequest({
          url: url,
          handAs: 'json',
          content:{f:'json'},
          callbackParamName:'callback'
        });
        def.then(lang.hitch(this, function(response){
          if(!this.domNode){
            return;
          }
          this.hideBigShelter();
          this.tab.hideShelter();
          this._layerDefinition = response;
          this._layerDefinition.url = url;
          this._resetByConfig(this.config, this._layerDefinition);
        }), lang.hitch(this, function(err){
          console.error(err);
          if(!this.domNode){
            return;
          }
          this.hideBigShelter();
        }));
      }
    },

    getConfig: function () {
      var config = {
        name:'',
        url:'',
        filter:{
          useFilter:'',
          filterInfo:''
        },
        popup: '',
        resultsSymbol:'',
        objectIdField:'',
        orderByFields: []
      };

      if(!this._layerDefinition){
        this.scrollToDom(this.generalTable);
        new Message({message: this.nls.setSourceTip});
        return null;
      }
      config.url = this._layerDefinition.url;

      var queryName = jimuUtils.stripHTML(this.queryNameTextBox.get('value'));
      if(!queryName){
        this.showValidationErrorTip(this.queryNameTextBox);
        return null;
      }
      config.name = queryName;

      var filterObj = this.filter.toJson();
      if (!filterObj) {
        new Message({
          message: this.nls.setFilterTip
        });
        return null;
      }
      config.filter = filterObj;

      var popup = this.popupConfig.getConfig();
      if(!popup){
        return null;
      }
      config.orderByFields = popup.orderByFields;
      delete popup.orderByFields;
      config.popup = popup;

      if(this._isTable(this._layerDefinition)){
        //if it is table, we don't save the symbol info
        config.resultsSymbol = null;
      }else{
        var sym1 = this.layerSymbolPicker.getSymbol();
        if(sym1){
          config.resultsSymbol = sym1.toJson();
        }
        else{
          return null;
        }
      }

      if(this._layerDefinition.objectIdField){
        config.objectIdField = this._layerDefinition.objectIdField;
      }
      else{
        var fields = this._layerDefinition.fields;
        var oidFieldInfos = array.filter(fields, lang.hitch(this, function(fieldInfo){
          return fieldInfo.type === 'esriFieldTypeOID';
        }));
        if(oidFieldInfos.length > 0){
          var oidFieldInfo = oidFieldInfos[0];
          config.objectIdField = oidFieldInfo.name;
        }
      }

      this.tr._layerDefinition = this._layerDefinition;

      return config;
    },

    scrollToDom: function(_dom){
      var y1 = html.coords(_dom).y;
      var y2 = html.coords(this.domNode).y;
      var value = y1 - y2;
      this.domNode.parentNode.scrollTop = value;
    },

    showValidationErrorTip: function(_dijit){
      if (!_dijit.validate() && _dijit.domNode) {
        if (_dijit.focusNode) {
          _dijit.focusNode.focus();
          setTimeout(lang.hitch(this, function() {
            _dijit.focusNode.blur();
          }), 100);
        }
      }
    },

    showBigShelter: function(){
      // this.shelter.show();
      this.emit("show-shelter");
    },

    hideBigShelter: function(){
      // this.shelter.hide();
      this.emit("hide-shelter");
    },

    showQueryDefinition: function(){
      this.tab.selectTab(this.nls.queryDefinition);
    },

    showResultsSetting: function(){
      this.tab.selectTab(this.nls.resultsSetting);
    },

    _initSelf: function(){
      this._initFilter();
      this._initPopupConfig();
      this._initTabs();
    },

    _initFilter: function(){
      this.filter = new Filter({
        enableAskForValues: true,
        noFilterTip: this.nls.noFilterTip,
        style: "width:100%;margin-top:22px;"
      });
      this.filter.placeAt(this.filterDiv);
    },

    _initTabs: function(){
      var tabDefinition = {
        title: this.nls.queryDefinition,
        content: this.definitionTabNode
      };

      var tabResults = {
        title: this.nls.resultsSetting,
        content: this.resultsTabNode
      };

      var tabs = [tabDefinition, tabResults];
      var args = {
        tabs: tabs
      };
      this.tab = new TabContainer3(args);
      this.tab.placeAt(this.detailSection);
      this.tab.showShelter();
    },

    _initPopupConfig: function(){
      var args = {
        nls: this.nls,
        sqs: this
      };
      this.popupConfig = new PopupConfig(args);
      this.popupConfig.placeAt(this.popupContainer);
    },

    _getRandomString: function(){
      var str = Math.random().toString();
      str = str.slice(2, str.length);
      return str;
    },

    _onQueryNameChanged: function(){
      this.emit('name-change', this.queryNameTextBox.get('value'));
    },

    _onQueryNameBlurred: function(){
      var value = jimuUtils.stripHTML(this.queryNameTextBox.get('value'));
      this.queryNameTextBox.set('value', value);
    },

    _clear: function(){
      this.urlTextBox.set('value', '');
      this._layerDefinition = null;
      this.queryNameTextBox.set('value', '');
      this.filter.reset();
      this.tab.showShelter();
      this.popupConfig.clear();
      this.layerSymbolPicker.reset();
    },

    _onBtnSetSourceClicked: function(){
      var args = {
        titleLabel: this.nls.setDataSource,

        dijitArgs: {
          multiple: false,
          createMapResponse: this.map.webMapResponse,
          portalUrl: this.appConfig.portalUrl,
          style: {
            height: '100%'
          }
        }
      };

      var sourcePopup = new _QueryableLayerSourcePopup(args);
      this.own(on(sourcePopup, 'ok', lang.hitch(this, function(item){
        //{name, url, definition}
        var radioType = sourcePopup.getSelectedRadioType();
        sourcePopup.close();
        sourcePopup = null;
        var queryName = null;
        var expr = null;
        if(radioType === 'map'){
          var layerObject = item.layerInfo && item.layerInfo.layerObject;
          if(layerObject && typeof layerObject.getDefinitionExpression === 'function'){
            expr = layerObject.getDefinitionExpression();
          }
        }
        this.setNewLayerDefinition(item.name, item.url, item.definition, queryName, expr);
      })));
      this.own(on(sourcePopup, 'cancel', lang.hitch(this, function(){
        sourcePopup.close();
        sourcePopup = null;
      })));

      sourcePopup.startup();
    },

    setNewLayerDefinition: function(name, url, definition,/*optional*/ queryName,/*optional*/ expr){
      definition.name = name;
      definition.url = url;
      var oldUrl = this._layerDefinition && this._layerDefinition.url;
      if (url !== oldUrl) {
        this._resetByNewLayerDefinition(definition, queryName, expr);
      }
    },

    _isImageServiceLayer: function(layerInfo) {
      return (layerInfo.url.indexOf('/ImageServer') > -1);
    },

    _isTable: function(layerInfo){
      return layerInfo.type === 'Table';
    },

    _showSymbolSection: function(){
      html.setStyle(this.symbolSection, 'display', 'block');
    },

    _hideSymbolSection: function(){
      html.setStyle(this.symbolSection, 'display', 'none');
    },

    _resetByNewLayerDefinition: function(layerInfo,/*optional*/ queryName,/*optional*/ defaultExpr){
      this._clear();
      if(!layerInfo){
        return;
      }
      this._layerDefinition = layerInfo;
      var url = layerInfo.url;
      this.urlTextBox.set('value', url);
      this.queryNameTextBox.set('value', queryName || layerInfo.name);
      this.tab.hideShelter();

      //reset filter
      this.filter.reset();
      if(this._layerDefinition){
        var expr = defaultExpr || '1=1';
        this.filter.buildByExpr(url, expr, this._layerDefinition);
      }

      //reset popupConfig
      var popupTitle = '';

      if(layerInfo.displayField){
        popupTitle = '${' + layerInfo.displayField + '}';
      }

      this.popupConfig.setConfig({
        title: popupTitle,
        fields: [],
        orderByFields: []
      });

      this.popupConfig.updateSortingIcon(this._layerDefinition);

      //reset symbol
      var symType = '';
      if(this._isImageServiceLayer(layerInfo)){
        symType = 'fill';
      } else if(this._isTable(layerInfo)){
        symType = '';
      } else{
        if(layerInfo.geometryType){
          var geoType = jimuUtils.getTypeByGeometryType(layerInfo.geometryType);

          if(geoType === 'point'){
            symType = 'marker';
          }
          else if(geoType === 'polyline'){
            symType = 'line';
          }
          else if(geoType === 'polygon'){
            symType = 'fill';
          }
        }
      }

      if(symType){
        //if the layer is feature layer or image service layer, we should let user to configure
        //result symbol
        this._showSymbolSection();
        this.layerSymbolPicker.showByType(symType);
      }else{
        //if the layer is a table, symType will be empty
        this._hideSymbolSection();
        this.layerSymbolPicker.reset();
      }
    },

    _resetByConfig:function(cfg, layerInfo){
      var config = lang.clone(cfg);
      this.urlTextBox.set('value', config.url);
      this.queryNameTextBox.set('value', config.name || '');

      //reset filter
      var filterInfo = config.filter;
      if(!this._isObject(filterInfo)){
        return;
      }
      this.filter.reset();

      if(this._isObject(filterInfo)){
        this.filter.buildByFilterObj(layerInfo.url, filterInfo, layerInfo);
      }
      else{
        this.filter.buildByExpr(layerInfo.url, '1=1', layerInfo);
      }

      //reset popupConfig
      this.popupConfig.clear();
      if(!this._isObject(config.popup)){
        config.popup = {
          title:'',
          fields:[]
        };
      }
      if(!(config.popup.fields && config.popup.fields.length >= 0)){
        config.popup.fields = [];
      }
      if(!config.popup.title){
        config.popup.title = '';
      }

      this.popupConfig.setConfig({
        title: config.popup.title,
        fields: config.popup.fields,
        orderByFields: config.orderByFields
      });

      this.popupConfig.updateSortingIcon(layerInfo);

      //reset symbol
      if(this._isTable(layerInfo)){
        //if it is a table, we should not allow user configure result symbol
        this._hideSymbolSection();
        this.layerSymbolPicker.reset();
      }else{
        //it is a feature layer or an image service layer
        this._showSymbolSection();
        if(config.resultsSymbol){
          var sym1 = esriSymbolJsonUtils.fromJson(config.resultsSymbol);
          this.layerSymbolPicker.showBySymbol(sym1);
        }
      }
    },

    _isObject:function(o){
      return o && typeof o === 'object';
    }

  });
});