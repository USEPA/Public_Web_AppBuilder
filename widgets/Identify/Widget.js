///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB Identify Widget
///////////////////////////////////////////////////////////////////////////
/*global define, console, setTimeout, clearTimeout*/
define(['dojo/_base/declare',
        'dijit/_WidgetsInTemplateMixin',
        'jimu/BaseWidget',
        'jimu/dijit/TabContainer',
        './List',
        'esri/tasks/IdentifyTask',
        'esri/tasks/IdentifyParameters',
        'esri/tasks/IdentifyResult',
        'jimu/dijit/Message',
        'esri/tasks/query',
        'esri/tasks/QueryTask',
        'esri/layers/CodedValueDomain',
        'esri/layers/Domain',
        'esri/layers/GraphicsLayer',
        'esri/layers/FeatureLayer',
        'esri/layers/FeatureType',
        'esri/layers/Field',
        'esri/layers/RangeDomain',
        'esri/tasks/GeometryService',
        'esri/config',
        'esri/graphic',
        'esri/graphicsUtils',
        'esri/geometry/Point',
        'esri/symbols/SimpleMarkerSymbol',
        'esri/symbols/PictureMarkerSymbol',
        'esri/geometry/Polyline',
        'esri/symbols/SimpleLineSymbol',
        'esri/Color',
        'esri/geometry/Polygon',
        'esri/geometry/Multipoint',
        'esri/geometry/Extent',
        'esri/geometry/Geometry',
        'esri/symbols/SimpleFillSymbol',
        'esri/renderers/SimpleRenderer',
        'esri/toolbars/draw',
        'esri/dijit/PopupTemplate',
        'esri/request',
        'esri/TimeExtent',
        'dojo/Deferred',
        'dijit/ProgressBar',
        'dojo/_base/lang',
        'dojo/on',
        'dojo/aspect',
        'dojo/_base/html',
        'dojo/_base/array',
        'dojo/promise/all',
        'dojo/date',
        'dojo/date/locale',
        'jimu/dijit/DrawBox',
        'jimu/utils',
        'jimu/dijit/LoadingShelter',
        'dojo/io-query',
        'esri/SpatialReference',
        'esri/tasks/ProjectParameters',
        'esri/geometry/webMercatorUtils',
        'jimu/WidgetManager',
        'jimu/PanelManager',
        'dijit/form/Select'],
  function (declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, List, IdentifyTask, IdentifyParameters,
    IdentifyResult, Message, Query, QueryTask, CodedValueDomain, Domain, GraphicsLayer, FeatureLayer, FeatureType, Field,
    RangeDomain, GeometryService, esriConfig, Graphic, graphicsUtils, Point, SimpleMarkerSymbol,
    PictureMarkerSymbol, Polyline, SimpleLineSymbol, Color, Polygon, Multipoint, Extent, Geometry, SimpleFillSymbol,
    SimpleRenderer, Draw, PopupTemplate, esriRequest, TimeExtent, Deferred, ProgressBar, lang, on, aspect, html, array,
    all, date, locale, DrawBox, utils, LoadingShelter, ioquery, SpatialReference, ProjectParameters, webMercatorUtils,
    WidgetManager, PanelManager) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], { /*jshint unused: false*/
      baseClass: 'jimu-widget-identify',
      progressBar: null,
      searchResults: null,
      tabContainer: null,
      list: null,
      selTab: null,
      identifyGeom: null,
      keepActive: false,
      graphicsLayer: null,
      identifytolerance: 5,
      returngeometryforzoom: true,
      usemaptime: false,
      identifylayeroption: 'visible',
      autoactivatedtool: null,
      configIdentLayers: null,
      disableAllLayersChoice: false,
      iResultLen: null,
      resultFound: false,
      enableGraphicClickInfo: true,
      identMarkerSymbol: null,
      identLineSymbol: null,
      identFillSymbol: null,
      numServicesIdent: 0,
      gid: null,
      identifyResultsArray: null,
      resultSym: null,
      replacenullswithemptystring: null,
      excludeLayers: null,
      timer2: null,
      timer: null,
      autoCloseNum: 2000,
      enableMoverRec: true,
      infoWinMouseOver: null,
      infoWinMouseOut: null,
      selSym: null,
      wManager: null,
      pManager: null,
      resultFormatString: "",

      postCreate: function () {
        this.inherited(arguments);
        var pms = lang.clone(this.config.symbols.picturemarkersymbol);
        pms.url = this.folderUrl + pms.url;
        this.resultSym = new PictureMarkerSymbol(pms);
        this.gid = 1;
        if(this.config.disablelayerdropdown){
          html.setStyle(this.LayerDD, 'display', 'none');
        }
        this.replacenullswithemptystring = this.config.replacenullswithemptystring;
        this.enableGraphicClickInfo = this.config.enableGraphicClickInfo;
        this.identifylayeroption = this.config.identifylayeroption;
        this.usemaptime = this.config.usemaptime;
        this.returngeometryforzoom = this.config.returngeometryforzoom;
        this.identifytolerance = this.config.identifytolerance;
        this.keepActive = this.config.keepidentifyactive;
        this.autoCloseNum = parseInt(this.config.infoautoclosemilliseconds);
        this.enableMoverRec = this.config.enablemouseoverrecordinfo;
        this.enableMoverGra = this.config.enablemouseovergraphicsinfo;
        this.disableAllLayersChoice = this.config.disablealllayerschoice;
        if(this.config.autoactivatedtool){
          this.autoactivatedtool = this.config.autoactivatedtool;
        }
        this.configIdentLayers = [];
        this.excludeLayers = this.config.layers.excludelayer;
        this._initResultFormatString();
        this._initIdentifySymbols();
        this._initTabContainer();
        this._initIdentifyLayers();
        this._initProgressBar();
        this._initDrawBox();
        this._bindEvents();
        this.graphicsLayer = new GraphicsLayer();
        this.graphicsLayer.name = 'Identify Results';
        this.map.addLayer(this.graphicsLayer);
        if(this.enableMoverGra){
          this.graphicsLayer.on('mouse-over', lang.hitch(this, this.mouseOverGraphic));
          this.graphicsLayer.on('mouse-out', lang.hitch(this, this.mouseOutGraphic));
        }
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
      },

      disableWebMapPopup: function() {
        if (this.map && this.map.webMapResponse) {
          var handler = this.map.webMapResponse.clickEventHandle;
          if (handler) {
            handler.remove();
            this.map.webMapResponse.clickEventHandle = null;
          }
        }
      },

      enableWebMapPopup: function() {
        if (this.map && this.map.webMapResponse) {
          var handler = this.map.webMapResponse.clickEventHandle;
          var listener = this.map.webMapResponse.clickEventListener;
          if (listener && !handler) {
            this.map.webMapResponse.clickEventHandle = on(
              this.map,
              'click',
              lang.hitch(this.map, listener)
            );
          }
        }
      },

      _initIdentifySymbols: function() {
        if (this.config.symbols && this.config.symbols.simplemarkersymbol) {
          this.identMarkerSymbol = new SimpleMarkerSymbol(this.config.symbols.simplemarkersymbol);
        } else {
          this.identMarkerSymbol = new SimpleMarkerSymbol();
        }
        if (this.config.symbols && this.config.symbols.simplelinesymbol) {
          this.identLineSymbol = new SimpleLineSymbol(this.config.symbols.simplelinesymbol);
        } else {
          this.identLineSymbol = new SimpleLineSymbol();
        }
        if (this.config.symbols && this.config.symbols.simplefillsymbol) {
          this.identFillSymbol = new SimpleFillSymbol(this.config.symbols.simplefillsymbol);
        } else {
          this.identFillSymbol = new SimpleFillSymbol();
        }
      },

      _initResultFormatString: function () {
        var tBold = false, tItalic = false, tUnder = false, tColorHex = "#000000";
        var vBold = false, vItalic = false, vUnder = false, vColorHex = "#000000";
        this.resultFormatString = "";
        if(this.config.resultFormat){
          var attribName = '[attribname]';
          tBold = this.config.resultFormat.attTitlesymbol.bold;
          tItalic = this.config.resultFormat.attTitlesymbol.italic;
          tUnder = this.config.resultFormat.attTitlesymbol.underline;
          if(this.config.resultFormat.attTitlesymbol.color){
            tColorHex = new Color(this.config.resultFormat.attTitlesymbol.color).toHex();
          }
          if(tBold){
            attribName = "<strong>" + attribName + "</strong>";
          }
          if(tItalic){
            attribName = "<em>" + attribName + "</em>";
          }
          if(tUnder){
            attribName = "<u>" + attribName + "</u>";
          }
          if(tColorHex){
            attribName = "<font color='" + tColorHex + "'>" + attribName + "</font>";
          }
          var attribValue = '[attribvalue]';
          vBold = this.config.resultFormat.attValuesymbol.bold;
          vItalic = this.config.resultFormat.attValuesymbol.italic;
          vUnder = this.config.resultFormat.attValuesymbol.underline;
          if(this.config.resultFormat.attValuesymbol.color){
            vColorHex = new Color(this.config.resultFormat.attValuesymbol.color).toHex();
          }
          if(vBold){
            attribValue = "<strong>" + attribValue + "</strong>";
          }
          if(vItalic){
            attribValue = "<em>" + attribValue + "</em>";
          }
          if(vUnder){
            attribValue = "<u>" + attribValue + "</u>";
          }
          if(vColorHex){
            attribValue = "<font color='" + vColorHex + "'>" + attribValue + "</font>";
          }
          this.resultFormatString = attribName + ": " + attribValue + '<br>';
        }else{
          this.resultFormatString = '<font><em>[attribname]</em></font>: <font>[attribvalue]</font><br>';
        }
      },

      _initDrawBox: function () {
        aspect.before(this.drawBox, "_activate", lang.hitch(this, function(){
          this.publishData({message: "Deactivate_DrawTool"});
        }));
        this.drawBox.setMap(this.map);
        var enabledButtons = ['POINT'];
        if(this.config.enablelineselect){
          enabledButtons.push('LINE');
        }
        if(this.config.enablepolylineselect){
          enabledButtons.push('POLYLINE');
        }
        if(this.config.enablefreehandlineselect){
          enabledButtons.push('FREEHAND_POLYLINE');
        }
        if(this.config.enabletriangleselect){
          enabledButtons.push('TRIANGLE');
        }
        if(this.config.enableextentselect){
          enabledButtons.push('EXTENT');
        }
        if(this.config.enablecircleselect){
          enabledButtons.push('CIRCLE');
        }
        if(this.config.enableellipseselect){
          enabledButtons.push('ELLIPSE');
        }
        if(this.config.enablepolyselect){
          enabledButtons.push('POLYGON');
        }
        if(this.config.enablefreehandpolyselect){
          enabledButtons.push('FREEHAND_POLYGON');
        }
        this.drawBox.geoTypes = enabledButtons;
        this.drawBox._initTypes();
        this.drawBox.setPointSymbol(this.identMarkerSymbol);
        this.drawBox.setLineSymbol(this.identLineSymbol);
        this.drawBox.setPolygonSymbol(this.identFillSymbol);
        if(this.keepActive){
          this.drawBox.deactivateAfterDrawing = false;
        }
      },

      _initIdentifyLayers: function () {
        var options = [];
        var i = 0, option;
        if(!this.disableAllLayersChoice){
          option = {
            value: i,
            label: this.nls.alllayers
          };
          options.push(option);
          i++;
        }

        var len = this.config.layers.layer.length;
        for (var e=0; e < len; e++) {
          option = {
            value: i,
            label: this.config.layers.layer[e].name
          };
          options.push(option);

          var identLayer = {
            url: this.config.layers.layer[e].url,
            id: this.config.layers.layer[e].id,
            label: this.config.layers.layer[e].name,
            links: this.config.layers.layer[e].links,
            fields: this.config.layers.layer[e].fields,
            zoomscale: this.config.layers.layer[e].zoomscale,
            forcescale: this.config.layers.layer[e].forcescale
          };
          this.configIdentLayers.push(identLayer);
          i++;
        }

        //select the first layer in the lists
        if(options.length > 0){
          options[0].selected = true;
        }

        if (len > 0) {
          this.identifyLayer.addOption(options);
        }
      },

      startup: function () {
        this.inherited(arguments);
        this.selSym = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
                                           new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                           new Color([68,140,203]), 3), new Color([255,255,255,0]));
        this.fetchData();
      },

      _initTabContainer: function () {
        var tabs = [];
        tabs.push({
          title: this.nls.identifylabel,
          content: this.tabNode1
        });
        tabs.push({
          title: this.nls.resultslabel,
          content: this.tabNode2
        });
        this.selTab = this.nls.identifylabel;
        this.tabContainer = new TabContainer({
          tabs: tabs,
          selected: this.selTab
        }, this.tabIdentify);

        this.tabContainer.startup();
        this.own(on(this.tabContainer,'tabChanged',lang.hitch(this,function(title){
          if(title !== this.nls.resultslabel){
            this.selTab = title;
          }
        })));
        utils.setVerticalCenter(this.tabContainer.domNode);
      },

      _bindEvents: function() {
        //bind DrawBox
        this.own(on(this.drawBox,'DrawEnd',lang.hitch(this, this._onDrawEnd)));
        if(this.autoactivatedtool){
          this.drawBox.activate(this.autoactivatedtool.toUpperCase());
        }
        this.own(on(this.btnClear, 'click', lang.hitch(this, this._clear)));
        html.setStyle(this.btnClear, 'display', 'none');
        this.own(on(this.list,'remove', lang.hitch(this, this._removeResultItem)));
      },

      _clear: function () {
        this.identifyGeom = null;
        html.setStyle(this.btnClear, 'display', 'none');
        this._hideInfoWindow();
        this.graphicsLayer.clear();
        this.tabContainer.selectTab(this.nls.identifylabel);
        this.list.clear();
        this.divResultMessage.textContent = this.nls.noResults;
        this.drawBox.clear();
        if(this.identifyResultsArray){
          this.identifyResultsArray = [];
        }
        return false;
      },

      _removeResultItem: function (index, item) {
        var idResult = this.list.items[this.list.selectedIndex];
        this.identifyResultsArray.splice(this.identifyResultsArray.indexOf(idResult), 1);
        this.graphicsLayer.remove(idResult.graphic);
        this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.identifyResultsArray.length;
        if(this.identifyResultsArray.length === 0){
          this._clear();
          return;
        }
        this.list.remove(index);
        this._hideInfoWindow();
      },

      _overResultItem: function (index, item) {
        this.disableTimer();
        var idResult = this.list.items[index];
        if(this.enableMoverRec){
          this.showInfoWin(idResult);
        }
      },

      _outResultItem: function (index, item) {
        this.timedClose();
      },

      _selectResultItem: function (index, item) {
        var idResult = this.list.items[index];
        if(idResult.geometry.type === 'point'){
          if(idResult.forceScale === true){
            this.map.setScale(idResult.zoomScale).then(this.map.centerAt(idResult.point).then(lang.hitch(this, function () {
              if(this.enableMoverRec){
                this.showInfoWin(idResult);
              }
            })));
          }else{
            if (this.map.getScale() > idResult.zoomScale){
              this.map.setScale(idResult.zoomScale).then(this.map.centerAt(idResult.point).then(lang.hitch(this, function () {
                if(this.enableMoverRec){
                  this.showInfoWin(idResult);
                }
              })));
            }else{
              this.map.centerAt(idResult.point).then(lang.hitch(this, function () {
                if(this.enableMoverRec){
                  this.showInfoWin(idResult);
                }
              }));
            }
          }
        }else{
          if (this.returngeometryforzoom) {
            this.map.setExtent(idResult.geometry.getExtent().expand(1.2), true).then(lang.hitch(this, function () {
                if(this.enableMoverRec){
                  this.showInfoWin(idResult);
                }
              }));
          }else{
            if(idResult.forceScale === true){
              this.map.setScale(idResult.zoomScale).then(this.map.centerAt(idResult.point).then(lang.hitch(this, function () {
                if(this.enableMoverRec){
                  this.showInfoWin(idResult);
                }
              })));
            }else{
              if (this.map.getScale() > idResult.zoomScale){
                this.map.setScale(idResult.zoomScale).then(this.map.centerAt(idResult.point).then(lang.hitch(this, function () {
                  if(this.enableMoverRec){
                    this.showInfoWin(idResult);
                  }
                })));
              }else{
                this.map.centerAt(idResult.point).then(lang.hitch(this, function () {
                  if(this.enableMoverRec){
                    this.showInfoWin(idResult);
                  }
                }));
              }
            }
          }
        }
      },

      //mouse over graphic
      mouseOverGraphic: function(event) {
        this.disableTimer();
        var gra = event.graphic;
        if(gra.attributes){
          var idResult = this.getResultByGID(gra.attributes.gid);
          if (this.map.extent.contains(idResult.point)){
             this.showInfoWin(idResult);
          }else{
            this._hideInfoWindow();
          }
        }
      },

      mouseOutGraphic: function (event) {
        this.timedClose();
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

      showInfoWin: function (idResult) {
        if (this.map.infoWindow) {
          idResult.graphic.setInfoTemplate(this._configurePopupTemplate(idResult));
          this.map.infoWindow.setFeatures([idResult.graphic]);
          if (this.map.infoWindow.reposition) {
            this.map.infoWindow.reposition();
          }
          this.map.infoWindow.show(idResult.centerpoint);
        }
      },

      _onDrawEnd:function(graphic, geotype, commontype){
        this._hideInfoWindow();
        this.drawBox.clear();

        this.graphicsLayer.clear();
        this.graphicsLayer.add(graphic);
        html.setStyle(this.btnClear, 'display', 'block');

        this.identifyGeom = graphic.geometry;
        var geometry = graphic.geometry;
        if(geometry.type === 'extent'){
          var a = geometry;
          var polygon = new Polygon(a.spatialReference);
          var r=[[a.xmin,a.ymin],[a.xmin,a.ymax],[a.xmax,a.ymax],[a.xmax,a.ymin],[a.xmin,a.ymin]];
          polygon.addRing(r);
          this.identifyGeom = polygon;
        }
        this.identifyFeatures(this.identifyGeom);
      },

      identifyFeatures: function(geom){
        this.numServicesIdent = 0;
        this.identifyResultsArray = [];
        this.iResultLen = 0;
        this.resultFound = false;
        this.list.clear();
        this.tabContainer.selectTab(this.nls.resultslabel);
        html.setStyle(this.progressBar.domNode, 'display', 'block');
        html.setStyle(this.divResult, 'display', 'none');

        var layers = array.map(this.map.layerIds, lang.hitch(this, function (layerId) {
          return this.map.getLayer(layerId);
        }));
//todo consider adding back the exclude basemap option
        /*var bmlayers = array.map(this.map.basemapLayerIds, lang.hitch(this, function (layerId) {
          return this.map.getLayer(layerId);
        }));

        console.info(bmlayers);*/
//end comment
        var featureLayers = array.map(this.map.graphicsLayerIds, lang.hitch(this, function (layerId) {
          return this.map.getLayer(layerId);
        }));

        featureLayers = array.filter(featureLayers, lang.hitch(this, function (layer){
          if(layer.type && layer.type === 'Feature Layer'){
            if(!layer.url || layer.url === '' || !layer.hasOwnProperty('url')){
              return false;
            }
            if(this.config.layers.onlythese === true){
              if(this.isService2beIdentified(layer)){
                if(this.identifylayeroption === 'visible' || this.identifylayeroption === 'top'){
                  if(!layer.visible || !layer.isVisibleAtScale(this.map.getScale())){
                    return false;
                  }
                }
                if(layer.version >= 10){
                  if(layer.capabilities.indexOf('Query') === -1){
                    return false;
                  }
                }
                this.numServicesIdent++;
                return true;
              }
            }else{
              if(this.identifylayeroption === 'visible' || this.identifylayeroption === 'top'){
                if(!layer.visible || !layer.isVisibleAtScale(this.map.getScale())){
                  return false;
                }
              }
              if(layer.version >= 10){
                if(layer.capabilities.indexOf('Query') === -1){
                  return false;
                }
              }
              if(this.isLayerNameExcluded(layer.name)){
                return false;
              }
              if(this._isFeatureLayerExcluded(layer.url)){
                return false;
              }
              this.numServicesIdent++;
              return true;
            }
          }
        }));

        layers = array.filter(layers, lang.hitch(this, function (layer) {
          if(!layer.url || layer.url === '' || !layer.hasOwnProperty('url')){
            return false;
          }
          if(this.config.layers.onlythese === true){
            if(this.isService2beIdentified(layer)){
              if(this.identifylayeroption === 'visible' || this.identifylayeroption === 'top'){
                if(!layer.visible || !layer.isVisibleAtScale(this.map.getScale())){
                  return false;
                }
              }
              if(this.isWholeServiceExcluded(layer.url)){
                return false;
              }

              if(layer.version >= 10){
                if(layer.capabilities.indexOf('Query') === -1){
                  return false;
                }
              }
              this.numServicesIdent++;
              return true;
            }
          }else{
            if(this.identifylayeroption === 'visible' || this.identifylayeroption === 'top'){
              if(!layer.visible || !layer.isVisibleAtScale(this.map.getScale())){
                return false;
              }
            }
            if(this.isWholeServiceExcluded(layer.url)){
              return false;
            }
            if(layer.version >= 10){
              if(layer.capabilities.indexOf('Query') === -1){
                return false;
              }
            }
            this.numServicesIdent++;
            return true;
          }
        }));

        var tasks = array.map(layers, lang.hitch(this, function (layer) {
          return new IdentifyTask(layer.url);
        }));

        var tasks2 = array.map(featureLayers, lang.hitch(this, function (layer) {
          return new QueryTask(layer.url);
        }));

        var FeatLyrNames = array.map(featureLayers, lang.hitch(this, function (layer) {
          return layer.name;
        }));

        var FeatLyrIds = array.map(featureLayers, lang.hitch(this, function (layer) {
          return layer.id;
        }));

        var LyrNames = array.map(layers, lang.hitch(this, function (layer) {
          return layer.name;
        }));

        var LyrIds = array.map(layers, lang.hitch(this, function (layer) {
          return layer.id;
        }));

        var params = this.createIdentifyParams(layers, geom);
        var params2 = this.createQueryParams(featureLayers, geom);

        var promises = [];
        var promises2 = [];

        for (var i = 0; i < tasks.length; i++) {
          if(params[i].layerIds && params[i].layerIds.length > 0){
            promises.push(tasks[i].execute(params[i]));
          }
        }

        for (i = 0; i < tasks2.length; i++) {
          promises2.push(tasks2[i].execute(params2[i]));
        }

        var iPromises = new all(promises);
        var qPromises = new all(promises2);
        iPromises.then(lang.hitch(this, function (r) {
          if(this.returngeometryforzoom){
            this.graphicsLayer.clear();
          }
          this.showIdentifyResults(r, tasks, LyrNames, LyrIds);
        }), lang.hitch(this, function (err){
          console.info(err);
        }));

        qPromises.then(lang.hitch(this, function (r) {
          if(this.returngeometryforzoom){
            this.graphicsLayer.clear();
          }
          this.showQueryResults(r, tasks2, FeatLyrNames, FeatLyrIds);
        }), lang.hitch(this, function (err){
          console.info(err);
        }));

        var tPromises = [iPromises, qPromises];

        var allPromises = new all(tPromises);
        allPromises.then(lang.hitch(this, function (r) {
          if (this.iResultLen === 0) {
            this.divResultMessage.textContent = this.nls.noresultsfoundlabel;
          } else {
            this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.iResultLen;
          }
          this.tabContainer.selectTab(this.nls.resultslabel);
          html.setStyle(this.progressBar.domNode, 'display', 'none');
          html.setStyle(this.divResult, 'display', 'block');
        }));
      },

      createIdentifyParams: function (layers, geom) {
        var identifyParamsList = [];
        array.forEach(layers, lang.hitch(this, function (layer) {
          var identifyParams = new IdentifyParameters();
          identifyParams.width = this.map.width;
          identifyParams.height = this.map.height;
          identifyParams.geometry = geom;
          identifyParams.tolerance = this.identifytolerance;
          identifyParams.mapExtent = this.map.extent;
          identifyParams.returnGeometry = this.returngeometryforzoom;
          if (this.usemaptime && this.map.timeExtent !== null){
            identifyParams.timeExtent = new TimeExtent(this.map.timeExtent.endTime, this.map.timeExtent.endTime);
          }
          if(this.identifylayeroption === 'visible'){
            identifyParams.layerOption = 'all';
          }else{
            identifyParams.layerOption = this.identifylayeroption;
          }

          var visLayers = layer.visibleLayers;
          if (visLayers && visLayers !== -1) {
            var subLayers = visLayers;
            if(subLayers.indexOf(-1) !== -1){
              subLayers.splice(subLayers.indexOf(-1), 1);
            }
            identifyParams.layerIds = this.removeGroupLayers(subLayers, layer);
          } else {
            identifyParams.layerIds = [];
          }
          identifyParamsList.push(identifyParams);
        }));
        return identifyParamsList;
      },

      removeGroupLayers: function(subLayers, layer) {
        var newSubLayers = [];
        for (var i = 0; i < subLayers.length; i++) {
          if (layer.layerInfos[subLayers[i]] && layer.layerInfos[subLayers[i]].subLayerIds === null){
            newSubLayers.push(subLayers[i]);
          }
        }
        return newSubLayers;
      },

      createQueryParams: function (layers, geom) {
        var queryParamsList = [];
        array.forEach(layers, lang.hitch(this, function (layer) {
          var queryParams = new Query();
          queryParams.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
          if(geom.type === 'point'){
            geom = this.pointToExtent(geom , this.identifyTolerance);
            if (layer.geometryType === 'esriGeometryPoint') {
              queryParams.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
            }
          }
          queryParams.geometry = geom;
          queryParams.outFields = ['*'];
          queryParams.returnGeometry = this.returngeometryforzoom;
          queryParams.outSpatialReference = this.map.spatialReference;
          queryParamsList.push(queryParams);
        }));
        return queryParamsList;
      },

      pointToExtent: function(objPoint, distance){
        var clickOffset = distance || 6;
        var centerPoint = new Point(objPoint.x,objPoint.y,objPoint.spatialReference);
        var mapWidth = this.map.extent.getWidth();
        var pixelWidth = mapWidth/this.map.width;
        var tolerance = clickOffset * pixelWidth;
        var queryExtent = new Extent(1,1,tolerance,tolerance,objPoint.spatialReference);
        return queryExtent.centerAt(centerPoint);
      },

      isService2beIdentified: function (layer) {
        var retval = false, arcL, url;
        if (layer.declaredClass === 'esri.layers.ArcGISDynamicMapServiceLayer'){
          arcL = layer;
        }else if(layer.declaredClass === 'esri.layers.ArcGISImageServiceLayer'){
          arcL = layer;
        }else if(layer.declaredClass === 'esri.layers.ArcGISTiledMapServiceLayer'){
          arcL = layer;
        }else if(layer.declaredClass === 'esri.layers.ArcGISTiledMapServiceLayer'){
          arcL = layer;
        }else if(layer.declaredClass === 'esri.layers.FeatureLayer'){
          arcL = layer;
        }else{
          return retval;
        }
        url = arcL.url;
        //remove any url parameters
        var queryPos = url.indexOf('?');
        if (queryPos !== -1){
          url = url.substring(0, queryPos);
        }
        //strip the layer id from the url if it has one
        url = url.replace(/\/[0-9]+$/g,'');
        for(var i=0; i<this.configIdentLayers.length; i++){
          if(url.toUpperCase() === this.configIdentLayers[i].url.toUpperCase()){
            retval = true;
            break;
          }
        }
        return retval;
      },

      isWholeServiceExcluded: function (serviceUrl) {
        var eURL = '';
        for (var el = 0; el < this.excludeLayers.length; el++) {
          eURL = this.excludeLayers[el].url;
          if(serviceUrl && eURL && serviceUrl.toUpperCase() === eURL.toUpperCase()){
            return true;
          }
        }
        return false;
      },

      isLayerNameExcluded: function (layerName) {
        var eName = '';
        for (var el = 0; el < this.excludeLayers.length; el++) {
          eName = this.excludeLayers[el].name;
          if(layerName && eName && layerName.toUpperCase() === eName.toUpperCase()){
            return true;
          }
        }
        return false;
      },

      _initProgressBar: function () {
        this.progressBar = new ProgressBar({
          indeterminate: true
        }, this.progressbar);
        html.setStyle(this.progressBar.domNode, 'display', 'none');
      },

      _isResultLayerExcluded: function (identifyResult, serviceUrl) {
        var eName = '';
        var eURL = '';
        var eId = -1;
        for (var el = 0; el < this.excludeLayers.length; el++) {
          eName = this.excludeLayers[el].name;
          eURL = this.excludeLayers[el].url;
          eId = this.excludeLayers[el].id;
          if(eName && identifyResult.layerName === eName){
            return true;
          }
          if(serviceUrl && eURL && eId && serviceUrl.toUpperCase() === eURL.toUpperCase() && identifyResult.layerId === eId){
            return true;
          }
          if(serviceUrl && eURL && !eId && serviceUrl.toUpperCase() === eURL.toUpperCase()){
            return true;
          }
        }
        return false;
      },

      _isFeatureLayerExcluded: function (serviceUrl) {
        var eURL = '';
        var eId = -1;
        var efUrl = '';
        for (var el = 0; el < this.excludeLayers.length; el++) {
          eURL = this.excludeLayers[el].url;
          eId = this.excludeLayers[el].id;
          if (!eURL) {continue;}
          efUrl = (eURL.substr(-1) === '/') ? eURL.toUpperCase() + eId : eURL.toUpperCase() + '/' + eId;
          if(serviceUrl && eURL && eId && serviceUrl.toUpperCase() === efUrl){
            return true;
          }
        }
        return false;
      },

      showIdentifyResults: function (r, itasks, names, Ids) {
        this.numServicesIdent--;
        //if top is chosen and a result is already found than bail out of all other returns.
        if(this.identifyLayerOption === 'top' && this.resultFound){
          this.numServicesIdent = 0;
          return;
        }

        var results = [];
        var taskUrls = [];
        r = array.filter(r, function (result) {
          return r[0];
        });
        for (var i = 0; i < r.length; i++) {
          results = results.concat(r[i]);
          for (var j = 0; j < r[i].length; j++) {
            taskUrls = taskUrls.concat(itasks[i].url);
          }
        }

        results = array.filter(results, lang.hitch(this, function (identifyResult, index) {
          var serviceUrl = taskUrls[index];
          var currentLayer = this.map.getLayer(Ids[index]);
//check if this is needed anymore
          if(this._isResultLayerExcluded(identifyResult, serviceUrl)){
            return false;
          }
//end comment
          var shouldContinue = false;
          if(!this.config.disablelayerdropdown){
            var selIndex = this.identifyLayer.get('value');
            if(this.disableAllLayersChoice){
              if(serviceUrl && serviceUrl.toUpperCase() === this.configIdentLayers[selIndex].url.toUpperCase() &&
                 identifyResult.layerId === this.configIdentLayers[selIndex].id){
                shouldContinue = true;
              }
            }else{
              if(selIndex > 0){
                if(serviceUrl && serviceUrl.toUpperCase() === this.configIdentLayers[selIndex - 1].url.toUpperCase() &&
                   identifyResult.layerId === this.configIdentLayers[selIndex - 1].id){
                  shouldContinue = true;
                }
              }else if(selIndex === 0){
                shouldContinue = true;
              }
            }
          }else{
            shouldContinue = true;
          }
          if(!shouldContinue){
            return false;
          }

          var title = identifyResult.layerName;
          var obj = identifyResult.feature.attributes;
          var content = '';
          var rsltContent = '';
          //var br = '<br>';
          var fld;
          var value;
          var identFields;
          var identLinks = [];
          var lyrIdLinks = [];
          var identZoom = this.config.defaultzoomscale;
          var identTitle;
          var identForceScale = false;
          var idResult = {};

          for(var i=0; i<this.configIdentLayers.length; i++){
            identFields = null;
//            console.info(serviceUrl);
            if(serviceUrl && serviceUrl.toUpperCase() === this.configIdentLayers[i].url.toUpperCase() && identifyResult.layerId === this.configIdentLayers[i].id){
              identTitle = title = this.configIdentLayers[i].label;
              if(this.configIdentLayers[i].links){
                identLinks = this.configIdentLayers[i].links.link;
              }
              identFields = this.configIdentLayers[i].fields;
              identZoom = this.configIdentLayers[i].zoomscale;
              identForceScale = this.configIdentLayers[i].forcescale;
              break;
            }
          }
          if(identFields && !identFields.all){
            this.resultFound = true;
            this.gid ++;
            if(this.identifyLayerOption === 'top' && this.resultFound){
              this.numServicesIdent = 0;
            }
            this.resultFound = true;
            var fields = identFields.field;
            var fldArr = [];
            for(var fd=0; fd<fields.length; fd++){
              fld = fields[fd];
              var str = fld.alias + '~';
              if(fld.useralias){
                if(fld.useralias === ''){
                  if(fld.alias !== fld.name){
                    str += fld.alias + '~';
                  }else{
                    str += 'NA~';
                  }
                }else{
                  str += fld.useralias + '~';
                }
              }else{
                if(fld.alias !== fld.name){
                  str += fld.alias + '~';
                }else{
                  str += 'NA~';
                }
              }
              if(fld.isdate){
                if(!fld.hasOwnProperty('dateformat')){
                  str += 'MM/dd/yyyy~';
                }else{
                  if(fld.dateformat === ''){
                    str += 'MM/dd/yyyy~';
                  }else{
                    str += fld.dateformat + '~';
                  }
                }
              }else{
                str += 'NA~';
              }
              if(fld.currencyformat){
                if(fld.currencyformat === ''){
                  str += 'NA~';
                }else{
                  str += fld.currencyformat + '~';
                }
              }else{
                str += 'NA~';
              }
              if(fld.numberformat){
                if(fld.numberformat === ''){
                  str += 'NA~';
                }else{
                  str += fld.numberformat + '~';
                }
              }else{
                str += 'NA~';
              }
              if(fld.useutc){
                if(fld.useutc === 'false'){
                  str += 'false~';
                }else{
                  str += 'true~';
                }
              }else{
                str += 'NA~';
              }
              if(fld.popuponly){
                if(fld.popuponly === 'false'){
                  str += 'false';
                }else{
                  str += 'true';
                }
              }else{
                str += 'NA';
              }
              fldArr.push(str);
            }
            if(identLinks && identLinks.length){
              for (var a = 0; a < identLinks.length; a++){
                var link = '',
                    alias = '',
                    linkicon = '',
                    linkFieldNull = false,
                    disableInPopUp = false,
                    popupType;
                if(identLinks[a].disableinpopup){
                  disableInPopUp = true;
                }
                if(identLinks[a].disablelinksifnull){
                  var lfields = this._getFieldsfromLink(identLinks[a].content);
                  for (var lf=0; lf<lfields.length; lf++){
                    if(!obj[lfields[lf]] || obj[lfields[lf]] === '' || obj[lfields[lf]] === 'Null'){
                      linkFieldNull = true;
                      break;
                    }
                  }
                }
                if(linkFieldNull){
                  link = '';
                }else{
                  link = this._substitute(identLinks[a].content, obj);
                }
                var sub = this._substitute(identLinks[a].alias, obj);
                alias = (sub) ? sub : identLinks[a].alias;
                linkicon = this._substitute((identLinks[a].icon || this.folderUrl + 'images/w_link.png'), obj);
                popupType = identLinks[a].popuptype;
                var lObj ={
                  link: link,
                  icon: linkicon,
                  alias: alias,
                  disableinpopup: disableInPopUp,
                  popuptype: popupType
                };
                if(!linkFieldNull){
                  lyrIdLinks.push(lObj);
                }
              }
            }

            for (var f = 0; f < fldArr.length; f++) {
              var cArr = fldArr[f].split('~');
              try{
                value = obj[cArr[0]] ? String(obj[cArr[0]]) : '';
              } catch (error){
                value = '';
              }
              if(this.replacenullswithemptystring && (value === 'Null' || value === '<Null>')){
                value = '';
              }

              var isDateField = false;
              var dateFormat = '';
              var numFormat = '';
              var curFormat = '';
              var useUTC = false;
              numFormat = cArr[4];
              curFormat = cArr[3];
              useUTC = (cArr[5] && cArr[5] === 'true');
              dateFormat = cArr[2];
              if (dateFormat !== 'NA'){
                isDateField = true;
              }else{
                isDateField = false;
              }
              if (isDateField) {
                var dateMS = Number(value);
                if (!isNaN(dateMS)) {
                  if (dateFormat !== '') {
                    value = this._formatDate(dateMS, dateFormat);
                  } else {
                    value = this._formatDate(dateMS, 'MM/dd/yyyy');
                  }
                }
              }
              if(numFormat !=='NA' && value !== 'Null' && value !== ''){
                var args = numFormat.split('|');
                /*value, percision, symbol, thousands, decimal*/
                value = this._formatNumber(value,args[0]||null,args[1]||null,args[2]||null);
              }
              if(curFormat !== 'NA' && value !== 'Null' && value !== ''){
                var args2 = curFormat.split('|');
                /*value,percision,symbol,thousands,decimal*/
                value = this._formatCurrency(value,args2[1]||null,args2[0]||null,args2[2]||null,args2[3]||null);
              }
              if(cArr[1] !== 'NA'){
                content = content + this.resultFormatString.replace('[attribname]', cArr[1]).replace('[attribvalue]', value);
              }else{
                content = content + this.resultFormatString.replace('[attribname]', cArr[0]).replace('[attribvalue]', value);
              }
              if(cArr[6] === 'false' || cArr[6] === 'NA'){
                if(cArr[1] !== 'NA'){
                  rsltContent = rsltContent + this.resultFormatString.replace('[attribname]', cArr[1]).replace('[attribvalue]', value);
                }else{
                  rsltContent = rsltContent + this.resultFormatString.replace('[attribname]', cArr[0]).replace('[attribvalue]', value);
                }
              }
            }
            idResult.icon = this.folderUrl + 'images/i_info.png';
            idResult.title = identTitle || identifyResult.layerName;
            if(content.lastIndexOf('<br>') === (content.length - 4)){
              idResult.content = content.substr(0,content.length - 4);
            }else{
              idResult.content = content;
            }
            if(rsltContent.lastIndexOf('<br>') === (rsltContent.length - 4)){
              idResult.rsltcontent = rsltContent.substr(0,rsltContent.length - 4);
            }else{
              idResult.rsltcontent = rsltContent;
            }
            idResult.links = lyrIdLinks;
            idResult.alt = (index % 2 === 0);
            idResult.sym = this.resultSym;
            var projecting = false;
            //Check if we have run into the SR bug of the IdentifyTask when going to an older ArcGIS Server version
            if(this.returngeometryforzoom && identifyResult.feature.geometry.spatialReference.wkid !== this.map.spatialReference.wkid){
              if (identifyResult.feature.geometry.spatialReference.wkid === 4326 && this.map.spatialReference.isWebMercator()){
                identifyResult.feature.geometry = webMercatorUtils.geographicToWebMercator(identifyResult.feature.geometry);
              }/*else{
                projecting = true;
                var projectParameters = new ProjectParameters();
                projectParameters.geometries = [identifyResult.feature.geometry];
                projectParameters.outSpatialReference = this.map.spatialReference;
                geometryService.project(projectParameters2, new AsyncResponder(projectResult,projectFault,[idResult,identifyResult,identForceScale,content,title,link]));
                esriConfig.defaults.geometryService.project(projectParameters, lang.hitch(this, this.projectResults),
                                                       lang.hitch(this, this.onError));
              }*/
            }

            if(this.identifyGeom.type === 'point'){
              idResult.centerpoint = this.identifyGeom;
              idResult.point = this.identifyGeom;
            }else{
              idResult.point = (this.returngeometryforzoom) ? this.getGeomCenter(identifyResult.feature.geometry) : this.getGeomCenter(this.identifyGeom);
              idResult.centerpoint = idResult.point;
            }
            idResult.geometry = (this.returngeometryforzoom) ? identifyResult.feature.geometry : this.identifyGeom;

            idResult.zoomScale = identZoom;
            idResult.zoom2msg = this.nls.zoom2message;
            idResult.removeResultMsg = this.nls.removeresultmessage;
            if(!projecting){
              var iGra = new Graphic(identifyResult.feature.geometry);
              switch (idResult.geometry.type){
                case 'point':
                case 'multipoint':{
                  iGra.symbol = this.identMarkerSymbol;
                  break;
                }
                case 'polyline':{
                  iGra.symbol = this.identLineSymbol;
                  break;
                }
                case 'polygon':
                case 'extent':{
                  iGra.symbol = this.identFillSymbol;
                  break;
                }
              }

              idResult.graphic = iGra;
              idResult.id = 'id_' + this.gid;
              idResult.forceScale = identForceScale;
              this.identifyResultsArray.push(idResult);
              var Atts = {
                gid: this.gid,
                content: content,
                title: title,
                icon: idResult.icon,
                link: lyrIdLinks
              };
              iGra.attributes = Atts;
              if(this.returngeometryforzoom){
                this.graphicsLayer.add(iGra);
              }
              if(this.enableGraphicClickInfo){
                iGra.setInfoTemplate(this._configurePopupTemplate(idResult));
              }
              this.list.add(idResult);
            }
            idResult.id = 'id_' + this.gid;
            this.gid ++;
            if(this.identifyLayerOption === 'top' && this.resultFound){
              this.numServicesIdent = 0;
            }
          }else{
            if(this.config.layers.onlythese === false){
              this.resultFound = true;
              for (fld in obj){
                if(fld.toUpperCase() !== 'SHAPE'){
                  try{
                    value = obj[fld] ? String(obj[fld]) : '';
                  } catch (error) {
                    value = '';
                  }
                  if(this.replacenullswithemptystring && (value === 'Null' || value === '<Null>')){
                    value = '';
                  }
                  content = content + this.resultFormatString.replace('[attribname]', fld).replace('[attribvalue]', value);
                  //content = content + '<em><strong>' + fld + '</strong></em>: ' + value + br;
                }
              }

              idResult.icon = this.folderUrl + 'images/i_info.png';
              idResult.title = identifyResult.layerName;
              if(content.lastIndexOf('<br>') === (content.length - 4)){
                idResult.content = content.substr(0,content.length - 4);
              }else{
                idResult.content = content;
              }
              idResult.rsltcontent = idResult.content;
              idResult.links = [];
              idResult.alt = (index % 2 === 0);
              idResult.sym = this.resultSym;
              var projecting2 = false;
              //Check if we have run into the SR bug of the IdentifyTask when going to an older ArcGIS Server version
              if(this.returngeometryforzoom && identifyResult.feature.geometry.spatialReference.wkid !== this.map.spatialReference.wkid){
                if (identifyResult.feature.geometry.spatialReference.wkid === 4326 && this.map.spatialReference.isWebMercator()){
                  identifyResult.feature.geometry = webMercatorUtils.geographicToWebMercator(identifyResult.feature.geometry);
                }/*else{
                  projecting2 = true;
                  var projectParameters2 = new ProjectParameters();
                  projectParameters2.geometries = [identifyResult.feature.geometry];
                  projectParameters2.outSpatialReference = this.map.spatialReference;
                  geometryService.project(projectParameters2, new AsyncResponder(projectResult,projectFault,[idResult,identifyResult,identForceScale,content,title,link]));
                  esriConfig.defaults.geometryService.project(projectParameters2, lang.hitch(this, this.projectResults),
                                                         lang.hitch(this, this.onError));
                }*/
              }

              if(this.identifyGeom.type === 'point'){
                idResult.centerpoint = idResult.point = this.identifyGeom;
              }else{
                idResult.centerpoint = idResult.point = (this.returngeometryforzoom) ? this.getGeomCenter(identifyResult.feature.geometry) : this.getGeomCenter(this.identifyGeom);
              }
              idResult.geometry = (this.returngeometryforzoom) ? identifyResult.feature.geometry : this.identifyGeom;

              idResult.zoomScale = identZoom;
              idResult.zoom2msg = this.nls.zoom2message;
              idResult.removeResultMsg = this.nls.removeresultmessage;
              if(!projecting2){
                var iGra2 = new Graphic(idResult.geometry);
                switch (idResult.geometry.type){
                  case 'point':
                  case 'multipoint':{
                    iGra2.symbol = this.identMarkerSymbol;
                    break;
                  }
                  case 'polyline':{
                    iGra2.symbol = this.identLineSymbol;
                    break;
                  }
                  case 'polygon':
                  case 'extent':{
                    iGra2.symbol = this.identFillSymbol;
                    break;
                  }
                }

                idResult.graphic = iGra2;
                idResult.id = 'id_' + this.gid;
                idResult.forceScale = identForceScale;
                this.identifyResultsArray.push(idResult);
                var Atts2 = {
                  gid: this.gid,
                  content: content,
                  title: title,
                  icon: idResult.icon,
                  link: ''
                };
                iGra2.attributes = Atts2;
                if(this.returngeometryforzoom){
                  this.graphicsLayer.add(iGra2);
                }
                if(this.enableGraphicClickInfo){
                  iGra2.setInfoTemplate(this._configurePopupTemplate(idResult));
                }
                this.list.add(idResult);
              }
              idResult.id = 'id_' + this.gid;
              this.gid ++;
              if(this.identifyLayerOption === 'top' && this.resultFound){
                this.numServicesIdent = 0;
              }
            }
          }
          return true;
        }));

        this.iResultLen += results.length;

        if(this.identifyResultsArray.length === 0 && this.numServicesIdent <= 0){
          this.divResultMessage.textContent = this.nls.noresultsfoundlabel;
          this.timedClose2();
        }else if(this.identifyResultsArray.length > 0 && this.numServicesIdent <= 0){
          this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.identifyResultsArray.length;
          this.timedClose2();
        }else{
          this.disableTimer2();
          this.divResultMessage.textContent = this.nls.loadinglabel + ' ' + this.nls.layersremaining + ' ' + this.numServicesIdent;
        }
        return results;
      },

      _getFeatureType: function (layer, typeID) {
        var result;
        if (layer) {
          for (var t = 0; t < layer.types.length; t++) {
            var featureType = layer.types[t];
            if (typeID === featureType.id) {
              result = featureType;
              break;
            }
          }
        }
        return result;
      },

      _getCodedValue: function (layer, fieldName, fieldValue, typeID) {
        var result;
        var codedValueDomain;
        if (typeID) {
          var featureType = this._getFeatureType(layer, typeID);
          if (featureType) {
            codedValueDomain = featureType.domains[fieldName];
          }
        } else {
          var field = this._getField(layer, fieldName);
          if (field) {
            codedValueDomain = field.domain;
          }
        }
        if (codedValueDomain) {
          if(codedValueDomain.type === 'codedValue'){
            for (var cv = 0; cv < codedValueDomain.codedValues.length; cv++) {
              var codedValue = codedValueDomain.codedValues[cv];
              if (fieldValue === codedValue.code) {
                result = codedValue;
                break;
              }
            }
          }
        }
        return result;
      },

      _substitute:function(string, Attribs, currentLayer){
        var lfields, alfields, fld, fld2Replace, lf;
        if(currentLayer){
          alfields = this._getFieldsfromLink(string, currentLayer);
          lfields = this._getFieldsfromLink(string);
          for (lf=0; lf<alfields.length; lf++){
            if(Attribs[alfields[lf]]){
              fld2Replace = lang.trim(lfields[lf]);
              fld = this._getField(currentLayer, alfields[lf]);
              if (fld.type === "esriFieldTypeString") {
                string = string.replace(new RegExp('{' + fld2Replace + '}', 'g'), lang.trim(Attribs[alfields[lf]]));
              } else {
                string = string.replace(new RegExp('{' + fld2Replace + '}', 'g'), Attribs[alfields[lf]]);
              }
            }
          }
        }else{
          lfields = this._getFieldsfromLink(string);
          for (lf=0; lf<lfields.length; lf++){
            if(Attribs[lfields[lf]]){
              fld2Replace = lang.trim(lfields[lf]);
              string = string.replace(new RegExp('{' + fld2Replace + '}', 'g'), Attribs[lfields[lf]]);
            }
          }
        }
        return string;
      },

      _getField: function (layer, fieldName) {
        var result;
        if (layer) {
          for (var f = 0; f < layer.fields.length; f++) {
            var field = layer.fields[f];
            if (fieldName === field.name) {
              result = field;
              break;
            }
          }
        }
        return result;
      },

      _getFieldsfromLink:function(strLink, currentLayer) {
        var retArr = [];
        var b1 = 0;
        var e1 = 0;
        var fldName = '';
        do{
          b1 = strLink.indexOf('{', e1);
          if(b1 === -1 ){break;}
          e1 = strLink.indexOf('}', b1);
          fldName = strLink.substring(b1 + 1,e1);
          //get the actual field name if the currentLayer is supplied
          //console.info(currentLayer);
          if(currentLayer){
            for (var i=0; i < currentLayer.fields.length; i++){
              var fld = currentLayer.fields[i];
              if(fld.alias === fldName){
                fldName = fld.name;
                break;
              }
            }
          }
          retArr.push(fldName);
        } while(e1 < strLink.length - 1);
        return retArr;
      },

      _formatDate: function (value, dateFormat) {
        if(dateFormat){
            dateFormat = dateFormat.replace(/D/g, 'd').replace(/Y/g, 'y');
        }
        var inputDate = new Date(value);
        return locale.format(inputDate, {
          selector: 'date',
          datePattern: dateFormat
        });
      },

      _formatCurrency: function (value,percision,symbol,thousand,decimal) {
        value = value || 0;
        percision = !isNaN(percision = Math.abs(percision)) ? percision : 2;
        symbol = symbol !== undefined ? symbol : '$';
        thousand = thousand || ',';
        decimal = decimal || '.';
        var negative = value < 0 ? '-' : '',
            i = parseInt(value = Math.abs(+value || 0).toFixed(percision), 10) + '',
            j = (j = i.length) > 3 ? j % 3 : 0;
        return symbol + negative + (j ? i.substr(0, j) + thousand : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousand) +
          (percision ? decimal + Math.abs(value - i).toFixed(percision).slice(2) : '');
      },

      _formatNumber: function (value,percision,thousand,decimal) {
        value = value || 0;
        percision = !isNaN(percision = Math.abs(percision)) ? percision : 2;
        thousand = thousand || ',';
        decimal = decimal || '.';
        var negative = value < 0 ? '-' : '',
            i = parseInt(value = Math.abs(+value || 0).toFixed(percision), 10) + '',
            j = (j = i.length) > 3 ? j % 3 : 0;
        return negative + (j ? i.substr(0, j) + thousand : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousand) +
          (percision ? decimal + Math.abs(value - i).toFixed(percision).slice(2) : '');
      },

      onError: function(msg) {
        alert(msg);
      },

     /* projectResults: function (geometries, data) {
        var idResult = data[0];
        var identifyResult = data[1];
        var identForceScale = data[2];
        var content = data[3];
        var title = data[4];
        var link = data[5];

        var geom = (geometries)[0];

        if(this.identifyGeom.type === 'point'){
          idResult.centerpoint = this.identifyGeom;
          idResult.point = this.identifyGeom;
        }else{
          idResult.point = (this.returngeometryforzoom) ? this.getGeomCenter(geom) : this.getGeomCenter(this.identifyGeom);
          idResult.centerpoint = idResult.point;
        }
        idResult.geometry = (this.returngeometryforzoom) ? geom : this.identifyGeom;

        var iGra = new Graphic(idResult.geometry);

        switch (geom.type){
          case 'point':
          case 'multipoint':{
            iGra.symbol = this.identMarkerSymbol;
            break;
          }
          case 'polyline':{
            iGra.symbol = this.identLineSymbol;
            break;
          }
          case 'polygon':
          case 'extent':{
            iGra.symbol = this.identFillSymbol;
            break;
          }
        }

        idResult.graphic = iGra;
        idResult.id = 'id_' + this.gid;
        idResult.forceScale = identForceScale;
        this.identifyResultsArray.push(idResult);
        var Atts = {
          gid: this.gid,
          content: content,
          title: title,
          icon: idResult.icon,
          link: lyrIdLinks
        };
        iGra.attributes = Atts;
        if(this.returngeometryforzoom){
          this.graphicsLayer.add(iGra);
        }
        if(this.enableGraphicClickInfo){
          iGra.setInfoTemplate(this._configurePopupTemplate(idResult));
        }
        this.list.add(idResult);

        if(this.identifyResultsArray.length === 0 && this.numServicesIdent <= 0){
          this.divResultMessage.textContent = this.nls.noresultsfoundlabel;
          this.timedClose2();
        }else if(this.identifyResultsArray.length > 0 && this.numServicesIdent <= 0){
          this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.identifyResultsArray.length;
          this.timedClose2();
        }else{
          this.disableTimer2();
          this.divResultMessage.textContent = this.nls.loadinglabel + ' ' + this.nls.layersremaining + ' ' + this.numServicesIdent;
        }
      },*/

      _configurePopupTemplate: function(listItem){
        var popUpInfo = {};
        popUpInfo.title = '{title}';
        popUpInfo.description = '{content}';
        popUpInfo.showAttachments = listItem.showattachments;
        var pminfos = [];
        var popUpMediaInfo;

        for(var l=0; l<listItem.links.length; l++){
          if (listItem.links[l].link){
            var pos = listItem.links[l].link.length - 4;
            var sfx = String(listItem.links[l].link).substr(pos, 4).toLowerCase();
            if (((sfx === '.jpg') || (sfx === '.png') || (sfx === '.gif')) && listItem.links[l].popuptype !== 'text'){
              // use PopUpMediaInfo if it is an image
              popUpMediaInfo = {};
              popUpMediaInfo.type = 'image';
              var val = {};
              val.sourceURL = listItem.links[l].link;
              val.linkURL = listItem.links[l].link;
              popUpMediaInfo.value = val;
              popUpMediaInfo.caption = listItem.links[l].alias;
              pminfos.push(popUpMediaInfo);
            }else if(listItem.links[l].icon !== '' && listItem.links[l].popuptype !== 'text'){
              popUpMediaInfo = {};
              popUpMediaInfo.type = 'image';
              popUpMediaInfo.value = {};
              popUpMediaInfo.value.sourceURL = listItem.links[l].icon;
              popUpMediaInfo.value.linkURL = listItem.links[l].link;
              popUpMediaInfo.caption = listItem.links[l].alias;
              pminfos.push(popUpMediaInfo);
            }else{
              if(!listItem.links[l].disableinpopup){
                var lText = (listItem.links[l].alias !== '') ? listItem.links[l].alias : listItem.links[l].link;
                popUpInfo.description += '<br><a href=\'' + listItem.links[l].link + '\'>' + lText + '</a>';
              }
            }
          }
        }
        if(pminfos.length > 0){
          popUpInfo.mediaInfos = pminfos;
        }
//        console.info(popUpInfo);
        var pt = new PopupTemplate(popUpInfo);
        this.map.infoWindow.fillSymbol = this.selSym;
        return pt;
      },

      //get geom center
      getGeomCenter: function (geometry) {
        var point = null;
        if (geometry){
          if(geometry.type === 'point'){
            point = geometry;
            return point;
          }else if (geometry.type === 'polyline'){
            var pl = geometry;
            pl.spatialReference =  this.map.spatialReference;
            var pathCount = pl.paths.length;
            var pathIndex = (pathCount > 1)?(Math.floor(pathCount / 2) - 1):0;
            var midPath = pl.paths[pathIndex];
            var ptCount = midPath.length;
            var ptIndex = (Math.floor(ptCount / 2) - 1);
            point = pl.getPoint(pathIndex, ptIndex);
            if(!point){
              console.log('Polyline Mid point calculation failed. Resorting to extent center');
              point = geometry.getExtent().getCenter();
            }
            return point;
          }else{
            point = geometry.getExtent().getCenter();
            return point;
          }
        }
        return point;
      },

      _getFullConfigLayerURL: function () {
        var offset = (this.disableAllLayersChoice)?0:1;
        var selIndex = this.identifyLayer.get('value');
        selIndex = selIndex - offset;
        var cURL = this.configIdentLayers[selIndex].url;
        var cId = this.configIdentLayers[selIndex].id;
        return (cURL.substr(-1) === '/') ? cURL.toUpperCase() + cId : cURL.toUpperCase() + '/' + cId;
      },

      showQueryResults: function (r, qtasks, fnames, fIds) {
        this.numServicesIdent--;
        var results = [];
        for (var i = 0; i < r.length; i++) {
          var serviceUrl = qtasks[i].url;
          if(this._isFeatureLayerExcluded(serviceUrl)){
            continue;
          }
          results = results.concat(r[i]);
          var FeatureLayerName = fnames[i];
//          console.info(serviceUrl);

          var shouldContinue = false;
          if(!this.config.disablelayerdropdown){
            var selIndex = this.identifyLayer.get('value');
            if(this.disableAllLayersChoice){
              if(serviceUrl && serviceUrl.toUpperCase() === this._getFullConfigLayerURL()){
                shouldContinue = true;
              }
            }else{
              if(selIndex > 0){
                if(serviceUrl && serviceUrl.toUpperCase() === this._getFullConfigLayerURL()){
                  shouldContinue = true;
                }
              }else if(selIndex === 0){
                shouldContinue = true;
              }
            }
          }else{
            shouldContinue = true;
          }
          if(!shouldContinue){
            continue;
          }

          for (var f = 0; f < r[i].features.length; f++) {
            var gra = r[i].features[f];
            var title = '';
            var obj = gra.attributes;
            var content = '';
            var rsltContent = '';
            var fld = '';
            var value = '';
            var identFields = null;
            var identLinks = [];
            var lyrIdLinks = [];
            var identZoom = this.config.defaultzoomscale;
            var identTitle = '';
            var identForceScale = false;
            var idResult= {};
            var br = '<br>';

            for(var j=0; j<this.configIdentLayers.length; j++){
              identFields = null;
//              console.info(serviceUrl);
              if(serviceUrl && serviceUrl.toUpperCase() === this.configIdentLayers[j].url.toUpperCase() + '/' + this.configIdentLayers[j].id){
                identTitle = title = this.configIdentLayers[j].label;
                identLinks = this.configIdentLayers[j].links.link;
                identFields = this.configIdentLayers[j].fields;
                identZoom = this.configIdentLayers[j].zoomscale;
                identForceScale = this.configIdentLayers[j].forcescale;
                break;
              }
            }
            if(identFields && !identFields.all){
              var currentLayer = this.map.getLayer(fIds[i]);
              this.resultFound = true;
              this.gid ++;
              if(this.identifyLayerOption === 'top' && this.resultFound){
                this.numServicesIdent = 0;
              }
              var fields = identFields.field;
              var fldArr = [];
              var fldAlias;
              for(var fd=0; fd<fields.length; fd++){
                fld = fields[fd];
                fldAlias = (r[i].fieldAliases && r[i].fieldAliases[fld.name])?r[i].fieldAliases[fld.name]:fld.name;
                var str = fld.name + '~';
                if(fld.useralias){
                  if(fld.useralias === ''){
                    if(fld.alias !== fld.name){
                      str += fld.alias + '~';
                    }else{
                      str += 'NA~';
                    }
                  }else{
                    str += fld.useralias + '~';
                  }
                }else{
                  if(fld.alias !== fld.name){
                    str += fld.alias + '~';
                  }else{
                    str += 'NA~';
                  }
                }
                if(fld.isdate){
                  if(!fld.hasOwnProperty('dateformat')){
                    str += 'MM/dd/yyyy~';
                  }else{
                    if(fld.dateformat === ''){
                      str += 'MM/dd/yyyy~';
                    }else{
                      str += fld.dateformat + '~';
                    }
                  }
                }else{
                  str += 'NA~';
                }
                if(fld.currencyformat){
                  if(fld.currencyformat === ''){
                    str += 'NA~';
                  }else{
                    str += fld.currencyformat + '~';
                  }
                }else{
                  str += 'NA~';
                }
                if(fld.numberformat){
                  if(fld.numberformat === ''){
                    str += 'NA~';
                  }else{
                    str += fld.numberformat + '~';
                  }
                }else{
                  str += 'NA~';
                }
                if(fld.useutc){
                  if(fld.useutc === 'false'){
                    str += 'false~';
                  }else{
                    str += 'true~';
                  }
                }else{
                  str += 'NA~';
                }
                if(fld.popuponly){
                  if(fld.popuponly === 'false'){
                    str += 'false';
                  }else{
                    str += 'true';
                  }
                }else{
                  str += 'NA';
                }
                fldArr.push(str);
              }
              if(identLinks && identLinks.length){
                for (var a = 0; a < identLinks.length; a++){
                  var link = '',
                      alias = '',
                      linkicon = '',
                      linkFieldNull = false,
                      disableInPopUp = false,
                      popupType;
                  if(identLinks[a].disableinpopup){
                    disableInPopUp = true;
                  }
                  if(identLinks[a].disablelinksifnull){
                    var lfields = this._getFieldsfromLink(identLinks[a].content, currentLayer);
                    for (var lf=0; lf<lfields.length; lf++){
                      if(!obj[lfields[lf]] || obj[lfields[lf]] === '' || obj[lfields[lf]] === 'Null'){
                        linkFieldNull = true;
                        break;
                      }
                    }
                  }
                  if(linkFieldNull){
                    link = '';
                  }else{
                    link = this._substitute(identLinks[a].content, obj, currentLayer);
                  }
                  var sub = this._substitute(identLinks[a].alias, obj, currentLayer);
                  alias = (sub) ? sub : identLinks[a].alias;
                  linkicon = this._substitute((identLinks[a].icon || this.folderUrl + 'images/w_link.png'), obj, currentLayer);
                  popupType = identLinks[a].popuptype;
                  var lObj ={
                    link: link,
                    icon: linkicon,
                    alias: alias,
                    disableinpopup: disableInPopUp,
                    popuptype: popupType
                  };
                  if(!linkFieldNull){
                    lyrIdLinks.push(lObj);
                  }
                }
              }
              for (var f3 = 0; f3 < fldArr.length; f3++) {
                var cArr = fldArr[f3].split('~');
                try{
                  if(obj.hasOwnProperty(cArr[0])){
                    value = String(obj[cArr[0]]);
                  } else {
                    value = '';
                  }
                } catch (error){
                  value = '';
                }
                if(this.replacenullswithemptystring && (value === 'Null' || value === '<Null>')){
                  value = '';
                }

                var isDateField = false;
                var dateFormat = '';
                var numFormat = '';
                var curFormat = '';
                var useUTC = false;
                numFormat = cArr[4];
                curFormat = cArr[3];
                useUTC = (cArr[5] && cArr[5] === 'true');
                dateFormat = cArr[2];
                if (dateFormat !== 'NA'){
                  isDateField = true;
                }else{
                  isDateField = false;
                }
                if (isDateField) {
                  var dateMS = Number(value);
                  if (!isNaN(dateMS)) {
                    if (dateFormat !== '') {
                      value = this._formatDate(dateMS, dateFormat);
                    } else {
                      value = this._formatDate(dateMS, 'MM/dd/yyyy');
                    }
                  }
                }
                if(numFormat !=='NA' && value !== 'Null' && value !== ''){
                  var args = numFormat.split('|');
                  /*value,percision,symbol,thousands,decimal*/
                  value = this._formatNumber(value, args[0] || null, args[1] || null, args[2] || null);
                }
                if(curFormat !== 'NA' && value !== 'Null' && value !== ''){
                  var args2 = curFormat.split('|');
                  /*value, percision, symbol, thousands, decimal*/
                  value = this._formatCurrency(value, args2[1] || null, args2[0] || null, args2[2] || null, args2[3] || null);
                }
                var typeID = currentLayer.typeIdField ? obj[currentLayer.typeIdField] : null;
                if (cArr[0] === currentLayer.typeIdField) {
                  var featureType = this._getFeatureType(currentLayer, typeID);
                  if (featureType && featureType.name) {
                    value = featureType.name;
                  }
                } else {
                  var codedValue = this._getCodedValue(currentLayer, cArr[0], obj[cArr[0]], typeID);
                  if (codedValue) {
                    value = codedValue.name;
                  }
                }

                if(cArr[1] !== 'NA'){
                  content = content + this.resultFormatString.replace('[attribname]', cArr[1]).replace('[attribvalue]', value);
                }else{
                  content = content + this.resultFormatString.replace('[attribname]', cArr[0]).replace('[attribvalue]', value);
                }
                if(cArr[6] === 'false' || cArr[6] === 'NA'){
                  if(cArr[1] !== 'NA'){
                    rsltContent = rsltContent + this.resultFormatString.replace('[attribname]', cArr[1]).replace('[attribvalue]', value);
                  }else{
                    rsltContent = rsltContent + this.resultFormatString.replace('[attribname]', cArr[0]).replace('[attribvalue]', value);
                  }
                }
              }
              idResult.icon = this.folderUrl + 'images/i_info.png';
              idResult.title = identTitle;
              if(content.lastIndexOf('<br>') === (content.length - 4)){
                idResult.content = content.substr(0,content.length - 4);
              }else{
                idResult.content = content;
              }
              if(rsltContent.lastIndexOf('<br>') === (rsltContent.length - 4)){
                idResult.rsltcontent = rsltContent.substr(0,rsltContent.length - 4);
              }else{
                idResult.rsltcontent = rsltContent;
              }
              idResult.links = lyrIdLinks;
              idResult.alt = (f % 2 === 0);
              idResult.sym = this.resultSym;
              var projecting = false;
              //Check if we have run into the SR bug of the IdentifyTask when going to an older ArcGIS Server version
              /*if(this.returngeometryforzoom && gra.geometry.spatialReference.wkid !== this.map.spatialReference.wkid){
                if (gra.geometry.spatialReference.wkid === 4326 && this.map.spatialReference.isWebMercator()){
                  gra.geometry = webMercatorUtils.geographicToWebMercator(gra.geometry);
                }else{
                  projecting = true;
                  var projectParameters = new ProjectParameters();
                  projectParameters.geometries = [gra.geometry];
                  projectParameters.outSpatialReference = this.map.spatialReference;
                  geometryService.project(projectParameters2, new AsyncResponder(projectResult,projectFault,[idResult,identifyResult,identForceScale,content,title,link]));
                  esriConfig.defaults.geometryService.project(projectParameters, lang.hitch(this, this.projectResults),
                                                         lang.hitch(this, this.onError));
                }
              }*/

              if(this.identifyGeom.type === 'point'){
                idResult.centerpoint = this.identifyGeom;
                idResult.point = this.identifyGeom;
              }else{
                idResult.point = (this.returngeometryforzoom) ? this.getGeomCenter(gra.geometry) : this.getGeomCenter(this.identifyGeom);
                idResult.centerpoint = idResult.point;
              }
              idResult.geometry = (this.returngeometryforzoom) ? gra.geometry : this.identifyGeom;

              idResult.zoomScale = identZoom;
              idResult.zoom2msg = this.nls.zoom2message;
              idResult.removeResultMsg = this.nls.removeresultmessage;
              if(!projecting){
                var iGra = new Graphic(idResult.geometry);
                switch (idResult.geometry.type){
                  case 'point':
                  case 'multipoint':{
                    iGra.symbol = this.identMarkerSymbol;
                    break;
                  }
                  case 'polyline':{
                    iGra.symbol = this.identLineSymbol;
                    break;
                  }
                  case 'polygon':
                  case 'extent':{
                    iGra.symbol = this.identFillSymbol;
                    break;
                  }
                }

                idResult.graphic = iGra;
                idResult.id = 'id_' + this.gid;
                idResult.forceScale = identForceScale;
                this.identifyResultsArray.push(idResult);
                this.iResultLen += 1;
                var Atts = {
                  gid: this.gid,
                  content: content,
                  title: title,
                  icon: idResult.icon,
                  link: lyrIdLinks
                };
                iGra.attributes = Atts;
                if(this.enableGraphicClickInfo){
                  iGra.setInfoTemplate(this._configurePopupTemplate(idResult));
                }
                if(this.returngeometryforzoom){
                  this.graphicsLayer.add(iGra);
                }
                this.list.add(idResult);
              }
              idResult.id = 'id_' + this.gid;
              this.gid ++;
              if(this.identifyLayerOption === 'top' && this.resultFound){
                this.numServicesIdent = 0;
              }
            }else{
              if(this.config.layers.onlythese === false){
                this.resultFound = true;
                for (fld in obj){
                  if(fld.toUpperCase() !== 'SHAPE'){
                    try{
                      value = obj[fld] ? String(obj[fld]) : '';
                    } catch (error) {
                      value = '';
                    }
                    if(this.replacenullswithemptystring && (value === 'Null' || value === '<Null>')){
                      value = '';
                    }
                    content = content + '<em><strong>' + fld + '</strong></em>: <font color="blue">' + value + '</font>' + br;
                  }
                }

                idResult.icon = this.folderUrl + 'images/i_info.png';
                idResult.title = FeatureLayerName;
                if(content.lastIndexOf('<br>') === (content.length - 4)){
                  idResult.content = content.substr(0,content.length - 4);
                }else{
                  idResult.content = content;
                }
                idResult.rsltcontent = idResult.content;
                idResult.links = [];
                idResult.alt = (f % 2 === 0);
                idResult.sym = this.resultSym;
                var projecting2 = false;
                //Check if we have run into the SR bug of the IdentifyTask when going to an older ArcGIS Server version
                if(this.returngeometryforzoom && gra.geometry.spatialReference.wkid !== this.map.spatialReference.wkid){
                  if (gra.geometry.spatialReference.wkid === 4326 && this.map.spatialReference.isWebMercator()){
                    gra.geometry = webMercatorUtils.geographicToWebMercator(gra.geometry);
                  }/*else{
                    projecting2 = true;
                    var projectParameters2 = new ProjectParameters();
                    projectParameters2.geometries = [gra.geometry];
                    projectParameters2.outSpatialReference = this.map.spatialReference;
                    geometryService.project(projectParameters2, new AsyncResponder(projectResult,projectFault,[idResult,identifyResult,identForceScale,content,title,link]));
                    esriConfig.defaults.geometryService.project(projectParameters2, lang.hitch(this, this.projectResults),
                                                           lang.hitch(this, this.onError));
                  }*/
                }

                if(this.identifyGeom.type === 'point'){
                  idResult.centerpoint = idResult.point = this.identifyGeom;
                }else{
                  idResult.centerpoint = idResult.point = (this.returngeometryforzoom) ? this.getGeomCenter(gra.geometry) : this.getGeomCenter(this.identifyGeom);
                }
                idResult.geometry = (this.returngeometryforzoom) ? gra.geometry : this.identifyGeom;

                idResult.zoomScale = identZoom;
                idResult.zoom2msg = this.nls.zoom2message;
                idResult.removeResultMsg = this.nls.removeresultmessage;
                if(!projecting2){
                  var iGra2 = new Graphic(idResult.geometry);
                  switch (idResult.geometry.type){
                    case 'point':
                    case 'multipoint':{
                      iGra2.symbol = this.identMarkerSymbol;
                      break;
                    }
                    case 'polyline':{
                      iGra2.symbol = this.identLineSymbol;
                      break;
                    }
                    case 'polygon':
                    case 'extent':{
                      iGra2.symbol = this.identFillSymbol;
                      break;
                    }
                  }

                  idResult.graphic = iGra2;
                  idResult.id = 'id_' + this.gid;
                  idResult.forceScale = identForceScale;
                  this.identifyResultsArray.push(idResult);
                  var Atts2 = {
                    gid: this.gid,
                    content: content,
                    title: title,
                    icon: idResult.icon,
                    link: ''
                  };
                  iGra2.attributes = Atts2;
                  if(this.returngeometryforzoom){
                    this.graphicsLayer.add(iGra2);
                  }
                  if(this.enableGraphicClickInfo){
                    iGra2.setInfoTemplate(this._configurePopupTemplate(idResult));
                  }
                  this.list.add(idResult);
                }
                idResult.id = 'id_' + this.gid;
                this.gid ++;
                if(this.identifyLayerOption === 'top' && this.resultFound){
                  this.numServicesIdent = 0;
                }
              }
            }
          }
        }

        if(this.identifyResultsArray.length === 0 && this.numServicesIdent <= 0){
          this.divResultMessage.textContent = this.nls.noresultsfoundlabel;
          this.timedClose2();
        }else if(this.identifyResultsArray.length > 0 && this.numServicesIdent <= 0){
          this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.identifyResultsArray.length;
          this.timedClose2();
        }else{
          this.disableTimer2();
          this.divResultMessage.textContent = this.nls.loadinglabel + ' ' + this.nls.layersremaining + ' ' + this.numServicesIdent;
        }

        return r;
      },

      timedClose2: function(){
        clearTimeout(this.timer2);
        this.timer2 = setTimeout(
          lang.hitch(this, function(){
            if(this.identifyResultsArray.length === 0){
              this.tabContainer.selectTab(this.nls.identifylabel);
            }
          }
        ),this.autoCloseNum);
      },

      disableTimer2: function(){
        clearTimeout(this.timer2);
      },

      getResultByGID: function (gid) {
        var retResult;
        for (var i = 0; i < this.identifyResultsArray.length; i++){
          var sr = this.identifyResultsArray[i];
          if(parseInt(sr.id.replace('id_', '')) === gid){
            retResult = sr;
            break;
          }
        }
        return retResult;
      },

      destroy: function () {
        if(this.drawBox){
          this.drawBox.destroy();
          this.drawBox = null;
        }
        this.inherited(arguments);
      },

      onReceiveData: function(name, widgetId, data) {
        if(data.message && data.message === "Deactivate_DrawTool"){
          this.drawBox.deactivate();
        }
      },

      onOpen: function () {
        if(this.graphicsLayer){
          this.graphicsLayer.show();
          if(this.autoactivatedtool){
            this.drawBox.activate(this.autoactivatedtool.toUpperCase());
          }
        }
        this.infoWinMouseOver = on(this.map.infoWindow.domNode, 'mouseover', lang.hitch(this, function(){
          this.disableTimer();
        }));

        this.infoWinMouseOut = on(this.map.infoWindow.domNode, 'mouseout', lang.hitch(this, function() {
          this.timedClose();
        }));
      },

      onClose: function () {
        this._hideInfoWindow();
        this.drawBox.deactivate();
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
        if (this.map && 　this.map.infoWindow) {
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
