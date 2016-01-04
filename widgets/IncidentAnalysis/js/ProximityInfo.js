define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/Color',
  'dojo/_base/array',
  'dojo/DeferredList',
  'dojo/dom-class',
  'dojo/dom-construct',
  'dojo/dom-style',
  'dojo/on',
  'esri/geometry/geometryEngine',
  'esri/graphic',
  'esri/layers/FeatureLayer',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/Font',
  'esri/symbols/TextSymbol',
  'esri/tasks/query',
  'jimu/CSVUtils'
], function(
  declare,
  lang,
  Color,
  array,
  DeferredList,
  domClass,
  domConstruct,
  domStyle,
  on,
  geometryEngine,
  Graphic,
  FeatureLayer,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  Font,
  TextSymbol,
  Query,
  CSVUtils
) {

  var proximityInfo = declare('ProximityInfo', null, {

    constructor: function(tab, container, parent) {
      this.tab = tab;
      this.container = container;
      this.parent = parent;
      this.incident = null;
      this.graphicsLayer = null;
      this.specialFields = {};
    },

    // update for incident
    updateForIncident: function(incident, distance, graphicsLayer) {
      array.forEach(this.tab.tabLayers, lang.hitch(this, function(tab) {
        if(typeof(tab.empty) !== 'undefined') {
          var tempFL = new FeatureLayer(tab.url);
          on(tempFL, "load", lang.hitch(this, function() {
            this.tab.tabLayers = [tempFL];
            this.processIncident(incident, distance, graphicsLayer);
          }));
        } else {
          this.processIncident(incident, distance, graphicsLayer);
        }
      }));
    },

    // process incident
    processIncident: function(incident, buffer, graphicsLayer) {
      this.container.innerHTML = "";
      domClass.add(this.container, "loading");
      var results = [];
      this.incident = incident;
      this.graphicsLayer = graphicsLayer;
      var tabLayers = this.tab.tabLayers;
      var defArray = [];
      for (var i = 0; i < tabLayers.length; i++) {
        var layer = tabLayers[i];
        var query = new Query();
        query.returnGeometry = true;
        query.geometry = buffer.geometry;
        query.outFields = this._getFields(layer);
        defArray.push(layer.queryFeatures(query));
      }
      var defList = new DeferredList(defArray);
      defList.then(lang.hitch(this, function(defResults) {
        for (var r = 0; r < defResults.length; r++) {
          var featureSet = defResults[r][1];
          var layer = tabLayers[r];
          var fields = this._getFields(layer);
          var graphics = featureSet.features;
          for (var g = 0; g < graphics.length; g++) {
            var gra = graphics[g];
            var geom = gra.geometry;
            // var loc = geom;
            // if (geom.type !== "point") {
            //   loc = geom.getExtent().getCenter();
            // }
            var dist = this._getDistance(incident.geometry, geom);
            var newAttr = {
              DISTANCE: dist
            };
            for (var f = 0; f < fields.length; f++) {
              newAttr[fields[f]] = gra.attributes[fields[f]];
            }
            gra.attributes = newAttr;
            results.push(gra);
          }
        }
        this._processResults(results);
      }));
    },

    // process results
    _processResults: function(results) {
      this.container.innerHTML = "";
      domClass.remove(this.container, "loading");
      this.graphicsLayer.clear();

      if (results.length === 0) {
        this.container.innerHTML = this.parent.nls.noFeaturesFound;
        return;
      }
      results.sort(this._compareDistance);

      var numberOfDivs = results.length + 1;
      var tpc = domConstruct.create("div", {
        id: "tpc",
        style: "width:" + (numberOfDivs * 220) + "px;"
      }, this.container);
      domClass.add(tpc, "IMT_tabPanelContent");

      var div_results_extra = domConstruct.create("div", {}, tpc);
      domClass.add(div_results_extra, "IMTcol");

      var div_exp = domConstruct.create("div", {
        innerHTML: this.parent.nls.downloadCSV
      }, div_results_extra);
      domClass.add(div_exp, "btnExport");
      on(div_exp, "click", lang.hitch(this, this._exportToCSV, results));

      var unit = this.parent.config.distanceUnits;
      var units = this.parent.nls[unit];

      for (var i = 0; i < results.length; i++) {
        var num = i + 1;
        var gra = results[i];
        var geom = gra.geometry;
        var loc = geom;
        if (geom.type !== "point") {
          loc = geom.getExtent().getCenter();
        }
        var attr = gra.attributes;
        var dist = attr.DISTANCE;
        var distLbl = units + ": " + Math.round(dist * 100) / 100;
        var info = "";
        var c = 0;
        for (var prop in attr) {
          if (prop !== "DISTANCE" && c < 3) {
            //info += attr[prop] + "<br/>";
            info += this._getFieldValue(prop, attr[prop]) + "<br/>";
            c += 1;
          }
        }

        var div = domConstruct.create("div", {
          id: "Feature_" + num
        }, tpc);
        domClass.add(div, "IMTcolRec");

        var div1 = domConstruct.create("div", {}, div);
        domClass.add(div1, "IMTcolRecBar");

        var div2 = domConstruct.create("div", {
          innerHTML: num
        }, div1);
        domClass.add(div2, "IMTcolRecNum");
        domStyle.set(div2, "backgroundColor", this.parent.config.color);
        on(div2, "click", lang.hitch(this, this._zoomToLocation, loc));

        var div3 = domConstruct.create("div", {
          innerHTML: distLbl
        }, div1);
        domClass.add(div3, "IMTcolDistance");

        if (this.parent.config.enableRouting) {
          var div4 = domConstruct.create("div", {}, div1);
          domClass.add(div4, "IMTcolDir");
          on(div4, "click", lang.hitch(this, this._routeToIncident, loc));
        }

        var div5 = domConstruct.create("div", {
          innerHTML: info
        }, div);
        domClass.add(div5, "IMTcolInfo");

        var sls = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
          new Color.fromString(this.parent.config.color), 1);
        var sms = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 24, sls,
          new Color.fromString(this.parent.config.color));
        var fnt = new Font();
        fnt.family = "Arial";
        fnt.size = "12px";
        var symText = new TextSymbol(num, fnt, "#ffffff");
        symText.setOffset(0, -4);
        this.graphicsLayer.add(new Graphic(loc, sms, attr));
        this.graphicsLayer.add(new Graphic(loc, symText, attr));

      }

    },

    _exportToCSV: function(results) {
      if (results.length === 0) {
        return false;
      }
      var name = this.tab.layers; //this.tab.tabLayers[0].id;
      var data = [];
      var cols = [];
      array.forEach(results, function(gra){
        data.push(gra.attributes);
      });
      for (var prop in data[0]) {
        cols.push(prop);
      }
      CSVUtils.exportCSV(name, data, cols);
    },

    // getFields
    _getFields: function(layer) {
      var fields = [];
      if(this.tab.advConfig && this.tab.advConfig.fields &&
        this.tab.advConfig.fields.length > 0) {
        array.forEach(this.tab.advConfig.fields, function(obj){
          fields.push(obj.expression);
        });
      } else {
        var fldInfos;
        if(layer.infoTemplate) {
          fldInfos = layer.infoTemplate.info.fieldInfos;
        } else {
          fldInfos = layer.fields;
        }
        for (var i = 0; i < fldInfos.length; i++) {
          var fld = fldInfos[i];
          if(typeof(fld.visible) !== 'undefined') {
            if (fld.visible) {
              fields.push(fld.fieldName);
            }
          } else {
            fields.push(fld.name);
          }
        }
      }
      // special fields: dates and domains
      var spFields = {};
      array.forEach(layer.fields, function(fld){
        if(fld.type === "esriFieldTypeDate" || fld.domain) {
          spFields[fld.name] = fld;
        }
      });
      this.specialFields = spFields;
      return fields;
    },

    // get field value
    _getFieldValue: function(fldName, fldValue) {
      var value = fldValue;
      if (this.specialFields[fldName]) {
        var fld = this.specialFields[fldName];
        if (fld.type === "esriFieldTypeDate") {
          value = new Date(fldValue).toLocaleString();
        } else {
          var codedValues = fld.domain.codedValues;
          array.some(codedValues, function(obj){
            if(obj.code === fldValue) {
              value = obj.name;
              return true;
            }
          });
        }
      }
      return value;
    },

    // get distance
    _getDistance: function(geom1, geom2) {
      var dist = 0;
      var units = this.parent.config.distanceUnits;
      dist = geometryEngine.distance(geom1, geom2, 9001);
      switch (units) {
        case "miles":
          dist *= 0.000621371;
          break;
        case "kilometers":
          dist *= 0.001;
          break;
        case "feet":
          dist *= 3.28084;
          break;
        case "yards":
          dist *= 1.09361;
          break;
        case "nauticalMiles":
          dist *= 0.000539957;
          break;
      }
      return dist;
    },

    // COMPARE DISTANCE
    _compareDistance: function(a, b) {
      if (a.attributes.DISTANCE < b.attributes.DISTANCE) {
        return -1;
      }
      if (a.attributes.DISTANCE > b.attributes.DISTANCE) {
        return 1;
      }
      return 0;
    },

    // zoom to location
    _zoomToLocation: function(loc) {
      this.parent.zoomToLocation(loc);
    },

    // route to incident
    _routeToIncident: function(loc) {
      this.parent.routeToIncident(loc);
    }
  });

  return proximityInfo;

});
