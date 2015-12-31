define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/Color',  
  'dojo/_base/lang',
  'dojo/aspect',
  'dojo/dom',
  'dojo/dom-attr',
  'dojo/dom-class',
  'dojo/dom-construct',
  'dojo/dom-style',
  'dojo/number',
  'dojo/on',
  'dojo/query',
  'dojox/lang/functional',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetBase',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/form/HorizontalRule',
  'dijit/form/HorizontalRuleLabels',
  'esri/config',
  'esri/geometry/Extent',
  'esri/geometry/Point',
  'esri/geometry/Polygon',  
  'esri/geometry/Polyline',
  'esri/geometry/scaleUtils',
  'esri/graphic', 
  'esri/renderers/SimpleRenderer',
  'esri/request',
  'esri/symbols/CartographicLineSymbol',
  'esri/symbols/Font',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/TextSymbol',
  'esri/tasks/LengthsParameters',
  'esri/tasks/PrintParameters',
  'esri/tasks/PrintTask',
  'esri/tasks/PrintTemplate',
  'esri/units',
  'dojo/text!./templates/PrintPlus.html',
  'dojo/text!./templates/PrintResult.html',
  'jimu/dijit/LoadingShelter',
  'jimu/dijit/Message',
  'jimu/portalUrlUtils',
  // These classes are used only in PrintPlus.html and/or PrintResult.html
  'dijit/form/Button',
  'dijit/form/CheckBox',
  'dijit/form/DropDownButton',
  'dijit/form/Form',
  'dijit/form/HorizontalSlider',
  'dijit/form/NumberTextBox',
  'dijit/form/RadioButton',
  'dijit/form/Select',
  'dijit/form/ValidationTextBox',
  'dijit/ProgressBar',
  'dijit/TooltipDialog'
], function(
  declare,
  array,
  Color, 
  lang,
  aspect,
  dom,
  domAttr,
  domClass,
  domConstruct,
  domStyle,
  number,
  on,
  query,
  functional,
  _TemplatedMixin,
  _WidgetBase,
  _WidgetsInTemplateMixin,
  HorizontalRule, 
  HorizontalRuleLabels,
  esriConfig,
  Extent, 
  Point,  
  Polygon, 
  Polyline, 
  scaleUtils,
  Graphic, 
  SimpleRenderer,
  esriRequest,
  CartographicLineSymbol,
  Font,
  SimpleFillSymbol, 
  SimpleMarkerSymbol,
  TextSymbol,
  LengthsParameters,
  PrintParameters,
  PrintTask,
  PrintTemplate,
  Units, 
  printTemplate,
  printResultTemplate,
  LoadingShelter,
  Message,
  portalUrlUtils
) {

  // Main print dijit
  var PrintDijit = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    widgetsInTemplate: true,
    templateString: printTemplate,
    map: null,
    count: 1,
    results: [],
    authorText: null,
    copyrightText: null,
    defaultTitle: null,
    defaultFormat: null,
    defaultLayout: null,
    defaultDpi: 90,
    noTitleBlockPrefix: null,
    layoutParams: null,
    mapSheetParams: {},
    relativeScale: null,
    titleBlock: true,
    relativeScaleFactor: null,
    scalePrecision: null,
    mapScales: null,
    outWkid: null,
    showLayout: true,
    showOpacitySlider: true,
    domIdPrefix: null,
    isDocked: false,
    suspendExtentHandler: false,
    dragSwipeHandlers: [],
    panZoomHandlers: [],
    resizeDelay: 100,
    widgetOpacityOver: 1.0,
    widgetOpacityOut: 0.9,
    // scaleLabelMaps defines the location of scale labels for an array of scales where the scale array length minus 1 is the index of this array
    // (e.g. an array of scales with length 9 would have labels for the first, third, fifth, seventh, and ninth scales ([0, 2, 4, 6, 8]))
    scaleLabelMaps: [[0],[0,1],[0,1,2],[0,1,2,3],[0,1,2,3,4],[0,5],[0,2,4,6],[0,7],[0,2,4,6,8],[0,3,6,9],[0,5,10],[0,11],[0,6,12],
                     [0,13],[0,7,14],[0,5,10,15],[0,4,8,12,16],[0,17],[0,9,18],[0,19],[0,5,10,15,20],[0,7,14,21],[0,11,22],[0,23],
                     [0,6,12,18,24],[0,5,10,15,20,25],[0,13,26],[0,9,18,27],[0,7,14,21,28],[0,29],[0,10,19,30],[0,8,16,23,31],
                     [0,8,16,24,32],[0,11,22,33],[0,17,34],[0,7,14,24,28,35],[0,9,18,28,36],[0,37],[0,19,38],[0,13,25,39]], 
    baseClass: "gis_PrintPlusDijit",
    pdfIcon: require.toUrl("./widgets/PrintPlus/images/pdf.png"),
    imageIcon: require.toUrl("./widgets/PrintPlus/images/image.png"),
    printTaskURL: null,
    printTask: null,
    async: false,
    mapUnitsToMeters: {},
    layoutLayerId: 'layoutGraphics',  // Make sure the layoutLayerId doesn't start with 'graphicsLayer' or it will be printed.
    
    postCreate: function() {
      this.inherited(arguments);
      var printParams = {
        async: this.async
      };
      var _handleAs = 'json';
      
      this.printTask = new PrintTask(this.printTaskURL, printParams);
      this.printparams = new PrintParameters();
      this.printparams.map = this.map;
      this.printparams.outSpatialReference = this.map.spatialReference;

      this.shelter = new LoadingShelter({
        hidden: true
      });
      this.shelter.placeAt(this.domNode);
      this.shelter.startup();
      this.shelter.show();

      this.titleNode.set('value', this.defaultTitle);
      this.authorNode.set('value', this.defaultAuthor);
      this.copyrightNode.set('value', this.defaultCopyright);

      var serviceUrl = portalUrlUtils.setHttpProtocol(this.printTaskURL);
      var portalNewPrintUrl = portalUrlUtils.getNewPrintUrl(this.appConfig.portalUrl);

      if (serviceUrl === portalNewPrintUrl ||
        /sharing\/tools\/newPrint$/.test(serviceUrl)) {
        _handleAs = 'text';
      }
      this._getPrintTaskInfo(_handleAs);

      if (this.printTask._getPrintDefinition) {
        aspect.after(this.printTask, '_getPrintDefinition', lang.hitch(this, 'printDefInspector'), false);
      }

      if (this.printTask._createOperationalLayers) {
        aspect.after(this.printTask, '_createOperationalLayers', lang.hitch(this, '_excludeInvalidLegend'));
      }
    },
    
    _getPrintTaskInfo: function(handle) {
      // portal own print url: portalname/arcgis/sharing/tools/newPrint
      esriRequest({
        url: this.printTaskURL,
        content: {
          f: "json"
        },
        callbackParamName: "callback",
        handleAs: handle || "json",
        timeout: 60000
      }).then(
        lang.hitch(this, '_handlePrintInfo'),
        lang.hitch(this, '_handleError')
      ).always(lang.hitch(this, function() {
        this.shelter.hide();
      }));
    },

    _excludeInvalidLegend_ORIGINAL: function(opLayers) {
      if (this.printTask.allLayerslegend) {
        var legendArray = this.printTask.allLayerslegend;
        var arr = [];
        for (var i = 0; i < legendArray.length; i++) {
          var layer = this.map.getLayer(legendArray[i].id);
          if ((layer && layer.declaredClass &&
            layer.declaredClass !== "esri.layers.GraphicsLayer") &&
            (!layer.renderer || (layer.renderer && !layer.renderer.hasVisualVariables()))) {
            arr.push(legendArray[i]);
          }
        }
        this.printTask.allLayerslegend = arr;
      }
      return opLayers;
    },

    _excludeInvalidLegend: function(opLayers) {
      var arr = [];  //A new array for the layers to include in the legend
      
      // Populate arr with the unique layers in opLayers and this.printTask.allLayerslegend
      // Note: opLayers includes basemap layers and all graphics layers.
      array.forEach(opLayers, function(layer) {
        arr.push({ id: layer.id });
      });
      arr = this.concatUnique(this.printTask.allLayerslegend, arr);
      
      // Remove basemap layers, and all graphics layers except the draw layer. 
      var itemsToRemove = [];
      var basemapUrl;
      array.forEach(arr, function(item, idx) {
        var layer = this.map.getLayer(item.id);
        var declaredClass = lang.getObject('declaredClass', false, layer);
        var renderer = lang.getObject('renderer', false, layer);
        var isBasemap = layer.hasOwnProperty('_basemapGalleryLayerType');
        if (isBasemap && lang.getObject('_basemapGalleryLayerType', false, layer) === 'basemap') {
          basemapUrl = layer.url;
        }
        if (isBasemap || 
            layer.url === basemapUrl ||
            (declaredClass === 'esri.layers.GraphicsLayer' && (!renderer || (renderer.hasVisualVariables && !renderer.hasVisualVariables())))
           ) {
          itemsToRemove.unshift(idx);
        }
      }, this);
      array.forEach(itemsToRemove, function(index) {
        arr.splice(index, 1);
      });
      
      // Set the layers to be included in the legend
      this.printTask.allLayerslegend = arr;
      
      return opLayers;
    },

    printDefInspector: function(printDef) {
      return printDef;
    },

    _makeLayerForGraphic: function(gra, lyrName, geomType, isText) {
      if (isText) {
        // Text won't show up in the Legend, so we don't need a renderer to carry the label
        // For text, we do need the symbol in the "features" array.
        return {
          layerDefinition: {
            name: lyrName,
            geometryType: geomType
          },
          featureSet: {
            geometryType: geomType,
            "features": [
              {
                "geometry": gra.geometry.toJson(),
                "symbol": gra.symbol.toJson()
              }
            ]
          }
        };
      } else {
        // We need a renderer to carry the label for the legend,
        // so we don't need the symbol in the "features" array.
        return {
          layerDefinition: {
            name: lyrName,
            geometryType: geomType,
            drawingInfo: {
              renderer: new SimpleRenderer({
                "label": lyrName,
                "symbol": gra.symbol.toJson()
              }).toJson()
            }
          },
          featureSet: {
            geometryType: geomType,
            "features": [
              {
                "geometry": gra.geometry.toJson()
              }
            ]
          }
        };
      }
    },
    
    startup: function() {
      this.inherited(arguments);
      
      // Just in case startup() gets called twice - BEGIN
      if (this.layoutInitialized) {
        return;
      }
      this.layoutInitialized = true;
      // Just in case startup() gets called twice - END
        
        this.lods = this._getLods();
        if (this.lods) {
          this.maxScale = this.lods[this.lods.length - 1].scale;
        }
      
      if (this.showLayout) {
        this.mapUnitsToMeters.x = this.mapUnitsToMeters.y = scaleUtils.getUnitValueForSR(this.map.spatialReference);
        if (!this.mapUnitsToMeters.x) {
          // We cannot determine the map units, so don't show the layout.
          this.showLayout = false;
        } else if (this.mapUnitsToMeters.x > 10000 || this.map.spatialReference.isWebMercator()) {
          // If the spatial reference is geographic or Web Mercator, call the geometry service to get the parameters to project the layout onto the map.  
          // This is an approximation, but adequate for small geographic areas (e.g. Hamilton County, IN - 400 Square miles)
          // TODO: Check the map area to see if an approximation makes sense
          var e = this.map.extent;  // TODO: change this to get the initial extent???
          var lineN = new Polyline(this.map.spatialReference);
          lineN.addPath([[e.xmin, e.ymax], [e.xmax, e.ymax]]);
          var lineS = new Polyline(this.map.spatialReference);
          lineS.addPath([[e.xmin, e.ymin], [e.xmax, e.ymin]]);
          var lineE = new Polyline(this.map.spatialReference);
          lineE.addPath([[e.xmax, e.ymax], [e.xmax, e.ymin]]);
          var lineW = new Polyline(this.map.spatialReference);
          lineW.addPath([[e.xmin, e.ymax], [e.xmin, e.ymin]]);
          var eDims = { x: e.getWidth(), y: e.getHeight() };
          var lp = new LengthsParameters();
          lp.polylines = [lineN, lineS, lineE, lineW];
          lp.lengthUnit = esri.tasks.GeometryService.UNIT_METER;
          lp.geodesic = true;
          esriConfig.defaults.geometryService.lengths(lp, 
            lang.hitch(this, function(result) {
              if (result.lengths.length === 4) {
                var southRatio = (result.lengths[0] / eDims.x);
                var northRatio = (result.lengths[1] / eDims.x);
                var westRatio  = (result.lengths[2] / eDims.y);
                var eastRatio  = (result.lengths[3] / eDims.y);
                // TODO: put in a check to fail if the ratios are too different?
                // var variation = [Math.abs(1 - (southRatio / northRatio)), Math.abs(1 - (westRatio / eastRatio))];
                //console.log('variation:', variation);
                this.mapUnitsToMeters.x *= (southRatio + northRatio) / 2;
                this.mapUnitsToMeters.y *= (westRatio + eastRatio) / 2;
              } else {
                this.showLayout = false;
                console.error("Get Map Units to Layout Units Conversion Factors");
                console.error("Calculating conversion factors failed.  Print layouts will not be shown on the map.");
              }
            }),
            lang.hitch(this, function() {
              this.showLayout = false;
              console.error("Get Map Units to Layout Units Conversion Factors");
              console.error("Calculating conversion factors failed.  Print layouts will not be shown on the map.");
            })
          );
        }
      }
      
      if (this.showLayout) {
        // If we still want to show the layout, create a graphics layer for it.
        this.layoutLayer = new esri.layers.GraphicsLayer({ id: this.layoutLayerId, opacity: 1.0 });
        this.layoutLayer.spatialReference = this.map.spatialReference;
        this.map.addLayer(this.layoutLayer);
        this.layoutLayer.enableMouseEvents();
        // Add the listener for the close graphic
        this.layoutLayer.on('click', lang.hitch(this, function(evt) {
          if (evt.graphic.id === 'closeLayoutX' || evt.graphic.id === 'closeLayoutSq') {
            // Stop event propagation so a popup isn't triggered.
            evt.stopPropagation();
            this._toggleShowLayout(false, true);
          }
        }));
        this.toggleMapPanHandlers(true);
        if (this.reason === 'helpContent') {
          // This widget was loaded just to populate the Help content, so don't show the layout.
          this._toggleShowLayout(false, false);
        }
      }
    },
    
    _onOpen: function() {
      if (this.layoutLayer) {
        // this.onStateChange('DOCKED', this.isDocked);
        this.toggleLayoutLayer(true);
      }
    },
    
    _onClose: function() {
      this.isDocked = false;
      if (this.layoutLayer && !this.showLayoutDijit.get('value')) {
        this.toggleLayoutLayer(false);
      }
    },
    
    _resize: function(isDocked) {
      // isDocked is true if the widget is docked (fills the browser window).  This will always be true for devices with small screens (phones),
      // but may be true or false as the browser window size is changed on devices with larger screens.
      
      this.advancedSettingsDropDownDijit.closeDropDown();
      var dockStateChanged = isDocked !== this.isDocked;
      this.isDocked = isDocked;
      if (this.layoutLayer) {
        if (isDocked) {
          // The widget is docked and has been resized by the browser window.
          this.setScaleRanges();
        } else if (dockStateChanged && !isDocked) {
          // The widget has been undocked.  Delete the scalebar ticks and labels so the scalebar can resize.
          this.deleteTicksAndLabels();
          // After a brief delay, add the ticks and labels.
          setTimeout(this.setScaleRanges(), this.resizeDelay);
        } else {
          // This ensures ticks and labels at startup (esp. on Chrome)
          this.setScaleRanges();
        }
        // this.onStateChange('DOCKED', isDocked);
      }
    },
    
    toggleMapPanHandlers: function(turnOn) {
      if (this.layoutLayer && this.layoutLayer.visible && this.showLayoutDijit.get('value') && turnOn) {
        var _handler;
        this.mapSheetMoving = false;
        // Use pan events for adjusting the map relative to the layout on all devices.
        // alert('pan events');
        _handler = this.map.on('pan-start', lang.hitch(this, function(evt) {  //'swipe-start'
          // The 'screenPoint' property of the 'pan' event is not documented, but essential to the logic.
          this.moveStartPt = this.map.toMap(evt.screenPoint);
          if (this.mapAreaExtent.contains(this.moveStartPt)) {
            this.mapSheetMoving = true;
            this.moveStartScreenPt = evt.screenPoint;
          }
        }));
        this.dragSwipeHandlers.push(_handler);
        _handler = this.map.on('pan', lang.hitch(this, function(evt) {  //'swipe-move'
          if (this.mapSheetMoving) {
            this.moveEndScreenPt = this.moveStartScreenPt.offset(evt.delta.x, evt.delta.y);
            moveEndPt = this.map.toMap(this.moveEndScreenPt);
            var mOffset = { x: this.moveStartPt.x - moveEndPt.x, y: this.moveStartPt.y - moveEndPt.y };
            this.moveMapSheet(mOffset);
            this.moveStartPt = moveEndPt;
            if (!this.map.extent.contains(this.mapAreaExtent)) {
              this.adjustMapToLayout();
            }
          }
        }));
        this.dragSwipeHandlers.push(_handler);
        _handler = this.map.on('pan-end', lang.hitch(this, function() {  //'swipe-end'
          if (this.mapSheetMoving) {
            this.mapSheetMoving = false;
            // To make sure the text is on top:
            this.layoutLayer.clear();
            this.drawMapSheet(this.mapAreaCenter);
          }
        }));
        this.dragSwipeHandlers.push(_handler);
      } else {
        // Remove event handlers for panning and zooming when the layout is shown
        if (this.dragSwipeHandlers) {
          array.forEach(this.dragSwipeHandlers, function(item) {
            item.remove();
            item = null;
          });
          this.dragSwipeHandlers = [];
        }
      }
    },
    
    togglePanZoomHandlers: function(turnOn) {
      if (turnOn && this.panZoomHandlers.length === 0 && this.showLayoutDijit.get('value')) {
        // Add the event handlers for panning and zooming and resizing when the layout is shown.
        var _handler;
        _handler = this.map.on('zoom-end', lang.hitch(this, function(evt) { this.adjustLayoutToMap('zoom-end', evt.extent); }));
        this.panZoomHandlers.push(_handler);
        _handler = this.map.on('pan-end', lang.hitch(this, function(evt) { this.adjustLayoutToMap('pan-end', evt.extent); }));
        this.panZoomHandlers.push(_handler);
        _handler = this.map.on('resize', lang.hitch(this, function(evt) { 
          var resizeTimer;
          var newExtent = evt.extent;
          clearTimeout(resizeTimer);
          // Set the delay to twice the delay used when the widget is docked or resized
          resizeTimer = setTimeout(lang.hitch(this, function() {
            this.map.resize();
            this.map.reposition();
            this.adjustLayoutToMap('resize', newExtent); 
          }), this.resizeDelay * 2);
        }));
        this.panZoomHandlers.push(_handler);
      } else if (!turnOn && this.panZoomHandlers.length > 0) {
        // Remove event handlers for panning and zooming and resizing when the layout is not shown.
        if (this.panZoomHandlers) {
          array.forEach(this.panZoomHandlers, function(item) {
            item.remove();
            item = null;
          });
          this.panZoomHandlers = [];
        }
      }
    },
    
    _handleError: function(err) {
      console.log('print widget load error: ', err);
      new Message({
        message: err.message || err
      });
    },
    
    _handlePrintInfo: function(data) {
      var Layout_Template = array.filter(data.parameters, function(param) {
        return param.name === "Layout_Template";
      });
      if (Layout_Template.length === 0) {
        console.log("print service parameters name for templates must be \"Layout_Template\"");
        return;
      }

      var layoutParam;
      var layoutItems = array.map(Layout_Template[0].choiceList, lang.hitch(this, function(item) {
        layoutParam = this.layoutParams[item];
        return {
          label: layoutParam && layoutParam.alias ? layoutParam.alias : item,
          noTb: false,
          value: item
        };
      }));
      
      // Filter out the No Title Block templates
      var index;
      var noTbLayouts = [];
      if (this.noTitleBlockPrefix) {
        layoutItems = array.filter(layoutItems, lang.hitch(this, function(item) {
          index = item.value.indexOf(this.noTitleBlockPrefix);
          if (index === 0) {
            noTbLayouts.push(item.value.slice(this.noTitleBlockPrefix.length));
            return false;
          } else {
            return true;
          }
          // return item.label.indexOf(this.noTitleBlockPrefix) !== 0;
        }));
      }
      
      // Add a property to the layouts that have a corresponding "no title block" layout.
      if (noTbLayouts.length) {
        array.forEach(layoutItems, function(item) {
          item.noTb = array.indexOf(noTbLayouts, item.value) !== -1;
        });
      }
      
      // Sort the layouts in the order they are listed in layoutParams (config.json).  If a layout is not included in layoutParams
      // (and has not been eliminated by the noTitleBlockPrefix filter above), put it at the end of the list.
      var keys = functional.keys(this.layoutParams);
      var bIndex;
      layoutItems.sort(function(a, b) {
        bIndex = array.indexOf(keys, b.value);
        return (bIndex !== -1) ? array.indexOf(keys, a.value) - bIndex : -1;
      });
      this.layoutDijit.addOption(layoutItems);
      
      this.mapSheetParams.layout = this.defaultLayout ? this.defaultLayout : Layout_Template[0].defaultValue;
      this.layoutDijit.set('value', this.mapSheetParams.layout);
      this.onStateChange('LAYOUT', this.mapSheetParams.layout);
      
      var Format = array.filter(data.parameters, function(param) {
        return param.name === "Format";
      });
      if (Format.length === 0) {
        console.log("print service parameters name for format must be \"Format\"");
        return;
      }

      var formatItems = array.map(Format[0].choiceList, function(item) {
        return {
          label: item,
          value: item
        };
      });
      
      formatItems.sort(function(a, b) {
        return (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0);
      });
      
      this.formatDijit.addOption(formatItems);
      if (this.defaultFormat) {
        this.formatDijit.set('value', this.defaultFormat);
      } else {
        this.formatDijit.set('value', Format[0].defaultValue);
      }
    },
    
    print: function() {
      this.preserve = this.preserveFormDijit.get('value');
      if (!this.layoutLayer) {
        // If not showing the layout footprint, just call the original print function (renamed to submitPrintJob).
        // this.printRequested = false;
        this.submitPrintJob();
      } else if (this.mapSheetParams.layout === 'MAP_ONLY' && this.preserve.preserveScale === 'true') {
        // For MAP_ONLY, just call the original print function (renamed to submitPrintJob).
        // this.printRequested = false;
        this.submitPrintJob();
        return;
      } else if (!this.printRequested) {
        // Don't do anything if a print has already been requested.
        // If a print has not been requested, get the current map extent, 
        // graphics layer opacity, and LODs (if the map has LODs).
        var printScale = this.mapSheetParams.layout === 'MAP_ONLY' ? this.mapOnlyScale : this.scaleSliderDijit.get('value');
        // If the requested scale is greater than the largest lod scale, warn the user.
        // This will never happen since we check the scale in the scaleBoxDijit.
        if (this.maxScale && printScale < this.maxScale) {
          if (!confirm(this.nls.printScaleMessage)) {
            return;
          }
        }
        this.suspendExtentHandler = true;  //Suspend the Extent change handler
        var def;
        var oldLevel = null;
        var oldCenter = null;
        var oldExtent = null;
        var oldLods = null;
        if (this.lods) {
          oldLevel = this.map.getLevel();
          oldCenter = this.map.extent.getCenter();
          printScaleLevel = this._getLevel(this.lods, printScale);
          // Set one LOD for the printing scale and zoom to it.
          if (printScaleLevel) {
            def = this.map.centerAndZoom(this.mapAreaCenter, printScaleLevel);
          } else {
            oldLods = this.lods;
            var resolution = printScale / (oldLods[0].scale / oldLods[0].resolution);
            var printLod = [{ 'level': 0, 'resolution': resolution, 'scale': printScale }];
            this._setLods(printLod);
            def = this.map.centerAndZoom(this.mapAreaCenter, 0);
          }
        } else {
          // Zoom to the print scale
          oldExtent = this.map.extent;
          def = this.map.centerAndZoom(this.mapAreaCenter, printScale / this.map.getScale());
        }
        this.updateStartListener = on.once(this.map, 'update-start', lang.hitch(this, function() { this.mapUpdating = true; }));
        this.updateEndListener = on.once(this.map, 'update-end', lang.hitch(this, 'printAndRestoreSettings', oldLevel, oldCenter, oldExtent, oldLods));
        def.then(lang.hitch(this, function() { 
          if (!this.mapUpdating) {
            // The zoom did not cause the map to update, so remove those listeners and print.
            this.updateStartListener.remove();
            this.updateStartListener = null;
            this.updateEndListener.remove();
            this.updateEndListener = null;
            this.printAndRestoreSettings(oldLevel, oldCenter, oldExtent, oldLods);
          }
        }));
      }
    },
    
    printAndRestoreSettings: function(oldLevel, oldCenter, oldExtent, oldLods) {
      this.mapUpdating = false;
      this.submitPrintJob();
      
      var def;
      if (oldCenter && oldLevel) {
        if (oldLods) {
          // Restore the LODs if they were changed.
          this._setLods(oldLods);
        }
        def = this.map.centerAndZoom(oldCenter, oldLevel);
      } else if (oldExtent) {
        def = this.map.setExtent(oldExtent);
      }
      
      // Restore the map extent and the graphics layer opacity.
      def.then(lang.hitch(this, function() {
        this.suspendExtentHandler = false;
      }));
    },
    
    //====================================================================================
    //                               *** BEGIN ***
    // Isolate access to the undocumented map properties (LODS) into their own functions.
    //
    // 1. 11 LODs in WebMap, no LODs in config.json
    //    a. __tileInfo.lods ------------------- Y (11)
    //    b. _params.lods ---------------------- Y (11)
    //    c. _params.tileInfo.lods ------------- Y (11)
    //    d. _mapParams.lods ------------------- N
    //    e. appConfig.map.mapOptions.lods ----- N
    //
    // 2. 11 LODs in WebMap, 9 LODs in config.json
    //    a. __tileInfo.lods ------------------- Y (9)
    //    b. _params.lods ---------------------- Y (9)
    //    c. _params.tileInfo.lods ------------- Y (9)
    //    d. _mapParams.lods ------------------- Y (9)
    //    e. appConfig.map.mapOptions.lods ----- Y (9)
    //====================================================================================
    
    _setLods: function(lods) {
      lang.setObject('__tileInfo.lods', lods, this.map);
      lang.setObject('_params.lods', lods, this.map);
      lang.setObject('_params.tileInfo.lods', lods, this.map);
      if (this.appConfig.map.lods) {
        lang.setObject('_mapParams.lods', lods, this.map);
      }
    },

    _getLods: function() {
      var lods = lang.getObject('_params.tileInfo.lods', false, this.map);
      return lods && lods.length ? lods : null;
    },
    
    //====================================================================================
    // Isolate access to the undocumented map properties (LODS) into their own functions.
    //                                *** END ***
    //====================================================================================
    
    _getLevel: function(lods, scale) {
      var level;
      array.some(lods, function(lod) {
        if (lod.scale === scale) {
          level = lod.level;
          return true;
        }
      });
      return level;
    },

    submitPrintJob: function() {
      if (this.printSettingsFormDijit.isValid()) {
        var form = this.printSettingsFormDijit.get('value');
        lang.mixin(form, this.layoutMetadataDijit.get('value'));
        if (form.layout !== 'MAP_ONLY') {  
          // Set this here so it doesn't change the user's settings for MAP_ONLY
          this.preserve.preserveScale = 'true';  
        }  
        lang.mixin(form, this.preserve);
        this.layoutForm = this.layoutFormDijit.get('value');
        var mapQualityForm = this.mapQualityFormDijit.get('value');
        var mapOnlyForm = this.mapOnlyFormDijit.get('value');
        var dpi = mapQualityForm.dpi;
        var dpiConversion = mapOnlyForm.printUnits === Units.INCHES ? 1 : 0.3937;
        mapOnlyForm.width = mapOnlyForm.width * dpi * dpiConversion;
        mapOnlyForm.height = mapOnlyForm.height * dpi * dpiConversion;
        lang.mixin(mapOnlyForm, mapQualityForm);

        var template = new PrintTemplate();
        template.format = form.format;
        template.layout = form.layout === 'MAP_ONLY' || this.titleBlock ? form.layout : this.noTitleBlockPrefix + form.layout;
        template.preserveScale = (form.preserveScale === 'true' || form.preserveScale === 'force'); 
        template.label = form.title;
        template.exportOptions = mapOnlyForm;
        template.layoutOptions = {
          authorText: form.author,
          copyrightText: form.copyright,
          legendLayers: (this.layoutForm.legend.length > 0 && this.layoutForm.legend[0]) ? null : [],
          titleText: form.title
        };
        this.printparams.template = template;
        this.printparams.extraParameters = { // come from source code of jsapi
          printFlag: true
        };
        var fileHandel = this.printTask.execute(this.printparams);

        var result = new PrintResultDijit({
          count: this.count.toString(),
          icon: (form.format === "PDF") ? this.pdfIcon : this.imageIcon,
          docName: form.title || (form.layout === 'MAP_ONLY' ? 'Just the map' : 'No Titleblock'),  //lcs - docName is not used
          title: form.title || (form.format + ', ' + form.layout),  //lcs - disabled form items are ignored
          fileHandle: fileHandel,
          nls: this.nls
        }).placeAt(this.printResultsNode, 'last');
        result.startup();
        domStyle.set(this.clearActionBarNode, 'display', 'block');
        this.count++;
      } else {
        this.printSettingsFormDijit.validate();
      }
    },
    
    clearResults: function() {
      domConstruct.empty(this.printResultsNode);
      domStyle.set(this.clearActionBarNode, 'display', 'none');
      this.count = 1;
    },
    
    updateAuthor: function(user) {
      user = user || '';
      if (user) {
        this.authorTB.set('value', user);
      }
    },
    
    getCurrentMapScale: function() {
      this.forceScaleNTB.set('value', this.map.getScale());
    },
    
    _onTitleBlockChange: function(value) {
      // Set the visibilities of the print options
      this.titleBlock = value;
      this.onStateChange('TITLE_BLOCK', value);
    
      // Don't draw a layout if there is no graphics layer
      if (this.layoutLayer) {
        this.layoutLayer.clear();
        this.setScaleRanges();
        if (this.showLayoutDijit.get('value')) {
          this.drawMapSheet(this.mapAreaCenter);
        }
      }
    },
    
    _onLayoutChange: function(layout) {
      // If changing from or to 'MAP_ONLY', this is a state change
      if (this.mapSheetParams.layout === 'MAP_ONLY' || layout === 'MAP_ONLY') {
        this.onStateChange('LAYOUT', layout);
      }
      this.mapSheetParams.layout = layout;

      // Hide the title block checkbox is there is no companion layout with no title block.
      var noTb = false;
      array.some(this.layoutDijit.options, function(option) {
        if (option.value === layout) {
          noTb = option.noTb;
          return true;
        }
      });
      this.titleBlockDijit.value = this.titleBlockDijit.checked = noTb;
      query('#titleBlock', this.domNode).style('visibility', noTb ? '' : 'hidden');
        
      // Draw the map sheet
      if (this.layoutLayer) {
        this.layoutLayer.clear();
      
        if (layout === 'MAP_ONLY') {
          // Remove the graphic layer pan and zoom handlers
          this.togglePanZoomHandlers(false);
        
          // Set the map sketch to reflect the settings
          this._adjustMapSketch();
        } else {
          // Add the graphic layer pan and zoom handlers
          this.togglePanZoomHandlers(true);
          
          if (this.layoutParams && this.layoutParams[layout]) {
            var layoutUnitsToMeters = this.getUnitToMetersFactor(this.layoutParams[layout].units);
            this.mapSheetParams = {
              layout: layout,
              pageSize: this.layoutParams[layout].params[0],
              mapSize: this.layoutParams[layout].params[1],
              pageOffsets: this.layoutParams[layout].params[2],
              noTbBorders: this.layoutParams[layout].params[3],
              unitRatio: {x: layoutUnitsToMeters.x / this.mapUnitsToMeters.x, y: layoutUnitsToMeters.y / this.mapUnitsToMeters.y}
            };
            var centerPt = this.map.extent.getCenter();
            this.setScaleRanges();
            if (this.showLayoutDijit.get('value')) {
              this.drawMapSheet(centerPt);
            }
          }
        }
      }
    },
    
    _onScaleBoxChange: function(value) {
      if (value < this.scaleSliderDijit.minimum) {
        value = this.scaleSliderDijit.minimum;
      } else if (value > this.scaleSliderDijit.maximum) {
        value = this.scaleSliderDijit.maximum;
      }
      this.scaleBoxDijit.set('value', value);
      this.scaleSliderDijit.set('value', value);
    },
    
    _onScaleSliderChange: function(value) {
      // Don't draw a layout if there is no graphics layer
      if (this.layoutLayer) {
        this.scaleBoxDijit.set('value', value);

        var domRelativeScale = dom.byId('relativeScale');
        if (domRelativeScale) {
          domRelativeScale.innerHTML = this.relativeScale.replace('[value]', number.format(value * this.relativeScaleFactor, {places: this.scalePrecision} ));
        }
        this.layoutLayer.clear();
        if (!this.mapAreaCenter) {
          this.mapAreaCenter = this.map.extent.getCenter();  
        }
        this.drawMapSheet(this.mapAreaCenter); 
        this.adjustLayoutToMap('printScaleChange', this.map.extent);
      }
    },
    
    drawMapSheet: function(centerPt) {
      var scale = this.scaleSliderDijit.get('value');
      var pageSize = this.mapSheetParams.pageSize;
      var unitRatio = this.mapSheetParams.unitRatio;
      var mapOffsets;
      var mapDims;
      
      if (this.titleBlock) {
        mapOffsets = this.mapSheetParams.pageOffsets;
        mapDims = this.mapSheetParams.mapSize;
      } else {
        mapOffsets = this.mapSheetParams.noTbBorders;
        mapDims = { x: pageSize.x - mapOffsets.x * 2, y: pageSize.y - mapOffsets.y * 2 };
      }
      
      // Calculate the boundaries for the print area
      var minX = centerPt.x - mapDims.x / 2 * scale * unitRatio.x;
      var minY = centerPt.y - mapDims.y / 2 * scale * unitRatio.y;
      var maxX = centerPt.x + mapDims.x / 2 * scale * unitRatio.x;
      var maxY = centerPt.y + mapDims.y / 2 * scale * unitRatio.y;
        
      // List the points in counter-clockwise order (this is the hole for the map)
      var ringMapArea = [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]];
      this.layoutMapArea = ringMapArea;
      
      // Update the map area center and extent so other functions can use them
      this.mapAreaCenter = centerPt;
      this.mapAreaExtent = new Extent(minX, minY, maxX, maxY, this.map.spatialReference);
        
      // Capture the upper right corner of the map area
      var insideX = maxX;
      var insideY = maxY;
      
      // Calculate the boundaries for the sheet boundary
      minX = minX - mapOffsets.x * scale * unitRatio.x;
      minY = minY - mapOffsets.y * scale * unitRatio.y;
      maxX = minX + pageSize.x * scale * unitRatio.x;
      maxY = minY + pageSize.y * scale * unitRatio.y;
      
      // Get the ratio of map units to pixels
      var mapUnitsToPixels = this.map.extent.getWidth() / this.map.width;
      // Calculate the margin width for the close symbol in map units
      var layoutMargin = Math.min(maxX - insideX, maxY - insideY);
      // Calculate the size of the close symbol in pixels
      var closeBtnSize = Math.min(30, Math.round(layoutMargin / mapUnitsToPixels) - 2);
      // Set the line widths of the layout and close symbols
      var layoutLineWidth = Math.max(Math.round(closeBtnSize / 3), 1);
      var closeBtnLineWidth = Math.max(Math.round(closeBtnSize / 6), 1);
      // Calculate the offset for the close symbol in map units
      var closeBtnOffset = (closeBtnSize + 4) * mapUnitsToPixels / 2;
      // Establish the point for the close symbol
      var ptCloseBtn = new Point(maxX - closeBtnOffset, maxY - closeBtnOffset, this.map.spatialReference);
      
      // list the points in clockwise order (this is the paper)
      var ringLayoutPerim = [[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]];
        
      var geomLayout = new Polygon(this.map.spatialReference);
      geomLayout.addRing(ringMapArea);
      geomLayout.addRing(ringLayoutPerim);
        
      var symLayout = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                          new CartographicLineSymbol(
                            CartographicLineSymbol.STYLE_SOLID, 
                            new Color([255,0,0,0.60]), 
                            layoutLineWidth, 
                            CartographicLineSymbol.CAP_ROUND, 
                            CartographicLineSymbol.JOIN_ROUND),
                          new Color([255,0,0,0.40]));
        
      var graLayout = new Graphic(geomLayout, symLayout);
      this.layoutLayer.add(graLayout);
      
      // Create the close symbols
      var symCloseBtnX = new SimpleMarkerSymbol({
        "color": [0,0,0,255],
        "size": 10,
        "angle": 0,
        "xoffset": 0,
        "yoffset": 0,
        "type": "esriSMS",
        "style": "esriSMSX",
        "outline": {
          "color": [0,0,0,255],
          "width": 2,
          "type": "esriSLS",
          "style": "esriSLSSolid"
        }
      });
      symCloseBtnX.setSize(closeBtnSize - closeBtnLineWidth);
      symCloseBtnX.outline.width = closeBtnLineWidth;
      
      var symCloseBtnOutline = new SimpleMarkerSymbol({
        "color": [0,0,0,0],
        "size": 12,
        "angle": 0,
        "xoffset": 0,
        "yoffset": 0,
        "type": "esriSMS",
        "style": "esriSMSSquare",
        "outline": {
          "color": [0,0,0,255],
          "width": 1,
          "type": "esriSLS",
          "style": "esriSLSSolid"
        }
      });
      symCloseBtnOutline.setSize(closeBtnSize);
      symCloseBtnOutline.outline.width = closeBtnLineWidth;
      
      // Establish the point for the instruction text (center of the bottom margin area).
      var ptInstruction = new Point((minX + maxX) / 2, minY + mapOffsets.y * scale * unitRatio.y / 2, this.map.spatialReference);
        
      // Create the text symbol
      var symInstruction = new TextSymbol({
        "type": "esriTS",
        "color": [0,0,0,255],
        "verticalAlignment": "middle",
        "horizontalAlignment": "center"
      });
      var fontInstruction = new Font({
        "family": "Arial",
        "size": 12,
        "style": "italic",
        "weight": "normal",
        "decoration": "none"
      });
      fontInstruction.setSize(closeBtnSize + 2 + 'px');
      symInstruction.setFont(fontInstruction);
      symInstruction.setText(this.nls.layoutInstruction);
      
      // Add the close graphics
      var graCloseBtnOutline = new Graphic(ptCloseBtn, symCloseBtnOutline);
      graCloseBtnOutline.id = 'closeLayoutSq';
      this.layoutLayer.add(graCloseBtnOutline);
      var graCloseBtnX = new Graphic(ptCloseBtn, symCloseBtnX);
      graCloseBtnX.id = 'closeLayoutX';
      this.layoutLayer.add(graCloseBtnX);
      
      var graInstruction = new Graphic(ptInstruction, symInstruction);
      var ptInstructionScreen = this.map.toScreen(ptInstruction);
      var pt1Screen = ptInstructionScreen.offset(graInstruction.symbol.getWidth() / 2, -(closeBtnSize + 12) / 2);
      var pt1Map = this.map.toMap(pt1Screen);
      var halfWidth = Math.min((maxX - minX) / 2, pt1Map.x - ptInstruction.x);
      var halfHeight = Math.min(mapOffsets.y * scale * unitRatio.y / 2, pt1Map.y - ptInstruction.y);
      var instructionExtent = new Extent(ptInstruction.x - halfWidth, ptInstruction.y - halfHeight, ptInstruction.x + halfWidth, ptInstruction.y + halfHeight, this.map.spatialReference);
      var symBackground = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, null, new Color([255,0,0,0.8]));
      var graInstructionBackground = new Graphic(instructionExtent, symBackground);
      this.layoutLayer.add(graInstructionBackground);
      this.layoutLayer.add(graInstruction);
    },
    
    moveMapSheet: function(mOffset) {
      var i, j, pt;
      this.mapAreaCenter = this.mapAreaCenter.offset(mOffset.x, mOffset.y);
      this.mapAreaExtent = this.mapAreaExtent.centerAt(this.mapAreaCenter);

      array.forEach(this.layoutLayer.graphics, lang.hitch(this, function(gra) {
        switch (gra.geometry.type) {
          case "point":
            pt = gra.geometry.offset(mOffset.x, mOffset.y);
            gra.setGeometry(pt);
            break;
          case "polyline":
            // This case has not been tested!
            var polyline = new Polyline(gra.geometry);
            for (i = 0; i < polyline.paths.length; i++) {
              for (j = 0; j < polyline.paths[i].length; j++) {
                pt = polyline.getPoint(i, j).offset(mOffset.x, mOffset.y);
                polyline.setPoint(i, j, pt);
              }
            }
            gra.setGeometry(polyline);
            break;
          case "polygon":
            var polygon = new Polygon(gra.geometry);
            for (i = 0; i < polygon.rings.length; i++) {
              for (j = 0; j < polygon.rings[i].length; j++) {
                pt = polygon.getPoint(i, j).offset(mOffset.x, mOffset.y);
                polygon.setPoint(i, j, pt);
              }
            }
            gra.setGeometry(polygon);
            break;
          case "extent":
            var extent = gra.geometry.offset(mOffset.x, mOffset.y);
            gra.setGeometry(extent);
            break;
        }
      }));
      this.layoutLayer.redraw();
    },
    
    _adjustMapSketch: function() {
      // Get the preserve scale, width, and height settings and draw the map sketch if there is enough data
      var preserveScale = this.preserveFormDijit.get('value').preserveScale === 'true'; 
      var mapOnlyForm = this.mapOnlyFormDijit.get('value');
      var printUnits = mapOnlyForm.printUnits;
      var printWidth = mapOnlyForm.width;
      var printHeight = mapOnlyForm.height;
      var extentWidth = this.map.extent.getWidth();
      var extentHeight = this.map.extent.getHeight();
      var paperMapDims = new Dims(printWidth, printHeight);
      var layoutUnitsToMeters = this.getUnitToMetersFactor(printUnits);
      var unitRatio = {x: layoutUnitsToMeters.x / this.mapUnitsToMeters.x, y: layoutUnitsToMeters.y / this.mapUnitsToMeters.y};
      var paperAspectRatio, browserAspectRatio;
      var browserMapDims;
      var scale;
      if (preserveScale) {
          // Calculate the extent to be printed
          scale = this.map.getScale();
          browserMapDims = new Dims(extentWidth / scale / unitRatio.x, extentHeight / scale / unitRatio.y);
      } else {
          // Calculate the scale
          paperAspectRatio = printWidth / printHeight;
          browserAspectRatio = extentWidth / extentHeight;
          if (paperAspectRatio > browserAspectRatio) {
            scale = (extentHeight / printHeight) / unitRatio.y;
            browserMapDims = new Dims(paperMapDims.x * browserAspectRatio / paperAspectRatio, paperMapDims.y);
          } else {
            scale = (extentWidth / printWidth) / unitRatio.x;
            browserMapDims = new Dims(paperMapDims.x, paperMapDims.y * paperAspectRatio / browserAspectRatio);
          }
          this.mapOnlyScale = scale;
      }
      if (!printWidth || !printHeight || printWidth <= 0 || printHeight <= 0) {
        // Can't draw the sketch
      }
        
      var max = 200;  // This should be coordinated with the width of the Advanced dropdown
      var offset = 47;  // This should be coordinated with the width of the Advanced dropdown
        
      // Normalize the map sizes to the space available
      var normalize = Math.max(paperMapDims.x, paperMapDims.y, browserMapDims.x, browserMapDims.y) / max;
      paperMapDims = new Dims(paperMapDims.x / normalize, paperMapDims.y / normalize);
      browserMapDims = new Dims(browserMapDims.x / normalize, browserMapDims.y / normalize);
        
      // Calculate the offsets required to center both rectangles
      var paperMapOffset = new Dims((offset + max - paperMapDims.x) / 2, Math.max(0, (browserMapDims.y - paperMapDims.y) / 2));
      var browserMapOffset = new Dims((offset + max - browserMapDims.x) / 2, Math.max(0, (paperMapDims.y - browserMapDims.y) / 2));
        
      // Draw the paper map extent
      var paperMap = dom.byId('paperMap');
      paperMap.style.position = (paperMapDims.y <= browserMapDims.y) ? 'absolute' : 'relative';
      paperMap.style.width = paperMapDims.x.toFixed(0) + 'px';
      paperMap.style.height = paperMapDims.y.toFixed(0) + 'px';
      paperMap.style.left = paperMapOffset.x.toFixed(0) + 'px';
      paperMap.style.top = paperMapOffset.y.toFixed(0) + 'px';

      // Draw the extent of the map in the  browser window
      var browserMap = dom.byId('browserMap');
      browserMap.style.position = (browserMapDims.y < paperMapDims.y) ? 'absolute' : 'relative';
      browserMap.style.width = browserMapDims.x.toFixed(0) + 'px';
      browserMap.style.height = browserMapDims.y.toFixed(0) + 'px';
      browserMap.style.left = browserMapOffset.x.toFixed(0) + 'px';
      browserMap.style.top = browserMapOffset.y.toFixed(0) + 'px';
        
      // The Dims object is like a Point, only much leaner
      function Dims(x, y) {
        this.x = x;
        this.y = y;
      }            
    },
    
    adjustLayoutToMap: function(evtType, mapExtent) {
      if (!this.suspendExtentHandler) {
        var centerPt;
        if (!evtType || evtType === 'zoom-end') {
          // This was a zoom, so reset the scales and redraw the layout
          this.setScaleRanges(mapExtent);
          centerPt = mapExtent.getCenter();
          this.layoutLayer.clear();
          this.drawMapSheet(centerPt);
        } else if (this.mapAreaExtent && !mapExtent.contains(this.mapAreaExtent)) {
          // Map extent does not contain the layout's map area.
          if (evtType === 'printScaleChange') {
            // Redraw the layout so it is within the map extents if the print scale has been changed.
            var correction = this.getCorrection(mapExtent);
            centerPt = this.mapAreaCenter.offset(correction.x, correction.y);
          } else {
            // Redraw the layout in the center of the map extent if there was a different cause
            centerPt = mapExtent.getCenter();
            this.setScaleRanges(mapExtent);
          }
          this.layoutLayer.clear();
          this.drawMapSheet(centerPt);
        } else if (evtType === 'resize') {
          this.setScaleRanges(mapExtent);
        }
      }
    },
    
    adjustMapToLayout: function() {
      var correction = this.getCorrection();
      this.suspendExtentHandler = true;
      this.map.setExtent(this.map.extent.offset(-correction.x, -correction.y));
      this.suspendExtentHandler = false;
    },
    
    getCorrection: function(mapExtent) {
      var correction = { x: 0, y: 0 };
      mapExtent = mapExtent || this.map.extent;
      var fudge = (mapExtent.getWidth() / this.map.width) * 25; //Set the fudge factor to the map units equivalent to 25 pixels
      if (mapExtent.xmin > this.mapAreaExtent.xmin - fudge) { correction.x = mapExtent.xmin - this.mapAreaExtent.xmin + fudge; }
      if (mapExtent.ymin > this.mapAreaExtent.ymin + fudge) { correction.y = mapExtent.ymin - this.mapAreaExtent.ymin + fudge; }
      if (mapExtent.xmax < this.mapAreaExtent.xmax + fudge) { correction.x = mapExtent.xmax - this.mapAreaExtent.xmax - fudge; }
      if (mapExtent.ymax < this.mapAreaExtent.ymax + fudge) { correction.y = mapExtent.ymax - this.mapAreaExtent.ymax - fudge; }
      return correction;
    },
    
    setScaleRanges: function(mapExtent) {
      var layout = this.mapSheetParams.layout;
      var pageSize = this.mapSheetParams.pageSize;
      var mapSize = this.mapSheetParams.mapSize;
      var noTbBorders = this.mapSheetParams.noTbBorders;
      var unitRatio = this.mapSheetParams.unitRatio;
      var maxScale;
      mapExtent = mapExtent || this.map.extent;
        
      //get the maximum scale of the map
      if (layout === 'MAP_ONLY') {
       return;
      }
        
      if (!isNaN(unitRatio.x) && !isNaN(unitRatio.y)) {
        if (this.titleBlock) {
          maxScale = Math.ceil(Math.min(mapExtent.getHeight() / mapSize.y / unitRatio.y, 
                                        mapExtent.getWidth() / mapSize.x / unitRatio.x));
        } else {
          maxScale = Math.ceil(Math.min(mapExtent.getHeight() / (pageSize.y - noTbBorders.y * 2) / unitRatio.y, 
                                        mapExtent.getWidth() / (pageSize.x - noTbBorders.x * 2) / unitRatio.x));
        }
      } else {
        maxScale = this.map.scale;
      }
        
      // set the ranges on the scale slider
      scaleArray = getValidScales(maxScale, this.mapScales);
      maxScale = scaleArray[0];
      var snapInterval = getSnapInterval(scaleArray);
      var minScale = scaleArray[scaleArray.length - 1];
      var oldScale = this.scaleSliderDijit.get('value');
      var startingScale = getSnapScale(oldScale, scaleArray);
      var discreteScales = ((maxScale - minScale) / snapInterval) + 1;
      this.scaleBoxDijit.set('value', startingScale);
      this.scaleBoxDijit.set('data-dojo-props', 'constraints:{min:' + minScale.toString() + ',max:' + maxScale.toString() + ',places:0,pattern:"000,000"}');
      this.scaleBoxDijit.set('invalidMessage', 'Invalid scale');
      query('#scaleSlider', this.domNode).style('display', discreteScales > 1 ? 'block' : 'none');
      this.scaleSliderDijit.set('minimum', minScale);
      this.scaleSliderDijit.set('maximum', maxScale);
      this.scaleSliderDijit.set('value', startingScale);
      this.scaleSliderDijit.set('discreteValues', discreteScales);
      
      // The scale labels (number of labels based on number of scales in scaleArray)
      var labels = getLabels(minScale, snapInterval, this.scaleLabelMaps[discreteScales - 1]);
      
      var sliderWidth = parseInt(domStyle.get(this.scaleSliderDijit.domNode, 'width'), 10);
      var scrollWidth = this.scaleSliderDijit.remainingBar.scrollWidth;
      var leftOffset = (sliderWidth - scrollWidth) / 2 - 1;
      var tickHeight = 2 + this.scaleSliderDijit.sliderHandle.clientHeight / 2;
      
      if (this.maxScale >= minScale && this.maxScale <= maxScale) {
        lodMaxScalePos = 100 * ((scrollWidth - 1) / scrollWidth - (maxScale - this.maxScale) / (maxScale - minScale));
      } else {
        lodMaxScalePos = null;
      }
      
      // Delete the ticks and labels
      this.deleteTicksAndLabels();
      
      // The ticks for each scale increment
      var scaleSliderDom = dom.byId('scaleSlider');
      var ruleNode = domConstruct.create("div", {}, scaleSliderDom, "last");
      this.sliderRule = new HorizontalRule({
        container: "bottomDecoration",
        count: discreteScales,
        ruleStyle: "border-width: thin;",
        style: "width: " + scrollWidth + "px; left: " + leftOffset + "px; height: " + tickHeight + "px;"
      }, ruleNode);
      this.sliderRule.startup();
        
      //The longer ticks for each scale label
      var ruleNode1 = domConstruct.create("div", {}, scaleSliderDom, "last");
      this.sliderRule1 = new HorizontalRule({
        container: "bottomDecoration",
        count: labels.length,
        ruleStyle: "border-width: thin;",
        style: "width: " + scrollWidth + "px; left: " + leftOffset + "px; height: 3px;"
      }, ruleNode1);
      this.sliderRule1.startup();
      
      if (lodMaxScalePos) {
        //The red tick for the largest basemap scale
        var ruleNode2 = domConstruct.create("div", {}, scaleSliderDom, "last");
        this.sliderRule2 = new HorizontalRule({
          container: "bottomDecoration",
          count: 1,
          ruleStyle: "border-width: medium; border-color: red; left: " + lodMaxScalePos + "%; height: " + (tickHeight + 3) + "px",
          style: "width: " + scrollWidth + "px; left: " + leftOffset + "px; height: 5px; top: -14px;"
        }, ruleNode2);
        this.sliderRule2.startup();
      }
      
      // The scale labels
      var labelsNode = domConstruct.create("div", {}, scaleSliderDom, "last");
      this.sliderLabels = new HorizontalRuleLabels({
        container: "bottomDecoration",
        labels: labels,
        // These width and left settings prevent the labels from causing a horizontal scroll bar.
        style: "width: 84%; left: 7%; height: 1em; font-size: 10px;"
      }, labelsNode);
      this.sliderLabels.startup();
        
      function getSnapInterval(scales) {
        // This function returns the largest common factor in the scales array.
        // If there is only one scale, return 1; if there are only two scales, return their difference.
        if (scales.length === 1) {
          return 1;
        } else if (scales.length === 2) {
          return scales[0] - scales[1];
        }
        
        // Three or more scales, so find the largest common factor.
        var largestFactor = 1;
        var minScale = scales[scales.length - 1];
        var factors = getPrimeFactors(minScale);
        var failedFactors = [];
        var tryFactor;
          
        for (var i = 0; i < factors.length; i++) {
          // if a tryFactor has failed once, don't try it again
          if (array.indexOf(failedFactors, largestFactor * factors[i]) === -1) {
            tryFactor = largestFactor * factors[i];
            // ignore the largest scale - it was calculated, not taken from the list
            for (var j = 1; j < scales.length - 1; j++) {
              if (scales[j] % tryFactor !== 0) {
                break;
              }
            }

            if (j === scales.length - 1) {
              largestFactor = tryFactor;
            } else {
              failedFactors.push(tryFactor);
            }
          }
        }
          
        return largestFactor;
      }
        
      function getPrimeFactors(value) {
        // This function returns an array of the factors of value.
        // The numbers 1 and value are never in the array, so if value is a prime number, a zero length array is returned.
            
        var primeFactors = [];
        var newValue = value;
        for (var i = 2; i < value; i++)
        {
          while (newValue % i === 0) {
            newValue = newValue / i;
            primeFactors.push(i);
          }
               
          if (newValue === 1) {
            break;
          }
        }
        return primeFactors;
      }
        
      function getValidScales(maxScale, mapScales) {
        var validScales = [];
        
        if (maxScale < mapScales.slice(-1)[0]) {
          return mapScales.slice(-1);
        }
        
        var minScale = Math.ceil(maxScale / 7);
           
        for (var i = 0; i < mapScales.length; i++) {
          var scale = mapScales[i];
          if (scale < maxScale) {
            validScales.push(scale);
          }
          if (scale < minScale) {
            break;
          }
        }
        return validScales;
      }
      
      function getSnapScale(scale, scales) {
        var snapScale;
        if (scale === 0) {
          // Scale is 0; the widget is just being opened.  Return the scale that will set
          // the sheet graphic to the largest size that does not include the entire map extent.
          snapScale = scales.length === 1 ? scales[0] : scales[1];
        } else if (array.indexOf(scales, scale) !== -1) {
          // Scale is one of the values in scales; return scale
          snapScale = scale;
        } else if (scale > scales[0]) {
          // Scale is larger than the largest value in scales; return the second largest value in scales
          snapScale = scales[1];
        } else if (scale < scales[scales.length - 1]) {
          // Scale is smaller than the smallest value in scales; return the smallest value in scales
          snapScale = scales[scales.length - 1];
        } else {
          // Return the value in scales that is closest to scale
          for (var i = 1; i < scales.length; i++) {
            if (scale <= scales[i - 1] && scale >= scales[i]) {
              if (scales[i - 1] - scale > scale - scales[i]) {
                snapScale = scales[i];
              } else {
                snapScale = scales[i - 1];
              }
              break;
            }
          }
        }
        return snapScale;
      }
        
      function getLabels(minScale, snapInterval, scaleIndices) {
        var labelArray = [];
        var scale;
        for (var i = 0; i < scaleIndices.length; i++) {
          scale = minScale + (snapInterval * scaleIndices[i]);
          labelArray.push(number.format(scale, {pattern: '###,###'}));
        }
        return labelArray;
      }
    },
    deleteTicksAndLabels: function() {
      if (this.sliderRule) {
        this.sliderRule.destroy();
        this.sliderRule = null;
      }
      if (this.sliderRule1) {
        this.sliderRule1.destroy();
        this.sliderRule1 = null;
      }
      if (this.sliderRule2) {
        this.sliderRule2.destroy();
        this.sliderRule2 = null;
      }
      if (this.sliderLabels) {
        this.sliderLabels.destroy();
        this.sliderLabels = null;
      }
    },
    
    getUnitToMetersFactor: function(unit) {
      switch (unit)
      {
        case Units.CENTIMETERS:     return {x: 0.01, y: 0.01};         
        // case Units.DECIMETERS:      return {x: 0.1, y: 0.1};
        // case Units.FEET:            return {x: 0.3048, y: 0.3048};
        case Units.INCHES:          return {x: 0.0254, y: 0.0254};
        // case Units.KILOMETERS:      return {x: 100.0, y: 100.0};
        // case Units.METERS:          return {x: 1.0, y: 1.0};
        // case Units.MILES:           return {x: 1609.344, y: 1609.344};
        case Units.MILLIMETERS:     return {x: 0.001, y: 0.001};
        // case Units.NAUTICAL_MILES:  return {x: 1852.0, y: 1852.0};
        // case Units.YARDS:           return {x: 0.9144, y: 0.9144};
        // case Units.UNKNOWN_UNITS:   return {x: NaN, y: NaN};
        // case Units.DECIMAL_DEGREES: return {x: 1.0, y: 1.0};
        default:                    return {x: NaN, y: NaN};
      }
    },
    
    onStateChange: function(reason, newValue) {
      var thisDom, display;
      switch (reason) {
        case 'TITLE_BLOCK':
          // When the title block checkbox is changed, set the disabled property of the title 
          // and adjust the visibility of the author, copyright, and legend.
          query('#titleInput', this.domNode).style('display', newValue ? '' : 'none');
          array.forEach(['layoutMetadata', 'layoutMetadataFields', 'includeLegend'], function(item, idx) {
            display = ['inline', 'inline', 'inline'];
            thisDom = dom.byId(item);
            if (thisDom && thisDom.style) {
              thisDom.style.display = newValue ? display[idx] : 'none';
            }
          });
          break;
        case 'LAYOUT':
          // When the layout is changed, set the disabled property of the title 
          // and adjust the visibility of the scale box, scale slider, and title block checkbox.
          query('#titleInput', this.domNode).style('display', newValue === 'MAP_ONLY' ? 'none' : '');
          array.forEach(['scaleBoxRow', 'scaleSliderRow', 'titleBlock', 'showLayout'], function(item, idx) {
            display = ['table-row', 'table-row', 'inline', 'inline'];
            thisDom = dom.byId(item);
            if (thisDom && thisDom.style) {
              thisDom.style.display = newValue === 'MAP_ONLY' ? 'none' : display[idx];
            }
          });
          // Set the visibility of the preserve scale/extents, map height/width and units, and map sketch.
          array.forEach(['mapScaleExtent', 'preserve', 'forceScale', 'mapOnlyOptions', 'mapWidthHeight', 'mapSketch', 'mapSketchLegend'], function(item, idx) {
            display = ['inline', 'inline', 'none', 'inline', 'inline', 'block', 'inline'];  //'forceScale' --> 'table-row'
            thisDom = dom.byId(item);
            if (thisDom && thisDom.style) {
              thisDom.style.display = newValue === 'MAP_ONLY' ? display[idx] : 'none';
            }
          });
          // Set the visibility of the title block options.
          array.forEach(['layoutMetadata', 'layoutMetadataFields', 'includeLegend'], lang.hitch(this, function(item, idx) {
            display = ['inline', 'inline', 'inline'];
            thisDom = dom.byId(item);
            if (thisDom && thisDom.style) {
              thisDom.style.display = newValue === 'MAP_ONLY' || !this.titleBlock ? 'none' : display[idx];
            }
          }));
          break;
        // case 'DOCKED':
          // break;
      }
    },
    
    _toggleShowLayout: function(show, layoutClicked) {
      // Turn the zoom/pan event handlers on or off (for adjusting the layout when the map extents change)
      this.togglePanZoomHandlers(show);
      // Turn the drag/swipe event handlers on or off (for adjusting the map relative to the layout)
      this.toggleMapPanHandlers(show);
      if (show) {
        this.layoutLayer.clear();
        this.drawMapSheet(this.mapAreaCenter);
        this.adjustLayoutToMap(null, this.map.extent);
      } else {
        this.layoutLayer.clear();
        if (layoutClicked) {
          this.showLayoutDijit.set('value', show);
          // turn off layoutLayer if the widget is closed
          if (this.getParent().state === 'closed') {
            this.toggleLayoutLayer(false);
          }
        } else {
          // This widget was loaded just to populate the Help content, so don't show the layout.
          this.toggleLayoutLayer(false);
        }
      }
    },
    
    toggleLayoutLayer: function(visible) {
      this.layoutLayer.visible = visible;
    },
    
    concatUnique: function(array1, array2) {
      var obj1 = {}, obj2 = {}, array3 = [];
      array.forEach(array1, function(item) { obj1[item.id] = 0; });
      array.forEach(array2, function(item) { obj2[item.id] = 0; });
      lang.mixin(obj1, obj2);
      for (var lyrName in obj1) { array3.push({ id: lyrName }); }
      return array3;
    }
  });

  // Print result dijit
  var PrintResultDijit = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    widgetsInTemplate: true,
    templateString: printResultTemplate,
    url: null,
    postCreate: function() {
      this.inherited(arguments);
      this.fileHandle.then(lang.hitch(this, '_onPrintComplete'), lang.hitch(this, '_onPrintError'));
    },
    
    _onPrintComplete: function(data) {
      if (data.url) {
        this.url = data.url;
        domStyle.set(this.progressBar.domNode, 'display', 'none');
        domStyle.set(this.successNode, 'display', 'inline-block');
        domClass.add(this.resultNode, "printResultHover");
      } else {
        this._onPrintError(this.nls.printError);
      }
    },
    
    _onPrintError: function(err) {
      console.log(err);
      domStyle.set(this.progressBar.domNode, 'display', 'none');
      domStyle.set(this.errNode, 'display', 'block');
      domClass.add(this.resultNode, "printResultError");

      domAttr.set(this.domNode, 'title', err.details || err.message || "");
    },
    
    _openPrint: function() {
      if (this.url !== null) {
        window.open(this.url);
      }
    }
  });
  return PrintDijit;
});
