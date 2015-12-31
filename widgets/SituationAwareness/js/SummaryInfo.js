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
], function (
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
    summaryGeom: null,

    symbolField: null,
    graphicsLayer: null,
    lyrRenderer: null,
    lyrSymbol: null,
    constructor: function (tab, container, parent) {
      this.tab = tab;
      this.container = container;
      this.parent = parent;
      this.config = parent.config;
      this.graphicsLayer = null;
    },

    /* jshint unused: true */
    // update for incident
    updateForIncident: function (incident, buffer, graphicsLayer) {
      this.container.innerHTML = "";
      domClass.add(this.container, "loading");
      this.summaryIds = [];
      this.summaryFeatures = [];
      this.summaryGeom = buffer.geometry;
      if (this.tab.tabLayers.length > 0) {
        var tempFL;
        if (typeof (this.tab.tabLayers[0].infoTemplate) !== 'undefined') {
          this.summaryLayer = this.tab.tabLayers[0];
          tempFL = new FeatureLayer(this.summaryLayer.url);
          tempFL.infoTemplate = this.tab.tabLayers[0].infoTemplate;
          this.tab.tabLayers.push(tempFL);
          this._initGraphicsLayer(graphicsLayer);
          this.summaryFields = this._getFields(this.summaryLayer);
          lang.hitch(this, this._queryFeatures(buffer.geometry));
        } else {
          tempFL = new FeatureLayer(this.tab.tabLayers[0].url);
          on(tempFL, "load", lang.hitch(this, function () {
            this.summaryLayer = tempFL;
            if (this.tab.tabLayers[0].url.indexOf("MapServer") > -1) {
              var lID = this.tab.tabLayers[0].url.split("MapServer/")[1];
              var mapLayers = this.parent.map.itemInfo.itemData.operationalLayers;
              for (var i = 0; i < mapLayers.length; i++) {
                var lyr = mapLayers[i];
                if (typeof (lyr.layerObject) !== 'undefined') {
                  if (lyr.layerObject.infoTemplates) {
                    var infoTemplate = lyr.layerObject.infoTemplates[lID];
                    if (infoTemplate) {
                      tempFL.infoTemplate = infoTemplate.infoTemplate;
                      break;
                    }
                  }
                }
              }
            }

            this.tab.tabLayers.push(tempFL);
            this._initGraphicsLayer(graphicsLayer);
            this.summaryFields = this._getFields(this.summaryLayer);
            lang.hitch(this, this._queryFeatures(buffer.geometry));
          }));
        }
      }
    },

    _initGraphicsLayer: function (gl) {
      if (gl !== null) {
        this.graphicsLayer = gl;
        this.graphicsLayer.clear();
        if (this.summaryLayer) {
          if (this.summaryLayer.renderer) {
            this.lyrRenderer = this.summaryLayer.renderer;
            this.graphicsLayer.renderer = this.lyrRenderer;
            if (typeof (this.summaryLayer.renderer.attributeField) !== 'undefined') {
              this.symbolField = this.summaryLayer.renderer.attributeField;
            } else {
              this.lyrSymbol = this.lyrRenderer.symbol;
            }
          }
        }
      }
    },

    // query features
    _queryFeatures: function (geom) {
      var query = new Query();
      query.geometry = geom;
      this.summaryLayer.queryIds(query, lang.hitch(this, function (objectIds) {
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
    _queryFeaturesByIds: function () {
      var max = this.summaryLayer.maxRecordCount || 1000;
      var ids = this.summaryIds.slice(0, max);
      this.summaryIds.splice(0, max);
      var query = new Query();
      var includeGeom = false;
      array.some(this.summaryFields, lang.hitch(this, function (obj) {
        if (obj.type === "area" || obj.type === "length" || this.graphicsLayer) {
          includeGeom = true;
          return true;
        }
      }));
      query.returnGeometry = includeGeom;
      var outFields = [];
      array.forEach(this.summaryFields, function (f) {
        outFields.push(f.field);
      });

      if (this.symbolField) {
        outFields.push(this.symbolField);
      }
      if (this.config.csvAllFields === true || this.config.csvAllFields === "true") {
        query.outFields = ['*'];
      } else {
        query.outFields = outFields;
      }
      query.objectIds = ids;
      this.summaryLayer.queryFeatures(query, lang.hitch(this, function (featureSet) {
        this.summaryFeatures = this.summaryFeatures.concat(featureSet.features);
        this._processResults();
        if (this.summaryIds.length > 0) {
          if (dom.byId('SA_SAT_download')) {
            domClass.replace(dom.byId('SA_SAT_download'), "processing", "download");
          }
          this._queryFeaturesByIds();
        } else {
          if (dom.byId('SA_SAT_download')) {
            domClass.replace(dom.byId('SA_SAT_download'), "download", "processing");
          }
        }
      }));
    },

    // prep results
    _prepResults: function () {
      for (var f = 0; f < this.summaryFields.length; f++) {
        var obj = this.summaryFields[f];
        var fld = obj.field;
        var type = obj.type;
        var value = obj.total;
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
        obj.total = value;
      }
    },

    // sort results
    _sortResults: function (property) {
      return function (a, b) {
        var result = (a.attributes[property] < b.attributes[property]) ? -1 :
          (a.attributes[property] > b.attributes[property]) ? 1 : 0;
        return result;
      };
    },

    // get sum
    _getSum: function (fld) {
      var value = 0;
      array.forEach(this.summaryFeatures, function (gra) {
        value += gra.attributes[fld];
      });
      return value;
    },

    // get min
    _getMin: function (fld) {
      this.summaryFeatures.sort(this._sortResults(fld));
      var value = this.summaryFeatures[0].attributes[fld];
      return value;
    },

    // get max
    _getMax: function (fld) {
      this.summaryFeatures.sort(this._sortResults(fld));
      this.summaryFeatures.reverse();
      var value = this.summaryFeatures[0].attributes[fld];
      return value;
    },

    //get area
    _getArea: function () {
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
      array.forEach(this.summaryFeatures, lang.hitch(this, function (gra) {
        var intersectGeom = geometryEngine.intersect(gra.geometry, this.summaryGeom);
        if (intersectGeom !== null) {
          value += geometryEngine.geodesicArea(intersectGeom, unitCode);
        }
      }));
      return value;
    },

    // get length
    _getLength: function () {
      var value = 0;
      var units = this.config.distanceUnits;
      var unitCode = this.config.distanceSettings[units];
      array.forEach(this.summaryFeatures, lang.hitch(this, function (gra) {
        var intersectGeom = geometryEngine.intersect(gra.geometry, this.summaryGeom);
        if (intersectGeom !== null) {
          value += geometryEngine.geodesicLength(intersectGeom, unitCode);
        }
      }));
      return value;
    },

    // process results
    //Solutions: added a string search looking for area or length to not round up.
    _processResults: function () {
      this._prepResults();
      this.container.innerHTML = "";
      domClass.remove(this.container, "loading");
      var results = this.summaryFields;
      var numberOfDivs = results.length + 1;
      var total = 0;
      var tpc = domConstruct.create("div", {
        id: "SA_tpc",
        style: "width:" + (numberOfDivs * 220) + "px;"
      }, this.container);
      domClass.add(tpc, "SAT_tabPanelContent");

      var div_results_extra = domConstruct.create("div", {}, tpc);
      domClass.add(div_results_extra, "SATcol");

      var div_exp = domConstruct.create("div", {
        id: 'SA_SAT_download',
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
          total = obj.total;
        } else {
          total = Math.round(obj.total);
        }
        if (isNaN(total)) {
          total = 0;
        }
        info += "<div class='colSummary'>" + number.format(total) + "</div><br/>";
        var div = domConstruct.create("div", {
          id: "SA_Demographics_" + i,
          innerHTML: info
        }, tpc);
        domClass.add(div, "SATcol");
      }

      if (this.graphicsLayer !== null) {
        this.graphicsLayer.clear();
        this.tab.tabLayers[1].clear();
        if (this.summaryFeatures) {
          for (var ii = 0; ii < this.summaryFeatures.length; ii++) {
            var gra = this.summaryFeatures[ii];
            if (this.lyrSymbol) {
              gra.symbol = this.lyrSymbol;
            }
            else {
              var sym = this.graphicsLayer.renderer.getSymbol(gra);
              gra.symbol = sym;
            }
            this.graphicsLayer.add(gra);
            this.tab.tabLayers[1].add(gra);
          }
        }
        this.graphicsLayer.setVisibility(true);
      }
    },

    _exportToCSV: function () {
      if (this.summaryFeatures.length === 0) {
        return false;
      }
      var name = this.tab.tabLayers[0].id;
      var data = [];
      var cols = [];
      array.forEach(this.summaryFeatures, function (gra) {
        data.push(gra.attributes);
      });
      if (this.config.csvAllFields === true || this.config.csvAllFields === "true") {
        for (var prop in data[0]) {
          cols.push(prop);
        }
      } else{
        for (var i = 0; i < this.summaryFields.length; i++) {
          cols.push(this.summaryFields[i].field);
        }
      }
      CSVUtils.exportCSV(name, data, cols);
    },

    // Solutions: Added case to handle fields structure coming from a map service.
    // also added a small integer into summary types.
    /*jshint loopfunc: true */
    _getFields: function (layer) {
      var fields = [];
      if (this.tab.advStat) {
        var stats = this.tab.advStat.stats;
        for (var key in stats) {
          var txt = "";
          //if (key !== "count" && key !== "area" && key !== "length") {
          //  txt = " (<span style='font-size:7pt;'>" + this.parent.nls[key] + "</span>)";
          //}
          if (stats[key].length > 0) {
            array.forEach(stats[key], function (pStat) {
              var obj = {
                field: pStat.expression,
                alias: pStat.label + txt,
                type: key,
                total: 0
              };
              fields.push(obj);
            });
          }
        }
        return fields;
      }
      var fldInfos;
      if (layer.infoTemplate) {
        fldInfos = layer.infoTemplate.info.fieldInfos;
      } else if (this.tab.tabLayers[0].url.indexOf("MapServer") > -1) {
        var lID = this.tab.tabLayers[0].url.split("MapServer/")[1];
        var mapLayers = this.parent.map.itemInfo.itemData.operationalLayers;
        fldInfos = null;
        for (var ii = 0; ii < mapLayers.length; ii++) {
          var lyr = mapLayers[ii];
          if (lyr.layerObject.infoTemplates) {
            var infoTemplate = lyr.layerObject.infoTemplates[lID];
            if (infoTemplate) {
              fldInfos = infoTemplate.infoTemplate.info.fieldInfos;
              break;
            }
          }
        }
      } else {
        fldInfos = layer.fields;
      }
      if (!fldInfos) {
        fldInfos = layer.fields;
      }
      for (var i = 0; i < fldInfos.length; i++) {
        var fld = fldInfos[i];
        if (typeof (layer.fields) !== 'undefined') {
          var fldType = layer.fields[i].type;
          var obj;
          //if (fld.visible && fld.fieldName !== layer.objectIdField &&
          if (fld.name !== layer.objectIdField && (fldType === "esriFieldTypeDouble" ||
          fldType === "esriFieldTypeInteger" || fldType === "esriFieldTypeSmallInteger")) {
            if (typeof (fld.visible) !== 'undefined') {
              if (fld.visible) {
                obj = {
                  field: fld.fieldName,
                  alias: fld.label,
                  type: "sum",
                  total: 0
                };
              }
            } else {
              obj = {
                field: fld.name,
                alias: fld.alias,
                type: "sum",
                total: 0
              };
            }
            if (obj) {
              fields.push(obj);
            }
            obj = null;
          }
        }
      }
      return fields;
    }
  });

  return summaryInfo;

});
