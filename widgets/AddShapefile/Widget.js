define([
  'dojo/_base/declare',
  'jimu/BaseWidget',
  'dojo/on',
  'dojo/sniff',
  'esri/request',
  'esri/geometry/scaleUtils',
  'dojo/_base/lang',
  'dojo/dom',
  'dojo/_base/array',
  'esri/layers/FeatureLayer',
  'esri/InfoTemplate',
  'esri/renderers/SimpleRenderer',
  'esri/symbols/PictureMarkerSymbol',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/Color'
],
function(
  declare,
  BaseWidget,
  on,
  sniff,
  request,
  scaleUtils,
  lang,
  dom,
  arrayUtils,
  FeatureLayer,
  InfoTemplate,
  SimpleRenderer,
  PictureMarkerSymbol,
  SimpleFillSymbol,
  SimpleLineSymbol,
  Color
  ) {
  return declare([BaseWidget], {

    baseClass: 'jimu-widget-addshapefile',
    portalUrl: 'http://www.arcgis.com',
    arrayFeatureLayer: null,
    // postCreate: function() {
    //   this.inherited(arguments);
    //   console.log('postCreate');
    // },

    startup: function() {
      this.inherited(arguments);
      on(this.uploadForm, "change", lang.hitch(this, function (event) {
        var fileName = event.target.value.toLowerCase();
        this.arrayFeatureLayer = [];
          
        if (sniff("ie")) { //filename is full path in IE so extract the file name
          var arr = fileName.split("\\");
          fileName = arr[arr.length - 1];
        }
        if (fileName.indexOf(".zip") !== -1) {//is file a zip - if not notify user
          this.generateFeatureCollection(fileName);
        }
        else {
          this.uploadstatus.innerHTML = '<p style="color:red">Add shapefile as .zip file</p>';
        }
      }));
    },

     onOpen: function(){
       console.log('onOpen');
     },

     onClose: function(){
       console.log('onClose');
     },

     onRemoveShapefile: function(evt) {
        if (this.arrayFeatureLayer.length > 0) {
            arrayUtils.forEach(this.arrayFeatureLayer, function(currFeatureLayer) {
                this.map.removeLayer(currFeatureLayer);    
            }, this);
        }
     },
      
    generateFeatureCollection: function(fileName) {
      var name = fileName.split(".");
      //Chrome and IE add c:\fakepath to the value - we need to remove it
      //See this link for more info: http://davidwalsh.name/fakepath
      name = name[0].replace("c:\\fakepath\\", "");

      this.uploadstatus.innerHTML = '<b>Loading… </b>' + name;

      //Define the input params for generate see the rest doc for details
      //http://www.arcgis.com/apidocs/rest/index.html?generate.html
      var params = {
        'name': name,
        'targetSR': this.map.spatialReference,
        'maxRecordCount': 1000,
        'enforceInputFileSizeLimit': true,
        'enforceOutputJsonSizeLimit': true
      };

      //generalize features for display Here we generalize at 1:40,000 which is approx 10 meters
      //This should work well when using web mercator.
      var extent = scaleUtils.getExtentForScale(this.map, 40000);
      var resolution = extent.getWidth() / this.map.width;
      params.generalize = true;
      params.maxAllowableOffset = resolution;
      params.reducePrecision = true;
      params.numberOfDigitsAfterDecimal = 0;

      var myContent = {
        'filetype': 'shapefile',
        'publishParameters': JSON.stringify(params),
        'f': 'json',
        'callback.html': 'textarea'
      };

      //use the rest generate operation to generate a feature collection from the zipped shapefile
      request({
        url: this.portalUrl + '/sharing/rest/content/features/generate',
        content: myContent,
        form: this.uploadForm,
        handleAs: 'json',
        load: lang.hitch(this, function (response) {
          if (response.error) {
            this.errorHandler(response.error);
            return;
          }
          var layerName = response.featureCollection.layers[0].layerDefinition.name;
          this.uploadstatus.innerHTML = '<b>Loaded: </b>' + layerName;
          this.addShapefileToMap(response.featureCollection);
        }),
        error: lang.hitch(this, this.errorHandler)
      });
    },

    errorHandler: function (error) {
      this.uploadstatus.innerHTML = "<p style='color:red'>" + error.message + "</p>";
    },

    addShapefileToMap: function (featureCollection) {
      //add the shapefile to the map and zoom to the feature collection extent
      //If you want to persist the feature collection when you reload browser you could store the collection in
      //local storage by serializing the layer using featureLayer.toJson()  see the 'Feature Collection in Local Storage' sample
      //for an example of how to work with local storage.
      var fullExtent;
      var layers = [];

      arrayUtils.forEach(featureCollection.layers, lang.hitch(this, function (layer) {
        var infoTemplate = new InfoTemplate("Details", "${*}");
        var featureLayer = new FeatureLayer(layer, {
          infoTemplate: infoTemplate
        });
        
        this.arrayFeatureLayer.push(featureLayer);
        //associate the feature with the popup on click to enable highlight and zoom to
        featureLayer.on('click', function (event) {
          this.map.infoWindow.setFeatures([event.graphic]);
        });
        //change default symbol if desired. Comment this out and the layer will draw with the default symbology
        this.changeRenderer(featureLayer);
        fullExtent = fullExtent ?
          fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
        layers.push(featureLayer);
      }));
      this.map.addLayers(layers);
      this.map.setExtent(fullExtent.expand(1.25), true);

      this.uploadstatus.innerHTML = "";
    },

    changeRenderer: function (layer) {
      //change the default symbol for the feature collection for polygons and points
      var symbol = null;
      switch (layer.geometryType) {
        case 'esriGeometryPoint':
          symbol = new PictureMarkerSymbol({
            'angle': 0,
            'xoffset': 0,
            'yoffset': 0,
            'type': 'esriPMS',
            'url': 'http://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png',
            'contentType': 'image/png',
            'width': 20,
            'height': 20
          });
          break;
        case 'esriGeometryPolygon':
          symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
              new Color([112, 112, 112]), 1), new Color([136, 136, 136, 0.25]));
          break;
      }
      if (symbol) {
        layer.setRenderer(new SimpleRenderer(symbol));
      }
    }

  });
});
