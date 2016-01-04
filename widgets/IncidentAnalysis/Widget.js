define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/dijit/Message',
    'jimu/utils',
    'jimu/LayerInfos/LayerInfos',
    'dojo/_base/Color',
    'dojo/_base/html',
    'dojo/dom',
    'dojo/on',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-geometry',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/xhr',
    'dojo/query',
    'dojo/json',
    'dijit/form/HorizontalSlider',
    'dijit/form/HorizontalRuleLabels',
    'esri/geometry/Extent',
    'esri/geometry/geometryEngine',
    'esri/geometry/Polygon',
    'esri/geometry/Point',
    'esri/geometry/Multipoint',
    'esri/geometry/Polyline',
    'esri/geometry/webMercatorUtils',
    'esri/graphic',
    'esri/layers/GraphicsLayer',
    'esri/symbols/Font',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/TextSymbol',
    'esri/tasks/locator',
    'esri/tasks/BufferParameters',
    'esri/toolbars/draw',
    './js/SummaryInfo',
    './js/WeatherInfo',
    './js/ClosestInfo',
    './js/ProximityInfo',
    'dojo/keys',
    'dojo/domReady!'
  ],
  function(declare, _WidgetsInTemplateMixin, BaseWidget, Message, utils, LayerInfos,
    Color, html, dom, on, domStyle, domClass, domConstruct, domGeom, lang, array, xhr,
    query,
    JSON,
    HorizontalSlider,
    HorizontalRuleLabels,
    Extent,
    geometryEngine,
    Polygon,
    Point,
    Multipoint,
    Polyline,
    webMercatorUtils,
    Graphic,
    GraphicsLayer,
    Font,
    SimpleLineSymbol,
    SimpleFillSymbol,
    SimpleMarkerSymbol,
    TextSymbol,
    Locator,
    BufferParameters,
    Draw,
    SummaryInfo,
    WeatherInfo,
    ClosestInfo,
    ProximityInfo,
    keys
  ) {

    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget, _WidgetsInTemplateMixin], {

      //templateString: template,
      /*jshint scripturl:true*/

      baseClass: 'jimu-widget-IMT',
      name: 'IncidentAnalysis',

      opLayers: null,
      curTab: 0,
      lyrBuffer: null,
      lyrIncidents: null,
      lyrClosest: null,
      lyrProximity: null,
      tabLayersVisibility: {},
      toolbar: null,
      tool: -1,
      symPoint: null,
      symLine: null,
      symPoly: null,
      symBuffer: null,
      symRoute: null,
      incident: null,
      buffer: null,
      locator: null,
      stops: [],

      Incident_Local_Storage_Key: "IMT_Incident",
      SLIDER_MAX_VALUE: 10000,

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        this._getStyleColor();
        this._createUI();
        this._loadUI();
        this._initLayers();
        this._verifyRouting();

        if (this.config.enableRouting) {
          this.config.enableRouting = false;
          var widgets = this.appConfig.widgetPool.widgets;
          array.forEach(widgets, lang.hitch(this, function(w) {
            if (w.name === "Directions") {
              this.config.enableRouting = true;
            }
          }));
        }

        this.SLIDER_MAX_VALUE = this.config.bufferRange.maximum;

        // set operational layers
        this.opLayers = this.map.itemInfo.itemData.operationalLayers;

        this._mapLoaded();

        this._restoreIncidents();
      },

      onOpen: function() {
        this.inherited(arguments);
        this._getTabLayersVisibility();
        this._addActionLink();
        this._clickTab(0);
      },

      onClose: function() {
        this._clear();
        this._toggleTabLayersOld();
        this._setTabLayersVisibility();
        this._removeActionLink();
        this.inherited(arguments);
      },

      onDeActive: function() {
        this._clickIncidentsButton(-1);
      },

      destroy: function() {
        this._clear();
        this._toggleTabLayersOld();
        if (this.lyrBuffer) {
          this.map.removeLayer(this.lyrBuffer);
        }
        if (this.lyrIncidents) {
          this.map.removeLayer(this.lyrIncidents);
        }
        if (this.lyrClosest) {
          this.map.removeLayer(this.lyrClosest);
        }
        if (this.lyrProximity) {
          this.map.addLayer(this.lyrProximity);
        }
        this.inherited(arguments);
      },

      /* jshint unused: true */
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
          case 'widgetPoolChange':
            this._verifyRouting();
            break;
        }
      },

      // add action link
      _addActionLink: function() {
        var actionLabel = this.nls.actionLabel;
        var actionLink;
        var aDom = query(".actionList", this.map.infoWindow.domNode);
        if (aDom.length > 0) {
          var aLinks = query("#actionLink", aDom[0]);
          if (aLinks.length > 0) {
            actionLink = aLinks[0];
          } else {
            actionLink = domConstruct.create("a", {
              "class": "action",
              "id": "actionLink",
              "innerHTML": actionLabel,
              "href": "javascript: void(0);"
            }, aDom[0]);
          }
          this.own(on(actionLink, "click", lang.hitch(this, this._setEventLocation)));
        }
      },

      // remove action link
      _removeActionLink: function() {
        if (dom.byId("actionLink")) {
          domConstruct.destroy(dom.byId("actionLink"));
        }
      },

      // update UI
      _updateUI: function(styleName) {
        this._getStyleColor(styleName);
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
                this.config.color = st.styleColor;
                this._setupSymbols();
                this._bufferIncident();
              }
            }
          })
        });
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

      disableWebMapPopup: function() {
        if (this.map) {
          this.map.setInfoWindowOnClick(false);
        }
      },

      enableWebMapPopup: function() {
        if (this.map) {
          this.map.setInfoWindowOnClick(true);
        }
      },

      _setEventLocation: function() {
        var feature = this.map.infoWindow.getSelectedFeature();
        var pData = {
          "eventType": "IncidentLocation",
          "dataValue": feature
        };
        this.onReceiveData("", "", pData);
      },

      //create a map based on the input web map id
      _initLayers: function() {

        this.locator = new Locator(this.config.geocodeService.url);
        this.own(on(this.locator, "location-to-address-complete",
          lang.hitch(this, this._showIncidentAddress)));
        this.own(on(this.locator, "error", lang.hitch(this, this._onAddressError)));

        this.lyrBuffer = new GraphicsLayer();
        this.map.addLayer(this.lyrBuffer);

        this.lyrIncidents = new GraphicsLayer();
        this.map.addLayer(this.lyrIncidents);

        this.lyrClosest = new GraphicsLayer();
        this.lyrClosest.setVisibility(false);
        this.map.addLayer(this.lyrClosest);

        this.lyrProximity = new GraphicsLayer();
        this.lyrProximity.setVisibility(false);
        this.map.addLayer(this.lyrProximity);
      },

      // map loaded
      _mapLoaded: function() {
        // option to move base map ref layers below graphics
        query('[data-reference]').style("z-index", 0);
        if (this.map.itemId) {
          LayerInfos.getInstance(this.map, this.map.itemInfo)
            .then(lang.hitch(this, function(operLayerInfos) {
              //console.log(operLayerInfos);
              this.opLayers = operLayerInfos;
              this._processOperationalLayers();
            }));
        }
        //this._processOperationalLayers();
        this._clickTab(0);
      },

      // process operational layers
      _processOperationalLayers: function() {
        // tab layers
        for (var i = 0; i < this.config.tabs.length; i++) {
          var t = this.config.tabs[i];
          if (t.layers && t.layers !== "") {
            t.tabLayers = this._getTabLayers(t.layers);
          }
        }
        //this._getTabLayersVisibility();
      },

      _createUI: function() {
        var units = this.config.distanceUnits;
        var lbl = utils.sanitizeHTML(this.config.bufferLabel ? this.config.bufferLabel : '');
        lbl += " (" + this.nls[units] + ")";
        this.buffer_lbl.innerHTML = lbl;

        var sliderNode = dom.byId("horizontalSliderDiv");
        var rulesNode = document.createElement('div');
        sliderNode.appendChild(rulesNode);
        var rulesNodeLabels = document.createElement('div');
        sliderNode.appendChild(rulesNodeLabels);

        var sliderLabels = new HorizontalRuleLabels({
          container: "bottomDecoration",
          minimum: this.config.bufferRange.minimum,
          maximum: this.config.bufferRange.maximum,
          labels: [this.config.bufferRange.minimum, this.config.bufferRange.maximum],
          style: "height:2em;font-size:75%;color:#fff"
        }, rulesNodeLabels);

        var discreteVals = Math.abs(Math.round(this.config.bufferRange.maximum -
          this.config.bufferRange.minimum)) + 1;

        var startVal = this.config.bufferRange.minimum + 10;
        if (startVal > this.config.bufferRange.maximum) {
          startVal = this.config.bufferRange.minimum;
        }

        this.horizontalSlider = new HorizontalSlider({
          value: startVal,
          minimum: this.config.bufferRange.minimum,
          maximum: this.config.bufferRange.maximum,
          discreteValues: discreteVals,
          intermediateChanges: false,
          showButtons: false,
          style: "width:180px;"
        }, sliderNode);

        this.own(on(this.horizontalSlider, "change", lang.hitch(this, this._sliderChange)));

        this.horizontalSlider.startup();
        sliderLabels.startup();

        this.sliderValue.set("value", startVal);

        var defTab = {
          type: "incidents",
          label: this.nls.incident,
          color: this.config.color
        };
        this.config.tabs.splice(0, 0, defTab);

        //tabs
        var pContainer = this.panelContainer;
        var pTabs = dom.byId("IMT_tabs");
        var wTabs = 0;
        for (var i = 0; i < this.config.tabs.length; i++) {
          var obj = this.config.tabs[i];
          var label = obj.label;
          if (obj.type === "weather") {
            label = this.nls.weather;
          }
          if (!label || label === "") {
            label = obj.layers;
          }
          var tab = domConstruct.create("div", {
            id: "tab" + i,
            innerHTML: utils.sanitizeHTML(label ? label : '')
          }, pTabs);
          domClass.add(tab, "IMTTab");
          wTabs += domGeom.position(tab).w;
          on(tab, "click", lang.hitch(this, this._clickTab, i));
          if (i > 0) {
            var panel = domConstruct.create("div", {
              id: "tabPanel" + i,
              innerHTML: this.nls.defaultTabMsg
            }, pContainer);
            domClass.add(panel, "IMT_tabPanel");

            // incidents
            //if (obj.type === "incidents") {}

            // summary
            if (obj.type === "summary") {
              obj.summaryInfo = new SummaryInfo(obj, panel, this);
            }

            // weather
            if (obj.type === "weather") {
              obj.weatherInfo = new WeatherInfo(obj, panel, this);
            }

            // closest
            if (obj.type === "closest") {
              obj.closestInfo = new ClosestInfo(obj, panel, this);
            }

            // proximity
            if (obj.type === "proximity") {
              obj.proximityInfo = new ProximityInfo(obj, panel, this);
            }

          }
        }
        wTabs += 10;
        domStyle.set(pTabs, "width", wTabs + "px");

      },

      // load UI
      _loadUI: function() {

        // Incidents
        for (var i = 0; i < 4; i++) {
          var btn = dom.byId("btn" + i);
          html.setAttr(btn, 'src', this.folderUrl + 'images/btn' + i + '.png');
          this.own(on(btn, "click", lang.hitch(this, this._clickIncidentsButton, i)));
        }

        this.toolbar = new Draw(this.map, {
          tooltipOffset: 20,
          drawTime: 90
        });
        this.toolbar.on("draw-end", lang.hitch(this, this._drawIncident));

        this.own(on(this.horizontalSlider, "change", lang.hitch(this, this._sliderChange)));

        this.own(on(this.sliderValue, "keyup", lang.hitch(this, function(event) {
          if (event.keyCode === keys.ENTER) {
            this._updateSliderValue();
          } else {
            var num = this.sliderValue.get("value");
            if (isNaN(num)) {
              this.sliderValue.set("value", this.horizontalSlider.value);
            } else {
              if (num < this.config.bufferRange.minimum) {
                this.sliderValue.set("value", this.config.bufferRange.minimum);
              }
              if (num > this.SLIDER_MAX_VALUE) {
                this.sliderValue.set("value", this.SLIDER_MAX_VALUE);
              }
            }
          }
        })));

        //this.own(on(this.sliderValue, "blur", lang.hitch(this, this._sliderTextChange)));

      },

      _locateBuffer: function(obj) {
        if (obj !== null) {
          var bufferExtent;
          if (obj.type === "extent") {
            bufferExtent = obj;
          } else {
            bufferExtent = obj.geometry.getExtent();
          }

          if (bufferExtent !== null) {
            bufferExtent = bufferExtent.expand(1.5);

            // move it up to avoid overlapping the widget
            var thisWidgetHeight = 80;
            var percent_to_moveUp = thisWidgetHeight / this.map.height;
            var eHeight = bufferExtent.getHeight();
            bufferExtent.update(bufferExtent.xmin, bufferExtent.ymin -
              eHeight * percent_to_moveUp, bufferExtent.xmax, bufferExtent.ymax -
              eHeight * percent_to_moveUp, this.map.spatialReference);

            this.map.setExtent(bufferExtent, true);
          }
        }
      },

      // click incidents button
      _clickIncidentsButton: function(num) {
        var btn;
        if (num < 3) {
          for (var i = 0; i < 3; i++) {
            btn = dom.byId("btn" + i);
            domClass.remove(btn, "btnOn");
          }
          if (num > -1 && num !== this.tool) {
            btn = dom.byId("btn" + num);
            domClass.add(btn, "btnOn");
            this.tool = num;
          } else {
            this.tool = -1;
          }
          switch (this.tool) {
            case -1:
              this.toolbar.deactivate();
              this.enableWebMapPopup();
              break;
            case 0:
              this._clear();
              this.toolbar.activate(Draw.POINT);
              this.disableWebMapPopup();
              break;
            case 1:
              this._clear();
              this.toolbar.activate(Draw.POLYLINE);
              this.disableWebMapPopup();
              break;
            case 2:
              this._clear();
              this.toolbar.activate(Draw.POLYGON);
              this.disableWebMapPopup();
              break;
          }
        } else {
          this._clear();
        }
      },

      _clear: function() {
        this.map.graphics.clear();
        this.lyrIncidents.clear();
        this.lyrBuffer.clear();
        this.lyrProximity.clear();
        this.lyrClosest.clear();
        this.incident = null;
        this.buffer = null;
        this.div_reversed_address.innerHTML = "";
        html.setStyle(this.div_reverse_geocoding, 'visibility', 'hidden');
        for (var i = 1; i < this.config.tabs.length; i++) {
          if (dom.byId("tabPanel" + i)) {
            dom.byId("tabPanel" + i).innerHTML = this.nls.defaultTabMsg;
          }
        }
      },

      _sliderChange: function() {
        this.sliderValue.set("value", this.horizontalSlider.value);
        this._bufferIncident();
      },

      _sliderTextChange: function() {
        if (this.sliderValue.value < 0 || this.sliderValue.value > this.SLIDER_MAX_VALUE) {
          // new Message({
          //   message: this.nls.sliderTextOutOfRange
          // });
          this.sliderValue.set("value", this.horizontalSlider.value);
        } else {
          this.horizontalSlider.set("value", this.sliderValue.value);
        }
      },

      _updateSliderValue: function() {
        if (this.sliderValue.displayedValue < 0 ||
          this.sliderValue.displayedValue > this.SLIDER_MAX_VALUE) {
          // new Message({
          //   message: this.nls.sliderTextOutOfRange
          // });
          this.sliderValue.set("value", this.horizontalSlider.value);
        } else {
          this.horizontalSlider.set("value", this.sliderValue.displayedValue);
        }
      },

      // click tab
      _clickTab: function(num) {
        this._toggleTabs(num);
        this._toggleTabLayers(num);
        this.curTab = num;
        this._clickIncidentsButton(-1);
      },

      // toggle tabs
      _toggleTabs: function(num) {
        for (var i = 0; i < this.config.tabs.length; i++) {
          if (i === num) {
            domClass.add("tab" + i, "active");
            domStyle.set("tabPanel" + i, "display", "block");
          } else {
            domClass.remove("tab" + i, "active");
            domStyle.set("tabPanel" + i, "display", "none");
          }
        }
        this._scrollToTab(num);
      },

      // get tab layers visibility
      _getTabLayersVisibility: function() {
        array.forEach(this.config.tabs, lang.hitch(this, function(tab) {
          array.forEach(tab.tabLayers, lang.hitch(this, function(layer) {
            if (typeof(layer.visible) !== 'undefined') {
              this.tabLayersVisibility[layer.id] = layer.visible;
              layer.setVisibility(false);
            }
          }));
        }));
      },

      // set tab layers visibility
      _setTabLayersVisibility: function() {
        array.forEach(this.config.tabs, lang.hitch(this, function(tab) {
          array.forEach(tab.tabLayers, lang.hitch(this, function(layer) {
            if (layer.id in this.tabLayersVisibility) {
              layer.setVisibility(this.tabLayersVisibility[layer.id]);
            }
          }));
        }));
      },

      // toggale tab layers
      _toggleTabLayers: function(num) {
        // old tab
        this._toggleTabLayersOld();
        // new tab
        this._toggleTabLayersNew(num);
      },

      // toggle tab layers old
      _toggleTabLayersOld: function() {
        var oldTab = this.config.tabs[this.curTab];
        if (!oldTab) {
          return;
        }
        this.lyrClosest.setVisibility(false);
        this.lyrProximity.setVisibility(false);
        if (oldTab.tabLayers) {
          array.forEach(oldTab.tabLayers, function(layer) {
            if (typeof(layer.visible) !== 'undefined') {
              layer.setVisibility(false);
            }
          });
        }
      },

      // toggle tab layers new
      _toggleTabLayersNew: function(num) {
        var tab = this.config.tabs[num];
        switch (tab.type) {
          case "incidents":
            break;
          case "summary":
            if (this.incident && tab.updateFlag === true) {
              tab.summaryInfo.updateForIncident(this.incident, this.buffer);
              tab.updateFlag = false;
            }
            break;
          case "weather":
            if (tab.tabLayers) {
              array.forEach(tab.tabLayers, function(layer) {
                layer.setVisibility(true);
              });
            }
            if (this.incident && tab.updateFlag === true) {
              tab.weatherInfo.updateForIncident(this.incident);
              tab.updateFlag = false;
            }
            break;
          case "closest":
            if (tab.tabLayers) {
              array.forEach(tab.tabLayers, function(layer) {
                if (typeof(layer.visible) !== 'undefined') {
                  layer.setVisibility(true);
                }
              });
            }
            this.lyrClosest.setVisibility(true);
            if (this.incident && tab.updateFlag === true) {
              tab.closestInfo.updateForIncident(this.incident,
                this.config.maxDistance, this.lyrClosest);
              tab.updateFlag = false;
            }
            break;
          case "proximity":
            if (tab.tabLayers) {
              array.forEach(tab.tabLayers, function(layer) {
                if (typeof(layer.visible) !== 'undefined') {
                  layer.setVisibility(true);
                }
              });
            }
            this.lyrProximity.setVisibility(true);
            if (this.incident && tab.updateFlag === true) {
              tab.proximityInfo.updateForIncident(this.incident, this.buffer, this.lyrProximity);
              tab.updateFlag = false;
            }
            break;
        }
        tab.updateFlag = false;
      },

      // draw incidents
      _drawIncident: function(evt) {
        //this.lyrIncidents.clear();
        var type = evt.geometry.type;
        var sym = this.symPoint;
        if (type === "polyline") {
          sym = this.symLine;
        }
        if (type === "polygon") {
          sym = this.symPoly;
        }
        this.incident = new Graphic(evt.geometry, sym);
        this.lyrIncidents.add(this.incident);
        this.toolbar.deactivate();
        this._clickIncidentsButton(-1);
        this._bufferIncident();
        if (type === "point") {
          this._getIncidentAddress(evt.geometry);
        }
        this.div_reversed_address.innerHTML = "";
        html.setStyle(this.div_reverse_geocoding, 'visibility', 'hidden');
      },

      // get incident address
      _getIncidentAddress: function(pt) {
        this.map.graphics.clear();
        this.locator.locationToAddress(webMercatorUtils.webMercatorToGeographic(pt), 100);
      },

      // show incident address
      _showIncidentAddress: function(evt) {
        if (evt.address.address) {
          var address = evt.address.address.Address;
          var location = webMercatorUtils.geographicToWebMercator(evt.address.location);
          var fnt = new Font();
          fnt.family = "Arial";
          fnt.size = "18px";
          var symText = new TextSymbol(address, fnt, "#000000");
          symText.setOffset(20, -4);
          symText.horizontalAlignment = "left";
          this.map.graphics.add(new Graphic(location, symText, {}));

          var str_complete_address = address + "</br>" + evt.address.address.City +
            ", " + evt.address.address.Region + " " + evt.address.address.Postal;

          this.div_reversed_address.innerHTML = str_complete_address;
          html.setStyle(this.div_reverse_geocoding, 'visibility', 'visible');
        }
      },

      _onAddressError: function() {
        this.div_reversed_address.innerHTML = this.nls.reverse_geocoded_error;
        html.setStyle(this.div_reverse_geocoding, 'visibility', 'visible');
      },

      // buffer incident
      _bufferIncident: function() {
        if (this.incident === null) {
          return;
        }

        for (var i = 0; i < this.config.tabs.length; i++) {
          var t = this.config.tabs[i];
          t.updateFlag = true;
        }

        var gra = this.incident;
        this.buffer = null;
        this.lyrBuffer.clear();
        var dist1 = this.horizontalSlider.value;
        var unit1 = this.config.distanceUnits;
        var unitCode = this.config.distanceSettings[unit1];

        if (dist1 > 0) {

          var wkid = gra.geometry.spatialReference.wkid;
          var bufferGeom;
          if (wkid === 4326 || wkid === 3587 || wkid === 102100) {
            bufferGeom = geometryEngine.geodesicBuffer(gra.geometry, dist1, unitCode);
          } else {
            bufferGeom = geometryEngine.buffer(gra.geometry, dist1, unitCode);
          }
          this._locateBuffer(bufferGeom.getExtent());
          this.buffer = new Graphic(bufferGeom, this.symBuffer);
          this.lyrBuffer.add(this.buffer);
          this._performAnalysis();

        } else {

          if (gra.geometry.type === "polygon") {
            this._locateBuffer(gra.geometry.getExtent());
            this.buffer = new Graphic(gra.geometry, this.symPoly);
            this.lyrBuffer.add(this.buffer);
            this._performAnalysis();
          }
        }

      },

      _performAnalysis: function() {
        this._toggleTabLayersNew(this.curTab);
      },

      // VERIFY ROUTING
      _verifyRouting: function() {
        if (this.config.enableRouting) {
          this.config.enableRouting = false;
          var widgets = this.appConfig.widgetPool.widgets;
          array.forEach(widgets, lang.hitch(this, function(w) {
            if (w.name === "Directions") {
              this.dirConfig = w;
              this.config.enableRouting = true;
            }
          }));
        }
      },

      // ZOOM TO LOCATION
      zoomToLocation: function(loc) {
        this.map.centerAndZoom(loc, this.config.defaultZoomLevel);
      },

      // ROUTE TO INCIDENT
      routeToIncident: function(loc) {
        var geom = this.incident.geometry;
        var pt = geom;
        if (geom.type !== "point") {
          pt = geom.getExtent().getCenter();
        }
        this.stops = [loc, pt];
        // TO DO: send data to directions widget
        var id = this.dirConfig.id;
        var name = this.appConfig.theme.name;
        var controllerWidget = this.widgetManager.getControllerWidgets()[0];
        switch (name) {
          case "BoxTheme":
          case "DartTheme":
            controllerWidget.setOpenedIds([id]);
            break;
          case "FoldableTheme":
          case "JewelryBoxTheme":
            var node = controllerWidget._getIconNodeById(id);
            if (node) {
              controllerWidget._onIconClick(node);
            }
            break;
          case "TabTheme":
            controllerWidget._hideOffPanelWidgets();
            var tabs = controllerWidget.tabs;
            var idx = 0;
            for (var i = 0; i < tabs.length; i++) {
              if (tabs[i].flag !== "more") {
                if (tabs[i].config.id === id) {
                  idx = i;
                  break;
                }
              } else {
                idx = i;
                var groups = tabs[i].config.groups;
                for (var j = 0; j < groups.length; j++) {
                  if (groups[j].id === id) {
                    controllerWidget._addGroupToMoreTab(groups[j]);
                  }
                }
              }
            }
            controllerWidget.selectTab(idx);
            setTimeout(lang.hitch(controllerWidget, controllerWidget._resizeToMax), 500);
            break;
          case "LaunchpadTheme":
            controllerWidget.setOpenedIds([id]);
            break;
          default:
            this.openWidgetById(id);
            break;
        }
        setTimeout(lang.hitch(this, this._addStops), 2000);
      },

      _addStops: function() {
        var w = this.widgetManager.getWidgetById(this.dirConfig.id);
        if (w && w.state !== "closed") {
          var d = w._dijitDirections;
          if (d) {
            d.reset();
            d.addStops(this.stops);
          }
        }
      },

      // get tab layers
      _getTabLayers: function(names) {
        var lyrs = [];
        array.forEach(this.opLayers._layerInfos, lang.hitch(this, function(layer) {
          if (layer.newSubLayers.length > 0) {
            this._recurseOpLayers(layer.newSubLayers, lyrs, names);
          } else {
            if (names.indexOf(layer.title) > -1) {
              //layer.layerObject.setVisibility(false);
              lyrs.push(layer.layerObject);
            }
          }
        }));
        return lyrs;
      },

      _recurseOpLayers: function(pNode, pLyrs, pNames) {
        var nodeGrp = pNode;
        array.forEach(nodeGrp, lang.hitch(this, function(Node) {
          if (Node.newSubLayers.length > 0) {
            this._recurseOpLayers(Node.newSubLayers, pLyrs, pNames);
          } else {
            if (pNames.indexOf(Node.title) > -1) {
              pLyrs.push(Node.layerObject);
            }
          }
        }));
      },

      // setup symbols
      _setupSymbols: function() {
        var symColor = Color.fromString(this.config.color);
        var rgb = symColor.toRgb();
        rgb.push(0.2);
        var blackColor = Color.fromString("#000000");
        var darkColor = Color.blendColors(symColor, blackColor, 0.2);
        var rgb2 = darkColor.toRgb();
        var cls = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
          new Color([255, 255, 255, 0.25]), 1);

        this.symPoint = new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_CIRCLE, 20, cls, new Color([rgb2[0], rgb2[1], rgb2[2], 0.7]));
        this.symLine = new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID, new Color([rgb2[0], rgb2[1], rgb2[2], 0.7]), 3);
        this.symPoly = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID, this.symLine, new Color([rgb2[0], rgb2[1], rgb2[2], 0.3]));
        this.symBuffer = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID, cls, new Color(rgb));
      },

      onReceiveData: function(name, widgetId, data) {
        if (data !== null && data.eventType) {
          if (data.eventType === "IncidentLocation") {
            if (data.dataValue && data.dataValue !== null) {
              this._clear();
              this._clickTab(0);
              var feature = data.dataValue;
              // if shapefile, use as incident directly
              if (feature.attributes[this.shapeFlagFieldName]) {
                this.incident = feature;
                this._bufferIncident();
              } else {
                this._drawIncident(feature);
              }
            }
          } else if (data.eventType === "WebMapChanged") {
            this._storeIncidents();
          }
        }
      },

      _storeIncidents: function() {
        if (this.incident !== null) {
          var obj_to_store = {
            "location": JSON.stringify(this.incident.geometry),
            "hasBuffer": this.lyrBuffer.graphics.length > 0,
            "buffer_dist": this.horizontalSlider.value,
            "unit": this.config.distanceUnits
          };
          var s_obj = JSON.stringify(obj_to_store);

          window.localStorage.setItem(this.Incident_Local_Storage_Key, s_obj);
          console.log("Inclident saved to storage");
        }
        this.publishData({
          "eventType": "WebMapChangedACK"
        });
        console.log("eventType WebMapChangedACK fired");
      },

      _restoreIncidents: function() {
        var stored_incident = window.localStorage.getItem(this.Incident_Local_Storage_Key);
        if (stored_incident !== null && stored_incident !== "null") {
          window.localStorage.setItem(this.Incident_Local_Storage_Key, null);

          var obj = JSON.parse(stored_incident, true);

          var buffer_dist = obj.buffer_dist;

          this.sliderValue.set("value", buffer_dist);
          this.horizontalSlider.set("value", buffer_dist);

          var incident_geog = JSON.parse(obj.location);
          var hasBuffer = obj.hasBuffer;

          if (incident_geog) {
            obj = {};
            var ags_geog = null;
            if (incident_geog.type === "extent") {
              ags_geog = new Extent(incident_geog);
            } else if (incident_geog.type === "multipoint") {
              ags_geog = new Multipoint(incident_geog);
            } else if (incident_geog.type === "point") {
              ags_geog = new Point(incident_geog);
            } else if (incident_geog.type === "polygon") {
              ags_geog = new Polygon(incident_geog);
            } else if (incident_geog.type === "polyline") {
              ags_geog = new Polyline(incident_geog);
            }

            obj.geometry = ags_geog;
            this._drawIncident(obj, hasBuffer);
          }

        }
      },

      // _scroll to tab
      _scrollToTab: function(num) {
        var boxW = domGeom.position(this.footerContentNode).w;
        var tabsW = domGeom.position(this.tabsNode).w;
        if (tabsW > boxW) {
          var box = domGeom.getMarginBox("tab" + num);
          var dist = box.l - (boxW - box.w) / 2;
          this.footerContentNode.scrollLeft = dist;
        }
      },

      // close
      _close: function() {
        this.widgetManager.closeWidget(this.id);
      }

    });
  });
