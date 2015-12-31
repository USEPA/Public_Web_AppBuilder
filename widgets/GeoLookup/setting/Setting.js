///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/declare',
        'jimu/BaseWidgetSetting',
        'dijit/_WidgetsInTemplateMixin',
        'jimu/dijit/SimpleTable',
        'dojo/query',
        'dojo/_base/html',
        'dojo/dom-style',
        'dojo/_base/array',
        'dojo/on',
        'dojo/_base/lang',
        'dojo/dom-construct',
        'jimu/symbolUtils',
        'esri/symbols/jsonUtils',
        'jimu/dijit/SymbolChooser',
        './layerDetails'],
function(declare,
        BaseWidgetSetting,
        _WidgetsInTemplateMixin,
        SimpleTable,
        query,
        html,
        domStyle,
        array,
        on,
        lang,
        domConstruct,
        jimuSymUtils,
        symbolJsonUtils,
        SymbolChooser,
        layerDetails) {
  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    /*jshint unused:true*/
    //these two properties is defined in the BaseWidget
    baseClass : 'solutions-widget-geolookup-setting',
    layersTable : null,
    currentLayer : null,
    selectedFields : [],
    layerList : [],
    symbolEvent : null,
    startup : function() {
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

      this.own(on(this.symbolInPreview, 'click', lang.hitch(this, function() {
        this.popSymbolChooser('Within');
        this.symbolDial.show();
      })));

      this.own(on(this.symbolOutPreview, 'click', lang.hitch(this, function() {
        this.popSymbolChooser('Outside');
        this.symbolDial.show();
      })));

      //This code calls a class.  This class takes the map object and will
      //return an array of layers and sublayers once complete event is fired.
      //If there are no operational layers, find buttons and only let user cancel.
      var preloadString = '<img src="' + this.folderUrl + 'setting/css/images/processing.gif"> ';
      preloadString += this.nls.settingsLoadingLayers;
      this.tableLayerInfos.innerHTML = preloadString;
      this.layerList = [];
      if ((this.map.itemInfo.itemData.operationalLayers).length > 0) {
        var lyrDet = new layerDetails(this.map);
        this.own(on(lyrDet, 'complete', lang.hitch(this, this._completeLayerDetails)));
        lyrDet.getAllMapLayers();
      } else {
        this._noLayersDisplay();
      }
    },

    setConfig : function(config) {
      this.config = config;
      array.forEach(this.config.enrichLayers, function(row) {
        this.selectedFields[row.id] = row.fields;
      }, this);
      this.showInitSymbols();
    },
    getConfig : function() {
      this.config.SymbolWithin = this.config.SymbolWithin;
      this.config.SymbolOutside = this.config.SymbolOutside;
      var data = this.layersTable.getData();
      this.config.enrichLayers = [];
      var layersValid = false;
      var error = array.some(data, function(row) {
        if (row.enrich) {
          var enrichLayer = {};
          enrichLayer.id = row.id;
          enrichLayer.label = row.label;
          enrichLayer.url = row.url;
          enrichLayer.name = row.name;
          if (!this.selectedFields[enrichLayer.id] || this.selectedFields[enrichLayer.id].length < 1) {
            return true;
          }
          enrichLayer.fields = this.selectedFields[enrichLayer.id];
          this.config.enrichLayers.push(enrichLayer);
          layersValid = true;
        }
      }, this);
      if (error || layersValid === false) {
        if(data.length > 0) {
          this.showOKError();
        }
        return false;
      }

      return this.config;
    },

    //After the class has returned layers, push only Featurelayers and Layers into the layer list.
    _completeLayerDetails : function(args) {
      this.createLayerTable();
      this.createFieldsTable();
      if (args) {
        array.forEach(args.data.items, lang.hitch(this, function(layer) {
          if (layer.type === 'Feature Layer') {
            this.layerList.push(layer);
          } else if (layer.type === 'Service' || layer.type === 'MapService') {
            array.forEach(layer.children, lang.hitch(this, function(subLayer) {
              if (subLayer.type === 'Layer') {
                this.layerList.push(subLayer);
              }
            }));
          } else {
          }
        }));
        if (this.layerList.length >= 1) {
          this.loadLayerTable();
        } else {
          this._noLayersDisplay();
        }
      } else {
        this._noLayersDisplay();
      }
    },

    //Load the layer table with the layers in the Layerlist. Only list the ploygon layers.
    loadLayerTable : function() {
      var label = '';
      var tableValid = false;
      var enrich = false;
      array.forEach(this.layerList, function(layer) {
        if (layer.id !== null && layer.id !== undefined) {
          if ((layer.type === 'Feature Layer' || layer.type === 'Layer') &&
          layer.url && layer.geometryType === 'esriGeometryPolygon') {
            label = layer.label;
            enrich = false;

            var filteredArr = array.filter(this.config.enrichLayers, function(layerInfo) {
              return layerInfo.id === layer.id;
            });
            if (filteredArr.length > 0) {
              enrich = true;
            }
            this.layersTable.addRow({
              label : label,
              enrich : enrich,
              id : layer.id,
              url : layer.url
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

    //This creates the layer table structure
    createLayerTable : function() {
      var layerTableFields = [{
        name : 'enrich',
        title : this.nls.layerTable.colEnrich,
        type : 'checkbox',
        'class' : 'enrich'
      }, {
        name : 'label',
        title : this.nls.layerTable.colLabel,
        type : 'text'
      }, {
        name : 'actions',
        title : this.nls.layerTable.colFieldSelector,
        type : 'actions',
        'class' : 'fieldselector',
        actions : ['edit']
      }, {
        name : 'id',
        type : 'text',
        hidden : true
      }, {
        name : 'url',
        type : 'text',
        hidden : true
      }];
      var args = {
        fields : layerTableFields,
        selectable : false
      };
      domConstruct.empty(this.tableLayerInfos);
      this.layersTable = new SimpleTable(args);
      this.layersTable.placeAt(this.tableLayerInfos);
      this.layersTable.startup();
      this.own(on(this.layersTable, 'actions-edit', lang.hitch(this, function(tr) {
        this.showLayerFields(tr);
        this.fieldsPage.show();
        this.resizeFieldsTable();
      })));

    },
    //This creates the fields table structure.  This only gets called when the parent layer table button is clicked
    createFieldsTable : function() {
      var layerFields = [{
        name : 'isAppended',
        title : this.nls.fieldTable.colAppend,
        type : 'checkbox',
        'class' : 'appended'
      }, {
        name : 'fieldName',
        title : this.nls.fieldTable.colName,
        type : 'text'
      }, {
        name : 'label',
        title : this.nls.fieldTable.colAlias,
        type : 'text',
        editable : true
      }, {
        name : 'order',
        title : this.nls.fieldTable.colOrder,
        type : 'actions',
        actions:["up", "down"]
      }];
      var layerFieldArgs = {
        fields : layerFields,
        selectable : false
      };
      this.layerFieldsTable = new SimpleTable(layerFieldArgs);
      this.layerFieldsTable.placeAt(this.tableFieldInfos);
      this.layerFieldsTable.startup();
      this.own(on(this.layerFieldsTable, 'row-up', lang.hitch(this, function() {
        this.resizeFieldsTable();
      })));
      this.own(on(this.layerFieldsTable, 'row-down', lang.hitch(this, function() {
        this.resizeFieldsTable();
      })));

    },

    resizeFieldsTable : function() {
      //manually resize the dijit dialog.  by default, it gets client height
      this.layerFieldsTable.domNode.style.width = "608px";
      this.layerFieldsTable.domNode.style.height = "360px";
      this.fieldsPage.resize();
    },

    //Loads the field table
    showLayerFields : function(tr) {

      this.currentLayer = null;
      var tds = query('.action-item-parent', tr);
      if (tds && tds.length) {
        var rowData = this.layersTable.getRowData(tr);
        this.layerFieldsTable.clear();

        var layer;
        array.forEach(this.layerList, lang.hitch(this, function(lyr) {
          if (lyr.id === rowData.id) {
            layer = lyr;
          }
        }));
        if (layer) {
          if (layer.children) {
            var fields = this.selectedFields[rowData.id];
            var filtFields;
            var filtAlias;
            var isAppended;
            var aliasLabel;
            if (fields) {
              filtFields = array.map(fields, function(field) {
                return field.fieldName;
              });
              filtAlias = array.map(fields, function(field) {
                return field.label;
              });
            }
            fields = layer.children;
            array.forEach(fields, function(field) {
              aliasLabel = field.label;
              isAppended = false;
              if (filtFields) {
                if (filtFields.indexOf(field.name) >= 0) {
                  isAppended = true;
                  aliasLabel = filtAlias[filtFields.indexOf(field.name)];
                }
              }
              this.layerFieldsTable.addRow({
                fieldName : field.name,
                label : aliasLabel,
                isAppended : isAppended
              });
            }, this);

            this.currentLayer = rowData.id;
          }
        }
      }

    },
    //The next couple functions handle button actions
    saveFields : function() {
      var data = this.layerFieldsTable.getData();
      var fields = [];
      var field;
      array.forEach(data, function(row) {
        if (row.isAppended === true) {
          field = {};
          field.fieldName = row.fieldName;
          field.label = row.label;

          fields.push(field);
        }
      }, this);

      this.selectedFields[this.currentLayer] = fields;

      this.fieldsPage.hide();

    },
    cancelFields : function() {
      this.fieldsPage.hide();
    },
    cancelAdv : function() {
      this.advSettingsPage.hide();
    },
    saveAdv : function() {
      var val;
      var valSpl;
      val = this.advSettingsLatValues.get('value');
      valSpl = val.split('\n');
      this.config.latFields = [];
      array.forEach(valSpl, function(value) {
        if (value !== '') {
          this.config.latFields.push(value);
        }
      }, this);

      val = this.advSettingsLongValues.get('value');
      valSpl = val.split('\n');
      this.config.longFields = [];
      array.forEach(valSpl, function(value) {
        if (value !== '') {
          this.config.longFields.push(value);
        }
      }, this);
      this.config.intersectField = this.advSettingsIntersectField.get('value');
      this.config.valueIn = this.advSettingsIntersectInValue.get('value');
      this.config.valueOut = this.advSettingsIntersectOutValue.get('value');
      this.config.cacheNumber = this.advSettingsCacheNumber.get('value');
      this.config.maxRowCount = this.advSettingsMaxRowCount.get('value');

      this.advSettingsPage.hide();
    },
    //When  user clicks advance setting, show some custom Dom with settings to change
    showAdvSettings : function() {

      var val = '';

      array.forEach(this.config.latFields, function(value) {
        val = val + value + '\n';
      }, this);
      this.advSettingsLatValues.set('value', val);

      val = '';
      array.forEach(this.config.longFields, function(value) {
        val = val + value + '\n';
      }, this);
      this.advSettingsLongValues.set('value', val);

      this.advSettingsIntersectField.set('value', this.config.intersectField);
      this.advSettingsIntersectInValue.set('value', this.config.valueIn);
      this.advSettingsIntersectOutValue.set('value', this.config.valueOut);
      this.advSettingsCacheNumber.set('value', this.config.cacheNumber);
      this.advSettingsMaxRowCount.set('value', this.config.maxRowCount);

      this.advSettingsPage.show();
    },

    popSymbolChooser : function(pParam) {

      this.symbolEvent = pParam;
      var symSelect;
      var sym;
      if (pParam === 'Within') {
        symSelect = this.config.SymbolWithin;
      } else {
        symSelect = this.config.SymbolOutside;
      }

      sym = symbolJsonUtils.fromJson(symSelect);
      if (sym) {
        this.symbolPicker.showBySymbol(sym);
      }

    },

    saveSymbol : function() {
      if (this.symbolEvent === 'Within') {
        this.config.SymbolWithin = this.symbolPicker.getSymbol().toJson();
      } else {
        this.config.SymbolOutside = this.symbolPicker.getSymbol().toJson();
      }
      this.showInitSymbols();
      this.symbolDial.hide();
    },

    cancelSymbol : function() {
      this.symbolDial.hide();
    },

    showInitSymbols : function() {
      var sym;
      var node;
      var symbolNode;
      if (this.config.SymbolWithin) {
        sym = symbolJsonUtils.fromJson(this.config.SymbolWithin);
        if (sym) {
          node = this.symbolInPreview;

          html.empty(node);

          symbolNode = jimuSymUtils.createSymbolNode(sym);
          if (!symbolNode) {
            symbolNode = html.create('div');
          }
          html.place(symbolNode, this.symbolInPreview);

        }
      }

      if (this.config.SymbolOutside) {
        sym = symbolJsonUtils.fromJson(this.config.SymbolOutside);
        if (sym) {
          node = this.symbolOutPreview;

          html.empty(node);

          symbolNode = jimuSymUtils.createSymbolNode(sym);
          if (!symbolNode) {
            symbolNode = html.create('div');
          }
          html.place(symbolNode, this.symbolOutPreview);

        }
      }
    },

    showOKError : function() {
      this.btnErrorMsg.innerHTML = this.nls.errorOnOk;
      html.removeClass(this.btnErrorMsg, 'hideGLItem');

    },
    hideOkError : function() {

      html.addClass(this.btnErrorMsg, 'hideGLItem');

    },
    _noLayersDisplay : function() {
      this.hideOkError();
      domStyle.set(this.tableLayerInfosError, 'display', '');
    }
  });
});
