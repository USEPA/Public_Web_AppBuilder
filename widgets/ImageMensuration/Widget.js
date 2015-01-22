define(['dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', 'jimu/BaseWidget',
        'dojo/_base/array', 'dojo/_base/lang', 'dojo/number', 
         'esri/request',
        'esri/toolbars/draw', 'dojo/i18n!esri/nls/jsapi', 'dijit/form/Button',
       'dijit/form/Select', 'dijit/form/DropDownButton', 'dojo/dom-attr', 'dijit/registry'],
function(declare, _WidgetsInTemplateMixin, BaseWidget, 
          array, lang, number, 
          esriRequest, 
          Draw, bundle, Button, 
          Select, ToggleButton, domAttr, registry) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
      
    baseClass: 'dtc-mensuration',
    imageService: null,
    drawToolbar : null,
    measureMethod : null,
    measureLine : null,
    units : null,
    //_MENSURATIONOPTIONS: The types of mensuration operations that can be done.  Populates the buttons during startup

      //_UNITS: the types of valid (i.e., linear) units. Populates this.unitsSelect during startup
      _UNITS : [{
          value : 'esriFeet',
          label : bundle.widgets.measurement.NLS_length_feet
        }, {
          value : 'esriYards',
          label : bundle.widgets.measurement.NLS_length_yards
        }, {
          value : 'esriMeters',
          label : bundle.widgets.measurement.NLS_length_meters,
          selected : true
        }],
      
      startup: function() {
          var _self = this;
          if(this.config.hasOwnProperty('imageService') && this.config.imageService) {
              this.onReceiveData(null, null, {
                  'target':'ImageAnalysis',
                  serviceId:this.config.imageService
              });
          } else {
              this.checkForImageService();
          }
        
        if (this.map.loaded) {
            this._init();
        } else {
            this.map.on('load', lang.hitch(this, function() {
                _self._init();
            }));
        }
    },
      _init: function() {
          var _self = this;
          
          this.drawToolbar = new Draw(this.map, {
				tooltipOffset : 50
			});
          this.drawToolbar.on('draw-end', lang.hitch(this, this.measureBuilding));
          
          this.unitsSelect.addOption(this._UNITS);
          this.units = 'esriMeters';
          
          this.unitsSelect.on('change', function(newValue){
              _self.units = newValue;
              _self.measureBuilding(null);
          });
          var _MENSURATIONOPTIONS = [{
              method : 'esriMensurationHeightFromBaseAndTop',
              title : this.nls.baseTopDesc,
              iconClass : 'iconBaseTop'
          }, {
              method : 'esriMensurationHeightFromBaseAndTopShadow',
              title : this.nls.baseShadowDesc,
              iconClass : 'iconBaseTopShadow'
          }, {
              method : 'esriMensurationHeightFromTopAndTopShadow',
              title : this.nls.topShadowDesc,
              iconClass : 'iconTopTopShadow'
          }];
          array.forEach(_MENSURATIONOPTIONS, function(option) {
              new Button({
                  onClick: lang.hitch(_self, function() {
                      _self.drawBuildingHeight(option.method);
                  }),
                  title: option.title,
                  iconClass: option.iconClass
              }).placeAt(_self.buttonContainer);
          
          });
          if (this.imageService) {
              this._buttonSet(this.imageService);
          }
      },
      drawBuildingHeight: function(method) {
            lang.hitch(this, this.resetHeights());
			this.measureMethod = method;
			this.measureLine = null;
			this.map.setMapCursor('crosshair');
			this.drawToolbar.activate(esri.toolbars.Draw.LINE);
      },
      measureBuilding: function(result) {
          this.drawToolbar.deactivate();
          var imageServiceLayer = this.imageService.url;
          if (result) {
              this.measureLine = result.geometry;
          }
          if (!this.measureLine) {
              return;
          }
          var fromPoint = this.measureLine.getPoint(0, 0);
          var toPoint = this.measureLine.getPoint(0, 1);
          this.info.innerHTML = 'Measuring building heights...';
          var contentObj = {
              fromGeometry : JSON.stringify(fromPoint.toJson()),
              toGeometry : JSON.stringify(toPoint.toJson()),
              geometryType : 'esriGeometryPoint',
              measureOperation : this.measureMethod,
              linearUnit : this.units,
              mosaicRule : '',
              pixelSize : '',
              f : 'json'
          };
          new esriRequest({
              url : lang.replace('{0}/{1}', [imageServiceLayer, 'measure']),
              content : contentObj,
              callbackParamName : 'callback',
              load : lang.hitch(this, this.onResult),
              error : lang.hitch(this, this.onResultError)
          });
      },
      onResult: function(response) {
          this.info.innerHTML = '';
			// ANALYSIS RESULTS - MEASUREMENTS //
          var measurement = response.height;
			//console.log(measurement);
			// NUMBER FORMATTING //
          var numFormat = {
              places : 2
          };
			// UPDATE MEASUREMENT UI //
          this.mensurationHeight.innerHTML = number.format(Math.abs(measurement.value), numFormat);
          this.heightUncertainty.innerHTML = number.format(measurement.uncertainty, numFormat);
			// DISPLAY MEASUREMENT GRAPHICS //
          this.map.setMapCursor('default');
      },
      onResultError: function(error){
          this.info.innerHTML = error.message;
          this.map.setMapCursor('default');
      },
      resetHeights: function() {
          // RESET MEASUREMENT UI //
          this.mensurationHeight.innerHTML = '0.00';
          this.heightUncertainty.innerHTML = '0.00';
          this.info.innerHTML = '';
      },
      _buttonSet: function(service) {
          var isNotMensurable = true;
          if (service.hasOwnProperty('capabilities')) {
              isNotMensurable = (service.capabilities.indexOf('Mensuration') < 0);
          }

			//If the service doesn't support mensuration, disable the buttons
          var buttons = registry.findWidgets(this.buttonContainer);
          array.forEach(buttons, function(button) {
              button.set('disabled', isNotMensurable);
          });
      },
      onReceiveData: function(name, source, params) {
        var _self = this;
        var service = null;
        if(params && params.serviceId && params.target === 'ImageAnalysis') {
            service = this.map.getLayer(params.serviceId);
            if (service.loaded === true) { 
                this.imageService = service;
                this._buttonSet(service);
            } else {
                service.on('load', function(){
                    _self.imageService = service;
                    _self._buttonSet(service);
                });
            }
        } else {
            this.imageService = null;
        }
    },
      checkForImageService: function() {
          if (this.map.loaded) {
              this.publishData({
                  'target':'ImageSelect',
                  'request':'imageService'
              });
          } else {
              var _self = this;
              this.map.on('load', lang.hitch(this, function(){
                  console.log('map loaded');
                  _self.publishData({
                  'target':'ImageSelect',
                  'request':'imageService'
              });
              }));
          }
    }
      
  });
});