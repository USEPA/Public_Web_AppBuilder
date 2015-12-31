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
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/Select',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/dom-style',
    'dojo/on',
    'dojo/query',
    'jimu/BaseWidget',
    'jimu/dijit/Message',
    'esri/layers/FeatureLayer',
    'dojo/text!./FieldPicker.html',
    'dojo/Evented',
    'jimu/dijit/SimpleTable'
  ],
  function(declare,
    _WidgetsInTemplateMixin,
    Select,
    array,
    lang,
    html,
    domStyle,
    on,
    query,
    BaseWidget,
    Message,
    FeatureLayer,
    template,
    Evented) {
    return declare([BaseWidget, _WidgetsInTemplateMixin, Evented], {
      templateString: template,
      baseClass: 'jimu-widget-IMT-setting',
      advConfig: {},
      fieldsList: null,
      callerLayer: null,
      callerTab: null,
      callerOpLayers: null,
      layerList: null,

      constructor: function( /*Object*/ args) {
        this.map = args.map;
      },

      postCreate: function() {
        this.inherited(arguments);
        this.startup();
      },

      startup: function() {
        this.operationsList = [{
          value: 'sum',
          label: this.nls.sum
        }, {
          value: 'avg',
          label: this.nls.avg
        }, {
          value: 'min',
          label: this.nls.min
        }, {
          value: 'max',
          label: this.nls.max
        }];

        var lbl = "";
        if (this.callerTab.type === "summary") {
          domStyle.set(this.chk_summary, "display", "block");
          lbl = "Type";
        } else {
          domStyle.set(this.chk_summary, "display", "none");
        }
        var cols = query('th', this.domNode);
        if (cols.length > 1) {
          cols[1].innerHTML = lbl;
        }

        this.own(on(this.btnCancel, 'click', lang.hitch(this, function() {
          this.emit('cancel');
        })));

        this.own(on(this.btnOk, 'click', lang.hitch(this, function() {
          this.updateAdvConfig();
          this.emit('ok', this.advConfig);
        })));

        this.layerTables = [];
        this.summaryLayers = [];
        this.advConfig = {};
        this._getAllValidLayers();

        this.own(on(this.btnAddField, 'click', lang.hitch(this, this._addTabRow)));

      },

      _updateGeomOptions: function(geomType) {
        if (!geomType) {
          return;
        }
        this.chk_area.set("disabled", (geomType !== "esriGeometryPolygon"));
        this.chk_length.set("disabled", (geomType !== "esriGeometryPolyline"));
      },

      _getAllValidLayers: function() {
        array.forEach(this.callerOpLayers, lang.hitch(this, function(OpLyr) {
          if (OpLyr.newSubLayers.length > 0) {
            this._recurseOpLayers(OpLyr.newSubLayers);
          } else {
            if (OpLyr.title === this.callerLayer) {
              this.layerList = OpLyr;
            }
          }
        }));
        if (this.layerList.layerObject.empty) {
          var tempFL = new FeatureLayer(this.layerList.layerObject.url);
          on(tempFL, "load", lang.hitch(this, function() {
            this._completeMapLayers(tempFL);
          }));
        } else {
          this._completeMapLayers(this.layerList);
        }
      },

      _recurseOpLayers: function(pNode) {
        var nodeGrp = pNode;
        array.forEach(nodeGrp, lang.hitch(this, function(Node) {
          if (Node.newSubLayers.length > 0) {
            this._recurseOpLayers(Node.newSubLayers);
          } else {
            if (Node.title === this.callerLayer) {
              this.layerList = Node;
            }
          }
        }));
      },

      //After the class has returned layers, push only Featurelayers and Layers into the layer list.
      /*jshint loopfunc: true */
      _completeMapLayers: function(args) {
        if (args) {
          var layer = args;
          //var tempLayer = [];
          console.log(layer);
          var fields;
          var aConfig;
          var geomType;
          if (typeof(layer.layerObject) === 'undefined') {
            // ST: get geom type and object id field
            geomType = layer.geometryType;
            this.objectIdField = layer.objectIdField;
            aConfig = {
              "url": layer.url,
              //"name" : layer.name,
              "fields": []
            };
            fields = lang.clone(layer.fields);
          } else {
            // ST: get geom type and object id field
            geomType = layer.layerObject.geometryType;
            this.objectIdField = layer.layerObject.objectIdField;
            aConfig = {
              "url": layer.layerObject.url,
              //"name" : layer.title,
              "fields": []
            };
            fields = lang.clone(layer.layerObject.fields);
          }
          //this.summaryLayers.push(tempLayer);
          this.advConfig = aConfig;
          // ST: update geom options
          this._updateGeomOptions(geomType);

          //if (this.summaryLayers.length >= 1) {
          if (this.advConfig.url) {
            this._setFields(fields);
            if (this.callerTab.advConfig && this.callerTab.advConfig.fields &&
              this.callerTab.advConfig.fields.length > 0) {
              var flds = this.callerTab.advConfig.fields;
              array.forEach(flds, lang.hitch(this, function(f) {
                if (f.type === "count") {
                  this.chk_count.set('value', true);
                } else if (f.type === "area") {
                  this.chk_area.set('value', true);
                } else if (f.type === "length") {
                  this.chk_length.set('value', true);
                } else {
                  console.log(f.type, f.expression);
                  this._populateTabTableRow(f.type, f.expression);
                }
              }));
            }
          }
        }

      },

      _setFields: function(pFields) {
        var validFieldTypes = [
          'esriFieldTypeInteger',
          'esriFieldTypeSmallInteger',
          'esriFieldTypeDouble'
        ];
        if (this.callerTab.type !== "summary") {
          validFieldTypes.push('esriFieldTypeString');
          validFieldTypes.push('esriFieldTypeDate');
        }
        var options = [];
        array.forEach(pFields, lang.hitch(this, function(field) {
          if (validFieldTypes.indexOf(field.type) > -1) {
            options.push({
              'label': field.alias,
              'value': field.name
            });
          }
        }));
        if (options.length < 1) {
          domStyle.set(this.btnAddField, "display", "none");
        }
        this.fieldsList = lang.clone(options);
      },

      _populateTabTableRow: function(pType, pFld) {
        var result = this.fieldTable.addRow({});
        if (result.success && result.tr) {
          var tr = result.tr;
          this._addTabFields(tr);
          this._addTabTypes(tr);
          tr.selectFields.set("value", pFld);
          if (this.callerTab.type === "summary") {
            tr.selectTypes.set("value", pType);
          }
        }
      },

      _addTabRow: function() {
        if (this.callerTab.type !== "summary" && this.fieldTable.getRows().length >= 3) {
          new Message({
            message: this.nls.max_records
          });
          return;
        }
        var result = this.fieldTable.addRow({});
        if (result.success && result.tr) {
          var tr = result.tr;
          this._addTabFields(tr);
          this._addTabTypes(tr);
        }
      },

      _addTabFields: function(tr) {
        var lyrOptions = lang.clone(this.fieldsList);
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
          tr.selectFields = tabLayers;
        }
      },

      _addTabTypes: function(tr) {
        if (this.callerTab.type !== "summary") {
          return;
        }
        var typeOptions = lang.clone(this.operationsList);
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

      updateAdvConfig: function() {
        var trs = this.fieldTable.getRows();
        var flds = [];
        if (this.callerTab.type !== "summary") {
          array.forEach(trs, function(tr) {
            flds.push({
              value: 0,
              type: "out",
              expression: tr.selectFields.value,
              label: tr.selectFields.textDirNode.innerText
            });
          });
        } else {
          // count
          if (this.chk_count.checked) {
            flds.push({
              value: 0,
              type: "count",
              expression: this.objectIdField,
              label: this.nls.count
            });
          }
          //area
          if (this.chk_area.checked) {
            flds.push({
              value: 0,
              type: "area",
              expression: this.objectIdField,
              label: this.nls.area
            });
          }
          //length
          if (this.chk_length.checked) {
            flds.push({
              value: 0,
              type: "length",
              expression: this.objectIdField,
              label: this.nls.length
            });
          }
          // sum, avg, min, max
          array.forEach(trs, lang.hitch(this, function(tr) {
            flds.push({
              value: 0,
              type: tr.selectTypes.value,
              expression: tr.selectFields.value,
              label: tr.selectFields.textDirNode.innerText
            });
          }));
        }
        if (flds.length > 0) {
          this.advConfig.fields = flds;
        } else {
          this.advConfig = null;
        }
        console.log("ADVCONFIG", this.advConfig);
      },

      destroy: function() {
        this.advConfig = null;
      }

    });

  });
