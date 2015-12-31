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
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/_base/lang',
    'dojo/dom-style',
    'dojo/on',
    'dojo/query',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/Select',
    'dijit/form/ValidationTextBox',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/Message',
    'jimu/dijit/SimpleTable'
  ],
  function(
    declare, array, html, lang,
    domStyle, on, query,
    _WidgetsInTemplateMixin,
    Select, ValidationTextBox,
    BaseWidgetSetting, Message) {

    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-summary-setting',

      summaryLayer: null,
      summaryFields: null,
      filterFields: null,
      layerFields: null,
      summaryTypes: null,

      postCreate: function() {
        this.inherited(arguments);
        this.summaryTypes = [{
          value: 'SUM',
          label: this.nls.sum
        }, {
          value: 'AVG',
          label: this.nls.avg
        }, {
          value: 'MIN',
          label: this.nls.min
        }, {
          value: 'MAX',
          label: this.nls.max
        }];

        this.own(on(this.btnAddSummaryField, 'click', lang.hitch(this, this._addSummaryFieldRow)));
        this.own(on(this.summaryTable, 'row-delete', lang.hitch(this, function(tr) {
          if (tr.select) {
            tr.select.destroy();
            delete tr.select;
          }
        })));
        this.own(on(this.showFeatureCount, 'change', lang.hitch(this, function() {
          if (this.showFeatureCount.checked) {
            this.featureCountLabel.set('readOnly', false);
          } else {
            this.featureCountLabel.set('readOnly', true);
          }
        })));

        this.setConfig(this.config);
        this._setLayers();

      },

      _setLayers: function() {
        var opLayers = this.map.itemInfo.itemData.operationalLayers;
        var options = [];

        if (opLayers && opLayers.length === 0) {
          new Message({
            message: this.nls.missingLayerInWebMap
          });
          return;
        }

        array.forEach(opLayers, lang.hitch(this, function(opLayer) {
          //if (opLayer.layerObject) {
          if (opLayer.layerType === "ArcGISFeatureLayer") {
            if (opLayer.featureCollection) {
              for (var i = 0; i < opLayer.featureCollection.layers.length; i++) {
                var lyr = opLayer.featureCollection.layers[i].layerObject;
                var lbl = opLayer.title;
                if (i > 0) {
                  lbl += ": " + i;
                }
                options.push({
                  label: lbl, //opLayer.layerObject.name,
                  value: lyr.id
                });
              }
            } else if (opLayer.layerObject) {
              options.push({
                label: opLayer.title, //opLayer.layerObject.name,
                value: opLayer.id
              });
            }
          }
          //}
        }));

        if (options.length === 0) {
          domStyle.set(this.btnAddSummaryField, "display", "none");
          new Message({
            message: this.nls.missingLayerInWebMap
          });
          return;
        }

        this.selectLayer = new Select({
          name: "selectLayer",
          options: options
        }).placeAt(this.opLayers);

        var summaryLayerId;
        //on change won't fire if the default selected value is the same as what's in the config
        //if (this.config.summaryLayer.url !== null && this.config.summaryLayer.url.length > 0) {
        if (this.config.summaryLayer.id) {
          summaryLayerId = this.config.summaryLayer.id;
        } else {
          summaryLayerId = options[0].value;
        }

        this.selectLayer.set("value", summaryLayerId);
        this._createFeatureLayer(summaryLayerId);
        this.selectLayer.on('change', lang.hitch(this, function(evt) {
          this._createFeatureLayer(evt);
        }));
      },

      // initialize widget configuration panel with current config data
      setConfig: function(config) {
        this.config = config;
        this.showFeatureCount.set('checked', config.showFeatureCount);
        if (config.showFeatureCount) {
          var label = this.nls.count;
          if (config.featureCountLabel) {
            label = config.featureCountLabel;
          }
          this.featureCountLabel.set('value', label);
        } else {
          this.featureCountLabel.set('readOnly', true);
        }
        this.displayCluster.set('checked', config.displayCluster);
      },

      _loadSummaryConfig: function() {
        if (!this.config.summaryLayer) {
          return;
        }
        this.summaryFields = [];
        array.forEach(this.config.summaryLayer.fields, lang.hitch(this, function(fld) {
          this.summaryFields.push({
            type: fld.type,
            label: fld.label,
            field: fld.field
          });
        }));

      },

      _createFeatureLayer: function(id) {
        var opLayers = this.map.itemInfo.itemData.operationalLayers;
        array.some(opLayers, lang.hitch(this, function(opLayer) {
          if (opLayer.layerType === "ArcGISFeatureLayer") {
            if (opLayer.featureCollection) {
              for (var i = 0; i < opLayer.featureCollection.layers.length; i++) {
                var lyr = opLayer.featureCollection.layers[i].layerObject;
                if (lyr.id === id) {
                  this.summaryLayer = lyr;
                  return true;
                }
              }
            } else if (opLayer.layerObject && opLayer.id === id) {
              this.summaryLayer = opLayer.layerObject;
              return true;
            }
          }
        }));
        this._populateSummaryTable(this.summaryLayer);
      },

      _populateSummaryTable: function(featureLayer) {
        var fields = featureLayer.fields;
        this.filterFields = [];
        this.filterFields.push({
          label: "-",
          value: ""
        });
        this.layerFields = [];
        array.forEach(fields, lang.hitch(this, function(field) {
          if (field.name !== featureLayer.objectIdField) {
            this.filterFields.push({
              label: field.alias,
              value: field.name
            });
            if (field.type === "esriFieldTypeInteger" ||
              field.type === "esriFieldTypeDouble" ||
              field.type === "esriFieldTypeSmallInteger") {
              this.layerFields.push({
                label: field.alias,
                value: field.name
              });
            }
          }
        }));
        this._createFilter();
        this._loadSummaryConfig();
        this._setSummaryTable();
      },

      _setSummaryTable: function() {
        this.summaryTable.clear();
        if (this.config.summaryLayer && this.config.summaryLayer.url === this.selectLayer.value) {
          array.forEach(this.config.summaryLayer.fields, lang.hitch(this, function(field) {
            this._populateSummaryTableRow(field);
          }));
        }
      },

      _populateSummaryTableRow: function(fieldInfo) {
        var result = this.summaryTable.addRow({});
        if (result.success && result.tr) {
          var tr = result.tr;
          this._addSummaryTypes(tr);
          this._addSummaryFields(tr);
          this._addSummaryLabel(tr);
          tr.selectTypes.set("value", fieldInfo.type);
          tr.selectFields.set("value", fieldInfo.field);
          tr.labelText.set("value", fieldInfo.label);
        }
      },

      // not used
      _setSelectedIndex: function(select, value) {
        var options = select.options;
        array.forEach(options, function(option, i) {
          if (option.value === value) {
            select.set("selectedIndex", i);
          }
        });
      },

      _createFilter: function() {
        var filterOptions = lang.clone(this.filterFields);
        this.filterSelect.set('options', filterOptions);
        if (this.config.summaryLayer !== null) {
          this.filterSelect.set("value", this.config.summaryLayer.filterField);
        }
      },

      _addSummaryFieldRow: function() {
        var result = this.summaryTable.addRow({});
        if (result.success && result.tr) {
          var tr = result.tr;
          this._addSummaryTypes(tr);
          this._addSummaryFields(tr);
          this._addSummaryLabel(tr);
        }
      },

      _addSummaryTypes: function(tr) {
        var typeOptions = lang.clone(this.summaryTypes);
        var td = query('.simple-table-cell', tr)[0];
        if (td) {
          html.setStyle(td, "verticalAlign", "middle");
          var types = new Select({
            style: {
              width: "100%",
              height: "30px"
            },
            options: typeOptions
          });
          types.placeAt(td);
          types.startup();
          tr.selectTypes = types;
        }
      },

      _addSummaryFields: function(tr) {
        var fieldsOptions = lang.clone(this.layerFields);
        var td = query('.simple-table-cell', tr)[1];
        html.setStyle(td, "verticalAlign", "middle");
        var fields = new Select({
          style: {
            width: "100%",
            height: "30px"
          },
          options: fieldsOptions
        });
        fields.placeAt(td);
        fields.startup();
        tr.selectFields = fields;
      },

      _addSummaryLabel: function(tr) {
        var td = query('.simple-table-cell', tr)[2];
        html.setStyle(td, "verticalAlign", "middle");
        var labelTextBox = new ValidationTextBox({
          style: {
            width: "100%",
            height: "30px"
          }
        });
        labelTextBox.placeAt(td);
        labelTextBox.startup();
        tr.labelText = labelTextBox;
      },

      // return updated widget config to builder
      getConfig: function() {
        this.config.showFeatureCount = this.showFeatureCount.checked;
        this.config.featureCountLabel = this.featureCountLabel.value;
        this.config.displayCluster = this.displayCluster.checked;

        var summaryLayer = {};
        var trs = this.summaryTable.getRows();
        var flds = [];
        array.forEach(trs, lang.hitch(this, function(tr) {
          var selectTypes = tr.selectTypes;
          var selectFields = tr.selectFields;
          var labelText = tr.labelText;
          var field = {
            type: selectTypes.value,
            label: labelText.value,
            field: selectFields.value
          };
          flds.push(field);
        }));

        lang.mixin(summaryLayer, {
          fields: flds
        });

        if (this.selectLayer) {
          array.forEach(this.selectLayer.options, lang.hitch(this, function(option) {
            if (option.selected) {
              lang.mixin(summaryLayer, {
                id: option.value,
                name: option.label,
                filterField: this.filterSelect.valueNode.value,
                url: option.value
              });
            }
          }));
        }
        this.config.summaryLayer = summaryLayer;

        return this.config;
      }

    });
  });
