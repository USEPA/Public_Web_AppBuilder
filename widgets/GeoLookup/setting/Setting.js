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
     'dijit/form/RadioButton',
    'dijit/form/Button',
    'dijit/form/SimpleTextarea',
    'dijit/form/TextBox',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    'dojo',
    'dojo/query',
    'dojo/_base/html',
    'dojo/dom-style',
    'dojo/_base/array',
    'dojo/on',
    'dojo/_base/lang',
    'dojo/json',
    'dijit/form/Select',
    'dojo/dom-construct',
    'jimu/dijit/SymbolChooser',
    'esri/symbols/jsonUtils'
],
  function (
    declare,
    _WidgetsInTemplateMixin,
    RadioButton,
    Button,
    SimpleTextarea,
    TextBox,
    BaseWidgetSetting,
    SimpleTable,
    dojo,
    query,
    html,
    domStyle,
    array,
    on,
    lang,
    JSON,
    Select,
    domConstruct,
    SymbolChooser,
    symbolJsonUtils

        ) {
      return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
          //these two properties is defined in the BaseWidget
          baseClass: 'solutions-widget-geolookup-setting',
          layersTable: null,
          currentLayer: null,
          selectedFields: [],
          startup: function () {
              this.inherited(arguments);
              if (this.config === null) {
                  this.config = {};

              }
              if (this.config === undefined) {
                  this.config = {};

              }
              if (this.config === '') {
                  this.config = {};

              }
              this.setConfig(this.config);
              this.createLayerTable();
              this.loadLayerTable();
              this.createFieldsTable();


              try {
                  var btnBar =
                      (this.domNode.parentNode.parentNode.parentNode.parentNode.lastChild.lastChild);

                  this.btnAdvSettings = domConstruct.toDom(
                  "<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1'>" +
                  this.nls.advSettingsBtn + "</div>");
                  dojo.connect(this.btnAdvSettings, "onclick", lang.hitch(this, this.showAdvSettings));

                  this.btnSaveFields = domConstruct.toDom(
                     "<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1 hide'>" +
                     this.nls.saveFields + "</div>");
                  dojo.connect(this.btnSaveFields, "onclick", lang.hitch(this, this.saveFields));

                  this.btnCancelFields = domConstruct.toDom(
                      "<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1 hide'>" +
                      this.nls.cancelFields + "</div>");
                  dojo.connect(this.btnCancelFields, "onclick", lang.hitch(this, this.cancelFields));

                  this.btnSaveAdv = domConstruct.toDom(
                    "<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1 hide'>" +
                    this.nls.saveAdv + "</div>");
                  dojo.connect(this.btnSaveAdv, "onclick", lang.hitch(this, this.saveAdv));

                  this.btnCancelAdv = domConstruct.toDom(
                      "<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1 hide'>" +
                      this.nls.cancelAdv + "</div>");
                  dojo.connect(this.btnCancelAdv, "onclick", lang.hitch(this, this.cancelAdv));


                  this.btnErrorMsg = domConstruct.toDom("<div class='settings-error hide'></div>");

                  domConstruct.place(this.btnAdvSettings, btnBar, "after");
                  domConstruct.place(this.btnSaveAdv, this.btnAdvSettings, "after");
                  domConstruct.place(this.btnCancelAdv, this.btnSaveAdv, "after");
                  domConstruct.place(this.btnSaveFields, this.btnCancelAdv, "after");
                  domConstruct.place(this.btnCancelFields, this.btnSaveFields, "after");
                  domConstruct.place(this.btnErrorMsg, this.btnCancelFields, "after");

              }
              catch (err) {
                  console.log(err.message);
              }
          },


          setConfig: function (config) {
              this.config = config;
              var error = array.forEach(this.config.enrichLayers, function (row) {
                  this.selectedFields[row.id] = row.fields;
              }, this);
              var sym;
              if (this.config.SymbolWithin) {
                  sym = symbolJsonUtils.fromJson(this.config.SymbolWithin);
                  if (sym) {
                      this.symbolWithin.showBySymbol(sym);
                  }
              }
              if (this.config.SymbolOutside) {
                  sym = symbolJsonUtils.fromJson(this.config.SymbolOutside);
                  if (sym) {
                      this.symbolOutside.showBySymbol(sym);
                  }
              }
          },
          getConfig: function () {

              this.config.SymbolWithin = this.symbolWithin.getSymbol().toJson();
              this.config.SymbolOutside = this.symbolOutside.getSymbol().toJson();
              var data = this.layersTable.getData();
              this.config.enrichLayers = [];
              var layersValid = false;
              var error = array.some(data, function (row) {
                  if (row.enrich) {
                      var enrichLayer = {};
                      enrichLayer.id = row.id;
                      enrichLayer.name = row.name;
                      if (!this.selectedFields[enrichLayer.id]) {
                          return true;
                      }
                      enrichLayer.fields = this.selectedFields[enrichLayer.id];
                      this.config.enrichLayers.push(enrichLayer);
                      layersValid = true;
                  }
              }, this);
              if (error || layersValid === false) {
                  this.showOKError();
                  return false;
              }

              return this.config;
          },

          loadLayerTable: function () {
              var label = '';
              var tableValid = false;
              var enrich = false;

              array.forEach(this.map.itemInfo.itemData.operationalLayers, function (layer) {
                  if (layer.layerObject !== null && layer.layerObject !== undefined) {
                      if (layer.layerObject.type === 'Feature Layer' && layer.url && layer.layerObject.geometryType === "esriGeometryPolygon") {
                          label = layer.title;
                          enrich = false;

                          var filteredArr = dojo.filter(this.config.enrichLayers, function (layerInfo) {
                              return layerInfo.id === layer.layerObject.id;
                          });
                          if (filteredArr.length > 0) {
                              enrich = true;
                          }
                          var row = this.layersTable.addRow({
                              label: label,
                              enrich: enrich,
                              id: layer.layerObject.id
                          });
                          tableValid = true;
                      }
                  }
              }, this);

              if (!tableValid) {
                  domStyle.set(this.tableLayerInfosError, 'display', '');
              } else {
                  domStyle.set(this.tableLayerInfosError, 'display', 'none');
              }
          },
          createLayerTable: function () {
              var layerTableFields = [{
                  name: 'enrich',
                  title: this.nls.layerTable.colEnrich,
                  type: 'checkbox',
                  'class': 'enrich'
              }, {
                  name: 'label',
                  title: this.nls.layerTable.colLabel,
                  type: 'text'
              },
             {
                 name: 'actions',
                 title: this.nls.layerTable.colFieldSelector,
                 type: 'actions',
                 'class': 'fieldselector',
                 actions: ['edit']
             }, {
                 name: 'id',
                 type: 'text',
                 hidden: true
             }];
              var args = {
                  fields: layerTableFields,
                  selectable: false
              };
              domConstruct.empty(this.tableLayerInfos);
              this.layersTable = new SimpleTable(args);
              this.layersTable.placeAt(this.tableLayerInfos);
              this.layersTable.startup();
              this.own(on(this.layersTable, 'actions-edit',
                  lang.hitch(this, this.showLayerFields)));

          },
          createFieldsTable: function () {
              var layerFields = [{
                  name: 'isAppended',
                  title: this.nls.fieldTable.colAppend,
                  type: 'checkbox',
                  'class': 'appended'
              }, {
                  name: 'fieldName',
                  title: this.nls.fieldTable.colName,
                  type: 'text'
              }, {
                  name: 'label',
                  title: this.nls.fieldTable.colAlias,
                  type: 'text',
                  editable: true
              }];
              var layerFieldArgs = {
                  fields: layerFields,
                  selectable: false
              };
              this.layerFieldsTable = new SimpleTable(layerFieldArgs);
              this.layerFieldsTable.placeAt(this.tableFieldInfos);
              this.layerFieldsTable.startup();
          },
          showLayerFields: function (tr) {
              this.currentLayer = null;
              var tds = query('.action-item-parent', tr);
              if (tds && tds.length) {
                  var rowData = this.layersTable.getRowData(tr);
                  this.layerFieldsTable.clear();

                  var layer = this.map.getLayer(rowData.id);
                  if (layer) {
                      if (layer.infoTemplate) {
                          var fields = this.selectedFields[rowData.id];
                          var filtFields;
                          var isAppended;
                          if (fields) {
                              filtFields = array.map(fields, function (field) {
                                  return field.fieldName;
                              });
                          }
                          var fields = layer.infoTemplate.info.fieldInfos;
                          array.forEach(fields, function (field) {
                              isAppended = false;
                              if (filtFields) {
                                  if (filtFields.indexOf(field.fieldName) >= 0) {
                                      isAppended = true;
                                  }
                              }
                              this.layerFieldsTable.addRow({
                                  fieldName: field.fieldName,
                                  label: field.label,
                                  isAppended: isAppended
                              });
                          }, this);
                          html.addClass(this.mainPage, 'hide');
                          html.addClass(this.btnAdvSettings, 'hide');
                          html.removeClass(this.fieldsPage, 'hide');
                          html.removeClass(this.btnSaveFields, 'hide');
                          html.removeClass(this.btnCancelFields, 'hide');
                          this.currentLayer = rowData.id;
                      }
                  }
              }
          },
          saveFields: function () {
              var data = this.layerFieldsTable.getData();
              var fields = [];
              var field;
              array.forEach(data, function (row) {
                  if (row.isAppended === true) {
                      field = {};
                      field.fieldName = row.fieldName;
                      field.label = row.label;

                      fields.push(field);
                  }
              }, this);

              this.selectedFields[this.currentLayer] = fields;
              html.removeClass(this.mainPage, 'hide');
              html.addClass(this.fieldsPage, 'hide');
              html.addClass(this.btnSaveFields, 'hide');
              html.addClass(this.btnCancelFields, 'hide');
              html.removeClass(this.btnAdvSettings, 'hide');
          },
          cancelFields: function () {
              html.removeClass(this.mainPage, 'hide');
              html.addClass(this.fieldsPage, 'hide');
              html.addClass(this.btnSaveFields, 'hide');
              html.addClass(this.btnCancelFields, 'hide');
              html.removeClass(this.btnAdvSettings, 'hide');

          },
          cancelAdv: function () {
              html.removeClass(this.mainPage, 'hide');
              html.addClass(this.advSettingsPage, 'hide');
              html.addClass(this.btnSaveAdv, 'hide');
              html.addClass(this.btnCancelAdv, 'hide');
              html.removeClass(this.btnAdvSettings, 'hide');
          },
          saveAdv: function () {
              html.removeClass(this.mainPage, 'hide');
              html.addClass(this.advSettingsPage, 'hide');
              html.addClass(this.btnSaveAdv, 'hide');
              html.addClass(this.btnCancelAdv, 'hide');
              html.removeClass(this.btnAdvSettings, 'hide');

              var val;
              var valSpl;
              val = this.advSettingsLatValues.get("value");
              valSpl = val.split("\n");
              this.config.latFields = [];
              array.forEach(valSpl, function (value) {
                  if (value != "") {
                      this.config.latFields.push(value);
                  }
              }, this);

              val = this.advSettingsLongValues.get("value");
              valSpl = val.split("\n");
              this.config.longFields = [];
              array.forEach(valSpl, function (value) {
                  if (value !=""){
                      this.config.longFields.push(value);
                  }
              }, this);
              this.config.intersectField = this.advSettingsIntersectField.get("value");
              this.config.valueIn = this.advSettingsIntersectInValue.get("value");
              this.config.valueOut = this.advSettingsIntersectOutValue.get("value");

          },
          showAdvSettings: function () {

              var val = "";

              array.forEach(this.config.latFields, function (value) {
                  val = val + value + "\n";
              }, this);
              this.advSettingsLatValues.set("value", val);

              val = "";
              array.forEach(this.config.longFields, function (value) {
                  val = val + value + "\n";
              }, this);
              this.advSettingsLongValues.set("value", val);

              this.advSettingsIntersectField.set("value", this.config.intersectField);
              this.advSettingsIntersectInValue.set("value", this.config.valueIn);
              this.advSettingsIntersectOutValue.set("value", this.config.valueOut);

              html.addClass(this.mainPage, 'hide');
              html.removeClass(this.advSettingsPage, 'hide');
              html.removeClass(this.btnSaveAdv, 'hide');
              html.removeClass(this.btnCancelAdv, 'hide');
              html.addClass(this.btnAdvSettings, 'hide');
          },
          showOKError: function () {
              this.btnErrorMsg.innerHTML = this.nls.errorOnOk;
              html.removeClass(this.btnErrorMsg, 'hide');

          },
          hideOkError: function () {

              html.addClass(this.btnErrorMsg, 'hide');

          }
      });
  });