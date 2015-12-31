///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define, console, window, setTimeout, document*/
define([
  "dojo/_base/declare",
  "dijit/_WidgetsInTemplateMixin",
  "jimu/BaseWidget",
  "esri/graphic",
  "esri/geometry/Point",
  "esri/geometry/ScreenPoint",
  "jimu/PanelManager",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/PictureMarkerSymbol",
  "esri/geometry/webMercatorUtils",
  "esri/layers/GraphicsLayer",
  "dojo/_base/lang",
  "dojo/on",
  "dojo/_base/html",
  "dojo/_base/Color",
  "dojo/_base/query",
  "dojo/_base/array",
  "dojo/dom-style",
  "dojo/dom",
  "dojo/dom-geometry",
  "jimu/dijit/Message",
  "esri/SpatialReference",
  "esri/tasks/ProjectParameters",
  "dojo/dom-construct",
  "dojo/_base/window",
  "dojo/_base/unload",
  "esri/config"
  ],
  function (declare, _WidgetsInTemplateMixin, BaseWidget, Graphic, Point, ScreenPoint, PanelManager,
    SimpleMarkerSymbol, PictureMarkerSymbol, webMercatorUtils, GraphicsLayer, lang, on, html,
    Color, query, array, domStyle, dom, domGeom, Message, SpatialReference, ProjectParameters,
    domConstruct, win, baseUnload, esriConfig) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: "Google Street View",
      baseClass: "widget-street-view",
      img: null,
      handlers: null,
      gsvHeading: 0,
      graphicsLayerGSV: null,
      wBGColor: null,
      noSVImageAvailableMsg: null,
      gAPIKey: null,
      gAPIClientID: null,
      popupsBlocked: null,
      attempts: 0,
      showAddressControl: true,
      addressControlPosition: "TOP_CENTER",
      showPanControl: true,
      panControlPosition: "TOP_LEFT",
      showZoomControl: true,
      zoomControlPosition: "TOP_LEFT",
      zoomControlStyle: "SMALL",
      showImageDateControl: true,
      clickToGo: true,
      disableDoubleclickzoom: true,
      showLinkControl: true,
      windowWidth: 610,
      windowHeight: 700,
      hideStreetviewWindowWhenMin: true,
      _mapWkid: null,
      _isReady: false,
      lastDragX: 0,

      postMixInProperties: function () {
        this.inherited(arguments);
      },

      postCreate: function () {
        this.handlers = [];
        this.inherited(arguments);
        this.gAPIKey = this.config.googleapikey;
        this.gAPIClientID = this.config.clientid;
        this.showAddressControl = this.config.streetviewpanoramaoptions.addresscontrol.visible === true;
        this.addressControlPosition = this.config.streetviewpanoramaoptions.addresscontrol.controlposition;
        this.showPanControl = this.config.streetviewpanoramaoptions.pancontrol.visible === true;
        this.panControlPosition = this.config.streetviewpanoramaoptions.pancontrol.controlposition;
        this.showZoomControl = this.config.streetviewpanoramaoptions.zoomcontrol.visible === true;
        this.zoomControlPosition =  this.config.streetviewpanoramaoptions.zoomcontrol.controlposition;
        this.zoomControlStyle = this.config.streetviewpanoramaoptions.zoomcontrol.controlstyle;
        this.clickToGo = this.config.streetviewpanoramaoptions.clicktogo === true;
        this.disableDoubleclickzoom = this.config.streetviewpanoramaoptions.disabledoubleclickzoom === true;
        this.showImageDateControl = this.config.streetviewpanoramaoptions.imagedatecontrol === true;
        this.showLinkControl = this.config.streetviewpanoramaoptions.linkscontrol === true;
        this.wBGColor = this._getBackgroundColorFromTheme();
        this.noSVImageAvailableMsg = this.nls.nostreetviewimageavailablemsg;
        this.windowWidth = this.config.windowproperties.width;
        this.windowHeight = this.config.windowproperties.height;
        this.img = domConstruct.create("img", null, win.body(), "first");
        this.img.src = this.folderUrl + "images/flying_gsv_man_e.png";
        this.img.style.position = "absolute";
        this.graphicsLayerGSV = new GraphicsLayer();
        this.graphicsLayerGSV.name = "Google Street View Location";
        this.map.addLayer(this.graphicsLayerGSV);
        this.CheckForPopUpBlockers();
        document.svWidget = this;
        baseUnload.addOnWindowUnload(lang.hitch(this, function(){
          document.winobj.close();
        }));

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

      onClose: function () {
        document.winobj.close();
        this.graphicsLayerGSV.setVisibility(false);
      },

      onOpen: function(){
        this.attempts = 0;
        if(this.graphicsLayerGSV){
          this.graphicsLayerGSV.setVisibility(true);
        }
        if(this.hideStreetviewWindowWhenMin){
          if(this.popupsBlocked){
            var qMessage = new Message({
              type: "error",
              titleLabel: this.nls.popupblockererrortitle,
              message: this.nls.popupblockermsg,
              buttons: [{
                label: this.nls.ok,
                onClick: lang.hitch(this, lang.hitch(this, function(){
                  qMessage.close();
                  PanelManager.getInstance().closePanel(this.id + "_panel");
                }))
              }]
            });
          }else{
            this.openSVwin(this.wBGColor,this.noSVImageAvailableMsg,this.gAPIKey,this.gAPIClientID,this.windowWidth,this.windowHeight);
          }
        }
      },

      onMinimized: function(){
        if(this.hideStreetviewWindowWhenMin){
          if(this.graphicsLayerGSV){
            this.graphicsLayerGSV.visible = false;
          }
          document.winobj.close();
        }
      },

      destroy: function () {
        this.inherited(arguments);
        document.winobj.close();
      },

      startup: function () {
        this.inherited(arguments);
        this._mapWkid = this.map.spatialReference.isWebMercator() ?
          3857 : this.map.spatialReference.wkid;
        this.CheckForPopUpBlockers();
      },

      _cleanup: function(targets) {
        array.forEach(targets, function(t) {
          t.remove();
        });
      },

      _isWebMercator: function(wkid) {
        // true if this spatial reference is web mercator
        if (SpatialReference.prototype._isWebMercator) {
          return SpatialReference.prototype._isWebMercator.apply({
            wkid: parseInt(wkid, 10)
          }, []);
        } else {
          var sr = new SpatialReference(parseInt(wkid, 10));
          return sr.isWebMercator();
        }
      },

      _onSvgMoveHandler: function(event){
        if (event && event.preventDefault) {
          event.preventDefault();
        } else {
          window.event.returnValue = false;
        }
        domStyle.set(this.img, {
          "left": parseInt(event.clientX - (this.img.width /2)) + "px",
          "top": parseInt(event.clientY - this.img.height) + "px"
        });
        if(this.lastDragX < parseInt(event.clientX - (this.img.width /2))){
          if(this.img.src !== this.folderUrl + "images/flying_gsv_man_e.png"){
            this.img.src = this.folderUrl + "images/flying_gsv_man_e.png";
          }
        }else if(this.lastDragX > parseInt(event.clientX - (this.img.width /2))){
          if(this.img.src !== this.folderUrl + "images/flying_gsv_man_w.png"){
            this.img.src = this.folderUrl + "images/flying_gsv_man_w.png";
          }
        }
        this.lastDragX = parseInt(event.clientX - (this.img.width /2));
        return false;
      },

      _onSVGMouseDown: function(event){
        if (event && event.preventDefault) {
          event.preventDefault();
        } else {
          window.event.returnValue = false;
        }
        this.map.disablePan();
        html.replaceClass(this.gsvDragIcon, "gsviconplaced", "gsviconnormal");
        domStyle.set(this.img, {
          "left": parseInt(event.clientX - (this.img.width /2)) + "px",
          "top": parseInt(event.clientY - this.img.height) + "px"
        });
        this.img.style.zIndex = 9999;
        this.img.style.visibility = "visible";
        this._cleanup(this.handlers);
        this.handlers.push(on(win.body(), "mousemove", lang.hitch(this, this._onSvgMoveHandler)));
        this.handlers.push(this.map.on("mouse-up", lang.hitch(this, this._onSVGMouseUP)));
        return false;
      },

      _onSVGMouseUP: function (event) {
        this.img.style.zIndex = 0;
        this.img.style.visibility = "hidden";
        this.graphicsLayerGSV.clear();
        event.preventDefault();
        this._cleanup(this.handlers);
        var svgGraphic = new Graphic(event.mapPoint);
        svgGraphic.setAttributes(atts);
        svgGraphic.symbol = new PictureMarkerSymbol( this.folderUrl + "images/SVM.png", 60, 60);
        this.handlers.push(this.graphicsLayerGSV.on("mouse-down", lang.hitch(this, this._onSVGMouseDown)));

        var svgGraphicLOS = new Graphic(event.mapPoint);
        svgGraphicLOS.setAttributes(atts);
        svgGraphicLOS.symbol = new PictureMarkerSymbol( this.folderUrl + "images/los.png", 80, 80);
        svgGraphicLOS.symbol.setAngle(this.gsvHeading);
        this.graphicsLayerGSV.add(svgGraphicLOS);
        this.graphicsLayerGSV.add(svgGraphic);

        if (this._mapWkid === 4326 || this._isWebMercator(this._mapWkid)){
          var mPoint;
          if(this._mapWkid === 4326){
            mPoint = event.mapPoint;
          }else{
            mPoint = webMercatorUtils.webMercatorToGeographic(event.mapPoint);
          }
          var lng = mPoint.x.toFixed(12);
          var lat = mPoint.y.toFixed(12);
          var atts = {
            rotation: this.gsvHeading,
            lat: lat,
            lng: lng
          };
          svgGraphic.setAttributes(atts);
          svgGraphicLOS.setAttributes(atts);
          this.openSVwin(this.wBGColor, this.noSVImageAvailableMsg, this.gAPIKey, this.gAPIClientID, this.windowWidth, this.windowHeight);
          this.checkForSVPano(lat, lng);
        }else{
          //console.info("Begining BNG X: " + event.mapPoint.x + ", " + "Y: " + event.mapPoint.y);
          var projectParameters = new ProjectParameters();
          projectParameters.geometries = [svgGraphic.geometry];
          projectParameters.outSR = new SpatialReference(4326);
          esriConfig.defaults.geometryService.project(projectParameters, lang.hitch(this, this.project2Geographic),
                                                         lang.hitch(this, this.onError));
        }
        this.map.enablePan();
      },

      popupWasBlocked: function(){
        this.popupsBlocked = true;
        var qMessage = new Message({
          type: "error",
          titleLabel: this.nls.popupblockererrortitle,
          message: this.nls.popupblockermsg,
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, lang.hitch(this, function(){
              qMessage.close();
              PanelManager.getInstance().closePanel(this.id + "_panel");
            }))
          }]
        });
      },

      popupNotBlocked: function(){
        this.popupsBlocked = false;
        this.openSVwin(this.wBGColor, this.noSVImageAvailableMsg, this.gAPIKey, this.gAPIClientID, this.windowWidth, this.windowHeight);
        /*if(this.checkIfOpera()){

        }*/
      },

      CheckForPopUpBlockers: function(){
        if(this.checkIfChrome()){
          if(this.detectChromeBlocker()){
            if (window.console){console.info("Chrome Blocker");}
          }
        }else{
          if(this.detectBlocker()){
            //blocked
            console.info("Blocker detected");
            //display error message
            new Message({
              titleLabel: this.nls.popupblockererrortitle,
              message: this.nls.popupblockermsg
            });
          }else{
            //not blocked
            this.openSVwin(this.wBGColor, this.noSVImageAvailableMsg, this.gAPIKey, this.gAPIClientID, this.windowWidth, this.windowHeight);
          }
        }
      },

      openSVwin: function(wBGColor, nSVImageAvailableMsg, gAPIKey, gAPIClientID, winWidth, winHeight) {
        try {
          if (!document.winobj || typeof (document.winobj) === "undefined" || document.winobj.closed) {
            var url = "widgets/StreetView/StreetView.html?wbgColor=" + wBGColor + "&nSVImageAvailableMsg=" + nSVImageAvailableMsg;
            var url2 = "";
            var windowName = "StreetView";
            var features = "modal=yes,alwaysRaised=yes,toolbar=no,location=no,resizable=yes,directories=no,status=no,scrollbars=no,copyhistory=no,width=" + winWidth + ",height=" + winHeight;
            if (!gAPIClientID) {
              url2 = "&gAPIKey=" + gAPIKey;
            } else {
              url2 = "&gAPIClientID=" + gAPIClientID;
            }
            if (typeof (document.parentWindow) !== "undefined") {
              document.winobj = document.parentWindow.open(url.concat(url2), windowName, features);
            } else {
              document.winobj = window.open(url.concat(url2), "_blank", features);
            }
          } else {
            document.winobj.focus();
          }
        } catch (e) {
          alert(e.message);
        }
      },

      noStreetViewAvailable: function() {
        this._cleanup(this.handlers);
        var osvgGraphic = this.graphicsLayerGSV.graphics[this.graphicsLayerGSV.graphics.length - 1];
        this.graphicsLayerGSV.clear();
        var atts = {
          rotation: this.gsvHeading,
          lat: osvgGraphic.geometry.y,
          lng: osvgGraphic.geometry.x
        };
        var pmGSVM = new PictureMarkerSymbol( this.folderUrl + "images/graySVM.png", 60, 60);
        var svgGraphic = new Graphic(osvgGraphic.geometry, pmGSVM, atts);
        this.handlers.push(this.graphicsLayerGSV.on("mouse-down", lang.hitch(this, this._onSVGMouseDown)));
        this.graphicsLayerGSV.add(svgGraphic);
      },

      setWindowReady: function(isReady){
        this._isReady = isReady;
        if(this.graphicsLayerGSV && this.graphicsLayerGSV.graphics && this.graphicsLayerGSV.graphics.length > 0){
          var svgGraphic = this.graphicsLayerGSV.graphics[1];
          this.checkForSVPano(svgGraphic.attributes.lat, svgGraphic.attributes.lng);
        }
      },

      setYawHandler: function(rotation){
        var svgGraphic = this.graphicsLayerGSV.graphics[1];
        var svgGraphicLOS = this.graphicsLayerGSV.graphics[0];
        this.gsvHeading = rotation;
        svgGraphic.attr("rotation", this.gsvHeading);
        svgGraphicLOS.symbol.setAngle(this.gsvHeading);
        this.graphicsLayerGSV.refresh();
      },

      setLatLonHandler: function(lat, lon){
        var svgGraphic = this.graphicsLayerGSV.graphics[1];
        var svgGraphicLOS = this.graphicsLayerGSV.graphics[0];
        svgGraphic.attr("rotation", this.gsvHeading);
        svgGraphicLOS.symbol.setAngle(this.gsvHeading);
        svgGraphic.attr("lat", lat);
        svgGraphic.attr("lng", lon);
        svgGraphicLOS.attr("lat", lat);
        svgGraphicLOS.attr("lng", lon);
        var gPnt = svgGraphic.geometry;
        var mPoint = new Point(lon, lat, new SpatialReference(4326));
        if (this._mapWkid === 4326 || this._isWebMercator(this._mapWkid)){
          if(this._mapWkid === 4326){
            svgGraphic.setGeometry(mPoint);
          }else{
            mPoint = webMercatorUtils.geographicToWebMercator(mPoint);
          }

          if (mPoint.x !== gPnt.x && mPoint.y !== gPnt.y){
            this.map.centerAt(mPoint);
            svgGraphic.setGeometry(mPoint);
            svgGraphicLOS.setGeometry(mPoint);
          }
          this.graphicsLayerGSV.refresh();
        }else{
//            console.info("After SV Lat: " + lat + ", " + "Lon: " + lon);
          var projectParameters = new ProjectParameters();
          projectParameters.geometries = [mPoint];
          projectParameters.outSR = this.map.spatialReference;
          esriConfig.defaults.geometryService.project(projectParameters, lang.hitch(this, this.project2Map),
                                                     lang.hitch(this, this.onError));
        }
      },

      project2Map: function(geometries){
        var point = geometries[0];
        var svgGraphic = this.graphicsLayerGSV.graphics[1];
        var svgGraphicLOS = this.graphicsLayerGSV.graphics[0];
        var gPnt = svgGraphic.geometry;
        svgGraphic.attr("rotation", this.gsvHeading);
        svgGraphicLOS.symbol.setAngle(this.gsvHeading);
        if (point.x != gPnt.x && point.y != gPnt.y){
          this.map.centerAt(point);
          svgGraphic.setGeometry(point);
          svgGraphicLOS.setGeometry(point);
        }
        this.graphicsLayerGSV.refresh();
      },

      project2Geographic: function(geometries){
        try{
          var mPoint = geometries[0];
//          console.info("End BNG X: " + mPoint.x + ", " + "Y: " + mPoint.y);
          if (mPoint){
            var svgGraphic = this.graphicsLayerGSV.graphics[1];
            var svgGraphicLOS = this.graphicsLayerGSV.graphics[0];
            svgGraphic.attr("rotation", this.gsvHeading);
            svgGraphicLOS.symbol.setAngle(this.gsvHeading);
            var lng = mPoint.x.toFixed(6);
            var lat = mPoint.y.toFixed(6);
            var atts = {
              rotation: this.gsvHeading,
              lat: lat,
              lng: lng
            };
            svgGraphic.setAttributes(atts);
            svgGraphicLOS.setAttributes(atts);

            this.openSVwin(this.wBGColor, this.noSVImageAvailableMsg, this.gAPIKey, this.gAPIClientID, this.windowWidth, this.windowHeight);
            this.checkForSVPano(lat, lng);
            this.graphicsLayerGSV.refresh();
          }
        }catch(err){
          alert.show(err.toString());
        }
      },

      onError: function(msg) {
        alert(msg);
      },

      checkForSVPano: function(lat, lng){
        if(this._isReady){
          this.attempts = 0;
          document.winobj.checkForSVpano(lat, lng, this.showAddressControl.toString(), this.showPanControl.toString(), this.showZoomControl.toString(),
                                     this.showImageDateControl.toString(), this.panControlPosition, this.addressControlPosition, this.clickToGo.toString(),
                                     this.disableDoubleclickzoom.toString(), this.zoomControlPosition, this.zoomControlStyle, this.showLinkControl.toString(),
                                     this.gsvHeading);
        }else{
          if(this.attempts < 4){
            setTimeout(lang.hitch(this, function(){this.checkForSVPano(lat, lng);}, 200));
          }
          this.attempts++;
        }
      },

      checkIfChrome: function () {
        var isChrome = !!window.chrome;
        return isChrome;
      },

      /*checkIfOpera: function () {
        var isOpera = !!window.opera || navigator.userAgent.indexOf(" OPR/") >= 0;
        return isOpera;
      },*/

      detectBlocker: function () {
        var pop = window.open("about:blank", "new_window_123", "height=150, width=150");
        var isblock = false;
        try {
          if (!pop || pop.closed || pop.closed == "undefined" || pop == "undefined" || parseInt(pop.innerWidth) === 0) {
            isblock = true;
          }
          if(pop){pop.close();}
        } catch (e) {
          isblock = true;
        }
        return isblock;
      },

      ChromeBlockerResponce: function (wasBlocked) {
        if (wasBlocked) {
          this.popupWasBlocked();
        } else {
          this.popupNotBlocked();
        }
      },

      detectChromeBlocker: function () {
        //console.log("chrome detected");
        var pop = window.open("about:blank", "new_window_123", "height=150,width=150");
        setTimeout(function () {
          if (pop.document.documentElement.clientWidth != 150 || pop.document.documentElement.clientHeight != 150) {
            if(pop){pop.close();}
            //console.log("poup was blocked");
            this.ChromeBlockerResponce(true);
          } else {
            if(pop){pop.close();}
            //console.log("poup was NOT blocked");
            this.ChromeBlockerResponce(false);
          }
        }, 1000);
      },

      _getBackgroundColorFromTheme: function(){
        var returnColor;
        switch(this.appConfig.theme.name + this.appConfig.theme.styles[0]) {
        /*BillboardTheme*/
          case "BillboardThemeblue":
            returnColor = "2f70e4";
            break;
          case "BillboardThemedefault":
            returnColor = "2e3641";
            break;
          case "BillboardThemegreen":
            returnColor = "6db8ac";
            break;
          case "BillboardThemeorange":
            returnColor = "edbd35";
            break;
          case "BillboardThemepink":
            returnColor = "fe6960";
            break;
          case "BillboardThemepurple":
            returnColor = "856d9c";
            break;
          case "BillboardThemered":
            returnColor = "e83428";
            break;
          case "BillboardThemeturquoise":
            returnColor = "2d95a0";
            break;
        /*BoxTheme*/
          case "BoxThemeblue":
            returnColor = "2d70e4";
            break;
          case "BoxThemedefault":
            returnColor = "646464";
            break;
          case "BoxThemegreen":
            returnColor = "80ab00";
            break;
          case "BoxThemepink":
            returnColor = "ed008c";
            break;
          case "BoxThemepurple":
            returnColor = "886197";
            break;
          case "BoxThemeorange":
            returnColor = "ff9b00";
            break;
          case "BoxThemered":
            returnColor = "cf0000";
            break;
          case "BoxThemeturquoise":
            returnColor = "2faacd";
            break;
        /*DartTheme*/
          case "DartThemeblue":
            returnColor = "2d70e4";
            break;
          case "DartThemedefault":
            returnColor = "646464";
            break;
          case "DartThemegreen":
            returnColor = "80ab00";
            break;
          case "DartThemeorange":
            returnColor = "ff9b00";
            break;
          case "DartThemepink":
            returnColor = "ed008c";
            break;
          case "DartThemepurple":
            returnColor = "886197";
            break;
          case "DartThemered":
            returnColor = "cf0000";
            break;
          case "DartThemeturquoise":
            returnColor = "2faacd";
            break;
        /*FoldableTheme*/
          case "FoldableThemeblack":
            returnColor = "000000";
            break;
          case "FoldableThemeblue":
            returnColor = "005fa2";
            break;
          case "FoldableThemecyan":
            returnColor = "267030";
            break;
          case "FoldableThemedefault":
            returnColor = "485566";
            break;
          case "FoldableThemegreen":
            returnColor = "2aaa8a";
            break;
          case "FoldableThemepurple":
            returnColor = "aa6fad";
            break;
          case "FoldableThemered":
            returnColor = "c93048";
            break;
          case "FoldableThemeyellow":
            returnColor = "d07d0e";
            break;
        /*JewelryBoxTheme*/
          case "JewelryBoxThemeblack":
            returnColor = "000000";
            break;
          case "JewelryBoxThemeblue":
            returnColor = "005fa2";
            break;
          case "JewelryBoxThemecyan":
            returnColor = "26703d";
            break;
          case "JewelryBoxThemedefault":
            returnColor = "485566";
            break;
          case "JewelryBoxThemegreen":
            returnColor = "2aaa8a";
            break;
          case "JewelryBoxThemepurple":
            returnColor = "ab6ead";
            break;
          case "JewelryBoxThemered":
            returnColor = "c93048";
            break;
          case "JewelryBoxThemeyellow":
            returnColor = "d07d0e";
            break;
        /*LaunchpadTheme*/
          case "LaunchpadThemedefault":
            returnColor = "262626";
            break;
          case "LaunchpadThemestyle2":
            returnColor = "262626";
            break;
        /*TabTheme*/
          case "TabThemeblue":
            returnColor = "0057b9";
            break;
          case "TabThemecyan":
            returnColor = "2aaa8a";
            break;
          case "TabThemedefault":
            returnColor = "292929";
            break;
          case "TabThemegreen":
            returnColor = "05ab08";
            break;
          case "TabThemepurple":
            returnColor = "ab6ead";
            break;
          case "TabThemered":
            returnColor = "c82f47";
            break;
          case "TabThemesimpleblue":
            returnColor = "3499dc";
            break;
          case "TabThemeyellow":
            returnColor = "d07d0e";
            break;
        /*Unknown*/
          default:
            returnColor = "485566";
            break;
        }
        return returnColor;
      }
    });
  });
