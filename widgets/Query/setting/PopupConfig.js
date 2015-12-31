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
  'dojo/text!./PopupConfig.html',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/on',
  'dojo/query',
  'jimu/dijit/SimpleTable',
  'jimu/dijit/Popup',
  'dijit/TooltipDialog',
  'dijit/Menu',
  'dijit/MenuItem',
  'dijit/popup',
  './SortFields'
],
function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, lang, html,
  array, on, query, SimpleTable, Popup, TooltipDialog, Menu, MenuItem, dojoPopup, SortFields) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-query-setting-popup-config',
    templateString: template,

    _currentOrderByFields: null,
    _validSortFieldTypes: ['esriFieldTypeOID',
                           'esriFieldTypeString',
                           'esriFieldTypeDate',
                           'esriFieldTypeSmallInteger',
                           'esriFieldTypeInteger',
                           'esriFieldTypeSingle',
                           'esriFieldTypeDouble'],

    //options:
    nls: null,
    sqs: null,
    config:null,//{title,fields,orderByFields}

    //methods:
    //setConfig
    //getConfig
    //clear
    //updateSortingIcon

    postCreate:function(){
      this.inherited(arguments);
      this._currentOrderByFields = [];
      this._initFieldsTable();
      this._initAddFields();
      this.clear();
      if(this.config){
        this.setConfig(this.config);
      }
    },

    setConfig:function(config){
      this.clear();

      this.config = lang.clone(config);
      var validTitle = this.config.title && typeof this.config.title === 'string';
      if(validTitle){
        this.titleTextBox.set('value', this.config.title || '');
      }
      else{
        this.titleTextBox.set('value', '');
      }
      var layerDefinition = this._getLayerDefinition();
      if(layerDefinition){
        var popupFieldsHash = {};
        var popupFieldNames = array.map(this.config.fields,
          lang.hitch(this, function(popupFieldInfo){
          //popupFieldInfo: {name,alias,specialType}
          var fieldName = popupFieldInfo.name;
          popupFieldsHash[fieldName] = popupFieldInfo;
          return fieldName;
        }));
        var allFieldInfos = lang.clone(layerDefinition.fields);
        allFieldInfos = this._getSortedFieldInfos(popupFieldNames, allFieldInfos);
        array.forEach(allFieldInfos, lang.hitch(this, function(fieldInfo){
          fieldInfo.visibility = false;
          fieldInfo.specialType = 'none';
          var popupFieldInfo = popupFieldsHash[fieldInfo.name];
          if(popupFieldInfo){
            fieldInfo = lang.mixin(fieldInfo, popupFieldInfo);
            fieldInfo.visibility = true;
          }
        }));
        this._setFields(allFieldInfos);
      }else{
        this._setFields([]);
      }
      this._setOrderByFields(this.config.orderByFields);
    },

    _getSortedFieldInfos: function(fieldNames, allFieldInfos){
      var result = [];
      var allFieldInfosHash = {};
      array.forEach(allFieldInfos, lang.hitch(this, function(fieldInfo){
        allFieldInfosHash[fieldInfo.name] = fieldInfo;
      }));
      var sortedAllFieldNames = [];
      sortedAllFieldNames = sortedAllFieldNames.concat(fieldNames);
      array.forEach(allFieldInfos, lang.hitch(this, function(fieldInfo){
        var fieldName = fieldInfo.name;
        if(sortedAllFieldNames.indexOf(fieldName) < 0){
          sortedAllFieldNames.push(fieldName);
        }
      }));
      result = array.map(sortedAllFieldNames, lang.hitch(this, function(fieldName){
        return allFieldInfosHash[fieldName];
      }));
      return result;
    },

    getConfig:function(){
      var config = {
        title:'',
        fields:[],
        orderByFields: []
      };

      if(!this.titleTextBox.validate()){
        this.sqs.showResultsSetting();
        this.sqs.scrollToDom(this.titleTextBox.domNode);
        this.sqs.showValidationErrorTip(this.titleTextBox);
        return null;
      }
      config.title = this.titleTextBox.get('value');

      var trs = this.fieldsTable.getRows();
      var fields = [];
      array.forEach(trs, lang.hitch(this, function(tr){
        var rowData = this.fieldsTable.getRowData(tr);
        //var field = tr.fieldInfo;
        if (rowData.visibility) {
          var item = {
            name: rowData.name,
            alias: rowData.alias || rowData.name,
            specialType: rowData.specialType
          };
          fields.push(item);
        }
      }));
      config.fields = fields;
      var layerDefinition = this._getLayerDefinition();

      if(this._shouldEnableSorting(layerDefinition)){
        config.orderByFields = this._getOrderByFields();
      }

      return config;
    },

    clear:function(){
      html.removeClass(this.btnSortFields, 'enabled');
      this._currentOrderByFields = [];
      this.titleTextBox.set('value', '');
      this.fieldsTable.clear();
      this._resetMenu();
      this._addEmptyMenuItem();
    },

    destroy:function(){
      this.sqs = null;
      this.titleTextBox.focusNode.blur();
      this.inherited(arguments);
    },

    updateSortingIcon: function(layerInfo){
      if(this._shouldEnableSorting(layerInfo)){
        html.addClass(this.btnSortFields, 'enabled');
      }else{
        html.removeClass(this.btnSortFields, 'enabled');
      }
    },

    _getLayerDefinition: function(){
      return this.sqs._layerDefinition;
    },

    _initFieldsTable: function(){
      var args = {
        autoHeight: false,
        style: "height:187px",
        fields: [{
          name: "visibility",
          title: this.nls.visibility,
          type: "checkbox"
        }, {
          name: "name",
          title: this.nls.name,
          type: "text",
          editable: false
        }, {
          name: "alias",
          title: this.nls.alias,
          type: "text",
          editable: true
        }, {
          name: "specialType",
          title: this.nls.specialType,
          type: "extension",
          create: lang.hitch(this, this._createSpecialType),
          setValue: lang.hitch(this, this._setValue4SpecialType),
          getValue: lang.hitch(this, this._getValueOfSpecialType)
        }, {
          name: "actions",
          title: this.nls.actions,
          type: "actions",
          actions: ["up", "down"]
        }]
      };
      this.fieldsTable = new SimpleTable(args);
      this.fieldsTable.placeAt(this.fieldsContainer);
      this.fieldsTable.startup();
    },

    _createSpecialType: function(td){
      var select = html.create('select', {}, td);
      html.create('option', {
        value: 'none',
        label: this.nls.none,
        selected: true,
        innerHTML: this.nls.none
      }, select);
      html.create('option', {
        value: 'link',
        label: this.nls.link,
        innerHTML: this.nls.link
      }, select);
      html.create('option', {
        value: 'image',
        label: this.nls.image,
        innerHTML: this.nls.image
      }, select);
    },

    _setValue4SpecialType: function(td, value){
      var select = query('select', td)[0];
      select.value = value;
    },

    _getValueOfSpecialType:function(td){
      var select = query('select', td)[0];
      return select.value;
    },

    _initAddFields:function(){
      var ttdContent = html.create("div");
      this.tooltipDialog = new TooltipDialog({
        style: "cursor:pointer",
        content: ttdContent
      });
      this.menu = new Menu();
      this.menu.placeAt(ttdContent);
      this.own(on(document.body, 'click', lang.hitch(this, function(){
        dojoPopup.close(this.tooltipDialog);
      })));
    },

    _onAddClicked:function(event){
      event.stopPropagation();
      event.preventDefault();
      dojoPopup.close(this.tooltipDialog);
      dojoPopup.open({
        popup: this.tooltipDialog,
        around: this.btnAddFields
      });
    },

    _resetMenu:function(){
      var menuItems = this.menu.getChildren();
      array.forEach(menuItems, lang.hitch(this, function(menuItem){
        this.menu.removeChild(menuItem);
      }));
    },

    _addEmptyMenuItem:function(){
      var menuItem = new MenuItem({
        label:this.nls.noField,
        onClick:lang.hitch(this, function(){
          var dialog = this.menu.getParent();
          html.setStyle(dialog.domNode.parentNode, 'display', 'none');
        })
      });
      this.menu.addChild(menuItem);
    },

    _setFields:function(fieldInfos){
      this._resetMenu();
      fieldInfos = array.filter(fieldInfos, function(item) {
        return item.type !== 'esriFieldTypeGeometry';
      });
      if (fieldInfos.length > 0) {
        array.forEach(fieldInfos, lang.hitch(this, function(fieldInfo) {
          this._addMenuItem(fieldInfo);
          this._addRow(fieldInfo);
        }));
      } else {
        this._addEmptyMenuItem();
      }
    },

    _addMenuItem:function(fieldInfo){
      var label = fieldInfo.name + " {" + fieldInfo.name + "}";
      var menuItem = new MenuItem({
        label:label,
        onClick:lang.hitch(this, function(){
          var a = this.titleTextBox.get('value');
          var b = a + "${" + fieldInfo.name + "}";
          this.titleTextBox.set('value', b);
          var dialog = this.menu.getParent();
          html.setStyle(dialog.domNode.parentNode, 'display', 'none');
        })
      });
      this.menu.addChild(menuItem);
    },

    _addRow:function(fieldInfo){
      var rowData = lang.clone(fieldInfo);
      var result = this.fieldsTable.addRow(rowData);
      if(result.success){
        result.tr.fieldInfo = rowData;
      }
    },

    _onBtnSortFieldsClicked: function(){
      var layerDefinition = this._getLayerDefinition();
      if(!layerDefinition){
        return;
      }

      if(!this._shouldEnableSorting(layerDefinition)){
        return;
      }

      var sortFields = new SortFields({
        nls: this.nls,
        layerDefinition: layerDefinition,
        orderByFields: lang.clone(this._currentOrderByFields),
        validSortFieldTypes: this._validSortFieldTypes
      });
      var popup = new Popup({
        width: 640,
        height: 380,
        titleLabel: this.nls.setSortingFields,
        content: sortFields,
        onClose: lang.hitch(this, function(){
          sortFields.destroy();
        }),
        buttons: [{
          label: this.nls.ok,
          onClick: lang.hitch(this, function(){
            var orderByFields = sortFields.getOrderByFields();
            this._setOrderByFields(orderByFields);
            popup.close();
          })
        }, {
          label: this.nls.cancel,
          onClick: lang.hitch(this, function(){
            popup.close();
          })
        }]
      });
    },

    _shouldEnableSorting: function(layerInfo){
      return this._isServiceSupportsPagination(layerInfo) &&
      this._isServiceSupportsOrderBy(layerInfo);
    },

    _isServiceSupportsPagination: function(layerInfo){
      var isSupport = false;
      if(layerInfo.advancedQueryCapabilities){
        if(layerInfo.advancedQueryCapabilities.supportsPagination){
          isSupport = true;
        }
      }
      return isSupport;
    },

    _isServiceSupportsOrderBy: function(layerInfo) {
      var isSupport = false;
      if (layerInfo.advancedQueryCapabilities) {
        if (layerInfo.advancedQueryCapabilities.supportsOrderBy) {
          isSupport = true;
        }
      }
      return isSupport;
    },

    _getOrderByFields: function(){
      return this._currentOrderByFields;
    },

    _setOrderByFields: function(orderByFields){
      //such as ["STATE_NAME DESC"]

      orderByFields = orderByFields || [];

      //clear UI
      this.sortFieldsDiv.innerHTML = "";

      var sortFieldInnerHTML = "";

      orderByFields = array.map(orderByFields, lang.hitch(this, function(item, i){
        var splits = item.split(' ');
        var fieldName = splits[0];
        var sortType = 'ASC';
        if(splits[1] && typeof splits[1] === 'string'){
          splits[1] = splits[1].toUpperCase();
          if(splits[1] === 'DESC'){
            sortType = 'DESC';
          }
        }

        var className = sortType.toLowerCase();

        //update UI
        var str = '<span>' + fieldName + '</span>' +
        '<span class="sort-arrow ' + className + '"></span>';
        if(i !== orderByFields.length - 1){
          str += "<span>,&nbsp;</span>";
        }

        sortFieldInnerHTML += str;

        var result = fieldName + " " + sortType;
        return result;
      }));

      if(sortFieldInnerHTML){
        sortFieldInnerHTML = "<span>&nbsp;&nbsp;</span>" + sortFieldInnerHTML;
      }

      this.sortFieldsDiv.innerHTML = sortFieldInnerHTML;

      this._currentOrderByFields = orderByFields;
    }

  });
});