define(['dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', 'jimu/BaseWidget', "dojo/_base/array", "dojo/_base/lang", "dojo/query",
       "dijit/form/Select", "dijit/form/CheckBox", "dijit/form/Button", "dijit/form/HorizontalSlider", "esri/dijit/LayerSwipe" ,"esri/layers/RasterFunction"
       ],
function(declare, _WidgetsInTemplateMixin, BaseWidget, array, lang, query, Select, CheckBox, Button, HSlider, LayerSwipe, RasterFunction) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    // DemoWidget code goes here 
    baseClass: 'dtc-ImageProperties',
    imageService: null,
    swipeWidget: null,
    visibilityHandler: null,
    startup: function() {
        //If we have the service set by config, use it
        if(this.config.hasOwnProperty('imageService') && this.config.imageService) {
            this.onReceiveData(null, null, {
                'target':'ImageAnalysis',
                serviceId:this.config.imageService
            });
        } else {
            this.checkForImageService();
        }

        if (!this.config.enableCanvas) {
            this.brightnessSlider.set('style', "display:none");
            this.contrastSlider.set('style', "display:none");
            query(".brightnessLabel").style("display", "none");
            query(".contrastLabel").style("display", "none");
        } else {
            this.brightnessSlider.on("change", lang.hitch(this, this._updateBrightness));
			this.contrastSlider.on("change", lang.hitch(this, this._updateContrast));
        }
        
        this.gammaSlider.on("change", lang.hitch(this, this._updateRasterFunction));
		this.DRAcheck.on("change", lang.hitch(this, this._updateRasterFunction));
        this.SwipeCheck.on("change", lang.hitch(this, this._updateSwipeFunction));
		this.redSelect.on("change", lang.hitch(this, this._updateChannels));
		this.greenSelect.on("change", lang.hitch(this, this._updateChannels));
		this.blueSelect.on("change", lang.hitch(this, this._updateChannels));
		this.resetButton.on("click", lang.hitch(this, this._reset));
        
        //Event handler to turn off swiping when swipe layer visibility cahgnes
        if (this.imageService) {
            if (this.imageService.loaded === true) {
                this.visibilityHandler = this.imageService.on("visibility-change", lang.hitch(this, this._visibilityChanged));
            } else {
                var _self = this;
                this.imageService.on('load', function(){
                    _self.visibilityHandler = _self.imageService.on("visibility-change", lang.hitch(_self, _self._visibilityChanged));
                });
            }
        }
    
    },
    onReceiveData: function(name, source, params) {
        var _self = this;
        var service = null;
        if(params && params.serviceId && params.target === "ImageAnalysis") {
            service = this.map.getLayer(params.serviceId);
            if (service.loaded === true) { 
                this.imageService = service;
                this._resetUI();
                this._setChannels();
                this.visibilityHandler = this.imageService.on("visibility-change", lang.hitch(this, this._visibilityChanged));
            } else {
                service.on('load', function(){
                    _self.imageService = service;
                    _self._resetUI();
                    _self._setChannels();
                    _self.visibilityHandler = _self.imageService.on("visibility-change", lang.hitch(_self, _self._visibilityChanged));                    
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
              this.map.on("load", lang.hitch(this, function(){
                  console.log('map loaded');
                  _self.publishData({
                  'target':'ImageSelect',
                  'request':'imageService'
              });
              }));
          }
    },
    _setChannels : function() {
        //Get bandIds
		var bandList = [];
        for (var i = 1; i <= this.imageService.bandCount; i++) {
            bandList.push({
                label : String(i),
                value : String(i - 1)
            });
        }
        //For each dropdown, clear the options, load the bands in and select based on r,g,b index
        array.forEach([this.redSelect, this.greenSelect, this.blueSelect], function(thisSelect, index) {
            thisSelect.removeOption(thisSelect.getOptions());
            var thisBandList = lang.clone(bandList);
            thisSelect.addOption(thisBandList);
            if (this.imageService.bandIds === null || this.imageService.bandIds === undefined) {
                thisSelect.set('value', index);
            } else {
                thisSelect.set('value', thisBandList[this.imageService.bandIds[index]]);
            }
        }, this);
    },
    _updateBrightness: function() {
        //Requires Canvas
        //Use the setBrightnessValue function of the ImageLayerEx
		//This happens dynamically in browser
        this.imageService.setBrightnessValue(this.brightnessSlider.value);
		this.brightnessValue.innerHTML = this.brightnessSlider.value;
    },
    _updateContrast : function() {
        //Requires Canvas
        //Use the setContrastValue function of the ImageLayerEx
		//This happens dynamically in browser
		this.imageService.setContrastValue(this.contrastSlider.value);
		this.contrastValue.innerHTML = this.contrastSlider.value;
    },
    _updateRasterFunction: function() {
        //The raster function controls Gamma and DRA
        var rf = new RasterFunction();
        //Function name is one of a set of predefined function names, in this case we're using stretch
        rf.functionName = 'Stretch';
        var args = {};
        //Check for DRA (when checked, the value is 'on')
        args.DRA = (this.DRAcheck.get('value') === 'on');
        //Gamma takes an array - possibly seperate values for R,G,B
        args.Gamma = [this.gammaSlider.value, this.gammaSlider.value, this.gammaSlider.value];
        rf.arguments = args;
        rf.variableName = "Raster";
        //Set the image service's rendering rule as the raster function
        this.imageService.setRenderingRule(rf);
        this.gammaValue.innerHTML = this.gammaSlider.value.toFixed(1);
    },
    _updateSwipeFunction: function() {
        var onOff = this.SwipeCheck.get('value');
        if(onOff === 'on') {
            this.swipeWidget = new LayerSwipe({
                type:"vertical",
                top:250,
                map:this.map,
                layers:[this.imageService]
            });
            this.swipeWidget.startup();
        } else {
            if(this.swipeWidget !== null) {
                this.swipeWidget.destroy();
                this.swipeWidget = null;
            }
        }
    },
    _updateChannels : function() {
        //Set the band IDs based on dropdown values
		//Values are strings, so use parseInt
        this.imageService.setBandIds([parseInt(this.redSelect.get('value')), 
                                      parseInt(this.greenSelect.get('value')), 
                                      parseInt(this.blueSelect.get('value'))]);
    },
    _visibilityChanged: function(e) {

        if (e.target === this.imageService) {
            if(e.visible) {
                if (this.swipeWidget) {
                    this.swipeWidget.enable();
                }
            } else {
                if (this.swipeWidget) {
                    this.swipeWidget.disable();
                }
            }
        } 
    },
    _reset : function() {
        //Reset all options on the image
        this.imageService.suspend();
        if (this.enableCanvasTools) {
            this.imageService.setBrightnessValue(0);
            this.imageService.setContrastValue(0);		
        }
        this.imageService.setBandIds([null, null, null]);
        this.imageService.setRenderingRule(new RasterFunction());
        this.imageService.resume();
        this.imageService.refresh();
        //Reset the UI values
        this.redSelect.set('value', 0);
        this.greenSelect.set('value', 1);
        this.blueSelect.set('value', 2);
        this._resetUI();
        //This is used in the imageService setter, hence the breakout
    },
    _resetUI: function() {
        if (this.visibilityHandler) {
            this.visibilityHandler.remove();
            this.visibilityHandler = null;
        }
        if (this.enableCanvasTools) {
            this.brightnessSlider.set('value', 0);
            this.contrastSlider.set('value', 0);				
        }
        this.gammaSlider.set('value', 1);
        this.DRAcheck.set('value', false);
        if(this.swipeWidget){
            this.swipeWidget.destroy();
            this.SwipeCheck.set('value', false);
        }
    }
  });
});