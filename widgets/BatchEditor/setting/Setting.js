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
    'dijit/form/Button',
    'dijit/form/RadioButton',
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
          baseClass: 'solutions-widget-batcheditor-setting',
          layersTable: null,
          commonFieldsTable: null,
          layerSelects: null,
          currentLayer: null,
          selectionSymbols: {},
          currentPage: 1,
          controlsAddedToWidgetFrame: false,
          toolOption: {
              Shape: { value: 0 },
              FeatureSpatial: { value: 1 },
              FeatureQuery: { value: 2 },
              Query: { value: 3 }
          },
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
              this.createFieldsTable();
              try {
                  var btnBar =
                      (this.domNode.parentNode.parentNode.parentNode.parentNode.lastChild.lastChild);
                  this.btnNext = domConstruct.toDom(
                      "<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1'>" +
                      this.nls.next + "</div>");

                  dojo.connect(this.btnNext, "onclick", lang.hitch(this, this.btnNextClick));
                  this.btnBack = domConstruct.toDom(
                      "<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1 hide'>" +
                      this.nls.back + "</div>");
                  dojo.connect(this.btnBack, "onclick", lang.hitch(this, this.btnBackClick));

                  this.btnSave = domConstruct.toDom(
                      "<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1 hide'>" +
                      this.nls.save + "</div>");
                  dojo.connect(this.btnSave, "onclick", lang.hitch(this, this.saveSymbol));

                  this.btnCancel = domConstruct.toDom(
                      "<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1 hide'>" +
                      this.nls.cancel + "</div>");
                  dojo.connect(this.btnCancel, "onclick", lang.hitch(this, this.cancelSymbol));

                  this.btnErrorMsg = domConstruct.toDom("<div class='settings-error hide'></div>");
                  domConstruct.place(this.btnNext, btnBar, "after");
                  domConstruct.place(this.btnBack, this.btnNext, "after");
                  domConstruct.place(this.btnSave, this.btnBack, "after");
                  domConstruct.place(this.btnCancel, this.btnSave, "after");

                  domConstruct.place(this.btnErrorMsg, this.btnCancel, "after");
                  html.addClass(this.pageOneControls, 'hide');
                  html.addClass(this.pageTwoControls, 'hide');
                  html.addClass(this.pageThreeControls, 'hide');
                  html.addClass(this.settingsFirstPageSaveError, 'hide');
                  html.addClass(this.settingsSecondPageSaveError, 'hide');
                  html.addClass(this.settingsThirdPageSaveError, 'hide');
                  html.addClass(this.symgolSelectorControls, 'hide');

                  this.controlsAddedToWidgetFrame = true;

              }
              catch (err) {
                  console.log(err.message);
              }
          },
          btnNextClick: function () {
              if (this.currentPage === 1) {
                  this.page1ToPage2();
              } else if (this.currentPage === 2) {
                  this.page2ToPage3();
              }
          },
          btnBackClick: function () {
              if (this.currentPage === 2) {
                  this.page2ToPage1();
              } else if (this.currentPage === 3) {
                  this.page3ToPage2();
              }
          },
          getSelectedTool: function () {
              if (this.selectByShape.checked) {
                  return this.toolOption.Shape;
              } else if (this.selectByFeature.checked) {
                  return this.toolOption.FeatureSpatial;
              } else if (this.selectByFeatureQuery.checked) {
                  return this.toolOption.FeatureQuery;
              } else if (this.selectByQuery.checked) {
                  return this.toolOption.Query;
              }
          },
          page1ToPage2: function () {

              if (this.selectByShape.checked === false &&
                  this.selectByFeature.checked === false &&
                  this.selectByFeatureQuery.checked === false &&
                  this.selectByQuery.checked === false) {
                  if (this.controlsAddedToWidgetFrame) {
                      this.btnErrorMsg.innerHTML = this.config.nls.page1.toolNotSelected;
                      html.removeClass(this.btnErrorMsg, 'hide');

                  }else {
                      domStyle.set(this.settingsFirstPageError, 'display', '');
                  }
              } else {
                  this.savePageToConfig("1");
                  this.showPage2();

              }

          },
          page2ToPage1: function () {
              this.savePageToConfig("2");
              this.showPage1();
          },
          page2ToPage3: function () {
             
              var result = array.some(this.layersTable.getRows(), function (row) {
                  var rowData = this.layersTable.getRowData(row);
                  return rowData.update;
              }, this);
              if (!result) {
                  if (this.controlsAddedToWidgetFrame) {
                      this.btnErrorMsg.innerHTML = this.config.nls.page2.noLayersSelected;
                      html.removeClass(this.btnErrorMsg, 'hide');

                  }else {
                      domStyle.set(this.settingsSecondPageError, 'display', '');
                  }
              } else {
                  this.savePageToConfig("2");
                  this.showPage3();
              }

          },
          page3ToPage2: function () {
              this.savePageToConfig("3");
              this.showPage2();
          },
          savePageToConfig: function (page) {
              if (page === "1") {
                  if (this.selectByShape.checked === true) {
                      this.config.selectByShape = this.selectByShape.checked;
                  } else {
                      this.config.selectByShape = false;
                  }

                  if (this.selectByFeature.checked === true) {
                      this.config.selectByFeature = this.selectByFeature.checked;

                  } else {
                      this.config.selectByFeature = false;
                  }

                  if (this.selectByFeatureQuery.checked === true) {
                      this.config.selectByFeatureQuery = this.selectByFeatureQuery.checked;
                  } else {
                      this.config.selectByFeatureQuery = false;
                  }

                  if (this.selectByQuery.checked === true) {
                      this.config.selectByQuery = this.selectByQuery.checked;
                  } else {
                      this.config.selectByQuery = false;
                  }
              }else if (page === "2") {
                  this.config.updateLayers = [];
                  this.config.selectByLayer = {};
                  var selectVal;
                  if (this.layersTable !== null) {

                      array.forEach(this.layersTable.getRows(), function (row) {

                          var rowData = this.layersTable.getRowData(row);
                          var symbol = null;
                          if (this.selectionSymbols[rowData.id] === undefined) {
                              if (rowData.geometryType === "esriGeometryPolygon") {
                                  this.symbolSelector.showByType('fill');
                              } else if (rowData.geometryType === "esriGeometryPoint") {
                                  this.symbolSelector.showByType('marker');
                              } else if (rowData.geometryType === "esriGeometryPolyline") {
                                  this.symbolSelector.showByType('line');

                              }
                              this.selectionSymbols[rowData.id] =
                                  this.symbolSelector.getSymbol().toJson();
                          }
                          symbol = this.selectionSymbols[rowData.id];

                          if (rowData.update === true) {
                             
                              if (this.selectByFeatureQuery.checked === true ||
                                  this.selectByQuery.checked === true) {
                                  selectVal = query('input[name="queryFldSelect"]', row).shift().value;
                                  if (selectVal !== "NOTSET1") {
                                      rowData.queryField = selectVal;
                                      this.layersTable.editRow(row,
                                          { 'queryField': rowData.queryField });
                                  } else {
                                      rowData.queryField = null;
                                  }
                              }
                              this.config.updateLayers.push({
                                  "id": rowData.id,
                                  "name": rowData.label,
                                  "queryField": rowData.queryField,
                                  "selectionSymbol": symbol
                              });
                          }
                          if (this.selectByFeature.checked === true ||
                              this.selectByFeatureQuery.checked === true) {
                              if (this.selectByFeatureQuery.checked === true) {
                                  selectVal = query('input[name="queryFldSelect"]', row).shift().value.toString();
                                  if (selectVal !== "NOTSET1") {
                                      rowData.queryField = selectVal;
                                      this.layersTable.editRow(row,
                                          { 'queryField': rowData.queryField });
                                  } else {
                                      rowData.queryField = null;
                                  }
                              }
                              if (rowData.selectByLayer === true) {
                                  this.config.selectByLayer = {
                                      "id": rowData.id,
                                      "name": rowData.label,
                                      "queryField": rowData.queryField,
                                      "selectionSymbol": symbol
                                  };
                              }
                          }

                      }, this);
                  }
              }else if (page === "3") {
                  this.config.commonFields = [];
                  array.forEach(this.commonFieldsTable.getRows(), function (row) {
                      var rowData = this.commonFieldsTable.getRowData(row);
                      if (rowData.isEditable === true) {
                          this.config.commonFields.push({
                              "alias": rowData.label,
                              "name": rowData.fieldName
                          });
                      }
                  }, this);
              }
          },
          showPage1: function () {
              this.selectByShape.set('checked', this.config.selectByShape);
              this.selectByFeature.set('checked', this.config.selectByFeature);
              this.selectByFeatureQuery.set('checked', this.config.selectByFeatureQuery);
              this.selectByQuery.set('checked', this.config.selectByQuery);

              domStyle.set(this.firstPageDiv, 'display', '');
              domStyle.set(this.secondPageDiv, 'display', 'none');

              domStyle.set(this.settingsFirstPageError, 'display', 'none');
              this.hideOkError();
              if (this.controlsAddedToWidgetFrame) {

                  html.addClass(this.btnBack, "hide");
                  html.removeClass(this.btnNext, "hide");
                  this.currentPage = 1;
              }
          },
          showPage2: function () {
              var selectedTool = this.getSelectedTool();
              var selectByLayerVisible, queryFieldVisible;
              var showOnlyEditable;
              if (selectedTool === this.toolOption.Shape) {
                  selectByLayerVisible = false;
                  queryFieldVisible = false;
                  showOnlyEditable = true;
              } else if (selectedTool === this.toolOption.FeatureSpatial) {
                  selectByLayerVisible = true;
                  queryFieldVisible = false;
                  showOnlyEditable = false;
              } else if (selectedTool === this.toolOption.FeatureQuery) {
                  selectByLayerVisible = true;
                  queryFieldVisible = true;
                  showOnlyEditable = false;
              } else if (selectedTool === this.toolOption.Query) {
                  selectByLayerVisible = false;
                  queryFieldVisible = true;
                  showOnlyEditable = false;
              }
              this.createLayerTable(selectByLayerVisible, queryFieldVisible);
              this.layersTable.clear();
              this.loadLayerTable(showOnlyEditable, selectByLayerVisible, queryFieldVisible);

              domStyle.set(this.firstPageDiv, 'display', 'none');
              domStyle.set(this.secondPageDiv, 'display', '');
              domStyle.set(this.thirdPageDiv, 'display', 'none');

              domStyle.set(this.settingsSecondPageError, 'display', 'none');
              if (this.controlsAddedToWidgetFrame) {

                  html.removeClass(this.btnBack, "hide");
                  html.removeClass(this.btnNext, "hide");
                  this.currentPage = 2;
              }
              this.hideOkError();

          },
          showPage3: function () {
              this.loadFieldsTable();
              domStyle.set(this.firstPageDiv, 'display', 'none');
              domStyle.set(this.secondPageDiv, 'display', 'none');
              domStyle.set(this.thirdPageDiv, 'display', '');
              if (this.controlsAddedToWidgetFrame) {

                  html.addClass(this.btnNext, "hide");
                  html.removeClass(this.btnBack, "hide");
                  this.currentPage = 3;
              }
              this.hideOkError();
          },
          hideOkError: function () {
              if (this.controlsAddedToWidgetFrame) {

                  html.addClass(this.btnErrorMsg, 'hide');
              } else {
                  domStyle.set(this.settingsFirstPageSaveError, 'display', 'none');
                  domStyle.set(this.settingsSecondPageSaveError, 'display', 'none');
                  domStyle.set(this.settingsThirdPageSaveError, 'display', 'none');
              }
          },
          showOKError: function () {
              if (this.controlsAddedToWidgetFrame) {
                  this.btnErrorMsg.innerHTML = this.nls.errorOnOk;
                  html.removeClass(this.btnErrorMsg, 'hide');
              }else {
                  var display = domStyle.get(this.firstPageDiv, 'display');
                  if (display !== 'none') {
                      domStyle.set(this.settingsFirstPageSaveError, 'display', '');
                      return;
                  }
                  display = domStyle.get(this.secondPageDiv, 'display');
                  if (display !== 'none') {
                      domStyle.set(this.settingsSecondPageSaveError, 'display', '');
                      return;
                  }
                  display = domStyle.get(this.thirdPageDiv, 'display');
                  if (display !== 'none') {
                      domStyle.set(this.settingsThirdPageSaveError, 'display', '');
                      return;
                  }
              }
          },
          setConfig: function (config) {
              this.config = config;
              this.showPage1();
              //this.addQueryFields();

          },
          getConfig: function () {
              this.savePageToConfig("1");

              if (this.selectByShape.checked === false &&
                  this.selectByFeature.checked === false &&
                  this.selectByFeatureQuery.checked === false &&
                  this.selectByQuery.checked === false) {
                  this.showOKError();
                  return false;
              }

              this.savePageToConfig("2");

              if (this.config.updateLayers) {
                  if (this.config.updateLayers.length === 0) {
                      this.showOKError();
                      return false;
                  }
              } else {
                  this.showOKError();
                  return false;
              }
              if (this.commonFieldsTable === null || this.commonFieldsTable === undefined) {
                  this.showOKError();
                  return false;
              }
              if (this.selectByFeature.checked === true ||
                  this.selectByFeatureQuery.checked === true) {
                  if (this.config.selectByLayer) {

                      if (this.config.selectByLayer.id === null) {
                          this.showOKError();
                          return false;
                      } else if (this.config.selectByLayer.id === undefined) {
                          this.showOKError();
                          return false;
                      } else if (this.config.selectByLayer.id === "") {
                          this.showOKError();
                          return false;
                      }
                  } else {
                      this.showOKError();
                      return false;
                  }
              }
              if (this.selectByFeatureQuery.checked === true) {
                  var err = array.some(this.config.updateLayers, function (layer) {
                      if (layer.queryField === null) {
                          this.showOKError();
                          return true;
                      }else if (layer.queryField === undefined) {
                          this.showOKError();
                          return true;
                      }else if (layer.queryField === "") {
                          this.showOKError();
                          return true;
                      }
                  }, this);
                  if (err) {
                      return false;
                  }
                  if (this.config.selectByLayer.queryField === null) {
                      this.showOKError();
                      return false;
                  } else if (this.config.selectByLayer.queryField === undefined) {
                      this.showOKError();
                      return false;
                  } else if (this.config.selectByLayer.queryField === "") {
                      this.showOKError();
                      return false;
                  }
              }

              this.savePageToConfig("3");
              if (this.config) {
                  if (this.config.commonFields.length === 0) {
                      this.showOKError();
                      return false;
                  }
              } else {
                  this.showOKError();
                  return false;
              }
              return this.config;
          },
          addQueryFields: function () {
              this.layerSelects = [];

              array.forEach(this.layersTable.getRows(), function (row) {
                  var queryFldCell = query('.queryFieldDropdown.empty-text-td', row).shift();

                  var rowData = this.layersTable.getRowData(row);
                  var layer = this.map.getLayer(rowData.id);
                  var fields = this.getVisibleFields(layer.infoTemplate.info.fieldInfos);

                  var s = new Select({
                      name: 'queryFldSelect',
                      options: fields
                  });

                  s.placeAt(queryFldCell);

                  this.layerSelects.push(s);
                  if (rowData.queryField) {
                      if (rowData.queryField !== "") {
                          if (array.some(fields, function (field) {
                                if (field.value === rowData.queryField) {
                                    return true;
                          } else {
                                    return false;
                          }
                          })) {
                              s.set('value', rowData.queryField);
                          }
                      }
                  }

              }, this);
          },
          getEditableFields: function (fields) {
              return dojo.filter(fields, function (field) {
                  return field.isEditable === true;
              });

          },
          getVisibleFields: function (fields) {
              //var result = [{ label: 'Do Not Query', value: 'Do Not Query' }];
              var result = [{ label: '', value: 'NOTSET1' }];
              array.forEach(fields, function (field) {
                  if (field.visible === true) {
                      var opt = {
                          label: field.label,
                          value: field.fieldName
                      };
                      result.push(opt);
                  }
              });
              return result;

          },
          arrayObjectIndexOf: function (myArray, searchTerm, property) {
              for (var i = 0, len = myArray.length; i < len; i++) {
                  if (myArray[i][property] === searchTerm) {
                      return i;
                  }
              }
              return -1;
          },
          intersect_array: function (array1, array2) {
              // Return array of array1 items not found in array2
              var array1Uniques = array.filter(array1, function (item) {
                  if (this.arrayObjectIndexOf(array2, item.fieldName, "fieldName") >= 0) {
                      return true;
                  } else {
                      return false;
                  }

              }, this);
              return array1Uniques;
          },
          loadFieldsTable: function () {
              this.commonFieldsTable.clear();
              var commonFields = null;
              var firstLay = true;
              array.forEach(this.layersTable.getRows(), function (row) {
                  var rowData = this.layersTable.getRowData(row);
                  if (rowData.update === true) {

                      var layer = this.map.getLayer(rowData.id);
                      var fields = this.getEditableFields(layer.infoTemplate.info.fieldInfos);
                      if (firstLay === true) {
                          commonFields = fields;
                          firstLay = false;
                      }else {
                          commonFields = this.intersect_array(commonFields, fields);
                      }
                  }
              }, this);
              if (commonFields === null) {
                  domStyle.set(this.tableCommonFieldsError, 'display', '');
                  domStyle.set(this.tableCommonFieldDesc, 'display', 'none');
                  domStyle.set(this.tableCommonFieldHeader, 'display', 'none');
                  domStyle.set(this.tableCommonFields, 'display', 'none');
                  this.tableCommonFieldsError.innerHTML = this.nls.page3.noCommonFields;
              } else if (commonFields.length === 0) {
                  domStyle.set(this.tableCommonFieldsError, 'display', '');
                  domStyle.set(this.tableCommonFieldDesc, 'display', 'none');
                  domStyle.set(this.tableCommonFieldHeader, 'display', 'none');
                  domStyle.set(this.tableCommonFields, 'display', 'none');
                  this.tableCommonFieldsError.innerHTML = this.nls.page3.noCommonFields;
              } else {
                  domStyle.set(this.tableCommonFieldsError, 'display', 'none');
                  domStyle.set(this.tableCommonFieldDesc, 'display', '');
                  domStyle.set(this.tableCommonFieldHeader, 'display', '');
                  domStyle.set(this.tableCommonFields, 'display', '');

                  var selectedFields = array.map(this.config.commonFields, function (commonField) {
                      return commonField.name;
                  });
                  var isEditable = false;
                  array.forEach(commonFields, function (field) {
                      if (selectedFields.indexOf(field.fieldName) > -1) {
                          isEditable = true;
                      } else {
                          isEditable = false;
                      }
                      this.commonFieldsTable.addRow({
                          fieldName: field.fieldName,
                          label: field.label,
                          isEditable: isEditable
                      });

                  }, this);

              }
          },
          createFieldsTable: function () {
              var commonFields = [{
                  name: 'isEditable',
                  title: this.nls.page3.fieldTable.colEdit,
                  type: 'checkbox',
                  'class': 'editable'
              }, {
                  name: 'fieldName',
                  title: this.nls.page3.fieldTable.colName,
                  type: 'text'
              }, {
                  name: 'label',
                  title: this.nls.page3.fieldTable.colAlias,
                  type: 'text',
                  editable: true
              }, {
                  name: 'actions',
                  title: this.nls.page3.fieldTable.colAction,
                  type: 'actions',
                  actions: ['up', 'down'],
                  'class': 'editable'
              }];
              var commonFieldArgs = {
                  fields: commonFields,
                  selectable: false
              };
              this.commonFieldsTable = new SimpleTable(commonFieldArgs);
              this.commonFieldsTable.placeAt(this.tableCommonFields);
              this.commonFieldsTable.startup();
          },

          loadLayerTable: function (showOnlyEditable, selectByLayerVisible, queryFieldVisible) {

              var label = '';
              var tableValid = false;
              var update = false;
           
              var queryField;
              var selectByLayer;
              array.forEach(this.map.itemInfo.itemData.operationalLayers, function (layer) {
                  if (layer.layerObject !== null && layer.layerObject !== undefined) {
                      if (layer.layerObject.type === 'Feature Layer' && layer.url) {
                          if ((showOnlyEditable && layer.layerObject.isEditable() === false)) {
                          } else {

                              label = layer.title;
                              update = false;
                              selectByLayer = false;
                              queryField = null;
                              var filteredArr = dojo.filter(this.config.updateLayers, function (layerInfo) {
                                  return layerInfo.name === label;
                              });
                              if (filteredArr.length > 0) {
                                  if (filteredArr[0].selectionSymbol) {
                                      this.selectionSymbols[layer.layerObject.id] =
                                          filteredArr[0].selectionSymbol;
                                  }
                                  update = true;
                                  queryField = filteredArr[0].queryField;
                              }

                              if (this.config.selectByLayer) {
                                  if (this.config.selectByLayer.name === label) {
                                      selectByLayer = true;

                                  }
                              }
                              var row = this.layersTable.addRow({
                                  label: label,
                                  update: update,
                                  id: layer.layerObject.id,
                                  selectByLayer: selectByLayer,
                                  geometryType: layer.layerObject.geometryType,
                                  queryField: queryField

                              });
                              tableValid = true;
                              if (layer.layerObject.isEditable() === false) {

                                  query('input[type="checkbox"]', row.tr).attr('disabled', 'disabled');
                              }
                          }
                      }
                  }
              }, this);

              if (!tableValid) {
                  domStyle.set(this.tableLayerInfosError, 'display', '');
              } else {
                  domStyle.set(this.tableLayerInfosError, 'display', 'none');
                  if (queryFieldVisible === true) {
                      this.addQueryFields();
                  }
              }
          },
          createLayerTable: function (selectByLayerVisible, queryFieldVisible) {
              var editFeaturesTableFields = [{
                  name: 'update',
                  title: this.nls.page2.layerTable.colUpdate,
                  type: 'checkbox',
                  'class': 'editable'
              }, {
                  name: 'label',
                  title: this.nls.page2.layerTable.colLabel,
                  type: 'text'
              }, {
                  name: 'selectByLayer',
                  title: this.nls.page2.layerTable.colSelectByLayer,
                  type: 'radio',
                  hidden: !selectByLayerVisible
              },
              {
                  name: 'queryFieldDropdown',
                  title: this.nls.page2.layerTable.colSelectByField,
                  type: 'empty',
                  hidden: !queryFieldVisible
              }, {
                  name: 'actions',
                  title: this.nls.page2.layerTable.colhighlightSymbol,
                  type: 'actions',
                  'class': 'symbolselector',
                  actions: ['edit']
              }, {
                  name: 'id',
                  type: 'text',
                  hidden: true
              },
               {
                   name: 'queryField',
                   type: 'text',
                   hidden: true
               }, {
                   name: 'geometryType',
                   type: 'text',
                   hidden: true
               }];
              var args = {
                  fields: editFeaturesTableFields,
                  selectable: false
              };
              domConstruct.empty(this.tableLayerInfos);
              this.layersTable = new SimpleTable(args);
              this.layersTable.placeAt(this.tableLayerInfos);
              this.layersTable.startup();
              this.own(on(this.layersTable, 'actions-edit',
                  lang.hitch(this, this.showSymbolSelector)));

          },
          showSymbolSelector: function (tr) {
              var tds = query('.action-item-parent', tr);
              if (tds && tds.length) {
                  var sym = null;
                  var data = this.layersTable.getRowData(tr);

                  if (this.selectionSymbols[data.id]) {
                      sym = symbolJsonUtils.fromJson(this.selectionSymbols[data.id]);

                  }
                  if (sym === null) {

                      if (data.geometryType === "esriGeometryPolygon") {

                          this.symbolSelector.showByType('fill');
                      }else if (data.geometryType === "esriGeometryPoint") {
                          this.symbolSelector.showByType('marker');
                      }else if (data.geometryType === "esriGeometryPolyline") {
                          this.symbolSelector.showByType('line');
                      }
                  }else {
                      this.symbolSelector.showBySymbol(sym);
                  }

                  this.currentLayer = data.id;
                  domStyle.set(this.secondPageDiv, 'display', 'none');
                  domStyle.set(this.symbolPage, 'display', '');
                  html.removeClass(this.btnSave, 'hide');
                  html.removeClass(this.btnCancel, 'hide');

                  html.addClass(this.btnNext, 'hide');
                  html.addClass(this.btnBack, 'hide');
              }
          },
          saveSymbol: function () {

              this.selectionSymbols[this.currentLayer] = this.symbolSelector.getSymbol().toJson();
              domStyle.set(this.secondPageDiv, 'display', '');
              domStyle.set(this.symbolPage, 'display', 'none');

              this.currentLayer = null;
              html.addClass(this.btnSave, 'hide');
              html.addClass(this.btnCancel, 'hide');

              html.removeClass(this.btnNext, 'hide');
              html.removeClass(this.btnBack, 'hide');

          },
          cancelSymbol: function () {
              domStyle.set(this.secondPageDiv, 'display', '');
              domStyle.set(this.symbolPage, 'display', 'none');
              this.currentLayer = null;
              html.addClass(this.btnSave, 'hide');
              html.addClass(this.btnCancel, 'hide');

              html.removeClass(this.btnNext, 'hide');
              html.removeClass(this.btnBack, 'hide');

          }

      });
  });