define(["dojo/_base/declare",
    "jimu/BaseWidget",
    "jimu/utils",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/_base/event",
    "dojo/_base/html",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/_base/xhr",
    "dojo/query",
    "esri/graphic",
    "esri/layers/FeatureLayer",
    "esri/tasks/query",
    "dojo/number",
    "esri/tasks/StatisticDefinition",
    "./ClusterLayer",
    "esri/graphicsUtils",
    "dojo/on",
    "widgets/Summary/c"
  ],
  function(declare, BaseWidget, utils,
    dom, domStyle, domClass, domConstruct, domGeometry, dojoEvent, html,
    lang, array, xhr, query, Graphic, FeatureLayer, Query, number, StatisticDefinition,
    ClusterLayer, graphicsUtils, on, Counter) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {

      //please note that this property is be set by the framework when widget is loaded.
      //templateString: template,
      /* jshint unused: true */

      baseClass: 'jimu-widget-summary',
      name: 'Summary',

      clusterLayer: null,
      counter0: null,
      counter1: null,
      counter2: null,
      counter3: null,
      fieldCount: 0,
      pageCount: 0,
      page: 0,
      visCount: 4,
      summaryIds: [],
      summaryFeatures: [],

      postCreate: function() {
        this.inherited(arguments);
        if (!this.config.summaryLayer) {
          this._showMessage(this.nls.missingSummaryLayerInConfig);
          return;
        }
        this.showFeatureCount = this.config.showFeatureCount;
        this.featureCountLabel = this.config.featureCountLabel;
        this.displayCluster = this.config.displayCluster;
        this.filterField = this.config.summaryLayer.filterField;
      },

      startup: function() {
        this.inherited(arguments);
        this._updateUI();
        this._loadCounters();
        if (this.filterField !== "") {
          domStyle.set(this.footerContentNode, "display", "block");
        }
        var clusterLayer = new ClusterLayer({
          id: this.label,
          displayOnPan: true,
          map: this.map,
          clusterSize: 120,
          color: "#6e6e6e",
          countField: null,
          features: []
        });
        this.map.addLayer(clusterLayer);
        this.clusterLayer = clusterLayer;
        this.own(on(this.clusterLayer, "click", lang.hitch(this, this._clusterClick)));
        this.labelNode.innerHTML = utils.sanitizeHTML(this.label ? this.label : '');
        this._getStyleColor(null);

        // Process operational layers
        this.opLayers = this.map.itemInfo.itemData.operationalLayers;
        this._processOperationalLayers();

        this.own(on(this.filterNode, "change", lang.hitch(this, this._setFilter)));
      },

      destroy: function() {
        if (this.clusterLayer) {
          this.map.removeLayer(this.clusterLayer);
          domConstruct.destroy(this.clusterLayer);
        }
        this.inherited(arguments);
      },

      onOpen: function() {
        this.inherited(arguments);
        this._updateLayerVisibility();
        //Disable because of count error
        //this._summarizeFeatures();
      },

      onClose: function() {
        this._updateLayerVisibility();
        this.inherited(arguments);
      },

      resize: function() {
        if (this.state === 'closed') {
          return;
        }
        this.inherited(arguments);
        if (this.resizeTimer) {
          clearTimeout(this.resizeTimer);
          this.resizeTimer = null;
        }
        this.resizeTimer = setTimeout(lang.hitch(this, this._loadPages), 600);
      },

      // on app config changed
      onAppConfigChanged: function(appConfig, reason, changedData) {
        switch (reason) {
          case 'themeChange':
          case 'layoutChange':
            // this.destroy();
            break;
          case 'styleChange':
            this._updateUI(changedData);
            break;
        }
      },

      // update UI
      _updateUI: function(styleName) {
        this._getStyleColor(styleName);
      },

      /*jshint unused:true */
      setPosition: function(position, containerNode) {
        if (this.appConfig.theme.name === "BoxTheme" || this.appConfig.theme.name === "DartTheme" ||
          this.appConfig.theme.name === "LaunchpadTheme") {
          this.inherited(arguments);
        } else {
          var pos = {
            left: "0px",
            right: "0px",
            bottom: "0px",
            height: "140px"
          };
          this.position = pos;
          var style = utils.getPositionStyle(this.position);
          style.position = 'absolute';
          containerNode = this.map.id;
          html.place(this.domNode, containerNode);
          html.setStyle(this.domNode, style);
          if (this.started) {
            this.resize();
          }
          // fix for Tab Thme on mobile devices
          if (this.appConfig.theme.name === "TabTheme") {
            var controllerWidget = this.widgetManager.getControllerWidgets()[0];
            this.widgetManager.minimizeWidget(controllerWidget.id);
          }
        }
      },

      // get style color
      _getStyleColor: function(styleName) {
        var t = this.appConfig.theme.name;
        var s = this.appConfig.theme.styles[0];
        if (styleName) {
          s = styleName;
        }
        var url = "./themes/" + t + "/manifest.json";
        xhr.get({
          url: url,
          handleAs: "json",
          load: lang.hitch(this, function(data) {
            var styles = data.styles;
            for (var i = 0; i < styles.length; i++) {
              var st = styles[i];
              if (st.name === s) {
                domStyle.set(this.footerNode, "background-color", st.styleColor);
                this.clusterLayer.setColor(st.styleColor);
              }
            }
          })
        });
      },

      // cluster click
      _clusterClick: function(evt) {
        var gra = evt.graphic;
        var count = gra.attributes.Count;
        var data = gra.attributes.Data;
        var title = count + " Features";
        if (count === 1) {
          title = count + " Feature";
        }
        var sumData = this._summarizeAttributes(data);
        var info = "";
        for (var f = 0; f < this.fieldCount; f++) {
          if (f === 0 && !this.config.showFeatureCount) {
            continue;
          } else {
            info += this.aliases[f] + ": " + sumData[f] + "<br/><br/>";
          }
        }
        this.map.infoWindow.setTitle(title);
        this.map.infoWindow.setContent(info);
        this.map.infoWindow.show(evt.mapPoint);
        dojoEvent.stop(evt);
      },

      // load counters
      _loadCounters: function() {
        var config = {
          digitsNumber: 17,
          direction: Counter.ScrollDirection.Upwards,
          characterSet: "0123456789.,- ",
          charsImageUrl: "widgets/Summary/images/c.png",
          markerImageUrl: "widgets/Summary/images/m.png"
        };
        this.counter0 = new Counter(this.counter0Node, config);
        this.counter0.value = 0;
        this.counter1 = new Counter(this.counter1Node, config);
        this.counter1.value = 0;
        this.counter2 = new Counter(this.counter2Node, config);
        this.counter2.value = 0;
        this.counter3 = new Counter(this.counter3Node, config);
        this.counter3.value = 0;
      },

      _processOperationalLayers: function() {
        if (!this.opLayers) {
          this._showMessage(this.nls.missingLayerInWebMap);
          return;
        }

        var opLayerId = this.config.summaryLayer.id;
        if (opLayerId !== "") {
          array.some(this.opLayers, lang.hitch(this, function(layer) {
            if (layer.layerType === "ArcGISFeatureLayer") {
              if (layer.layerObject && layer.id === opLayerId) {
                var flds = [];
                array.forEach(this.config.summaryLayer.fields, function(f) {
                  flds.push(f.field);
                });
                this.targetLayer = layer.layerObject;
                this.opLayer = new FeatureLayer(layer.layerObject.url, {
                  outFields: flds,
                  infoTemplate: layer.layerObject.infoTemplate
                });
                this._setLayer();
                return true;
              } else if (layer.featureCollection) {
                for (var i = 0; i < layer.featureCollection.layers.length; i++) {
                  var lyr = layer.featureCollection.layers[i].layerObject;
                  if (lyr.id === opLayerId) {
                    this.targetLayer = lyr;
                    this.opLayer = lyr;
                    this.opLayerIsFeatureCollection = true;
                  }
                  this._setLayer();
                  return true;
                }
              }
            }
          }));
        } else {
          this._showMessage(this.nls.missingSummaryLayerInConfig);
        }
      },

      // set layer
      _setLayer: function() {
        if (this.map.infoWindow.isShowing) {
          this.map.infoWindow.hide();
        }
        this._closeMessage();
        this.targetLayerVisibility = (this.targetLayer.visible) ? true : false;

        this.own(on(this.map, "extent-change", lang.hitch(this, this._summarizeFeatures)));

        this._configureFields();
        this._populateFilterValues();
        this._loadPages();

        if (this.opLayer.geometryType === "esriGeometryPoint") {
          if (this.displayCluster) {
            this.cluster = true;
            this.clusterLayer.setVisibility(true);
          }
        }
        setTimeout(lang.hitch(this, this._summarizeFeatures), 600);
      },

      // configure fields
      _configureFields: function() {
        if (this.config.summaryLayer && this.config.summaryLayer.fields) {
          var aliases = [this.featureCountLabel];
          var summaryFields = [];
          array.forEach(this.config.summaryLayer.fields, lang.hitch(this, function(fld) {
            summaryFields.push(fld);
            var fldLabel = fld.label;
            if (fldLabel.length === 0) {
              fldLabel = this._getFieldAlias(fld.field);
            }
            aliases.push(fldLabel);
          }));
          this.fields = [{
            field: "",
            type: "COUNT",
            label: this.featureCountLabel
          }].concat(summaryFields);
          this.aliases = aliases;
          this.fieldCount = this.fields.length;
        }
      },

      // populate filter values
      _populateFilterValues: function() {
        var fieldName = this.filterField;
        if (!fieldName) {
          return;
        }

        var arrayF = [];
        var fld = this._getFilterField(fieldName);

        //domains
        if (fld && fld.domain && fld.domain.type === "codedValue") {

          var codedValues = fld.domain.codedValues;
          for (var i = 0; i < codedValues.length; i++) {
            var obj = codedValues[i];
            var name = obj.name;
            var code = obj.code;
            arrayF.push({
              value: code,
              label: name
            });
          }
          this.populateOptions(arrayF);

        } else {

          // feature collections
          if (this.opLayerIsFeatureCollection) {
            var graphics = this.opLayer.graphics;
            var dict = {};
            array.forEach(graphics, function(g) {
              var name = g.attributes[fieldName];
              if (!dict[name]) {
                dict[name] = true;
                arrayF.push({
                  value: name,
                  label: name
                });
              }
            });
            arrayF.sort(function(a, b) {
              if (a.value < b.value) {
                return -1;
              } else if (a.value > b.value) {
                return 1;
              }
              return 0;
            });
            this._populateOptions(arrayF);
            // feature layers
          } else {
            var query = new Query();
            var statDef = new StatisticDefinition();
            statDef.statisticType = "count";
            statDef.onStatisticField = fieldName;
            statDef.outStatisticFieldName = "STAT_COUNT";
            query.returnGeometry = false;
            query.where = "1=1";
            query.orderByFields = [fieldName];
            query.groupByFieldsForStatistics = [fieldName];
            query.outStatistics = [statDef];

            this.opLayer.queryFeatures(query, lang.hitch(this, function(featureSet) {
              for (var i = 0; i < featureSet.features.length; i++) {
                var feature = featureSet.features[i];
                var name = feature.attributes[fieldName];
                if (name === null) {
                  continue;
                }
                arrayF.push({
                  value: name,
                  label: name
                });
              }
              this._populateOptions(arrayF);
            }));
          }
        }
      },

      // get filter field
      _getFilterField: function(name) {
        var fld;
        array.some(this.opLayer.fields, function(f) {
          if (f.name === name) {
            fld = f;
            return true;
          }
        });
        return fld;
      },

      // get field alias
      _getFieldAlias: function(name) {
        if (this.opLayer.infoTemplate) {
          var flds = this.opLayer.infoTemplate.info.fieldInfos;
          for (var i = 0; i < flds.length; i++) {
            var f = flds[i];
            if (f.fieldName === name) {
              return f.label;
            }
          }
        }
        return name;
      },

      // load pages
      _loadPages: function() {
        if (this.fields) {
          try {
            var w = domGeometry.getContentBox(this.containerNode).w;
            this.visCount = Math.floor(w / 220);
            this.fieldCount = this.fields.length;
            var count = this.fieldCount;
            if (!this.config.showFeatureCount) {
              count -= 1;
            }
            this.pageCount = Math.ceil(count / this.visCount);
            var list = this.pagesListNode;
            list.innerHTML = "";
            if (this.pageCount > 1) {
              domStyle.set(list, "width", this.pageCount * 20 + 'px');
              for (var i = 0; i < this.pageCount; i++) {
                var id = "pageSum" + i;
                var link = domConstruct.create("li", {
                  id: id
                }, list);
                this.own(on(link, "click", lang.hitch(this, this._setPage, i)));
              }
            }
            this.page = 0;
            this._setPage(0);
          } catch (ex) {
            console.log(ex);
          }
        }
      },

      // set page
      _setPage: function(num) {
        var pageNodes = query("> li", this.pagesListNode);
        array.forEach(pageNodes, function(node) {
          if (node.id === "pageSum" + num) {
            domClass.add(node, "active");
          } else {
            domClass.remove(node, "active");
          }
        });
        this.page = num;
        var panelNodes = query("> div", this.containerNode);
        var i = 0;
        array.forEach(panelNodes, function(panel) {
          if (i < this.visCount) {
            domStyle.set(panel, "display", "block");
          } else {
            domStyle.set(panel, "display", "none");
          }
          i += 1;
        });
        this._updateCounters();
      },

      // summarize features
      _summarizeFeatures: function() {
        if (this.summaryIds.length > 0) {
          return;
        }
        this.summaryIds = [];
        this.summaryFeatures = [];
        if (this.opLayer) {
          var ext = this.map.extent;
          if (this.opLayerIsFeatureCollection) {
            var features = [];
            var fld = this.filterField;
            var list, value;
            if (fld) {
              list = this.filterNode;
              value = list.options[list.selectedIndex].value;
            }
            for (var i = 0; i < this.opLayer.graphics.length; i++) {
              var gra = this.opLayer.graphics[i];
              if (ext.intersects(gra.geometry)) {
                if (fld) {
                  var fldValue = gra.attributes[fld].toString();
                  if (fldValue === value || value === "") {
                    features.push(gra);
                  }
                } else {
                  features.push(gra);
                }
              }
            }
            this.summaryFeatures = features;
            if (this.displayCluster) {
              this.clusterLayer.setFeatures(features);
            }
            this.sumData = this._summarizeAttributes(features);
            this._updateCounters();
          } else {
            // var query = new Query();
            // query.returnGeometry = true;
            // query.geometry = ext;
            // this.opLayer.queryFeatures(query, lang.hitch(this, function(featureSet) {
            //   var features = featureSet.features;
            //   if (this.displayCluster) {
            //     this.clusterLayer.setFeatures(features);
            //   }
            //   this.sumData = this._summarizeAttributes(features);
            //   this._updateCounters();
            // }));
            this._queryFeatures(ext);
          }
        }
      },

      // query features
      _queryFeatures: function(ext) {
        var query = new Query();
        query.geometry = ext;
        this.opLayer.queryIds(query, lang.hitch(this, function(objectIds) {
          this.summaryIds = objectIds;
          if (this.summaryIds.length > 0) {
            this._queryFeaturesByIds();
          } else {
            this.sumData = this._summarizeAttributes(this.summaryFeatures);
            this._updateCounters();
          }
        }));
      },

      _queryFeaturesByIds: function() {
        var max = this.opLayer.maxRecordCount || 1000;
        var ids = this.summaryIds.slice(0, max);
        this.summaryIds.splice(0, max);
        var query = new Query();
        query.outSpatialReference = this.map.spatialReference;
        query.returnGeometry = true;
        query.objectIds = ids;
        this.opLayer.queryFeatures(query, lang.hitch(this, function(featureSet) {
          this.summaryFeatures = this.summaryFeatures.concat(featureSet.features);
          if (this.displayCluster) {
            this.clusterLayer.setFeatures(this.summaryFeatures);
          }
          this.sumData = this._summarizeAttributes(this.summaryFeatures);
          this._updateCounters();
          if (this.summaryIds.length > 0) {
            this._queryFeaturesByIds();
          }
        }));
      },

      // show message
      _showMessage: function(msg) {
        domStyle.set(this.containerNode, "display", "none");
        this.messageTextNode.innerHTML = msg;
        domStyle.set(this.messageNode, "display", "block");
      },

      //summarize attributes
      _summarizeAttributes: function(features) {
        var summaryArray = [];
        array.forEach(this.fields, lang.hitch(this, function(fld) {
          var fldName = fld.field.replace(/^\s+|\s+$/g, '');
          if (fld.type === "SUM") {
            summaryArray.push(this._calculateSum(features, fldName));
          } else if (fld.type === "AVG") {
            summaryArray.push(this._calculateAvg(features, fldName));
          } else if (fld.type === "MAX") {
            summaryArray.push(this._calculateMax(features, fldName));
          } else if (fld.type === "MIN") {
            summaryArray.push(this._calculateMin(features, fldName));
          } else if (fld.type === "COUNT") {
            var count = features.length;
            summaryArray.push(count);
          }
        }));
        return summaryArray;
      },

      _calculateSum: function(features, fldName) {
        var sumValue = 0;
        for (var i = 0; i < features.length; i++) {
          var gra = features[i];
          var val = gra.attributes[fldName];
          if (isNaN(val)) {
            continue;
          }
          sumValue += val;
        }
        return sumValue;
      },

      _calculateAvg: function(features, fldName) {
        var count = features.length;
        var avgValue = 0;
        for (var i = 0; i < features.length; i++) {
          var gra = features[i];
          var val = gra.attributes[fldName];
          if (isNaN(val)) {
            continue;
          }
          avgValue += val;
        }
        avgValue = avgValue / count;
        return avgValue;
      },

      _calculateMax: function(features, fldName) {
        var maxValue;
        for (var i = 0; i < features.length; i++) {
          var gra = features[i];
          var value = gra.attributes[fldName];
          if (isNaN(value)) {
            continue;
          }
          if (i === 0) {
            maxValue = value;
          } else {
            if (value > maxValue) {
              maxValue = value;
            }
          }
        }
        return maxValue;
      },

      _calculateMin: function(features, fldName) {
        var minValue;
        for (var i = 0; i < features.length; i++) {
          var gra = features[i];
          var value = gra.attributes[fldName];
          if (isNaN(value)) {
            continue;
          }
          if (i === 0) {
            minValue = value;
          } else {
            if (value < minValue) {
              minValue = value;
            }
          }
        }
        return minValue;
      },

      // update counters
      _updateCounters: function() {
        var vis = this.visCount;
        for (var i = 0; i < vis; i++) {
          var fldIndex = this.page * vis + i;
          if (!this.config.showFeatureCount) {
            fldIndex += 1;
          }
          var p = this["panel" + i + "Node"];
          if (fldIndex < this.fieldCount) {
            domStyle.set(p, "display", "block");
            if (this.sumData) {
              this._updateCounter(i, fldIndex);
            }
          } else {
            domStyle.set(p, "display", "none");
          }
        }
      },

      // update counter
      _updateCounter: function(index, fldIndex) {
        var value = this.sumData[fldIndex];
        // if (fldIndex >= this.fields.length)
        // value = Math.round(value/this.count);
        var num = value;
        var units = "";
        // if (value > 1000) {
        // num = Math.floor(value*10/ 1000)/10;
        // units = "THOUSANDS";
        // }
        // if (value > 1000000) {
        // num = Math.floor(value*10/ 1000000)/10;
        // units = "MILLIONS";
        // }
        // if (value > 1000000000) {
        // num = Math.floor(value*10/ 1000000000)/10;
        // units = "BILLIONS";
        // }
        if (value >= 10000000000000) {
          num = Math.floor(value * 10 / 1000000000000) / 10;
          units = "TRILLIONS";
        }
        var counter = this["counter" + index];
        var newValue = this._formatNumber(num);
        if (counter !== null && newValue !== null) {
          counter.setValue(newValue);
        }
        this["title" + index + "Node"].innerHTML =
          utils.sanitizeHTML(this.aliases[fldIndex] ? this.aliases[fldIndex] : '');
        this["units" + index + "Node"].innerHTML = units;
      },

      _formatNumber: function(num) {
        var roundNum;
        if (num > -1000 && num < 1000) {
          roundNum = num.toFixed(2);
          num = number.format(roundNum, {
            places: 2
          });
          if (num % 1 === 0) {
            num = number.format(roundNum, {
              places: 0
            });
          }
        } else {
          roundNum = number.round(num);
          num = number.format(roundNum, {
            places: 0
          });
        }
        return num;
      },

      // close message
      _closeMessage: function() {
        domStyle.set(this.messageNode, "display", "none");
        domStyle.set(this.containerNode, "display", "block");
      },

      _populateOptions: function(array) {
        //TODO: Setup so it populates my array
        if (array.length > 0) {
          var list = this.filterNode;
          if (list === null) {
            console.log("Filter search drop down not configured");
            //return;
          }
          domConstruct.create("option", {
            value: "",
            innerHTML: this.nls.all
          }, list);
          for (var i = 0; i < array.length; i++) {
            var obj = array[i];
            var value = obj.value;
            var label = obj.label;
            domConstruct.create("option", {
              value: value,
              innerHTML: label
            }, list);
          }
        }
      },

      // set filter
      _setFilter: function() {
        var list = this.filterNode;
        var fldName = this.filterField;
        var value = list.options[list.selectedIndex].value;
        var ext;

        if (this.opLayerIsFeatureCollection) {
          var graphics = [];
          array.forEach(this.opLayer.graphics, function(g) {
            var fldValue = g.attributes[fldName].toString();
            if ((fldValue === value) || (value === "")) {
              var gra = new Graphic(g.geometry, g.symbol, g.attributes);
              g.show();
              graphics.push(gra);
            } else {
              g.hide();
            }
          });
          if (graphics.length > 0) {
            ext = graphicsUtils.graphicsExtent(graphics);
            if (ext) {
              this.map.setExtent(ext.expand(2));
            } else {
              if (graphics.length > 0) {
                this.map.centerAt(graphics[0].geometry);
              }
            }
          }
        } else {
          var fld = this._getFilterField(fldName);
          var expr = fldName + " = " + value;
          if (fld && fld.type === "esriFieldTypeString") {
            expr = fldName + " = '" + value + "'";
          }
          if (value === "") {
            expr = "1=1";
          }
          this.opLayer.setDefinitionExpression(expr);
          this.targetLayer.setDefinitionExpression(expr);
          if (expr) {
            var query = new Query();
            query.returnGeometry = true;
            query.where = expr;
            this.opLayer.queryFeatures(query, lang.hitch(this, function(featureSet) {
              ext = graphicsUtils.graphicsExtent(featureSet.features);
              this.map.setExtent(ext.expand(1.5));
            }));
          }
        }
      },

      // close
      _close: function() {
        this.widgetManager.closeWidget(this.id);
      },

      // update layer visibility
      _updateLayerVisibility: function() {
        if (!this.targetLayer) {
          return;
        }
        if (this.state === 'closed') {
          if (this.displayCluster && this.targetLayer.geometryType === "esriGeometryPoint") {
            this.targetLayer.setVisibility(this.targetLayerVisibility);
          }
          if (this.clusterLayer) {
            this.clusterLayer.setVisibility(false);
          }
        } else {
          if (this.displayCluster && this.targetLayer.geometryType === "esriGeometryPoint") {
            this.targetLayer.setVisibility(false);
          }
          if (this.clusterLayer) {
            this.clusterLayer.setVisibility(true);
          }
        }
      }

    });
  });
