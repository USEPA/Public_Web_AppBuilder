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

define(['dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/registry',
  'dijit/form/Select',
  'dojo/text!./SortFields.html',
  'dojo/on',
  'dojo/query',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'jimu/dijit/SimpleTable'
],
function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, registry, Select,
  template, on, query, lang, array, html, SimpleTable) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-query-setting-sort-fields',
    templateString: template,

    _allFieldNames: null,
    _sortTipClassName: 'sort-tip',
    _fieldNameSelectClassName: 'field-name-select',
    _sortTypeSelectClassName: 'sort-type-select',

    //options:
    nls: null,
    layerDefinition: null,
    orderByFields: null,
    validSortFieldTypes: [],

    //methods:
    //getOrderByFields

    postCreate:function(){
      this.inherited(arguments);

      var fieldInfos = array.filter(this.layerDefinition.fields,
        lang.hitch(this, function(fieldInfo){
        return this.validSortFieldTypes.indexOf(fieldInfo.type) >= 0;
      }));

      this._allFieldNames = array.map(fieldInfos, function(fieldInfo){
        return fieldInfo.name;
      });

      this._initTable();

      if(this.orderByFields){
        this._setOrderByFields(this.orderByFields);
      }else{
        this.orderByFields = [];
      }
    },

    _initTable: function(){
      var args = {
        autoHeight: false,
        style:"height:187px",
        fields: [{
          name: 'sortTip',
          title: this.nls.field,
          type: 'text',
          width: '100px'
        }, {
          name: 'fieldName',
          title: '',
          type: 'extension',
          create: lang.hitch(this, this._create4FieldName),
          setValue: lang.hitch(this, this._setValue4FieldName),
          getValue: lang.hitch(this, this._getValue4FieldName)
        }, {
          name: 'sortType',
          title: this.nls.sortingOrder,
          type: 'extension',
          create: lang.hitch(this, this._create4SortType),
          setValue: lang.hitch(this, this._setValue4SortType),
          getValue: lang.hitch(this, this._getValue4SortType)
          // width: '180px'
        }, {
          name: 'actions',
          title: this.nls.actions,
          type: 'actions',
          actions: ['up', 'down', 'delete'],
          width: '120px'
        }]
      };
      this.table = new SimpleTable(args);
      this.own(on(this.table, 'row-up', lang.hitch(this, this._onTableRowUp)));
      this.own(on(this.table, 'row-down', lang.hitch(this, this._onTableRowDown)));
      this.table.placeAt(this.tableDiv);
      this.table.startup();
    },

    getOrderByFields: function(){
      var rowsData = this.table.getData();
      var orderByFields = array.map(rowsData, lang.hitch(this, function(rowData){
        var str = rowData.fieldName + " " + rowData.sortType;
        return str;
      }));
      return orderByFields;
    },

    _getFieldAlias: function(fieldName){
      var alias = fieldName;
      var fieldInfos = this.layerDefinition.fields;
      for(var i = 0; i < fieldInfos.length; i++){
        if(fieldInfos[i].name === fieldName){
          alias = fieldInfos[i].alias || fieldName;
          return alias;
        }
      }
      return alias;
    },

    _getRestFields: function(){
      var selects = this._getAllFieldSelects();
      var existFieldNames = array.map(selects, lang.hitch(this, function(select){
        return select.get('value');
      }));
      var restFields = array.filter(this._allFieldNames, lang.hitch(this, function(fieldName){
        return existFieldNames.indexOf(fieldName) < 0;
      }));
      return restFields;
    },

    _onAddNewClicked: function(){
      var restFields = this._getRestFields();
      if(restFields.length === 0){
        return;
      }
      var rows = this.table.getRows();
      var tip = '';
      if(rows.length === 0){
        tip = this.nls.sortBy;
      }else{
        tip = this.nls.thenBy;
      }
      this.table.addRow({
        sortTip: tip,
        fieldName: restFields[0],
        sortType: 'ASC'
      });
    },

    _setOrderByFields: function(orderByFields){
      //update table here
      //such as ["STATE_NAME DESC"]
      this.table.clear();
      orderByFields = orderByFields || [];

      array.forEach(orderByFields, lang.hitch(this, function(item, i){
        var splits = item.split(' ');
        var fieldName = splits[0];
        var sortType = 'ASC';
        if(splits[1] && typeof splits[1] === 'string'){
          splits[1] = splits[1].toUpperCase();
          if(splits[1] === 'DESC'){
            sortType = 'DESC';
          }
        }
        var tip = '';
        if(i === 0){
          tip = this.nls.sortBy;
        }else{
          tip = this.nls.thenBy;
        }
        this.table.addRow({
          sortTip: tip,
          fieldName: fieldName,
          sortType: sortType
        });
      }));
    },

    _getAllFieldSelects: function(){
      var selectNodes = query('.' + this._fieldNameSelectClassName, this.table.tbody);
      var selects = array.map(selectNodes, lang.hitch(this, function(selectNode){
        return registry.byNode(selectNode);
      }));
      return selects;
    },

    _getSelectFromTd: function(td, className){
      var selectNode = query('.' + className, td)[0];
      var select = registry.byNode(selectNode);
      return select;
    },

    _onTableRowUp: function(){
      this._resetSortTips();
    },

    _onTableRowDown: function(){
      this._resetSortTips();
    },

    _getAllSortTipDivs: function(){
      var divs = query('.sortTip .normal-text-div', this.table.tbody);
      return divs;
    },

    _resetSortTips: function(){
      var rows = this.table.getRows();
      array.forEach(rows, lang.hitch(this, function(tr, i){
        var tip = "";
        if(i === 0){
          tip = this.nls.sortBy;
        }else{
          tip = this.nls.thenBy;
        }
        this.table.editRow(tr, {
          sortTip: tip
        });
      }));
      var divs = this._getAllSortTipDivs();
      array.forEach(divs, lang.hitch(this, function(div, i){
        if(i === 0){
          div.innerHTML = this.nls.sortBy;
        }else{
          div.innerHTML = this.nls.thenBy;
        }
      }));
    },

    _create4FieldName: function(td){
      var restFields = this._getRestFields();
      var select = new Select({
        style: 'width:120px;height:20px;'
      });
      html.addClass(select.domNode, this._fieldNameSelectClassName);
      select.placeAt(td);
      array.forEach(restFields, lang.hitch(this, function(fieldName){
        var alias = this._getFieldAlias(fieldName);
        select.addOption({
          value: fieldName,
          label: alias
        });
      }));
      this.own(on(select, 'change', lang.hitch(this, this._onFieldNameSelectChanged)));
    },

    _setValue4FieldName: function(td, fieldData){
      var select = this._getSelectFromTd(td, this._fieldNameSelectClassName);
      select.set('value', fieldData);
    },

    _getValue4FieldName: function(td){
      var select = this._getSelectFromTd(td, this._fieldNameSelectClassName);
      return select.get('value');
    },

    _onFieldNameSelectChanged: function(){
      var selects = this._getAllFieldSelects();
      array.forEach(selects, lang.hitch(this, function(select){
        var currentValue = select.get('value');

        var options = select.getOptions();
        var removeOptions = array.filter(options, lang.hitch(this, function(option){
          return option.value !== currentValue;
        }));
        select.removeOption(removeOptions);

        var restFields = this._getRestFields();
        array.forEach(restFields, lang.hitch(this, function(fieldName){
          if(fieldName !== currentValue){
            var alias = this._getFieldAlias(fieldName);
            select.addOption({
              value: fieldName,
              label: alias
            });
          }
        }));
      }));
    },

    _create4SortType: function(td){
      var select = new Select({
        style: 'width:120px;height:20px;'
      });
      html.addClass(select.domNode, this._sortTypeSelectClassName);
      select.placeAt(td);
      select.addOption({
        value: 'ASC',
        label: this.nls.ascending,
        selected: true
      });
      select.addOption({
        value: 'DESC',
        label: this.nls.descending
      });
    },

    _setValue4SortType: function(td, fieldData){
      var select = this._getSelectFromTd(td, this._sortTypeSelectClassName);
      if(fieldData === 'ASC' || fieldData === 'DESC'){
        select.set('value', fieldData);
      }
    },

    _getValue4SortType: function(td){
      var select = this._getSelectFromTd(td, this._sortTypeSelectClassName);
      return select.get('value');
    }
  });
});