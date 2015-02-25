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
        'dojo/_base/html',
        'dojo/_base/array',
        'dojo/promise/all',
        'dojo/date',
        'dojo/date/locale',
        './DrawBox',
        'jimu/utils',
        'jimu/dijit/LoadingShelter',
        'dojo/io-query',
        'esri/SpatialReference',
        'esri/tasks/ProjectParameters',
        'esri/geometry/webMercatorUtils',
        'dijit/form/Select'],
  function (declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, List, IdentifyTask, IdentifyParameters,
    IdentifyResult, Message, Query, QueryTask, CodedValueDomain, Domain, GraphicsLayer, FeatureLayer, FeatureType, Field,
    RangeDomain, GeometryService, esriConfig, Graphic, graphicsUtils, Point, SimpleMarkerSymbol,
    PictureMarkerSymbol, Polyline, SimpleLineSymbol, Polygon, Multipoint, Extent, Geometry, SimpleFillSymbol,
    SimpleRenderer, Draw, PopupTemplate, esriRequest, TimeExtent, Deferred, ProgressBar, lang, on, html, array,
    all, date, locale, DrawBox, utils, LoadingShelter, ioquery, SpatialReference, ProjectParameters, webMercatorUtils) {
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

      postCreate: function () {
        this.inherited(arguments);
        this.resultSym = new PictureMarkerSymbol({
          'url': this.folderUrl + 'images/i_info.png',
          'height': '20',
          'width': '20',
          'type': 'esriPMS',
          'angle': '0'
        });
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

      _initDrawBox: function () {
        this.drawBox.setMap(this.map);
        var enabledButtons = ['point'];
        if(this.config.enablelineselect){
          enabledButtons.push('line');
        }
        if(this.config.enablepolylineselect){
          enabledButtons.push('polyline');
        }
        if(this.config.enablefreehandlineselect){
          enabledButtons.push('freehand_polyline');
        }
        if(this.config.enabletriangleselect){
          enabledButtons.push('triangle');
        }
        if(this.config.enableextentselect){
          enabledButtons.push('extent');
        }
        if(this.config.enablecircleselect){
          enabledButtons.push('circle');
        }
        if(this.config.enableellipseselect){
          enabledButtons.push('ellipse');
        }
        if(this.config.enablepolyselect){
          enabledButtons.push('polygon');
        }
        if(this.config.enablefreehandpolyselect){
          enabledButtons.push('freehand_polygon');
        }
        this.drawBox.setTypes(enabledButtons);
        this.drawBox.setPointSymbol(this.identMarkerSymbol);
        this.drawBox.setLineSymbol(this.identLineSymbol);
        this.drawBox.setPolygonSymbol(this.identFillSymbol);
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
        if(this.keepActive && this.drawBox.activate){
          this.drawBox.activate(this.drawBox.lastTool);
        }else{
          this.drawBox.deactivate();
          this.map.enableMapNavigation();
        }

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

        var params = this.createIdentifyParams(layers, geom);
        var params2 = this.createQueryParams(featureLayers, geom);

        var promises = [];
        var promises2 = [];

        for (var i = 0; i < tasks.length; i++) {
          promises.push(tasks[i].execute(params[i]));
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
          this.showIdentifyResults(r, tasks);
        }), lang.hitch(this, function (err){
          console.info(err);
        }));

        qPromises.then(lang.hitch(this, function (r) {
          if(this.returngeometryforzoom){
            this.graphicsLayer.clear();
          }
          this.showQueryResults(r, tasks2, FeatLyrNames);
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
//            console.info(subLayers);
            identifyParams.layerIds = subLayers;
          } else {
            identifyParams.layerIds = [];
          }
          identifyParamsList.push(identifyParams);
        }));
        return identifyParamsList;
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

      showIdentifyResults: function (r, itasks) {
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
          var br = '';
          var line = '';
          var label = '';
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
              var str = fld.name + '~';
              if(fld.alias){
                if(fld.alias === ''){
                  str += 'NA~';
                }else{
                  str += fld.alias + '~';
                }
              }else{
                str += 'NA~';
              }
              if(fld.dateformat){
                if(fld.dateformat === ''){
                  str += 'NA~';
                }else{
                  str += fld.dateformat + '~';
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
                    if(!obj[lfields[lf]] || obj[lfields[lf]] === ''){
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
                lyrIdLinks.push(lObj);
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
                /*value,percision,symbol,thousands,decimal*/
                value = this._formatNumber(value,args[0]||null,args[1]||null,args[2]||null);
              }
              if(curFormat !== 'NA' && value !== 'Null' && value !== ''){
                var args2 = curFormat.split('|');
                /*value,percision,symbol,thousands,decimal*/
                value = this._formatCurrency(value,args2[1]||null,args2[0]||null,args2[2]||null,args2[3]||null);
              }

              if(cArr[1] !== 'NA'){
                content = content + br + cArr[1] + ': ' + value;
                br = '<br>';
              }else{
                content = content + br + cArr[0] + ': ' + value;
                br = '<br>';
              }
              if(cArr[6] === 'false' || cArr[6] === 'NA'){
                if(cArr[1] !== 'NA'){
                  rsltContent = content + br + cArr[1] + ': ' + value;
                  br = '<br>';
                }else{
                  rsltContent = content + br + cArr[0] + ': ' + value;
                  br = '<br>';
                }
              }
            }
            idResult.icon = this.folderUrl + 'images/i_info.png';
            idResult.title = identifyResult.layerName;
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
            idResult.label = label;
            idResult.links = lyrIdLinks;
            idResult.alt = (index % 2 === 0);
            idResult.sym = this.resultSym;
            var projecting = false;
            //Check if we have run into the SR bug of the IdentifyTask when going to an older ArcGIS Server version
            if(this.returngeometryforzoom && identifyResult.feature.geometry.spatialReference.wkid !== this.map.spatialReference.wkid){
              if (identifyResult.feature.geometry.spatialReference.wkid === 4326 && this.map.spatialReference.isWebMercator()){
                identifyResult.feature.geometry = webMercatorUtils.geographicToWebMercator(identifyResult.feature.geometry);
              }else{
                projecting = true;
                var projectParameters = new ProjectParameters();
                projectParameters.geometries = [identifyResult.feature.geometry];
                projectParameters.outSpatialReference = this.map.spatialReference;
                //geometryService.project(projectParameters2, new AsyncResponder(projectResult,projectFault,[idResult,identifyResult,identForceScale,content,title,link]));
                esriConfig.defaults.geometryService.project(projectParameters, lang.hitch(this, this.projectResults),
                                                       lang.hitch(this, this.onError));
              }
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
              switch (identifyResult.feature.geometry.type){
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
                  //value = value.replace(/>/g,'&gt;').replace(/</g,'&lt;');
                  label = label + line + fld + ': ' + value;
                  line = ', ';
                  content = content + br + fld + ': ' + value;
                  br = '<br>';
                }
              }

              idResult.icon = this.folderUrl + 'images/i_info.png';
              idResult.title = identifyResult.layerName;
              idResult.content = content;
              idResult.rsltcontent = content;
              idResult.label = label;
              idResult.links = [];
              idResult.alt = (index % 2 === 0);
              idResult.sym = this.resultSym;
              var projecting2 = false;
              //Check if we have run into the SR bug of the IdentifyTask when going to an older ArcGIS Server version
              if(this.returngeometryforzoom && identifyResult.feature.geometry.spatialReference.wkid !== this.map.spatialReference.wkid){
                if (identifyResult.feature.geometry.spatialReference.wkid === 4326 && this.map.spatialReference.isWebMercator()){
                  identifyResult.feature.geometry = webMercatorUtils.geographicToWebMercator(identifyResult.feature.geometry);
                }else{
                  projecting2 = true;
                  var projectParameters2 = new ProjectParameters();
                  projectParameters2.geometries = [identifyResult.feature.geometry];
                  projectParameters2.outSpatialReference = this.map.spatialReference;
                  //geometryService.project(projectParameters2, new AsyncResponder(projectResult,projectFault,[idResult,identifyResult,identForceScale,content,title,link]));
                  esriConfig.defaults.geometryService.project(projectParameters2, lang.hitch(this, this.projectResults),
                                                         lang.hitch(this, this.onError));
                }
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

      _substitute:function(string, Attribs){
        var lfields = this._getFieldsfromLink(string);
        for (var lf=0; lf<lfields.length; lf++){
          if(Attribs[lfields[lf]]){
            string = string.replace(new RegExp('{' + lang.trim(lfields[lf]) + '}', 'g'), lang.trim(Attribs[lfields[lf]]));
          }
        }
        return string;
      },

      _getFieldsfromLink:function(strLink) {
        var retArr = [];
        var b1 = 0;
        var e1 = 0;
        var fldName = '';
        do{
          b1 = strLink.indexOf('{', e1);
          if(b1 === -1 ){break;}
          e1 = strLink.indexOf('}', b1);
          fldName = strLink.substring(b1 + 1,e1);
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

      projectResults: function (geometries, data) {
/*todo i need to find a 9.3 server that has the SR bug issue so I can test this function*/
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
      },

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
            if (((sfx === '.jpg') || (sfx === '.png') || (sfx === '.gif')) && listItem.links[l].popuptype !== 'text'){ // use PopUpMediaInfo if it is an image
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

      showQueryResults: function (r, qtasks, fnames) {
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

          //this.iResultLen += r[i].features.length;
          for (var f = 0; f < r[i].features.length; f++) {
            var feats = r[i].features;
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
            var br = '';
            var line = '';
            var label = '';

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
                fldAlias = (feats.fieldAliases && feats.fieldAliases[fld.name])?feats.fieldAliases[fld.name]:fld.name;
                var str = fld.name + '~';
                if(fld.alias){
                  if(fld.alias === ''){
                    str += fldAlias + '~';
                  }else{
                    str += fld.alias + '~';
                  }
                }else{
                  str += fldAlias + '~';
                }
                if(fld.dateformat){
                  if(fld.dateformat === ''){
                    str += 'NA~';
                  }else{
                    str += fld.dateformat + '~';
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
                      if(!obj[lfields[lf]] || obj[lfields[lf]] === ''){
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
                  lyrIdLinks.push(lObj);
                }
              }
              for (var f3 = 0; f3 < fldArr.length; f3++) {
                var cArr = fldArr[f3].split('~');
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
                  /*value,percision,symbol,thousands,decimal*/
                  value = this._formatNumber(value,args[0]||null,args[1]||null,args[2]||null);
                }
                if(curFormat !== 'NA' && value !== 'Null' && value !== ''){
                  var args2 = curFormat.split('|');
                  /*value,percision,symbol,thousands,decimal*/
                  value = this._formatCurrency(value,args2[1]||null,args2[0]||null,args2[2]||null,args2[3]||null);
                }

                if(cArr[1] !== 'NA'){
                  content = content + br + cArr[1] + ': ' + value;
                  br = '<br>';
                }else{
                  content = content + br + cArr[0] + ': ' + value;
                  br = '<br>';
                }
                if(cArr[6] === 'false' || cArr[6] === 'NA'){
                  if(cArr[1] !== 'NA'){
                    rsltContent = content + br + cArr[1] + ': ' + value;
                    br = '<br>';
                  }else{
                    rsltContent = content + br + cArr[0] + ': ' + value;
                    br = '<br>';
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
              idResult.label = label;
              idResult.links = lyrIdLinks;
              idResult.alt = (f % 2 === 0);
              idResult.sym = this.resultSym;
              var projecting = false;
              //Check if we have run into the SR bug of the IdentifyTask when going to an older ArcGIS Server version
              if(this.returngeometryforzoom && gra.geometry.spatialReference.wkid !== this.map.spatialReference.wkid){
                if (gra.geometry.spatialReference.wkid === 4326 && this.map.spatialReference.isWebMercator()){
                  gra.geometry = webMercatorUtils.geographicToWebMercator(gra.geometry);
                }else{
                  projecting = true;
                  var projectParameters = new ProjectParameters();
                  projectParameters.geometries = [gra.geometry];
                  projectParameters.outSpatialReference = this.map.spatialReference;
                  //geometryService.project(projectParameters2, new AsyncResponder(projectResult,projectFault,[idResult,identifyResult,identForceScale,content,title,link]));
                  esriConfig.defaults.geometryService.project(projectParameters, lang.hitch(this, this.projectResults),
                                                         lang.hitch(this, this.onError));
                }
              }

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
                    label = label + line + fld + ': ' + value;
                    line = ', ';
                    content = content + br + fld + ': ' + value;
                    br = '<br>';
                  }
                }

                idResult.icon = this.folderUrl + 'images/i_info.png';
                idResult.title = FeatureLayerName;
                idResult.content = content;
                idResult.rsltcontent = content;
                idResult.label = label;
                idResult.links = [];
                idResult.alt = (f % 2 === 0);
                idResult.sym = this.resultSym;
                var projecting2 = false;
                //Check if we have run into the SR bug of the IdentifyTask when going to an older ArcGIS Server version
                if(this.returngeometryforzoom && gra.geometry.spatialReference.wkid !== this.map.spatialReference.wkid){
                  if (gra.geometry.spatialReference.wkid === 4326 && this.map.spatialReference.isWebMercator()){
                    gra.geometry = webMercatorUtils.geographicToWebMercator(gra.geometry);
                  }else{
                    projecting2 = true;
                    var projectParameters2 = new ProjectParameters();
                    projectParameters2.geometries = [gra.geometry];
                    projectParameters2.outSpatialReference = this.map.spatialReference;
                    //geometryService.project(projectParameters2, new AsyncResponder(projectResult,projectFault,[idResult,identifyResult,identForceScale,content,title,link]));
                    esriConfig.defaults.geometryService.project(projectParameters2, lang.hitch(this, this.projectResults),
                                                           lang.hitch(this, this.onError));
                  }
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
      }

    });
  });
