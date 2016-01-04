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
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/dom-style',
    'dojo/dom-construct',
    'dojo/on',
    'dojo/query',
    'dijit/form/Select',
    'dijit/form/ValidationTextBox',
    'dijit/_WidgetsInTemplateMixin',
    './FeaturelayerSource',
    './FieldPicker',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/Message',
    'jimu/dijit/Popup',
    'jimu/LayerInfos/LayerInfos',
    'esri/dijit/editing/TemplatePicker',
    'dojo/dom-class',
    'jimu/dijit/SimpleTable',
    'jimu/dijit/RadioBtn'
],
  function(
    declare, array, lang, html, domStyle, domConstruct, on, query,
    Select, ValidationTextBox, _WidgetsInTemplateMixin,
    FeaturelayerSource, FieldPicker, BaseWidgetSetting, Message, Popup,
    LayerInfos, TemplatePicker, domClass
  ) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-SAT-setting',

      //solutions: added to hold array of field operations for each summary layer
      //summaryFields: [],
      opLayers: [],
      curRow: null,

      postCreate: function() {
        this.inherited(arguments);
        // this._setLayers();
        // this._setTypes();
        this._getAllLayers();
        this.own(on(this.btnAddTab, 'click', lang.hitch(this, this._addTabRow)));
        // this.own(on(this.tabTable, 'row-delete', lang.hitch(this, function(tr) {
        //   if (tr.select) {
        //     tr.select.destroy();
        //     delete tr.select;
        //   }
        // })));
        this.own(on(this.tabTable, 'actions-edit', lang.hitch(this, function(tr) {
          this._onEditLayerClicked(tr);
        })));
      },

      startup: function() {
        this.inherited(arguments);
        //this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;

        if (this.config.distanceUnits) {
          this.selectUnits.set("value", this.config.distanceUnits);
        }

        if (this.config.maxDistance) {
          this.txt_maximumDistance.set("value", this.config.maxDistance);
        }

        if (this.config.enableRouting) {
          this.chk_routing.set('value', true);
        }

        this.tabTable.clear();
        for (var i = 0; i < this.config.tabs.length; i++) {
          var aTab = this.config.tabs[i];
          if (aTab.type === this.config.special_layer.value) {
            this.chk_weather.set('value', true);
            this.weatherTabAdditionalLayers = aTab.layers;
            this.currentlySelectedLayer.innerHTML = this.weatherTabAdditionalLayers;
          } else {
            this._populateTabTableRow(aTab);
            //solutions: added to see if advanced stats exist. if it does, add it to summary fields
            // if(typeof(aTab.advStat) !== 'undefined') {
            //   var temp = [];
            //   temp.push({name:aTab.layers, stats:aTab.advStat.stats, url:aTab.advStat.url, statTypes:aTab.advStat.text});
            //   this.summaryFields.push(temp);
            // }
          }
        }

        this.buffer_lbl.set("value", this.config.bufferLabel ?
          this.config.bufferLabel : this.nls.buffer_lbl);

        this.buffer_max.set("value", this.config.bufferRange.maximum);
        this.buffer_min.set("value", this.config.bufferRange.minimum);

        ////////////////////////////////////////////////////////////////
        //solutions: added to support save and display
        if (typeof (this.save_layer_options) !== 'undefined') {
          if (this.save_layer_options.length > 0) {
            this.selectSaveLayer.on("change", lang.hitch(this, function () {
              if (this.chk_save.checked) {
                var l = this.opLayers.getLayerInfoById(this.selectSaveLayer.value).layerObject;
                this._updateTemplatePicker(l);
              }
            }));

            this.chk_save.onChange = lang.hitch(this, function (val) {
              if (this.selectSaveLayer) {
                if (val === true) {
                  this.selectSaveLayer.set("disabled", '');
                  var l = this.opLayers.getLayerInfoById(this.selectSaveLayer.value).layerObject;
                  this._updateTemplatePicker(l);
                }
                else {
                  this.selectSaveLayer.set("disabled", 'disabled');
                  if (this.tpd.children.length > 0) {
                    if (this.templatePicker) {
                      this.templatePicker.destroy();
                      this.selectedTemplateIndex = -1;
                      this.selectedTemplate = null;
                    }
                  }
                }
              }
            });

            this.chk_save.set("checked", this.config.saveEnabled);
            this.selectSaveLayer.addOption(this.save_layer_options);
            this.selectSaveLayer.set("value", this.config.editLayer);
            if (this.config.saveEnabled && this.config.editTemplate) {
              this.selectedTemplate = this.config.editTemplate;
              if (typeof(this.config.selectedTemplateIndex) !== 'undefined') {
                this.selectedTemplateIndex = this.config.selectedTemplateIndex;
              }
            }
          }
        } else {
          this.chk_save.set("disabled", 'disabled');
        }

        this.chk_csv.set("checked", this.config.csvAllFields);
        this.chk_display.set("checked", this.config.summaryDisplayEnabled);
        ////////////////////////////////////////////////////////////////
      },

      getConfig: function() {

        this.config.distanceUnits = this.selectUnits.value;

        if (this.txt_maximumDistance.value) {
          this.config.maxDistance = this.txt_maximumDistance.value;
        }

        if (this.chk_routing.checked) {
          this.config.enableRouting = true;
        } else {
          this.config.enableRouting = false;
        }

        var tabs = [];

        var aTab = {};
        if (this.chk_weather.checked) {
          aTab.label = this.config.special_layer.label;
          aTab.type = this.config.special_layer.value;
          aTab.layers = this.weatherTabAdditionalLayers;
          aTab.url = this.config.special_layer.url;
          tabs.push(aTab);
        }

        //solutions: added to check fields then append to the tab struct object.
        //this.updateSummaryFields();

        var trs = this.tabTable.getRows();
        array.forEach(trs, lang.hitch(this, function(tr) {
          var selectLayers = tr.selectLayers;
          var selectTypes = tr.selectTypes;
          var labelText = tr.labelText;
          aTab = {};
          aTab.label = labelText.value;
          aTab.type = selectTypes.value;
          aTab.layers = selectLayers.value;
          if(tr.tabInfo && tr.tabInfo.advStat) {
            aTab.advStat = tr.tabInfo.advStat;
          }
          //solutions: extending the structure to add the advance stats details
          //jh: added the statTypes check so we can distinguish one row from the next if we have multiple summary layer instances for a single layer name
          //array.forEach(this.summaryFields, lang.hitch(this, function (fieldsItem) {
          //   if (fieldsItem[0].name === selectLayers.value && selectTypes.value === 'summary' && Object.keys(fieldsItem[0].stats).join(", ") === statTypes) {
          //     aTab.advStat = {};
          //     aTab.advStat.url = fieldsItem[0].url;
          //     aTab.advStat.stats = fieldsItem[0].stats;
          //   aTab.advStat.text = statTypes;
          //   }
          // }));
          tabs.push(aTab);
        }));

        this.config.tabs = tabs;
        this.config.bufferLabel = this.buffer_lbl.value;
        this.config.bufferRange.maximum = this.buffer_max.value;
        this.config.bufferRange.minimum = this.buffer_min.value;

        if (this.chk_save.checked) {
          if (!this.selectedTemplate) {
            new Message({
              message: this.nls.mustSelectTemplate
            });
          }
          else {
            this.config.editTemplate = this.selectedTemplate;
            this.config.editLayer = this.selectSaveLayer.value;
            this.config.selectedTemplateIndex = this.selectedTemplateIndex;
          }
        } else {
          this.config.editTemplate = null;
          this.config.selectedTemplateIndex = null;
        }

        this.config.saveEnabled = this.chk_save.checked;
        this.config.csvAllFields = this.chk_csv.checked;
        this.config.summaryDisplayEnabled = this.chk_display.checked;

        return this.config;
      },

      _getAllLayers: function() {
        if (this.map.itemId) {
          LayerInfos.getInstance(this.map, this.map.itemInfo)
            .then(lang.hitch(this, function(operLayerInfos) {
              this.opLayers = operLayerInfos;
              this._setLayers();
              this._setTypes();
              this.setConfig(this.config);
            }));
        }
      },

      _setLayers: function() {
        var options = [];
        var saveOptions = [];
        array.forEach(this.opLayers._layerInfos, lang.hitch(this, function(OpLyr) {
          if(OpLyr.newSubLayers.length > 0) {
            this._recurseOpLayers(OpLyr.newSubLayers, options, saveOptions);
          } else {
            options.push({
              label: OpLyr.title,
              value: OpLyr.title
            });

            //solutions: added to only show editable poygon layers
            if (OpLyr.layerObject) {
              var lo = OpLyr.layerObject;
              //TODO: Check if strings like Create and Edit need to be in NLS.
              if (lo.geometryType === 'esriGeometryPolygon' && (lo.capabilities.indexOf("Edit") > 0 || lo.capabilities.indexOf("Create") > 0)) {
                saveOptions.push({
                  label: OpLyr.title,
                  value: OpLyr.id,
                  selected: false
                });
              }
            }
          }
        }));

        if (options.length === 0) {
          domStyle.set(this.btnAddTab, "display", "none");
          new Message({
            message: this.nls.missingLayerInWebMap
          });
          return;
        }

        this.layer_options = lang.clone(options);
        this.save_layer_options = lang.clone(saveOptions);
      },

      _recurseOpLayers: function(pNode, pOptions, pSaveOptions) {
        var nodeGrp = pNode;
        array.forEach(nodeGrp, lang.hitch(this, function(Node) {
          if(Node.newSubLayers.length > 0) {
            this._recurseOpLayers(Node.newSubLayers, pOptions);
          } else {
            pOptions.push({
              label: Node.title,
              value: Node.title
            });

            //solutions: added to only show editable poygon layers
            if (Node.layerObject) {
              var lo = Node.layerObject;
              if (lo.geometryType === 'esriGeometryPolygon' && (lo.capabilities.indexOf("Edit") > 0 || lo.capabilities.indexOf("Create") > 0)) {
                pSaveOptions.push({
                  label: Node.title,
                  value: Node.id,
                  selected: false
                });
              }
            }
          }
        }));
      },

      _setTypes: function() {
        this.analysis_options = [{
          value: 'closest',
          label: this.nls.closest
        }, {
          value: 'proximity',
          label: this.nls.proximity
        }, {
          value: 'summary',
          label: this.nls.summary
        }];
      },

      _populateTabTableRow: function(tabInfo) {
        var result = this.tabTable.addRow({});
        if (result.success && result.tr) {
          var tr = result.tr;
          this._addTabLayers(tr);
          this._addTabTypes(tr);
          this._addTabLabel(tr);
          tr.selectLayers.set("value", tabInfo.layers);
          tr.selectTypes.set("value", tabInfo.type);
          tr.labelText.set("value", tabInfo.label);
          tr.tabInfo = tabInfo;
        }
      },

      _addTabRow: function() {
        var result = this.tabTable.addRow({});
        if (result.success && result.tr) {
          var tr = result.tr;
          this._addTabLayers(tr);
          this._addTabTypes(tr);
          this._addTabLabel(tr);
        }
      },

      _addTabLayers: function(tr) {
        var lyrOptions = lang.clone(this.layer_options);
        var td = query('.simple-table-cell', tr)[0];
        if (td) {
          html.setStyle(td, "verticalAlign", "middle");
          var tabLayers = new Select({
            style: {
              width: "100%",
              height: "30px"
            },
            options: lyrOptions
          });
          tabLayers.placeAt(td);
          tabLayers.startup();
          tr.selectLayers = tabLayers;
        }
      },

      _addTabTypes: function(tr) {
        var typeOptions = lang.clone(this.analysis_options);
        var td = query('.simple-table-cell', tr)[1];
        if (td) {
          html.setStyle(td, "verticalAlign", "middle");
          var tabTypes = new Select({
            style: {
              width: "100%",
              height: "30px"
            },
            options: typeOptions
          });
          tabTypes.placeAt(td);
          tabTypes.startup();
          tr.selectTypes = tabTypes;
        }
      },

      _addTabLabel: function(tr) {
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

      _onBtnSelectLayersClicked: function() {
        var args = {
          nls: this.nls,
          map: this.map,
          config: this.config,
          weatherTabAdditionalLayers: this.weatherTabAdditionalLayers,
          appConfig: this.appConfig
        };

        var sourceDijit = new FeaturelayerSource(args);

        var popup = new Popup({
          width: 830,
          height: 560,
          content: sourceDijit,
          titleLabel: this.nls.selectLayers
        });

        this.own(on(sourceDijit, 'ok', lang.hitch(this, function(items) {
          this.weatherTabAdditionalLayers = items;
          this.currentlySelectedLayer.innerHTML = this.weatherTabAdditionalLayers;
          sourceDijit.destroy();
          sourceDijit = null;
          popup.close();

        })));

        this.own(on(sourceDijit, 'cancel', lang.hitch(this, function() {
          sourceDijit.destroy();
          sourceDijit = null;
          popup.close();
        })));
      },

      _onEditLayerClicked: function(tr) {

        // var parameters = tr.selectLayers;
        // for (var i = 0; i < this.config.tabs.length; i++) {
        //   var aTab = this.config.tabs[i];
        //   if (aTab.type === tr.selectTypes.value && aTab.layers === tr.selectLayers.value) {
        //     parameters = aTab;
        //     break;
        //   }
        // }
        this.curRow = tr;

        var aTab = tr.tabInfo;
        if(!aTab) {
          aTab = {};
          aTab.label = tr.labelText.value;
          aTab.type = tr.selectTypes.value;
          aTab.layers = tr.selectLayers.value;
          aTab.advStat = {};
          tr.tabInfo = aTab;
        }
        if(aTab.type !== tr.selectTypes.value || aTab.layers !== tr.selectLayers.value){
          aTab.type = tr.selectTypes.value;
          aTab.layers = tr.selectLayers.value;
          aTab.advStat = {};
        }

        var args = {
          nls: this.nls,
          callerLayer: tr.selectLayers.value,
          callerTab: aTab,
          callerOpLayers: this.opLayers._layerInfos
        };

        var sourceDijit = new FieldPicker(args);

        var popup = new Popup({
          width: 830,
          height: 560,
          content: sourceDijit,
          titleLabel: this.nls.selectFields + ": " + tr.selectLayers.value
        });

        this.own(on(sourceDijit, 'ok', lang.hitch(this, function(items) {
          this.curRow.tabInfo.advStat = items;
          this.curRow = null;
          //this.summaryFields.push(items);
          sourceDijit.destroy();
          sourceDijit = null;
          popup.close();
        })));

        this.own(on(sourceDijit, 'cancel', lang.hitch(this, function() {
          this.curRow = null;
          sourceDijit.destroy();
          sourceDijit = null;
          popup.close();
        })));
      },

      //solutions: added to handle field summary array manipulation
      /*jshint loopfunc: true */
      // updateSummaryFields: function() {
      //   console.log("Before", this.summaryFields);
      //   if(this.summaryFields.length > 0) {
      //     var trs = this.tabTable.getRows();
      //     var flag = false;
      //     for(var i = this.summaryFields.length-1; i >= 0; i--){
      //       flag = false;
      //       array.forEach(trs, lang.hitch(this, function(tr) {
      //         //if (this.summaryFields[i][0].name === tr.selectLayers.value &&
      //         // tr.selectTypes.value === 'summary') {
      //         if (this.summaryFields[i][0].name === tr.selectLayers.value) {
      //           flag = true;
      //         }
      //       }));
      //       if(!flag) {
      //         this.summaryFields.splice(i, 1);
      //       }
      //     }
      //   }
      //   console.log("After", this.summaryFields);
      // },

      //solutions: added to support save when a layer has more than one template
      _updateTemplatePicker: function (layer) {
        if (this.tpd.children.length > 0) {
          if (this.templatePicker) {
            this.templatePicker.destroy();
          }
        }
        if (layer.templates) {
          if (layer.templates.length > 1) {
            this.createTemplatePicker([layer]);
          } else if (layer.templates.length === 1) {
            this.selectedTemplate = layer.templates[0];
          }
        }
        if (layer.types) {
          if (layer.types.length > 1) {
            this.createTemplatePicker([layer]);
          }
          else if (layer.types.length === 1) {
            this.selectedTemplate = layer.types[0].templates[0];
          }
        }
      },

      //solutions: added to support save
      createTemplatePicker: function (layers) {
        var tpdDIV = domConstruct.create("div", {
          id: "divTemplatePicker",
          style: "padding-top: 10px;"
        }, this.tpd);

        var widget = new TemplatePicker({
          featureLayers: layers,
          rows: 1,
          columns: "auto",
          showTooltip: false,
          style: "height: 100%; overflow: auto;",
          grouping: false
        }, tpdDIV);

        widget.startup();

        widget.on("selection-change", lang.hitch(this, function () {
          this.selectedTemplate = widget.getSelected().template;
          if (typeof(this.selectedTemplateIndex) !== 'undefined') {
            if (widget._selectedCell.cellIndex !== this.selectedTemplateIndex) {
              var row = this.tpd.getElementsByTagName('tr')[0];
              var row1 = this.tpd.getElementsByTagName('tr')[1];
              domClass.remove(row.cells[this.selectedTemplateIndex], "dojoxGridCellOver dojoxGridCellFocus selectedItem");
              domClass.remove(row1.cells[this.selectedTemplateIndex], "dojoxGridCellOver dojoxGridCellFocus selectedItem");
            }
          }
          this.selectedTemplateIndex = widget._selectedCell.cellIndex;
        }));

        this.templatePicker = widget;

        if (typeof(this.selectedTemplateIndex) !== 'undefined') {
          var row = this.tpd.getElementsByTagName('tr')[0];
          var row1 = this.tpd.getElementsByTagName('tr')[1];
          domClass.add(row.cells[this.selectedTemplateIndex], "dojoxGridCell  dojoxGridCellOver dojoxGridCellFocus selectedItem");
          domClass.add(row1.cells[this.selectedTemplateIndex], "dojoxGridCell  dojoxGridCellOver dojoxGridCellFocus selectedItem");
        }
      }
    });
  });
