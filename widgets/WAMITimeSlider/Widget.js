///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', 'dojo/_base/lang', 'dojo/dom', 'dojo/on',
    'dojo/query', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/dom-attr', 'dojo/dom-class', 'dojo/_base/array', 
    'dojo/parser', 'dojo/fx/Toggler','dojo/date/locale', 'dijit/registry', 'dojo/data/ObjectStore', 
    'dojo/store/Memory', 'dijit/form/Select', 'dojox/timing/_base', 'dijit/form/HorizontalSlider', 
    'dijit/form/NumberSpinner', 
    'jimu/BaseWidget', 
    'esri/layers/ArcGISImageServiceLayer','esri/TimeExtent','esri/dijit/TimeSlider'
],
       function (
        declare,_WidgetsInTemplateMixin,lang,dom,on,
        query,domStyle,domConstruct,domAttr,domClass,array,
        parser,Toggler,locale,registry,ObjectStore,
        Memory,Select, timingBase, HorizontalSlider, 
        NumberSpinner,
        BaseWidget,
        ArcGISImageServiceLayer,TimeExtent,TimeSlider
        
    ) {
        var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
            name: 'WAMI Time Slider',
            baseClass: 'jimu-widget-wamitimeslider',
            timeSlider: null,
            timeSliderDiv: null,
            loaded: false,
            wamiLayer:null,
            imageLayers : [],
            framerate : null,
            playback:null,
            movingrate:null,
            imageQuality: null,
            _timer : null,
            indexTime: null,
            direction: null,
            playbackToggle: null,
            
//***********************************            
//Required Functions for Widget Lifecyle
//**************************************
            
            postCreate: function() {
                    this.inherited(arguments);
                    //console.log('postCreate');
                },
            
            startup: function() {
                this.inherited(arguments);
                this.imageLayers = this._getImageLayers();
                this._initImageSelect();
                this.framerate = this.config.WAMITimeSlider.framerate;
                this.playback = this.config.WAMITimeSlider.playback;
                this.imageQuality = this.config.WAMITimeSlider.quality;
                this.movingrate = (this.playback * (1 / this.framerate) * 1000);
                
                //Create the timer and set it's event, use the config file setting for initial values
                this._timer = new timingBase.Timer();
                this._timer.setInterval(this.movingrate);
                this._timer.onTick = lang.hitch(this, '_onTick', 1);
                
                
                this.map.on('time-extent-change',lang.hitch(this, this.timeExtentChanged));

                //UX Elements for the player
                //this.initProgressSlider();
                this.progressSlider.startup();
                this.initPlayBtn();


                //old UX to replace
                this.qualitySlider.on('change', lang.hitch(this, this._updateQuality));
                this.framerateSpinner.on('change', lang.hitch(this, this._updatreFramerate));
                            
                
                //console.log('startup');
            },
            
            onOpen: function(){
                
               // console.log('onOpen');
            },
            
            onClose: function(){
                            
                   // console.log('onClose');
                
            },
            
            onMinimize: function(){
                
               // console.log('onMinimize');
            },
            onMaximize: function(){
                
               // console.log('onMaximize');
            },
            
            onSignIn: function(credential){
                
                /* jshint unused:false*/
                //console.log('onSignIn');
            },
            
            onSignOut: function(){
                
               // console.log('onSignOut');
            },
                        
//End of Widget Lifecyle Functions
            
            imageLayerSelected:function(e){
                for(var i = 0; i < this.imageLayers.length; i+= 1) {
                    //Turn on the Selected Layer and apply the currently defined properties. 
                    //Zooms the map to the extent of the layer. Turns off other Image Layers.
                    //TODO: Make the zoom a config option or possible widget option
                    if (this.imageLayers[i].id === this.imageSelect.get('value')){
                        //console.log(i);
                        this.wamilayer = this.map.getLayer(this.imageSelect.get('value'));
                        if (this.wamilayer){
                            this.wamilayer.setVisibility(true);
                            this.wamilayer.setImageFormat(this.config.WAMITimeSlider.format);
                            this.wamilayer.setCompressionQuality(this.imageQuality);
                            this.map.setExtent(this.wamilayer.fullExtent);
                        }

                    }
                    else{
                       var layer = this.map.getLayer(this.imageLayers[i].id);
                        if (layer){
                            layer.setVisibility(false);
                        }
                    }
                        
                }                
                
                // Reset Slider to use the time extent from the WAMI Layer
                // Set the end time/start time to the same so it starts at begining of video
                this._setupSlider();
                if (this.wamilayer){
                    var vidTimeExtent = new TimeExtent();
                    
                    vidTimeExtent.startTime = this.wamilayer.timeInfo.timeExtent.startTime;
                    vidTimeExtent.endTime = this.wamilayer.timeInfo.timeExtent.startTime;
                    this.map.setTimeExtent(vidTimeExtent);
                    this.infoBoxText();
                        

                    }
            },
            infoBoxText:function(){
                var vstart = locale.format(this.wamilayer.timeInfo.timeExtent.startTime,
                                                 {selector:'time', timePattern:'H:m:ss'});
                var vend = locale.format(this.wamilayer.timeInfo.timeExtent.endTime,
                                                {selector:'time', timePattern:'H:m:ss'});
                var vdstart = locale.format(this.wamilayer.timeInfo.timeExtent.startTime,
                                                 {selector:'date', datePattern:'MMM d, yyy'});
                var vdend = locale.format(this.wamilayer.timeInfo.timeExtent.endTime,
                                                {selector:'date', datePattern:'MMM d, yyy'});
                dom.byId('timeExtentValue').innerHTML = this.nls.videoDate + ' : ' + vstart + ' - ' + vend;
                dom.byId('dateExtentValue').innerHTML = this.nls.videoDate + ' : ' + vdstart + ' - ' + vdend;  
            },
            timeExtentChanged:function(e){
                if (this.map.timeExtent){
                    var vidtime = locale.format(this.map.timeExtent.endTime,
                                                {selector:'time', timePattern:'H:m:ss.SSS'}); 
                    dom.byId('playbackValue').innerHTML = ' ' + this.nls.timeReadout + ' : ' + vidtime;
                    this.progressSlider.setValue(this.map.timeExtent.endTime.getTime());
                    
                }
                //else {console.log('No Time Extent Update');}

            },
            setIndex:function(){
              var sliderVal = this.progressSlider.sliderCurrentValue();
                if (sliderVal !== this.indexTime){
                    this.indexTime = sliderVal;
                }
            },

//*******************************
//Button Toolbar Control.
//***************************
            
            initPlayBtn:function(){
                
                dom.byId('playRevEndBtn').addEventListener('click',lang.hitch(this, this.playRevEnd));
                dom.byId('playRevStep').addEventListener('click',lang.hitch(this, this.playRevStep));
                dom.byId('playRevBtn').addEventListener('click',lang.hitch(this, this.playRev));
                dom.byId('playForwardBtn').addEventListener('click',lang.hitch(this, this.playForward));
                dom.byId('playForwardStepBtn').addEventListener('click',lang.hitch(this, this.playForwardStep));
                dom.byId('playForwardEndBtn').addEventListener('click',lang.hitch(this, this.playForwardEnd));
                
            },
            playRevEnd:function(){
                this.indexTime = this.wamilayer.timeInfo.timeExtent.startTime.getTime();
                this._setTime();
            },
            playRevStep:function(){
                this._timer.stop();
                this.indexTime -= this.movingrate;
                this._setTime();
                this.resetPlayBtn();
                
            },
            playRev:function(val){
                if(this.direction !== 'rev'){
                    //console.log('Reverse');
                    this._timer.start();
                    this.direction='rev';
                    query('span',dom.byId('playRevBtn')).removeClass('icon-chevron-left').addClass('icon-pause');
                    query('span',dom.byId('playForwardBtn')).removeClass('icon-pause').addClass('icon-chevron-right');
                }
                else {
                    //console.log('Pause');
                    this.resetPlayBtn();
                }
                
            },
            playForward:function(val){
                if(this.direction !== 'fwd'){
                    //console.log('Forward');
                    this._timer.start();
                    this.direction='fwd';
                    //var t = query('span',dom.byId('playForwardBtn'));
                    //console.log(t);
                    query('span',dom.byId('playForwardBtn')).removeClass('icon-chevron-right').addClass('icon-pause');
                    query('span',dom.byId('playRevBtn')).removeClass('icon-pause').addClass('icon-chevron-left');
                }
                else {
                    //console.log('Pause');
                    this.resetPlayBtn();
                }
                
            },                        
            playForwardStep:function(){
                this._timer.stop();
                this.indexTime += this.movingrate;
                this._setTime();
                this.resetPlayBtn();
                
            },
            playForwardEnd:function(){
                this.indexTime = this.wamilayer.timeInfo.timeExtent.endTime.getTime();
                this._setTime();
            },
            resetPlayBtn:function(){
                this._timer.stop();
                this.direction = null;
                query('span',dom.byId('playForwardBtn')).removeClass('icon-pause').addClass('icon-chevron-right');
                query('span',dom.byId('playRevBtn')).removeClass('icon-pause').addClass('icon-chevron-left');
            },
//*******************************
//Progress Slider Controls.
//***************************
            progressSlider: {
                progressIndex:null,
                progressClick:null,
                startx:null,
                value:null,
                minimum:null,
                maximum:null,
                valueConversion:1.0,
                self:this,
                startup : function(){
                  //Event Listeners to enable dragging os slider button
                  dom.byId('progButton').addEventListener('mousedown',this._progressClick.bind(this), false);
                  dom.byId('playArea').addEventListener('mousemove',this._progressMove.bind(this),false);
                  dom.byId('playArea').addEventListener('mouseup',this._progressDone.bind(this),false);
                    //console.log('valueConversion initial Value '+ this.valueConversion);
              },
                _progressClick:function(e){
                    this.progressClick = true;
                    this.progressIndex = domStyle.get('progressBarIndicator','width');
                    this.startx = e.pageX;
                    //console.log('Click StartX ' + this.startx);   
                },
                _progressDone:function(e){
                    this.progressClick = false;
                    //console.log(this.value);
                },
                _progressMove:function(e){
                    if(this.progressClick){
                        var progMove=0;
                        var progBarWidth = dom.byId('progressBar').offsetWidth;
                        var buttonWidth = dom.byId('progButton').offsetWidth;
                        var x = e.pageX;
                        
                        //Current Positions for Prgress Bar and Progress Button
                        var deltax = x - this.startx;
                        var newx = deltax + this.progressIndex;
                        if(newx < 0){
                            progMove = 0;
                            //Add Current Time here
                        }
                        else if (newx > progBarWidth){
                            //set time here
                            progMove = progBarWidth;
                        }
                        else{
                            progMove = newx;
                        }
                    domStyle.set('progressBarIndicator',{'width' : progMove + 'px'});
                    domStyle.set('progButton',{'left' : (progMove - buttonWidth) + 'px'});
                                        
                    }
                },
                sliderCurrentValue:function(){
                    var barWidth = domStyle.get('progressBarIndicator','width');
                    this.value = Math.floor(this.valueConversion * barWidth + this.minimum);
                    return this.value;
                },
                setTimeExtent:function(extent){
                        this.value = extent && extent.startTime.getTime();
                        this.minimum = extent && extent.startTime.getTime();
                        this.maximum = extent && extent.endTime.getTime();
                        this.discreteValues = extent && (extent.endTime - extent.startTime);
                        this.valueConversion = this.discreteValues / dom.byId('progressBar').offsetWidth;
                    
                    //console.log('slider width to milisecond: ' + this.maximum);
                },
                setValue:function(time){
                    this.value = time;
                    var relVaule = time - this.minimum;
                    var position = relVaule / this.valueConversion;
                    var buttonWidth = dom.byId('progButton').offsetWidth;
                    domStyle.set('progressBarIndicator',{'width' : position + 'px'});
                    domStyle.set('progButton',{'left' : (position - buttonWidth) + 'px'}); 
                }
                

            },
//Time Control Functions
            _onTick:function(){
                //Temporary fix to make change the index when the slider changes
                //Need to figure out how to wire up events to handle this.
                this.setIndex();
                //console.log('Image Date Starting Index ' + this.indexTime);
                if (this.direction === 'fwd'){this.indexTime += this.movingrate;}
                else if (this.direction === 'rev'){this.indexTime -= this.movingrate;}
                else {
                    //console.log('not moving');
                      return;
                }
                this._setTime();
                
            },
            _setTime:function(){
                //console.log('Image Date using Index ' + this.indexTime);
                //TODO: Need to protect against empty time extent
                if (this.wamilayer){
                      //console.log('Test Tic ' + this.indexTime);
                   if (this.indexTime >= this.wamilayer.timeInfo.timeExtent.startTime ){
                        var vidTimeExtent = new TimeExtent();
                        vidTimeExtent.startTime = this.wamilayer.timeInfo.timeExtent.startTime;
                        vidTimeExtent.endTime = new Date(this.indexTime);
                        this.map.setTimeExtent(vidTimeExtent);
                    }
                    //else {console.log('paused');}
                }
                //else{console.log('No Image Selected Fix this bug!');}
      
            },            
            _updateQuality: function() {
                this.imageQuality = this.qualitySlider.value;
                if (this.wamilayer){
                    this.wamilayer.setCompressionQuality(this.imageQuality);
                }
                //console.log('Slider Change Quality ' + this.imageQuality);
                //TODO: Figure out how to show initial value
                this.qualityValue.innerHTML = this.qualitySlider.value;
                
            },
            
            _updatreFramerate:function(){
                if(this.framerateSpinner.value){
                    this.framerate = this.framerateSpinner.value;
                    //console.log('Framerate Change ' + this.framerate);
                    //This seems expensive to do on every framerate change
                    //TODO: Change this implementation
                    //this.wamiSlider(); //Built In Time Slider
                    this.movingrate = (this.playback * (1 / this.framerate) * 1000);
                    this._timer.setInterval(this.movingrate);
                    //Changing to set the tick interval
                    
                }
            },
            
//UX Setup Functions          
            //Setup the Slider based on the time extent of the selected layer
            _setupSlider: function(){
                if (this.wamilayer){
                    this.timeExtent = this.wamilayer.timeInfo.timeExtent;
                    this.progressSlider.setTimeExtent(this.timeExtent);
                    //Set the time index to the start time 
                    this.indexTime = this.timeExtent.startTime.getTime();
                    //Set up the slider extent to equal the video layer extent
                }
            },           
            //Create a list of Image Layers that can be annimated by the video play controls            
            _getImageLayers: function() {
            //TODO: Filter list to only time enabled image layers
            var ids = this.map.layerIds;
            var len = ids.length;
                for (var i = 0; i < len; i++) {
                    var layer = this.map.getLayer(ids[i]);
                    //if (layer.setMosaicRule)
                    if (layer.declaredClass === 'esri.layers.ArcGISImageServiceLayer'){
                        this.imageLayers.push({label : layer.arcgisProps.title,id : layer.id});
                    }
                    
                }
            //Add the select statement. Includes blank string to force it to the top of the sort    
            this.imageLayers.push({label : ' ' + this.nls.selectVideoLayers, id : '-1'});
            return this.imageLayers;
            },
            
            //Initialize the WAMI Select Widget with the Image Service Layers in the web map            
            _initImageSelect:function(){
                var _self = this;
                var store = new Memory({
                    data : this.imageLayers
                });
                //Add an empty item to represent the first item in the store
                var os = new ObjectStore({
                    objectStore : store
                });
                this.imageSelect.setStore(os/*,this.imageLayers[0]*/);
                this.imageSelect.on('change',function(newValue){ _self.imageLayerSelected();});
                this.imageSelect.sortByLabel = false;
            }
            

          
        });
        
        return clazz;
        });