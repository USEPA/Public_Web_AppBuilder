define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/_base/Color',
  'dojo/dom',
  'dojo/dom-class',
  'dojo/dom-construct',
  'dojo/dom-style',
  'dojo/number',
  'dojo/on',
  'dojo/has',
  'dijit/form/Button',
  'jimu/dijit/Popup',
  'jimu/CSVUtils',
  'jimu/utils',
  'esri/config',
  'esri/geometry/geometryEngine',
  'esri/geometry/mathUtils',
  'esri/geometry/Point',
  'esri/geometry/webMercatorUtils',
  'esri/graphic',
  'esri/layers/FeatureLayer',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/Font',
  'esri/symbols/TextSymbol',
  'esri/tasks/query'
], function(
  declare,
  array,
  lang,
  Color,
  dom,
  domClass,
  domConstruct,
  domStyle,
  number,
  on,
  has,
  Button,
  Popup,
  CSVUtils,
  utils,
  esriConfig,
  geometryEngine,
  mathUtils,
  Point,
  webMercatorUtils,
  Graphic,
  FeatureLayer,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  Font,
  TextSymbol,
  Query
) {

  var summaryInfo = declare('SummaryInfo', null, {

    summaryLayer: null,
    summaryFields: [],
    summaryIds: [],
    summaryFeatures: [],

    constructor: function(tab, container, parent) {
      this.tab = tab;
      this.container = container;
      this.parent = parent;
      this.config = parent.config;
    },

    /* jshint unused: true */
    // update for incident
    updateForIncident: function(incident, buffer) {
      this.container.innerHTML = "";
      domClass.add(this.container, "loading");
      this.summaryIds = [];
      this.summaryFeatures = [];
      if (this.tab.tabLayers.length > 0) {
        if (typeof(this.tab.tabLayers[0].infoTemplate) !== 'undefined') {
          this.summaryLayer = this.tab.tabLayers[0];
          this.summaryFields = this._getFields(this.summaryLayer);
          lang.hitch(this, this._queryFeatures(buffer.geometry));
        } else {
          var tempFL = new FeatureLayer(this.tab.tabLayers[0].url);
          on(tempFL, "load", lang.hitch(this, function() {
            this.summaryLayer = tempFL;
            this.summaryFields = this._getFields(this.summaryLayer);
            lang.hitch(this, this._queryFeatures(buffer.geometry));
          }));
        }
      }
    },

    // query features
    _queryFeatures: function(geom) {
      var query = new Query();
      query.geometry = geom;
      this.summaryLayer.queryIds(query, lang.hitch(this, function(objectIds) {
        if (objectIds) {
          this.summaryIds = objectIds;
          if (this.summaryIds.length > 0) {
            this._queryFeaturesByIds();
          } else {
            this._processResults();
          }
        } else {
          this._processResults();
        }
      }));
    },

    // query features by ids
    _queryFeaturesByIds: function() {
      var max = this.summaryLayer.maxRecordCount || 1000;
      var ids = this.summaryIds.slice(0, max);
      this.summaryIds.splice(0, max);
      var query = new Query();
      var includeGeom = false;
      array.some(this.summaryFields, function(obj) {
        if (obj.type === "area" || obj.type === "length") {
          includeGeom = true;
          return true;
        }
      });
      query.returnGeometry = includeGeom;
      var outFields = [];
      array.forEach(this.summaryFields, function(f) {
        outFields.push(f.field);
      });
      query.outFields = outFields;
      query.objectIds = ids;
      this.summaryLayer.queryFeatures(query, lang.hitch(this, function(featureSet) {
        this.summaryFeatures = this.summaryFeatures.concat(featureSet.features);
        this._processResults();
        if (this.summaryIds.length > 0) {
          if (dom.byId('IMT_download')) {
            domClass.replace(dom.byId('IMT_download'), "processing", "download");
          }
          this._queryFeaturesByIds();
        } else {
          if (dom.byId('IMT_download')) {
            domClass.replace(dom.byId('IMT_download'), "download", "processing");
          }
        }
      }));
    },

    // prep results
    _prepResults: function() {
      for (var f = 0; f < this.summaryFields.length; f++) {
        var obj = this.summaryFields[f];
        var fld = obj.field;
        var type = obj.type;
        var value = obj.value;
        switch (type) {
          case "count":
            value = this.summaryFeatures.length;
            break;
          case "area":
            value = this._getArea();
            break;
          case "length":
            value = this._getLength();
            break;
          case "sum":
            value = this._getSum(fld);
            break;
          case "avg":
            var t = this._getSum(fld);
            value = t / this.summaryFeatures.length;
            break;
          case "min":
            value = this._getMin(fld);
            break;
          case "max":
            value = this._getMax(fld);
            break;
        }
        obj.value = value;
      }
    },

    // sort results
    _sortResults: function(property) {
      return function(a, b) {
        var result = (a.attributes[property] < b.attributes[property]) ? -1 :
          (a.attributes[property] > b.attributes[property]) ? 1 : 0;
        return result;
      };
    },

    // get sum
    _getSum: function(fld) {
      var value = 0;
      array.forEach(this.summaryFeatures, function(gra) {
        value += gra.attributes[fld];
      });
      return value;
    },

    // get min
    _getMin: function(fld) {
      this.summaryFeatures.sort(this._sortResults(fld));
      var value = this.summaryFeatures[0].attributes[fld];
      return value;
    },

    // get max
    _getMax: function(fld) {
      this.summaryFeatures.sort(this._sortResults(fld));
      this.summaryFeatures.reverse();
      var value = this.summaryFeatures[0].attributes[fld];
      return value;
    },

    //get area
    _getArea: function() {
      var value = 0;
      var areaUnits = lang.clone(this.config.distanceSettings);
      areaUnits.miles = 109413;
      areaUnits.kilometers = 109414;
      areaUnits.feet = 109405;
      areaUnits.meters = 109404;
      areaUnits.yards = 109442;
      areaUnits.nauticalMiles = 109409;
      var units = this.config.distanceUnits;
      var unitCode = areaUnits[units];
      array.forEach(this.summaryFeatures, function(gra) {
        value += geometryEngine.geodesicArea(gra.geometry, unitCode);
      });
      return value;
    },

    // get length
    _getLength: function() {
      var value = 0;
      var units = this.config.distanceUnits;
      var unitCode = this.config.distanceSettings[units];
      array.forEach(this.summaryFeatures, function(gra) {
        value += geometryEngine.geodesicLength(gra.geometry, unitCode);
      });
      return value;
    },

    // process results
    //Solutions: added a string search looking for area or length to not round up.
    _processResults: function() {
      this._prepResults();
      this.container.innerHTML = "";
      domClass.remove(this.container, "loading");
      var results = this.summaryFields;
      var numberOfDivs = results.length + 1;
      var total = 0;
      var tpc = domConstruct.create("div", {
        id: "tpc",
        style: "width:" + (numberOfDivs * 220) + "px;"
      }, this.container);
      domClass.add(tpc, "IMT_tabPanelContent");

      var div_results_extra = domConstruct.create("div", {}, tpc);
      domClass.add(div_results_extra, "IMTcol");

      var div_exp = domConstruct.create("div", {
        id: 'IMT_download',
        innerHTML: this.parent.nls.downloadCSV
      }, div_results_extra);
      domClass.add(div_exp, ['btnExport', 'download']);
      on(div_exp, "click", lang.hitch(this, this._exportToCSV));

      for (var i = 0; i < results.length; i++) {
        var obj = results[i];
        var info = utils.sanitizeHTML(obj.alias ? obj.alias : '') + "<br/>";
        // MODIFIED: ST
        //if(info.indexOf(">area<") !== -1 || info.indexOf(">length<") !== -1) {
        if (obj.alias === this.parent.nls.area || obj.alias === this.parent.nls.length) {
          total = obj.value;
        } else {
          total = Math.round(obj.value);
        }
        if (isNaN(total)) {
          total = 0;
        }
        info += "<div class='colSummary'>" + number.format(total) + "</div><br/>";
        var div = domConstruct.create("div", {
          id: "Demographics_" + i,
          innerHTML: info
        }, tpc);
        domClass.add(div, "IMTcol");
      }
    },

    _exportToCSV: function() {
      if (this.summaryFeatures.length === 0) {
        return false;
      }
      console.log(this.tab);
      var name = this.tab.layers; //this.tab.tabLayers[0].id;
      var data = [];
      var cols = [];
      array.forEach(this.summaryFeatures, function(gra) {
        data.push(gra.attributes);
      });
      for (var prop in data[0]) {
        cols.push(prop);
      }
      CSVUtils.exportCSV(name, data, cols);
    },

    // Solutions: Added case to handle fields structure coming from a map service.
    // also added a small integer into summary types.
    /*jshint loopfunc: true */
    _getFields: function(layer) {
      var fields = [];
      if (this.tab.advConfig && this.tab.advConfig.fields && this.tab.advConfig.fields.length > 0) {
        array.forEach(this.tab.advConfig.fields, lang.hitch(this, function(f) {
          var txt = "";
          if (f.type !== "count" && f.type !== "area" && f.type !== "length") {
            txt = " (<span style='font-size:7pt;'>" + this.parent.nls[f.type] + "</span>)";
          }
          var obj = {
            field: f.expression,
            alias: f.label + txt,
            type: f.type,
            value: 0
          };
          fields.push(obj);
        }));
        return fields;
      }
      var fldInfos;
      if (layer.infoTemplate) {
        fldInfos = layer.infoTemplate.info.fieldInfos;
      } else {
        fldInfos = layer.fields;
      }
      for (var i = 0; i < fldInfos.length; i++) {
        var fld = fldInfos[i];
        var fldName = fld.fieldName || fld.name;
        var fldType = this._getFieldType(layer.fields, fldName);
        var obj = null;
        if (fldName !== layer.objectIdField && (fldType === "esriFieldTypeDouble" ||
            fldType === "esriFieldTypeInteger" || fldType === "esriFieldTypeSmallInteger")) {
          if (typeof(fld.visible) !== 'undefined') {
            if (fld.visible) {
              obj = {
                field: fld.fieldName,
                alias: fld.label,
                type: "sum",
                value: 0
              };
            }
          } else {
            obj = {
              field: fld.name,
              alias: fld.alias,
              type: "sum",
              value: 0
            };
          }
          if (obj) {
            fields.push(obj);
          }
        }
      }
      return fields;
    },

    _getFieldType: function(fields, name) {
      var fldType;
      array.some(fields, function(f) {
        if (f.name === name) {
          fldType = f.type;
          return true;
        }
      });
      return fldType;
    }

  });

  return summaryInfo;

});
