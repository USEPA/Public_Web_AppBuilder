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
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/on",
  "dojo/dom-construct",

  "dijit/_TemplatedMixin",
  "dijit/_WidgetBase",

  "esri/dijit/editing/Editor",
  "esri/layers/FeatureLayer",
  "esri/dijit/editing/TemplatePicker",

  "xstyle/css!./css/FilterEditor.css"

],
  function (declare, lang, array, on, domConstruct,
            _TemplatedMixin, _WidgetBase,
            Editor, FeatureLayer, TemplatePicker) {
    return declare([_WidgetBase, _TemplatedMixin], {
      name: "FilterEditor",
      baseClass: "jimu-widget-FilterEditor",
      declaredClass: 'jimu.dijit.FilterEditor',
      templateString: "<div style='height:100%;width:100%'>" +
        "<div data-dojo-attach-point='filterEditorDiv'></div></div>",
      editor: null,
      flList: [],
      settings: null,
      searchTemplatePicker: null,
      map: null,
      selectDropDown: null,
      filterTextBox: null,
      featureLayerNames: [],

      /**
       * Check if all needed parameters are available
       **/
      constructor: function (args) {

        declare.safeMixin(this, args);
        if (this.settings) {
          this.map = this.settings.map;

          if (this.settings.layerInfos === null || !(this.settings.layerInfos instanceof Array)) {
            throw new Error("'layerInfos' was not set. Please set 'layerInfos' " +
              "parameter as a list of FeatureLayers");
          }

          if (this.map === null) {
            throw new Error("Map parameter cannot be null");
          }
        }
      },

      /**
       * Retrieve layers and render the widget
       */
      postCreate: function () {
        this.inherited(arguments);

        this.featureLayerNames = [];
        this.flList = [];
        
        this._getLayers();
        this._getFeatureLayers();

        var count = this.flList.length;
        array.forEach(this.flList, function (item) {
          var layer = new FeatureLayer(item.url);
          layer.on("Load", lang.hitch(this, function (evt) {
            --count;
            this.featureLayerNames.push({
              name: evt.layer.name,
              url: evt.layer.url
            });
            if (!count) {
              this._renderUI();
            }
          }));
        }, this);
      },

      /**
       * Resets and null out class variables
       */
      destroy: function () {
        this.inherited(arguments);
        if (this.featureLayerNames) {
          this.featureLayerNames = [];          
        }          
        if (this.flList) {
          this.flList = [];
        }
        if (this.searchTemplatePicker) {
          this.searchTemplatePicker = null;
        }
      },      

      /**
       * Updates the template picker based on selection in dropdown
       **/
      _updateTemplate: function () {
        // Clear any selections from previous selection
        this.searchTemplatePicker.clearSelection();

        var val = this.selectDropDown.options[this.selectDropDown.selectedIndex].text;

        if (val !== "") {
          if (val === "All") {
            this.searchTemplatePicker.attr("featureLayers", this.flList);

            if (this.filterTextBox.value === "") {
              this.searchTemplatePicker.attr("grouping", true);
            }
            else {
              this.searchTemplatePicker.attr("grouping", false);
            }

            this.searchTemplatePicker.update();

            return;
          }
          var flVal = this.selectDropDown.value;
          var layer = new FeatureLayer(flVal);
          this.searchTemplatePicker.attr("featureLayers", [layer]);
          this.searchTemplatePicker.attr("grouping", false);
          this.searchTemplatePicker.update();
        }
      },

      /**
       * Renders all UI elements
       **/
      _renderUI: function () {

        // label for select
        var flLabel = domConstruct.create("label", {
          innerHTML: "Feature Layers"
        })
        domConstruct.place(flLabel, this.filterEditorDiv);

        this.selectDropDown = domConstruct.create("select", {
          'class': 'flDropDown'
        });
        domConstruct.place(this.selectDropDown, this.filterEditorDiv);
        this.selectDropDown.onchange = lang.hitch(this, function () {
          this._updateTemplate();
        });

        var optionAll = domConstruct.create("option", {
          value: "all",
          innerHTML: "All"
        });
        domConstruct.place(optionAll, this.selectDropDown);

        for (var i = 0; i < this.featureLayerNames.length; i++) {
          var option = domConstruct.create("option", {
            value: this.featureLayerNames[i].url,
            innerHTML: this.featureLayerNames[i].name
          });
          domConstruct.place(option, this.selectDropDown);
        }

        this.filterTextBox = domConstruct.create("input", {
          'class': "searchtextbox",
          type: "text",
          placeholder: "Search Templates"
        }, this.filterEditorDiv);
        this.filterTextBox.onkeyup = lang.hitch(this, function () {
          this._filterTemplatePicker();
        });

        this._initSearchEditor(this.filterEditorDiv, this.flList);
      },

      /**
       * Search all of the templates for specified text
       */
      _filterTemplatePicker: function (text) {

        // Clear any selections from previous tab
        this.searchTemplatePicker.clearSelection();

        var origFunc = this.searchTemplatePicker.constructor.prototype._getItemsFromLayer;

        var filterText = this.filterTextBox.value;

        this.searchTemplatePicker._getItemsFromLayer = lang.hitch(this, function () {

          var items;
          items = origFunc.apply(this.searchTemplatePicker, arguments);

          if (filterText) {
            items = array.filter(items, function (item) {
              var match = false;
              var regex = new RegExp(filterText, "ig");

              if (regex.test(item.label)) {
                console.log("item = ", item);
                match = true;
              }

              return match;
            });
          }

          if (items.length === 0) {
            this.searchTemplatePicker.grid.noDataMessage = "No available templates";
          }

          return items;
        });

        var val = this.selectDropDown.options[this.selectDropDown.selectedIndex].text;

        if (val === "All" && filterText === "") {
          this.searchTemplatePicker.attr("grouping", true);
        }
        else {
          this.searchTemplatePicker.attr("grouping", false);
        }
        this.searchTemplatePicker.update();
      },

      /**
       * Clean up
       */
      onClose: function () {

        if (this.editor) {
          this.editor.destroy();
        }
        this.enableWebMapPopup();
        this.editor = null;
        this.editDiv = domConstruct.create("div", {
          style: {
            width: "100%",
            height: "100%"
          }
        });
        domConstruct.place(this.editDiv, this.domNode);
      },

      /**
       * Resize the editor template when widget is maximized
       */
      onMaximize: function () {
        setTimeout(lang.hitch(this, this._resize), 100);
      },

      /**
       * Retrieve specific layer from map
       * @param url
       * @returns {*}
       * @private
       */
      _getLayerFromMap: function (url) {
        var ids = this.map.graphicsLayerIds;
        var len = ids.length;
        for (var i = 0; i < len; i++) {
          var layer = this.map.getLayer(ids[i]);
          if (layer.url === url) {
            return layer;
          }
        }
        return null;
      },

      /**
       * Retrieves all layers from map and store them in a list
       * @private
       */
      _getLayers: function () {
        var layerInfos;

        layerInfos = this.settings.layerInfos;

        for (var i = 0; i < layerInfos.length; i++) {
          var featureLayer = layerInfos[i].featureLayer;
          var layer = this._getLayerFromMap(featureLayer.url);
          if (!layer) {
            if (!layerInfos[i].featureLayer.options) {
              layerInfos[i].featureLayer.options = {};
            }
            if (!layerInfos[i].featureLayer.options.outFields) {
              if (layerInfos[i].fieldInfos) {
                layerInfos[i].featureLayer.options.outFields = [];
                for (var j = 0; j < layerInfos[i].fieldInfos.length; j++) {
                  layerInfos[i].featureLayer.options
                    .outFields.push(layerInfos[i].fieldInfos[j].fieldName);
                }
              }
              else {
                layerInfos[i].featureLayer.options.outFields = ["*"];
              }
            }
            layer = new FeatureLayer(featureLayer.url, featureLayer.options);
            this.map.addLayer(layer);
          }
          if (layer.visible) {
            layerInfos[i].featureLayer = layer;
          }
        }
      },

      /**
       * Retrieves all feature layers from map and store them in a list
       * @private
       */
      _getFeatureLayers: function () {
        var layerInfos = this.settings.layerInfos;

        for (var i = 0; i < layerInfos.length; i++) {
          var featureLayer = layerInfos[i].featureLayer;
          this.flList.push(featureLayer);
        }
      },

      /**
       * Create, init and start the editor based on
       * all feature services
       * @param parentNode
       * @param featureLayers
       * @private
       */
      _initSearchEditor: function (parentNode, featureLayers) {
        var editDiv = null;
        if (this.editor) {
          this.editor.destroy();
          this.editor = null;
          editDiv = domConstruct.create("div", {
            style: {
              width: "100%",
              height: "100%"
            }
          });
          domConstruct.place(editDiv, parentNode);

          this.searchTemplatePicker.destroy();
          this.searchTemplatePicker = [];
        }

        if (!editDiv) {
          editDiv = domConstruct.create("div", {
            style: {
              width: "100%",
              height: "100%"
            }
          });
          domConstruct.place(editDiv, parentNode);
        }


        var templateDiv = domConstruct.create("div", {
          style: {
            width: "100%",
            height: "100%"
          }
        });
        domConstruct.place(templateDiv, parentNode);

        this.searchTemplatePicker = this.createTemplatePicker(featureLayers,
          "FeatureLayer", editDiv);

        this.settings.templatePicker = this.searchTemplatePicker;

        var params = {
          settings: this.settings
        };

        this.editor = new Editor(params, templateDiv);
        this.editor.startup();
      },

      /**
       * Creates the template picker to be used with the Editor
       **/
      createTemplatePicker: function (items, type, div) {

        var templStyle = "height: 400px; overflow: auto;";
        var columnsToDisplay = 4;
        if (this.templatePickerOptions !== null && this.templatePickerOptions !== undefined) {
          if (this.templatePickerOptions.height !== null) {
            templStyle = "height: " + this.templatePickerOptions.height + "px; overflow: auto;";
          }

          if (this.templatePickerOptions.columnnsToDisplay !== null) {
            columnsToDisplay = this.templatePickerOptions.columnnsToDisplay;
          }
        }

        var templateOptions = {
          rows: "auto",
          style: templStyle,
          columns: columnsToDisplay,
          showTooltip: true,
          grouping: true
        };
        if (type === "FeatureLayer") {
          templateOptions.featureLayers = items;
        }
        else {
          templateOptions.items = items;
        }
        var templatePicker = new TemplatePicker(templateOptions, div);
        templatePicker.startup();

        return templatePicker;
      },

      /**
       * Resizes the editor template picker accordingly
       * @private
       */
      _resize: function () {
        if (this.editor) {
          if (this.editor.templatePicker) {
            this.editor.templatePicker.update();
          }
        }
      }
    });
  });