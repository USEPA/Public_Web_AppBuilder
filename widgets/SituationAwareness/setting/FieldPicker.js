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
  'dijit/form/ValidationTextBox',
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
  'jimu/dijit/SimpleTable'],
function (declare,
  _WidgetsInTemplateMixin,
  Select,
  ValidationTextBox,
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
  Evented,
  Table) {
  return declare([BaseWidget, _WidgetsInTemplateMixin, Evented], {
    templateString: template,
    baseClass: 'jimu-widget-SAT-setting',
    //summaryLayers : [],
    advStat: {},
    // operationsList : [{
    //   value : 'area',
    //   label : 'Area'
    // }, {
    //   value : 'avg',
    //   label : 'Average'
    // }, {
    //   value : 'count',
    //   label : 'Count'
    // }, {
    //   value : 'length',
    //   label : 'Length'
    // }, {
    //   value : 'max',
    //   label : 'Maximum'
    // }, {
    //   value : 'min',
    //   label : 'Minimum'
    // }, {
    //   value : 'sum',
    //   label : 'Summation'
    // }],
    fieldsList: null,
    callerLayer: null,
    callerTab: null,
    callerOpLayers: null,
    layerList: null,

    constructor: function (/*Object*/args) {
      this.map = args.map;
    },

    postCreate: function () {
      this.inherited(arguments);
      this.startup();
    },

    startup: function () {
      //this.inherited(arguments);
      //var title = dom.byId(this.divLayerTitle).innerHTML;
      //dom.byId(this.divLayerTitle).innerHTML = title + " " + this.callerLayer;

      var fields = null;
      if (this.callerTab.type === "summary") {
        fields = [{
          name: "layer",
          title: "Field",
          "class": "label",
          type: "empty",
          width: "250px"
        }, {
          name: "label",
          title: this.nls.layerLabel,
          "class": "label",
          type: "empty",
          width: "200px"
        }, {
          name: "type",
          title: "Type",
          "class": "sumlabel",
          type: "empty"
        }, {
          name: "actions",
          title: "Actions",
          "class": "actions",
          type: "actions",
          actions: ["up", "down", "delete"]
        }];
      } else {
        fields = [{
          name: "layer",
          title: "Field",
          "class": "label",
          type: "empty",
          width: "60%"
        }, {
          name: "actions",
          title: "Actions",
          "class": "actions",
          type: "actions",
          actions: ["up", "down", "delete"],
          width: "40%"
        }];
      }


      var args = {
        fields: fields
      };
      this.displayFieldsTable = new Table(args);
      this.displayFieldsTable.placeAt(this.fieldTable);
      html.setStyle(this.displayFieldsTable.domNode, {
        'height': '100%'
      });
      this.displayFieldsTable.startup();

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

      // TO DO: change column label
      /*jshint unused: true*/
      if (this.callerTab.type === "summary") {
        domStyle.set(this.chk_summary, "display", "block");
      } else {
        domStyle.set(this.chk_summary, "display", "none");
      }

      this.own(on(this.btnCancel, 'click', lang.hitch(this, function () {
        this.emit('cancel');
      })));

      this.own(on(this.btnOk, 'click', lang.hitch(this, function () {
        this.updateSummaryType();
        //this.emit('ok', this.summaryLayers);
        // TO DO: simplify advStat structure
        // clean up
        var ok = false;
        for (var key in this.advStat.stats) {
          if (this.advStat.stats.hasOwnProperty(key)) {
            ok = true;
          }
        }
        if (!ok) {
          this.advStat = null;
        }
        this.emit('ok', this.advStat);
      })));

      this.layerTables = [];
      this.summaryLayers = [];
      this.advStat = {};
      this._getAllValidLayers();

      this.own(on(this.btnAddField, 'click', lang.hitch(this, this._addTabRow)));

      // this.own(on(this.fieldTable, 'row-delete', lang.hitch(this, function() {
      //   var rows = this.fieldTable.getRows();
      //   if (rows.length <= 0) {
      //     html.addClass(this.btnOk, 'jimu-state-disabled');
      //   }
      // })));

    },

    _updateGeomOptions: function (geomType) {
      if (!geomType) {
        return;
      }
      this.chk_area.set("disabled", (geomType !== "esriGeometryPolygon"));
      this.chk_length.set("disabled", (geomType !== "esriGeometryPolyline"));
    },

    _getAllValidLayers: function () {
      array.forEach(this.callerOpLayers, lang.hitch(this, function (OpLyr) {
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
        on(tempFL, "load", lang.hitch(this, function () {
          this._completeMapLayers(tempFL);
        }));
      } else {
        this._completeMapLayers(this.layerList);
      }
    },

    _recurseOpLayers: function (pNode) {
      var nodeGrp = pNode;
      array.forEach(nodeGrp, lang.hitch(this, function (Node) {
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
    _completeMapLayers: function (args) {
      if (args) {
        var layer = args;
        //var tempLayer = [];
        console.log(layer);
        var fields;
        var aStat;
        var geomType;
        if (typeof (layer.layerObject) === 'undefined') {
          // ST: get geom type and object id field
          geomType = layer.geometryType;
          this.objectIdField = layer.objectIdField;
          aStat = {
            "url": layer.url,
            //"name" : layer.name,
            "stats": {}
          };
          fields = lang.clone(layer.fields);
        } else {
          // ST: get geom type and object id field
          geomType = layer.layerObject.geometryType;
          this.objectIdField = layer.layerObject.objectIdField;
          aStat = {
            "url": layer.layerObject.url,
            //"name" : layer.title,
            "stats": {}
          };
          fields = lang.clone(layer.layerObject.fields);
        }
        //this.summaryLayers.push(tempLayer);
        this.advStat = aStat;
        // ST: update geom options
        this._updateGeomOptions(geomType);

        //if (this.summaryLayers.length >= 1) {
        if (this.advStat.url) {
          this._setFields(fields);
          if (typeof (this.callerTab.advStat) !== 'undefined') {
            var statGroup = this.callerTab.advStat.stats;
            for (var key in statGroup) {
              if (key === "count") {
                this.chk_count.set('value', true);
              } else if (key === "area") {
                this.chk_area.set('value', true);
              } else if (key === "length") {
                this.chk_length.set('value', true);
              } else {
                array.forEach(statGroup[key], lang.hitch(this, function (exp) {
                  this._populateTabTableRow(key, exp);
                }));
              }
            }
            // if (domClass.contains(this.btnOk, 'jimu-state-disabled')) {
            //   html.removeClass(this.btnOk, 'jimu-state-disabled');
            // }
          }
        }
        //else {
        //this._noLayersDisplay();
        //}

      }

    },

    _setFields: function (pFields) {
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
      array.forEach(pFields, lang.hitch(this, function (field) {
        if (validFieldTypes.indexOf(field.type) > -1) {
          // if ((field.alias).toUpperCase() === 'OBJECTID') {
          //   options.push({
          //     'label' : 'Features',
          //     'value' : field.name
          //   });
          // } else {
          options.push({
            'label': field.alias,
            'value': field.name
          });
          // }
        }
      }));
      if (options.length < 1) {
        domStyle.set(this.btnAddField, "display", "none");
      }
      this.fieldsList = lang.clone(options);
    },

    _populateTabTableRow: function (pKey, pTab) {
      var result = this.displayFieldsTable.addRow({});
      if (result.success && result.tr) {
        var tr = result.tr;
        this._addTabFields(tr);
        this._addTabTypes(tr);
        this._addTabLabel(tr);
        tr.selectFields.set("value", pTab.expression);
        tr.labelText.set("value", pTab.label);
        if (this.callerTab.type === "summary") {
          tr.selectTypes.set("value", pKey);
        }
      }
    },

    _addTabRow: function () {
      if (this.callerTab.type !== "summary" && this.displayFieldsTable.getRows().length >= 3) {
        new Message({
          message: this.nls.max_records
        });
        return;
      }
      var result = this.displayFieldsTable.addRow({});
      if (result.success && result.tr) {
        var tr = result.tr;
        this._addTabFields(tr);
        this._addTabTypes(tr);
        this._addTabLabel(tr);
        // if (domClass.contains(this.btnOk, 'jimu-state-disabled')) {
        //   html.removeClass(this.btnOk, 'jimu-state-disabled');
        // }
      }
    },

    _addTabFields: function (tr) {
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

    _addTabLabel: function (tr) {
      if (this.callerTab.type !== "summary") {
        return;
      }
      var td = query('.simple-table-cell', tr)[1];
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

    _addTabTypes: function (tr) {
      if (this.callerTab.type !== "summary") {
        return;
      }
      var typeOptions = lang.clone(this.operationsList);
      var td = query('.simple-table-cell', tr)[2];
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

    updateSummaryType: function () {
      var trs = this.displayFieldsTable.getRows();
      if (this.callerTab.type !== "summary") {
        var flds = [];
        array.forEach(trs, function (tr) {
          //flds.push({
          //    value: 0,
          //    expression: tr.selectFields.value,
          //    label: tr.labelText.value ? tr.labelText.value : tr.selectFields.textDirNode.innerText
          //});
          //TODO check out the txtDirNode thing that was changed for some FF specific issue
          flds.push({
            value: 0,
            expression: tr.selectFields.value,
            label: tr.selectFields.value
          });
        });
        if (flds.length > 0) {
          //this.summaryLayers[0].stats.outFields = flds;
          this.advStat.stats.outFields = flds;
        }
      } else {
        // count
        if (this.chk_count.checked) {
          //this.summaryLayers[0].stats.count = [
          this.advStat.stats.count = [
            {
              value: 0,
              expression: this.objectIdField,
              label: this.nls.count
            }
          ];
        }
        //area
        if (this.chk_area.checked) {
          //this.summaryLayers[0].stats.area = [
          this.advStat.stats.area = [
            {
              value: 0,
              expression: this.objectIdField,
              label: this.nls.area
            }
          ];
        }
        //length
        if (this.chk_length.checked) {
          //this.summaryLayers[0].stats.length = [
          this.advStat.stats.length = [
            {
              value: 0,
              expression: this.objectIdField,
              label: this.nls.length
            }
          ];
        }
        // sum, avg, min, max
        array.forEach(trs, lang.hitch(this, function (tr) {
          if (typeof (this.advStat.stats[tr.selectTypes.value]) === 'undefined') {
            this.advStat.stats[tr.selectTypes.value] = [];
          }
          var statBlock = {};
          statBlock.value = 0;
          statBlock.expression = tr.selectFields.value;
          //textDirNode.innerText was coming back undefined if the widget was configured in FF
          //Field names in "advanced" summary mode were not displaying correctly when the attributes were turned off in the corresponding popup configuration
          for (var i = 0; i < tr.selectFields.options.length; i++) {
            if (tr.selectFields.options[i].value === tr.selectFields.value) {
              statBlock.label = tr.labelText.value ? tr.labelText.value : tr.selectFields.options[i].label;
              break;
            }
          }
          if (typeof (statBlock.label) === 'undefined') {
            statBlock.label = statBlock.expression;
          }
          //this.summaryLayers[0].stats[tr.selectTypes.value].push(statBlock);
          this.advStat.stats[tr.selectTypes.value].push(statBlock);
        }));
      }
      console.log("ADVSTAT", this.advStat);
    },

    destroy: function () {
      //this.summaryLayers = null;
      this.advStat = null;
    }

  });

});
