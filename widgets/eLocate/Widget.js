///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eLocate Widget
///////////////////////////////////////////////////////////////////////////
/*global define, console, setTimeout, clearTimeout*/
define([
  'dojo/_base/declare',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/TabContainer',
  './List',
  './CountryCodes',
  'jimu/dijit/Message',
  'esri/layers/GraphicsLayer',
  'esri/tasks/GeometryService',
  'esri/config',
  'esri/graphic',
  'esri/graphicsUtils',
  'esri/geometry/Point',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/PictureMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/Color',
  'esri/geometry/Extent',
  'esri/geometry/Geometry',
  'esri/symbols/SimpleFillSymbol',
  'esri/renderers/SimpleRenderer',
  'esri/dijit/PopupTemplate',
  'esri/request',
  'esri/tasks/locator',
  'esri/toolbars/draw',
  'esri/symbols/jsonUtils',
  'esri/tasks/AddressCandidate',
  'dojo/i18n!esri/nls/jsapi',
  'dojo/Deferred',
  'dijit/ProgressBar',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/aspect',
  'dojo/_base/html',
  'dojo/dom-class',
  'dojo/_base/array',
  'jimu/utils',
  'jimu/dijit/LoadingShelter',
  'dojo/io-query',
  'esri/SpatialReference',
  'esri/tasks/ProjectParameters',
  'esri/geometry/webMercatorUtils',
  'jimu/WidgetManager',
  'jimu/PanelManager',
  'dijit/form/Select',
  'jimu/dijit/CheckBox'],
  function (declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, List, CountryCodes,
    Message, GraphicsLayer, GeometryService, esriConfig, Graphic, graphicsUtils, Point, SimpleMarkerSymbol,
    PictureMarkerSymbol, SimpleLineSymbol, Color, Extent, Geometry, SimpleFillSymbol,
    SimpleRenderer, PopupTemplate, esriRequest, locator, Draw, jsonUtils, AddressCandidate, esriBundle,
    Deferred, ProgressBar, lang, on, aspect, html, domClass, array, utils, LoadingShelter, ioquery,
    SpatialReference, ProjectParameters, webMercatorUtils, WidgetManager, PanelManager
  ) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], { /*jshint unused: false*/
      baseClass: 'widget-eLocate',
      progressBar: null,
      tabContainer: null,
      disabledTabs: null,
      list: null,
      selTab: null,
      graphicsLayer: null,
      enableGraphicClickInfo: true,
      timer2: null,
      timer: null,
      autoCloseNum: null,
      enableMoverRec: false,
      infoWinMouseOver: null,
      infoWinMouseOut: null,
      wManager: null,
      pManager: null,
      addressTab: true,
      coordTab: true,
      revTab: true,
      rsltsTab: true,
      _locatorUrl: "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
      _unitArr: null,
      locateResultArr: null,
      zoomScale: null,
      forceScale: null,
      drawToolBar: null,
      _defaultAddPointStr: "",
      serviceWKID: null,
      geocode: {},
      rGeoMarkerSymbol: null,
      addressMarkerSymbol: null,
      coordMarkerSymbol: null,

      postCreate: function () {
        this.inherited(arguments);
        this.drawLayer = new GraphicsLayer({id:"DrawGL"});
        this.list.zoom2msg = this.nls.zoom2message;
        this.list.removeResultMsg =  this.nls.removeresultmessage;
        this._initTabContainer();
        this._initProgressBar();
        this._initUnitsDD();
        this._initDraw();
        this._initLocator();
        this._initSymbols();
        this._bindEvents();

        this.wManager = WidgetManager.getInstance();
        this.pManager = PanelManager.getInstance();
        this._addThemeFixes();

        this.own(on(this.domNode, 'mousedown', lang.hitch(this, function (event) {
          event.stopPropagation();
          if (event.altKey) {
            var msgStr = this.nls.widgetverstr + ': ' + this.manifest.version;
            msgStr += '\n' + this.nls.wabversionmsg + ': ' + this.manifest.wabVersion;
            msgStr += '\n' + this.manifest.description;
            new Message({
              titleLabel: this.nls.widgetversion,
              message: msgStr
            });
          }
        })));
        this.zoomScale = this.config.zoomscale || 5000;
        this.forceScale = this.config.forcescale || false;
        this.minscore = Number(this.config.minscore) || 40;
        this.enableMoverRec = this.config.enablemouseoverrecordinfo;
        this.enableMoverGra = this.config.enablemouseovergraphicsinfo;
        this.autoCloseNum = this.config.infoautoclosemilliseconds || Number.NEGATIVE_INFINITY;
        this.cbxAddSearchExtent.setValue(this.config.limitsearchtomapextentbydefault || false);
      },

      _bindEvents: function() {
        this.own(on(this.btnClear, 'click', lang.hitch(this, this._clear)));
        html.setStyle(this.btnClear, 'display', 'none');
        this.own(on(this.list, 'remove', lang.hitch(this, this._removeResultItem)));
        this.own(on(this.btnClear2, 'click', lang.hitch(this, this._clear)));
        html.setStyle(this.btnClear2, 'display', 'none');
        this.own(on(this.btnClear1, 'click', lang.hitch(this, this._clear)));
        html.setStyle(this.btnClear1, 'display', 'none');
        this.own(on(this.btnCoordLocate, "click", lang.hitch(this, this.prelocateCoords)));
        this.own(on(this.revGeocodeBtn, "click", lang.hitch(this, this._reverseGeocodeToggle)));
        this.own(on(this.CoordHintText, "click", lang.hitch(this, this._addExampleText)));
        this.own(on(this.btnAddressLocate, "click", lang.hitch(this, this._locateAddress)));
        this.own(on(this.AddressTextBox, 'keydown', lang.hitch(this, function(evt){
          var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
          if (keyNum === 13) {
            this._locateAddress();
          }
        })));
      },

      startup: function () {
        this.inherited(arguments);

        this.graphicsLayer = new GraphicsLayer();
        this.graphicsLayer.name = 'eLocate Results';
        this.map.addLayer(this.graphicsLayer);
        if(this.enableMoverGra){
          this.graphicsLayer.on('mouse-over', lang.hitch(this, this.mouseOverGraphic));
        }
      },

      _initSymbols: function () {
        var addJson = lang.clone(this.config.symbols.addresspicturemarkersymbol);
        addJson.url = this.folderUrl + addJson.url;

        var geoJson = lang.clone(this.config.symbols.geopicturemarkersymbol);
        geoJson.url = this.folderUrl + geoJson.url;

        var coordJson = lang.clone(this.config.symbols.coordpicturemarkersymbol);
        coordJson.url = this.folderUrl + coordJson.url;

        this.rGeoMarkerSymbol = jsonUtils.fromJson(geoJson);
        this.coordMarkerSymbol = jsonUtils.fromJson(coordJson);
        this.addressMarkerSymbol = jsonUtils.fromJson(addJson);
      },

      _initLocator: function () {
        var locatorUrl = this.config.locator.url || this._locatorUrl;
        this.geocode.url = locatorUrl;
        var rGeocode = this._getLocatorInfo(this.geocode);
        if(rGeocode){
          if(rGeocode.version < 10.1){
            html.setStyle(this.cbxAddSearchExtent, 'display', 'none');
          }
          this.locator = new locator(locatorUrl);
          this.locator.outSpatialReference = this.map.spatialReference;
        }else{
          new Message({
            titleLabel: this.nls.locatorissue,
            message: this.nls.locatorissuemessage
          });
          html.replaceClass(this.tabNode1, 'eLocate-tab-node-hidden', 'eLocate-tab-node');
        }
      },

      _getLocatorInfo: function(geocode) {
        var def = new Deferred();
        esriRequest({
          url: geocode.url,
          content: {
            f: "json"
          },
          handleAs: "json",
          callbackParamName: "callback"
        }).then(lang.hitch(this, function(response) {
          if (response.singleLineAddressField && response.singleLineAddressField.name) {
//            console.info(response);
            geocode.singleLineFieldName = response.singleLineAddressField.name;
            geocode.version = response.currentVersion;
            this.serviceWKID = response.spatialReference.wkid;
            def.resolve(geocode);
          } else {
            console.warn(geocode.url + "has no singleLineFieldName");
            def.resolve(null);
          }
        }), lang.hitch(this, function(err) {
          console.error(err);
          def.resolve(null);
        }));

        return def;
      },

      _initDraw: function () {
        this._defaultAddPointStr = esriBundle.toolbars.draw.addPoint;
        this.drawToolBar = new Draw(this.map);
        this.map.addLayer(this.drawLayer);
        this.pointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_X, 12, null, new Color(255,0,0,255));
        this.drawToolBar.setMarkerSymbol(this.pointSymbol);
        this.own(on(this.drawToolBar, 'draw-end', lang.hitch(this, this._onDrawEnd)));
      },

      _onDrawEnd: function(event) {
        var g = new Graphic(event.geometry, this.pointSymbol, null, null);
        this.drawLayer.clear();
        this.drawLayer.add(g);
        this.locator.locationToAddress(event.geometry, 30, lang.hitch(this, this.rlocateResult),
                                      lang.hitch(this, this.locateError));
        if(!this.config.keepinspectoractive){
          var node = this.revGeocodeBtn;
          domClass.remove(node, "selected");
          this.drawToolBar.deactivate();
          this.drawActive = false;
          esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;
          this.enableWebMapPopup();
        }
      },

      locateError: function (info) {
        console.error(info);
        if(!this.config.keepinspectoractive){
          this._reverseGeocodeToggle();
        }
        new Message({
          titleLabel: this.nls.reversegeocodefailtitle,
          message: this.nls.reversegeocodefailmsg
        });
      },

      rlocateResult: function (event) {
        this.disableTimer();
        this._hideInfoWindow();
        this.list.clear();
        this.locateResultArr = this.createAddressInspectorResult(event);
        this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.locateResultArr.length;
        if (this.locateResultArr.length > 0){
          this.list.add(this.locateResultArr[0]);
          this.tabContainer.selectTab(this.nls.resultslabel);
          this.showLocation(this.locateResultArr[0]);
        }
      },

      createAddressInspectorResult: function(addrCandidate) {
        var result = [];

        var sAdd = this.standardizeAddress(addrCandidate);
        var locateResult = {};
        locateResult.sym = this.rGeoMarkerSymbol;
        locateResult.title = addrCandidate.address.Address ? String(addrCandidate.address.Address) : addrCandidate.address.Street ? String(addrCandidate.address.Street) : this.manifest.name;
        locateResult.content = locateResult.rsltcontent = "<em>" + this.nls.address + "</em>: " +
          sAdd + "<br><em>" + this.nls.coordinates + "</em>: " +
          (addrCandidate.location.x).toFixed(2) + ", " + (addrCandidate.location.y).toFixed(2);
        locateResult.point = addrCandidate.location;
        locateResult.alt = false;
        locateResult.id = 'id_1';
        var projParams = new ProjectParameters();
        if (!locateResult.point.spatialReference && !isNaN(this.serviceWKID)){ // AGS 9.X returns locations w/o a SR and doesn't support outSR
          locateResult.point.setSpatialReference(new SpatialReference(this.serviceWKID));
          if (webMercatorUtils.canProject(locateResult.point, this.map)) {
            locateResult.point = webMercatorUtils.project(locateResult.point, this.map);
          }else{
            projParams.geometries = [locateResult.point];
            projParams.outSR = this.map.spatialReference;
            esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandler,addrCandidate),
                                                        lang.hitch(this, this.geometryService_faultHandler));
          }
        }else if (locateResult.point.spatialReference){
          if (webMercatorUtils.canProject(locateResult.point, this.map)) {
            locateResult.point = webMercatorUtils.project(locateResult.point, this.map);
          }else{
            projParams.geometries = [locateResult.point];
            projParams.outSR = this.map.spatialReference;
            esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandler,addrCandidate),
                                                        lang.hitch(this, this.geometryService_faultHandler));
          }
        }

        result.push(locateResult);
        return result;
      },

      standardizeAddress: function(result) {
        var retStr = "";
//        console.info(result.address);
        if(result.address.Address){
            retStr += result.address.Address + "\n";
        }else if(result.address.Street){
            retStr += result.address.Street + "\n";
        }
        if(result.address.City){
            retStr += result.address.City + ", ";
        }
        if(result.address.State){
            retStr += result.address.State + " ";
        }else if(result.address.Region){
            retStr += result.address.Region + " ";
        }
        if(result.address.Postal){
            retStr += result.address.Postal;
        }else if(result.address.Zip4){
            retStr += result.address.Zip4;
        }else if(result.address.Zip){
            retStr += result.address.Zip;
        }
        if(result.address.CountryCode && result.address.CountryCode != "USA"){
          retStr += " " + this.toProperCase(CountryCodes[result.address.CountryCode]) || result.address.CountryCode;
        }
        return retStr;
      },

      toProperCase: function (str) {
        return str.replace(/\w\S*/g, function(str){return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();});
      },

      _initUnitsDD: function() {
        this._unitArr = [];
        var options = [];
        var len = this.config.pointunits.pointunit.length;
        for (var i = 0; i < len; i++) {
          this._unitArr.push(lang.clone(this.config.pointunits.pointunit[i]));
          var option = {
            value: i,
            label: this.config.pointunits.pointunit[i].name
          };
          options.push(option);
          if (i === 0) {
            options[i].selected = true;
            this.xCoordLbl.innerHTML = this.config.pointunits.pointunit[i].xlabel;
            this.yCoordLbl.innerHTML = this.config.pointunits.pointunit[i].ylabel;
            this.CoordHintLbl.innerHTML = this.nls.example;
            this.CoordHintText.innerHTML = this.config.pointunits.pointunit[i].example;
          }
        }
        this.unitdd.addOption(options);
        this.own(on(this.unitdd, "change", lang.hitch(this, this._unitDDChanged)));
      },

      _unitDDChanged: function (newValue){
        this.xCoordLbl.innerHTML = this._unitArr[newValue].xlabel;
        this.yCoordLbl.innerHTML = this._unitArr[newValue].ylabel;
        this.CoordHintText.innerHTML = this._unitArr[newValue].example;
        this.xCoordTextBox.set('value', '');
        this.yCoordTextBox.set('value', '');
      },

      isSelTabVisible: function () {
        switch (this.selTab) {
          case this.nls.addresslabel:
            return this.addressTab;
          case this.nls.coordslabel:
            return this.coordTab;
          case this.nls.addressinsplabel:
            return this.revTab;
          case this.nls.resultslabel:
            return this.rsltsTab;
        }
      },

      _reverseGeocodeToggle: function () {
        var node = this.revGeocodeBtn;
        if(domClass.contains(node, 'selected')){
          domClass.remove(node, "selected");
          this.drawToolBar.deactivate();
          this.drawActive = false;
          esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;
          this.enableWebMapPopup();
        } else {
          domClass.add(node, "selected");
          this.disableWebMapPopup();
          esriBundle.toolbars.draw.addPoint = this.nls.drawpointtooltip;
          this.drawToolBar.activate(Draw.POINT);
          this.drawActive = true;
        }
      },

      disableWebMapPopup:function(){
        if(this.map){
          this.map.setInfoWindowOnClick(false);
        }
      },

      enableWebMapPopup:function(){
        if(this.map){
          this.map.setInfoWindowOnClick(true);
        }
      },

      _initTabContainer: function () {
        if (this.config.hasOwnProperty('disabledtabs')) {
          this.disabledTabs = this.config.disabledtabs;
        } else {
          this.disabledTabs = [];
        }
        var initView = this.config.initialView || "address";
        array.map(this.disabledTabs, lang.hitch(this, function (dTab) {
          if (dTab === 'address') {
            this.addressTab = false;
          }
          if (dTab === 'coordinate') {
            this.coordTab = false;
          }
          if (dTab === 'reverse') {
            this.revTab = false;
          }
          if (dTab === 'result') {
            this.rsltsTab = false;
          }
        }));
        if (initView === "address" && this.addressTab) {
          this.selTab = this.nls.addresslabel;
        } else if (initView === "coordinate" && this.coordTab) {
          this.selTab = this.nls.coordslabel;
        } else if (initView === "reverse" && this.revTab) {
          this.selTab = this.nls.addressinsplabel;
        } else {
          this.selTab = this.nls.addresslabel;
        }
        var tabs = [];
        if (this.addressTab) {
          tabs.push({
            title: this.nls.addresslabel,
            content: this.tabNode1
          });
          html.replaceClass(this.tabNode1, 'eLocate-tab-node', 'eLocate-tab-node-hidden');
        }
        if (this.coordTab) {
          tabs.push({
            title: this.nls.coordslabel,
            content: this.tabNode2
          });
          html.replaceClass(this.tabNode2, 'eLocate-tab-node', 'eLocate-tab-node-hidden');
        }
        if (this.revTab) {
          tabs.push({
            title: this.nls.addressinsplabel,
            content: this.tabNode3
          });
          html.replaceClass(this.tabNode3, 'eLocate-tab-node', 'eLocate-tab-node-hidden');
        }
        if (this.rsltsTab) {
          tabs.push({
            title: this.nls.resultslabel,
            content: this.tabNode4
          });
          html.replaceClass(this.tabNode4, 'eLocate-tab-node', 'eLocate-tab-node-hidden');
        }

        this.tabContainer = new TabContainer({
          tabs: tabs,
          selected: this.selTab
        }, this.tabeLocate);

        this.tabContainer.startup();
        this.own(on(this.tabContainer,'tabChanged',lang.hitch(this,function(title){
          if(title !== this.nls.resultslabel){
            this.selTab = title;
            if(this.drawActive && this.selTab !== this.nls.addressinsplabel){
              var node = this.revGeocodeBtn;
              domClass.remove(node, "selected");
              this.drawToolBar.deactivate();
              this.drawActive = false;
              esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;
              this.enableWebMapPopup();
            }
          }
        })));
        utils.setVerticalCenter(this.tabContainer.domNode);
      },

      _locateAddress: function () {
        this._hideInfoWindow();
        this.graphicsLayer.clear();
        this.list.clear();
        if (this.locateResultArr){
          this.locateResultArr = [];
        }
        this.tabContainer.selectTab(this.nls.resultslabel);
        html.setStyle(this.progressBar.domNode, 'display', 'block');
        html.setStyle(this.divResult, 'display', 'none');
        var params = {};
        params.address = {};
        if(this.config.locator.countryCode){
          params.countryCode = this.config.locator.countryCode;
        }
        params.address[this.geocode.singleLineFieldName] = this.AddressTextBox.get('value');
        console.info(params);
        if(this.cbxAddSearchExtent.getValue()){
          params.searchExtent = this.map.extent;
        }
        this.locator.addressToLocations(params, lang.hitch(this, this.addresslocateResult), lang.hitch(this, this.locateError));
      },

      addresslocateResult: function (addresses) {
        if (addresses.length > 0){
          this.locateResultArr = this.createLocateResults(addresses);
          this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.locateResultArr.length;
          if (this.locateResultArr.length > 0){
            this.showLocation(this.locateResultArr[0]);
          }
          html.setStyle(this.progressBar.domNode, 'display', 'none');
          html.setStyle(this.divResult, 'display', 'block');
        }else{
          html.setStyle(this.progressBar.domNode, 'display', 'none');
          html.setStyle(this.divResult, 'display', 'block');
          this.divResultMessage.textContent = this.nls.noresultsfoundlabel;
        }
      },

      createLocateResults: function(addresses) {
        var result = [];
        array.forEach(addresses, lang.hitch(this,function(addrCandidate, i){
          if(addrCandidate.score >= this.minscore){
            var locateResult = {};
            locateResult.sym = this.addressMarkerSymbol;
            locateResult.title = addrCandidate.address ? String(addrCandidate.address) :
            addrCandidate.street ? String(addrCandidate.street) : this.manifest.name;
            locateResult.content = locateResult.rsltcontent = "<em>" + this.nls.score + "</em>: " +
              (addrCandidate.score % 1 === 0 ? addrCandidate.score : addrCandidate.score.toFixed(1));
            locateResult.point = addrCandidate.location;
            locateResult.alt = (i % 2 === 0);
            locateResult.id = 'id_' + i;
            var projParams = new ProjectParameters();
            if (!locateResult.point.spatialReference && !isNaN(this.serviceWKID)){ // AGS 9.X returns locations w/o a SR and doesn't support outSR
              locateResult.point.setSpatialReference(new SpatialReference(this.serviceWKID));
              if (webMercatorUtils.canProject(locateResult.point, this.map)) {
                locateResult.point = webMercatorUtils.project(locateResult.point, this.map);
              }else{
                projParams.geometries = [locateResult.point];
                projParams.outSR = this.map.spatialReference;
                esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandler, addrCandidate),
                                                            lang.hitch(this, this.geometryService_faultHandler));
              }
            }else if (locateResult.point.spatialReference){
              if (webMercatorUtils.canProject(locateResult.point, this.map)) {
                locateResult.point = webMercatorUtils.project(locateResult.point, this.map);
              }else{
                projParams.geometries = [locateResult.point];
                projParams.outSR = this.map.spatialReference;
                esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandler, locateResult),
                                                            lang.hitch(this, this.geometryService_faultHandler));
              }
            }
            result.push(locateResult);
            this.list.add(locateResult);
          }
        }));
        return result;
      },

      projectCompleteHandler: function (results, locateResult){
        locateResult.point = results[0];
      },

      _addExampleText: function() {
        var exampleArr = this.CoordHintText.innerHTML.split(",");
        this.xCoordTextBox.set('value', exampleArr[0]);
        this.yCoordTextBox.set('value', exampleArr[1]);
      },

      _clear: function () {
        html.setStyle(this.btnClear, 'display', 'none');
        html.setStyle(this.btnClear1, 'display', 'none');
        html.setStyle(this.btnClear2, 'display', 'none');
        this.disableTimer();
        this._hideInfoWindow();
        this.graphicsLayer.clear();
        if (this.list.items.length > 0 && this.isSelTabVisible()) {
          this.tabContainer.selectTab(this.selTab);
        }
        this.list.clear();
        this.divResultMessage.textContent = this.nls.noresultsfoundlabel;
        return false;
      },

      _removeResultItem: function (index, item) {
        var locResult = this.list.items[this.list.selectedIndex];
        this.locateResultArr.splice(this.locateResultArr.indexOf(locResult), 1);
        this.graphicsLayer.remove(locResult.graphic);
        this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.locateResultArr.length;
        if(this.locateResultArr.length === 0){
          this._clear();
          this.disableTimer();
          this._hideInfoWindow();
          return;
        }
        this.list.remove(index);
        this.disableTimer();
        this._hideInfoWindow();
      },

      _overResultItem: function (index, item) {
        this.disableTimer();
        if(!this.map.infoWindow.isShowing){
          var locResult = this.list.items[index];
          if(this.enableMoverRec){
            this.showLocation(locResult);
          }
        }
      },

      _outResultItem: function (index, item) {
        if(this.autoCloseNum != Number.NEGATIVE_INFINITY){
          if(this.enableMoverRec){
            this.timedClose();
          }
        }
      },

      _selectResultItem: function (index, item) {
        var locResult = this.list.items[index];
        this.showLocation(locResult);
      },

      prelocateCoords: function ()  {
        var long = this.xCoordTextBox.get('value');
        var lat = this.yCoordTextBox.get('value');
        if (long && lat){
          var numLong = parseFloat(long);
          var numLat = parseFloat(lat);
          var selUnit = this._unitArr[this.unitdd.get('value')];
          if(selUnit.wkid === this.map.spatialReference.wkid || selUnit.wgs84option == "map"){
            this.locateCoordinates();
          }else{
            this.tabContainer.selectTab(this.nls.resultslabel);
            html.setStyle(this.progressBar.domNode, 'display', 'block');
            html.setStyle(this.divResult, 'display', 'none');
            var point, wmPoint;
            if(selUnit.wgs84option == "dms"){
              numLong = this.dms_to_deg(this.xCoordTextBox.get('value'));
              numLat = this.dms_to_deg(this.yCoordTextBox.get('value'));
              point = new Point(numLong, numLat, new SpatialReference(parseInt(selUnit.wkid)));
              if (webMercatorUtils.canProject(point, this.map)) {
                wmPoint = webMercatorUtils.project(point, this.map);
                this.projectCompleteHandler2([wmPoint]);
                return;
              }
            }else if(selUnit.wgs84option == "dm" || selUnit.wgs84option == "ddm"){
              numLong = this.dm_to_deg(this.xCoordTextBox.get('value'));
              numLat = this.dm_to_deg(this.yCoordTextBox.get('value'));
              point = new Point(numLong, numLat, new SpatialReference(parseInt(selUnit.wkid)));
              if (webMercatorUtils.canProject(point, this.map)) {
                wmPoint = webMercatorUtils.project(point, this.map);
                this.projectCompleteHandler2([wmPoint]);
                return;
              }
            } else {
              point = new Point(numLong, numLat, new SpatialReference(parseInt(selUnit.wkid)));
              if (webMercatorUtils.canProject(point, this.map)) {
                wmPoint = webMercatorUtils.project(point, this.map);
                this.projectCompleteHandler2([wmPoint]);
                return;
              }
            }

            var projParams = new ProjectParameters();
            projParams.geometries = [point];
            projParams.outSR = this.map.spatialReference;
            esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandler2),
                                         lang.hitch(this, this.geometryService_faultHandler));
          }
        }
      },

      projectCompleteHandler2: function (results){
        this.disableTimer();
        this._hideInfoWindow();
        this.list.clear();
        if (this.locateResultArr){
          this.locateResultArr = [];
        }

        try{
          var long = this.xCoordTextBox.get('value');
          var lat = this.yCoordTextBox.get('value');
          if (long && lat){
            var locateResult = {};
            locateResult.sym = this.coordMarkerSymbol;
            locateResult.title = this.nls.coordslabel;
            locateResult.content = locateResult.rsltcontent = "<em>" + this.nls.location + "</em>: " + long + ", " + lat;
            locateResult.point = results[0];
            locateResult.alt = false;
            locateResult.id = 'id_1';

            this.locateResultArr = [locateResult];
            this.list.add(locateResult);
            this.showLocation(locateResult);

            this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.locateResultArr.length;

            html.setStyle(this.progressBar.domNode, 'display', 'none');
            html.setStyle(this.divResult, 'display', 'block');
          }
        }
        catch (error)
        {
          console.info(error);
        }
      },

      geometryService_faultHandler: function(err) {
        console.info(err);
        html.setStyle(this.progressBar.domNode, 'display', 'none');
        html.setStyle(this.divResult, 'display', 'block');
      },

      dms_to_deg: function  (dmsStr) {
        var negNum = false;
        if(dmsStr.toLowerCase().indexOf("w") > -1){
          negNum = true;
        }
        if(dmsStr.toLowerCase().indexOf("s") > -1){
          negNum = true;
        }
        var myPattern = /[WwnNEeSs ]/g;
        dmsStr = dmsStr.replace(myPattern, "");
        var dmsArr = dmsStr.split("-");

        //Compute degrees, minutes and seconds:
        var sec = Number(dmsArr[2]) / 60;
        var min = sec + Number(dmsArr[1]);
        var dec = min / 60;
        var fDeg = dec + Number(dmsArr[0]);
        if(negNum){
          fDeg = -Math.abs(fDeg);
        }
        return fDeg;
      },

      dm_to_deg: function (dmStr) {
        var negNum = false;
        if(dmStr.toLowerCase().indexOf("w") > -1){
          negNum = true;
        }
        if(dmStr.toLowerCase().indexOf("s") > -1){
          negNum = true;
        }
        var myPattern = /[WwnNEeSs ]/g;
        dmStr = dmStr.replace(myPattern, "");
        var dmArr = dmStr.split("-");
        //Compute degrees, minutes:
        var min = Number(dmArr[1]);
        var dec = min / 60;
        var fDeg = dec + Number(dmArr[0]);
        if(negNum){
          fDeg = -Math.abs(fDeg);
        }
        return fDeg;
      },

      locateCoordinates: function (){
        this.disableTimer();
        this._hideInfoWindow();
        this.list.clear();
        if (this.locateResultArr){
          this.locateResultArr = [];
        }

        try{
          var long = this.xCoordTextBox.get('value');
          var lat = this.yCoordTextBox.get('value');
          if (long && lat){
            var numLong = Number(long);
            var numLat = Number(lat);
            if (!isNaN(numLong) && !isNaN(numLat)){
              this.tabContainer.selectTab(this.nls.resultslabel);
              html.setStyle(this.progressBar.domNode, 'display', 'block');
              html.setStyle(this.divResult, 'display', 'none');
              var locateResult = {};
              locateResult.sym = this.coordMarkerSymbol;
              locateResult.title = this.nls.coordslabel;
              locateResult.content = locateResult.rsltcontent = "<em>" + this.nls.location + "</em>: " + long + ", " + lat;
              locateResult.point = new Point(numLong, numLat, this.map.spatialReference);
              locateResult.alt = false;
              locateResult.id = 'id_1';

              this.locateResultArr = [locateResult];
              this.list.add(locateResult);
              this.showLocation(locateResult);

              this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.locateResultArr.length;

              html.setStyle(this.progressBar.domNode, 'display', 'none');
              html.setStyle(this.divResult, 'display', 'block');
            }
          }
        }
        catch (error)
        {
          console.info(error);
        }
      },

      showLocation: function (locResult) {
        this._hideInfoWindow();
        this.graphicsLayer.clear();

        var ptGraphic = new Graphic(locResult.point);
        ptGraphic.setSymbol(locResult.sym);
        var Atts = {
          content: locResult.content,
          title: locResult.title,
          gid: parseInt(locResult.id.replace('id_', ''))
        };
        ptGraphic.attributes = Atts;
        this.graphicsLayer.add(ptGraphic);

        locResult.graphic = ptGraphic;
        if(this.forceScale === true){
          this._setScaleAndCenter(locResult);
        }else{
          if (this.map.getScale() > this.zoomScale){
            this._setScaleAndCenter(locResult);
          }else{
            this.map.centerAt(locResult.point).then(lang.hitch(this, function () {
              this.showInfoWin(locResult);
            }));
          }
        }

        html.setStyle(this.btnClear, 'display', '');
        html.setStyle(this.btnClear1, 'display', '');
        html.setStyle(this.btnClear2, 'display', '');
      },

      _setScaleAndCenter: function(locResult) {
        this.map.setScale(this.zoomScale).then(
          setTimeout(
            lang.hitch(this, function() {
              this.map.centerAt(locResult.point).then(
                lang.hitch(this, function () {
                  this.showInfoWin(locResult);
                })
              );
            }), 1000)
        );
      },

      infoWindowShow: function (locateResult) {
        if (this.map.infoWindow) {
          locateResult.graphic.setInfoTemplate(this._configurePopupTemplate(locateResult));
          if(typeof this.map.infoWindow.setFeatures === 'function'){
            this.map.infoWindow.setFeatures([locateResult.graphic]);
          }
          if(typeof this.map.infoWindow.reposition === 'function'){
            this.map.infoWindow.reposition();
          }
          this.map.infoWindow.show(locateResult.point);
        }
      },

      //mouse over graphic
      mouseOverGraphic: function(event) {
        this.disableTimer();
        var gra = event.graphic;
        if(gra.attributes){
          var locResult = this.getResultByGID(gra.attributes.gid);
          if (this.map.extent.contains(locResult.point)){
            this.showLocation(locResult);
            if(this.autoCloseNum != Number.NEGATIVE_INFINITY){
              this.timedClose();
            }
          }else{
            this._hideInfoWindow();
          }
        }
      },

      getResultByGID: function (gid) {
        var retResult;
        for (var i = 0; i < this.locateResultArr.length; i++){
          var sr = this.locateResultArr[i];
          if(parseInt(sr.id.replace('id_', '')) === gid){
            retResult = sr;
            break;
          }
        }
        return retResult;
      },

      timedClose: function(){
        clearTimeout(this.timer);
        this.timer = setTimeout(
          lang.hitch(this, function(){
            this._hideInfoWindow();
          }
        ),this.autoCloseNum);
      },

      disableTimer: function(){
        clearTimeout(this.timer);
      },

      showInfoWin: function (locResult) {
        if (this.map.infoWindow) {
          locResult.graphic.setInfoTemplate(this._configurePopupTemplate(locResult));
          this.map.infoWindow.setFeatures([locResult.graphic]);
          if (this.map.infoWindow.reposition) {
            this.map.infoWindow.reposition();
          }
          this.map.infoWindow.show(locResult.point.offset(15, 0));
        }
      },

      _initProgressBar: function () {
        this.progressBar = new ProgressBar({
          indeterminate: true
        }, this.progressbar);
        html.setStyle(this.progressBar.domNode, 'display', 'none');
      },

      _configurePopupTemplate: function(listItem){
        var popUpInfo = {};
        popUpInfo.title = '{title}';
        popUpInfo.description = '{content}';
        var pminfos = [];
        var popUpMediaInfo;
        var pt = new PopupTemplate(popUpInfo);
        return pt;
      },

      destroy:function(){
        if(this.drawToolBar){
          this.drawToolBar.deactivate();
        }

        if(this.drawLayer){
          if(this.map){
            this.map.removeLayer(this.drawLayer);
          }
        }

        this.drawToolBar = null;
        this.drawLayer = null;
        this.inherited(arguments);
      },

      onOpen: function () {
        if(this.graphicsLayer){
          this.graphicsLayer.show();
        }
        this.infoWinMouseOver = on(this.map.infoWindow.domNode, 'mouseover', lang.hitch(this, function(){
          this.disableTimer();
        }));

        this.infoWinMouseOut = on(this.map.infoWindow.domNode, 'mouseout', lang.hitch(this, function() {
          if(this.autoCloseNum != Number.NEGATIVE_INFINITY){
            this.timedClose();
          }
        }));
      },

      onClose: function () {
        this._hideInfoWindow();
        this.graphicsLayer.hide();

        this.infoWinMouseOver.remove();
        this.infoWinMouseOut.remove();
      },

      onMinimize: function () {
        this._hideInfoWindow();
        if(this.graphicsLayer){
          this.graphicsLayer.hide();
        }
      },

      _hideInfoWindow: function () {
        if (this.map && this.map.infoWindow) {
          this.map.infoWindow.hide();
          this.map.infoWindow.setTitle('');
          this.map.infoWindow.setContent('');
        }
      },

      _addThemeFixes: function () {
        /*Workaround for the LanunchPad theme not firing onClose and onOpen for the widget*/
        if(this.appConfig.theme.name === "LaunchpadTheme"){
          var tPanel = this.getPanel();
          if(tPanel){
            aspect.after(tPanel, "onClose", lang.hitch(this, this.onClose));
            aspect.after(tPanel, "onOpen", lang.hitch(this, this.onOpen));
          }
        }
        /*end work around for LaunchPad*/
        /*Workaround for TabTheme moregroup not calling onClose and onOpen when the SidebarController is minimized*/
        if(this.appConfig.theme.name === "TabTheme"){
          var sidebarWidget = this.wManager.getWidgetsByName('SidebarController');
          if (sidebarWidget[0]) {
            aspect.after(sidebarWidget[0], "onMinimize", lang.hitch(this, this.onClose));
            aspect.after(sidebarWidget[0], "onMaximize", lang.hitch(this, this.onOpen));
          }
        }
      }

    });
  });
