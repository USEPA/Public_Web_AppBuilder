define(['dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', 'jimu/BaseWidget',
        'dojo/_base/array', 'dojo/_base/lang', 'dojo/on',
       'dijit/form/ToggleButton', 'dijit/form/CheckBox',
       'esri/layers/GraphicsLayer', 'esri/symbols/SimpleFillSymbol','esri/symbols/SimpleLineSymbol', 'dojo/_base/Color',
        'esri/tasks/ImageServiceIdentifyParameters', 'esri/tasks/ImageServiceIdentifyTask',
        'esri/tasks/query', 'esri/tasks/QueryTask'
       ],
function(declare, _WidgetsInTemplateMixin, BaseWidget, 
          array, lang, on, 
          Button, CheckBox, GraphicsLayer, SFS, SLS, Color, 
          ImageServiceIdentifyParameters, ImageServiceIdentifyTask, 
          Query, Task) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    // DemoWidget code goes here 
      baseClass: 'dtc-imageInfo',
      imageService: null,
      //graphics: esri.layers.GraphicsLayer
		graphics:null,
		//imageOutline: esri.Graphic (footprint of image)
		imageOutline: null,
		//fields: String[]
		fields: null,
		//copyText: string
		copyText: null,
      
      startup: function(){
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
      _init: function(){
          this.graphics = new GraphicsLayer();
          this.graphics.setVisibility(false);
          this.map.addLayer(this.graphics);
          this.imageOutline = new SFS(SFS.STYLE_SOLID, 
                                      new SLS(SLS.STYLE_SOLID, new Color([255,255,0]), 2),
                                      new Color([255,255,0,0.1]));
          this.map.on('extent-change', lang.hitch(this, this._onExtentChange));
			//Allow the user to click on the map and get image info
          this.btnIdentify.set('title', this.nls.selectImage);
          this.btnIdentify.on('click', lang.hitch(this, this._startIdentify));
			//Toggle the footprint on/off
          this.chkFootprint.on('change', lang.hitch(this, this._toggleFootprint));
			//Copy/download the metadata text.  Stubbed for future use
			//this.btnCopy.on('click', lang.hitch(this, this._getData));
      },
      _onExtentChange: function() {
          if(this.chkAutoUpdate.get('value') === 'on') {
              var point = this.map.extent.getCenter();
              this._updateInfo(point);
          }
      },
      //Modify the cursor and set up the response for a map click
      _startIdentify: function() {
          //var _self = this;
          this.map.setMapCursor('crosshair');
          on.once(this.map, 'click', lang.hitch(this, this._onIdentifyClick));
      },
      
      //Revert the cursor and send the point to _updateInfo
      _onIdentifyClick: function(e) {
          this.map.setMapCursor('default');
          this._updateInfo(e.mapPoint);
      },
      
      _updateInfo: function(point) {
          var _self = this;
          _self._clearInfo();
          if (_self.imageService === null) {
              _self._updateError('No image service selected');
              return;
          }
          //Identify on the center of the map
          var params = new ImageServiceIdentifyParameters();
          params.geometry = point;
          params.mosaicRule = (_self.imageService.mosaicRule === null) ? _self.imageService.defaultMosaicRule : _self.imageService.mosaicRule; 
          params.returnGeometry = true;
          if (_self.map.timeExtent) {
              params.timeExtent = _self.map.timeExtent;
          }
          var task = new ImageServiceIdentifyTask(_self.imageService.url);
          task.execute(params, lang.hitch(_self, _self._updateResult), lang.hitch(_self, _self._updateError));	
		},
      
      _updateResult: function(result) {
			var _self = this;

			//Find the visible image from the catalog results
			var visibleItem;
			array.forEach(result.catalogItemVisibilities, function(isVis, index){
				if (isVis === 1) 
                {visibleItem = index;}
			});
			if (visibleItem === null) {
				_self._updateError('No images found.');
				return;
			}

			//add the shape to the graphics layer
			var thisImage = result.catalogItems.features[visibleItem];
			thisImage.setSymbol(_self.imageOutline);
			_self.graphics.add(thisImage);
			
			//and insert the text
			var htmlText = '<div class=\'details\'>';
			_self.copyText = '';
			
			var fieldNames = Object.keys(_self.fields);
			var excludeFields = [result.catalogItems.objectIdFieldName, 'Shape', 'Shape_Area', 'Shape_Length'];
			array.forEach(fieldNames, function(name){
				if (excludeFields.indexOf(name)< 0){
					var l = _self.fields[name]['alias'];
					var v;
					//If it's a coded value domain, use the domain value
					if (_self.fields[name].domain !== null && _self.fields[name].domain.type === 'codedValue') {
						array.forEach(_self.fields[name].domain.codedValues, function(codedValue){
							if (codedValue.code === thisImage.attributes[name]) {
								v = codedValue.name;
							}
						});
					} else if (_self.fields[name].type === 'esriFieldTypeDate') {
						var thisDate = new Date(parseInt(thisImage.attributes[name],10));
						v = thisDate.toISOString();
					} else {
						//Otherwise, get the string representation
						v = String(thisImage.attributes[name]);
					}
					//add to our outputs
					htmlText +='<span class=\'field\'>'+ l + ':</span>';
					htmlText += '<span class=\'value\'>'+ v + '</span>';
					_self.copyText += l + '\t' + v + '\n';
				}
			});
			//Add details to the DOM
			htmlText += '</table>';
			_self.imageDetails.innerHTML = htmlText;
		},
      //Clear out the information on a new request
		_clearInfo: function() {
			this.graphics.clear();
			this.copyText = '';
			this.imageDetails.innerHTML = '';
		},
		
		//Present the error to the user
		_updateError: function(error) {
			this.imageDetails.innerHTML = 'An error has occured.<br />' + error;
			console.log(error);
		},
		
		//Turn the footprint or off
		_toggleFootprint: function(){
			this.graphics.setVisibility(this.chkFootprint.get('value') === 'on');
		},
		
		//_getData: copy/download the metadata text.  Stubbed for future use
		_getData: function(){
			
		},
      
      onReceiveData: function(name, source, params) {
        var _self = this;
        var service = null;
        if(params && params.serviceId && params.target === 'ImageAnalysis') {
            service = this.map.getLayer(params.serviceId);
            if (service.loaded === true) { 
                this.imageService = service;
                var q = new Query();
				//We don't need actually results, just the overhead
				q.where = '1=0';
				q.returnGeometry = false;
				q.outFields = ['*'];
				var qt = new Task(service.url);
				qt.execute(q, function(fSet){
					_self.fields = {};
					array.forEach(fSet.fields, function(fieldInfo){
						_self.fields[fieldInfo.name] = fieldInfo;
					});
					//Now that we've loaded the field information, let's load up the image info that we're seeing
                    lang.hitch(_self, _self.updateInfo());
                });
            } else {
                service.on('load', function(){
                    _self.imageService = service;
                    var q = new Query();
					//We don't need actually results, just the overhead
					q.where = '1=0';
					q.returnGeometry = false;
					q.outFields = ['*'];
					var qt = new Task(service.url);
					qt.execute(q, function(fSet){
						_self.fields = {};
						array.forEach(fSet.fields, function(fieldInfo){
							_self.fields[fieldInfo.name] = fieldInfo;
						});
						//Now that we've loaded the field information, let's load up the image info that we're seeing
						lang.hitch(_self, _self.updateInfo());
                    });
                });
            }
        } else {
            this.imageService = null;
        }
    },
    checkForImageService: function() {
        console.log('hello');
          if (this.map.loaded) {
              console.log('map loaded');
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