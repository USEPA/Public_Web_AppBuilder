define(['dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', 'jimu/BaseWidget', 
        'dojo/_base/array', 'dojo/data/ObjectStore', 'dojo/store/Memory',
        "dijit/form/Select"],
function(declare, _WidgetsInTemplateMixin, BaseWidget, array, ObjectStore, Memory, Select) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    // DemoWidget code goes here 
      baseClass: 'dtc-ImageSelect',
      imageServices: [],
      startup: function(){
          
          //stub for future canvas support
//          if (this.config.enableCanvas) {
//          
//          } 
          if (this.map.loaded) {
              this.init();
          } else {
              this.map.on('load', lang.hitch(this, this.init))
          }

      },
      init: function() {
          var _self = this;
        if (this.config.enableCanvas) {
          console.log('canvas');
        } else {
            array.forEach(this.map.layerIds, function(layerId, i) {
                var thisLayer = _self.map.getLayer(layerId);
                if (thisLayer.declaredClass === "esri.layers.ArcGISImageServiceLayer") {
                    _self.imageServices.push({
                        label : thisLayer.arcgisProps.title,
                        id : thisLayer.id
                    });
                    
				}
            });
            var store = new Memory({
                data : this.imageServices
            });
            var os = new ObjectStore({
                objectStore : store
            });
            this.imageSelect.setStore(os /*, this.imageServices[0]*/);
            this.publishData();

            //Hook in event publishers for change
            this.imageSelect.on("change", function(newValue){
                _self.selectionChanged();
                console.log('published');
            });
        }
      },
      selectionChanged: function() {
        this.publishData({
            'target':'ImageAnalysis',
            'serviceId':this.imageSelect.get('value')
        });
      },
      onReceiveData: function(name, source, params) {
          if(params && params.request && params.target === 'ImageSelect') {
              switch(params.request) {
                  case "imageService":
                      this.selectionChanged();
                      break;
              }
          }
      }
  });
});