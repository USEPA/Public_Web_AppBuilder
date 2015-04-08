define(['dojo/_base/declare', 'jimu/BaseWidget', 'esri/tasks/GeometryService', 'esri/tasks/ProjectParameters', 'esri/SpatialReference',
        'esri/graphic', 'esri/symbols/SimpleMarkerSymbol'],
function(declare, BaseWidget, GeometryService, ProjectParameters, SpatialReference,
         Graphic, SimpleMarkerSymbol) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here 
    
    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-demo',

    name: 'StreetViewPopup',
	
    postCreate: function () {
      //this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function () {
        
        this.inherited(arguments);
      geoService = new GeometryService('"' + this.config.geomService + '"');
     
      console.log('startup');
    },
  
    onOpen: function () {
	var _popWidth = this.config.popWidth;
	var _popHeight = this.config.popHeight;
	var _symbolStyle = this.config.symbolStyle;
	var _symbolColor = this.config.symbolColor;
	var _symbolSize = this.config.symbolSize;
	var _popScroll = this.config.popScroll;
	var _panel = this.config.panel;
	var _gm = this.config.gm;
	var _bm = this.config.bm;
	var _md = this.config.md;
	var _mi = this.config.mi;

	this.map.setInfoWindowOnClick(false);    // added this to fix popup issue
        this.map.setMapCursor("pointer");
        //wire up map on click event
        mapClick = this.map.on("click", myClick);
        //fired when user clicks on map
        function myClick(evt) {
		
		
            this.graphics.clear();

            var x, y, point, pPoint;
            var outSR = new SpatialReference(4326);
            point = evt.mapPoint;
            //alert(point.x);

            var symbol = new SimpleMarkerSymbol().setStyle(_symbolStyle);
            symbol.setColor(_symbolColor);
            symbol.setSize(_symbolSize);

            var gclick = new Graphic(point, symbol);
            //this.mapIdNode.graphics.Add(gclick);
            this.graphics.add(gclick);

            var geoPoint = esri.geometry.webMercatorToGeographic(evt.mapPoint);
            //alert(geoPoint.x);

            var dMap = document.getElementById('dualMap');
            var path = "widgets/StreetViewPopup/dualmaps/streetmap.html?lat=" + geoPoint.y + "&lng=" + geoPoint.x + "&panel=" + _panel + "&gm=" + _gm + "&mi=" + _mi;
            dMap.innerHTML = '<iframe id="dMaps" style="width:' + _popWidth + 'px;height:' + _popHeight + 'px; padding:0px" src="' + path + '" marginwidth="0" marginheight="0" frameborder="0"></iframe>';

            dMap.style.visibility = 'visible';

            return point;
        }
      console.log('onOpen');
    },

    onClose: function () {
        this.map.setMapCursor("default");
        this.map.graphics.clear();
        mapClick.remove();
        //alert("no click");
		this.map.setInfoWindowOnClick(true);    // added this to fix popup issue
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    }
  });
});