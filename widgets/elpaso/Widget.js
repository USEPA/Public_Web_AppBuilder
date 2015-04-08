
define(['dojo/_base/declare', 
    'jimu/BaseWidget',
    'dojox/layout/FloatingPane',
    'dojo/_base/lang','dojo/on',
    'dojo/dom-construct' ,
    './oneService',
    'esri/request'   
    ],
function(declare, BaseWidget,FloatingPane,lang,on,domConstruct,_oneService,esriRequest) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // Custom widget code goes here 

 
    baseClass: 'jimu-widget-elpaso',
    
    //this property is set by the framework when widget is loaded.
     name: 'elpaso',


//methods to communication with app container:

     postCreate: function() {
	//add logo
	this.imageNode.src = this.folderUrl + "images/elpaso_logo.png";



//add layer
if (this.map.getLayer("imageLayer_" + this.id)) {
            this.imageLayer = this.map.getLayer("imageLayer_" + this.id);
        } else {
            this.imageLayer = new esri.layers.GraphicsLayer({ id: "imageLayer_" + this.id });
            var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CROSS, 14, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 255]), 2), new dojo.Color([255, 0, 255, 1.0]));
            var rd = new esri.renderer.SimpleRenderer(symbol);
            rd.label = "Click Point";
            this.imageLayer.setRenderer(rd);
            this.map.addLayer(this.imageLayer);
        }


     var wobj = this;
//add local config, local config used to hide config settings from widget setup UI.
    var layersRequest = esriRequest({
    url: wobj.folderUrl + "configLocal.json",
    content: { f: "json" },
    handleAs: "json",
    callbackParamName: "callback"
  });
  layersRequest.then(
    function(response) {     
      wobj.config = response;
     

        //add widget id to each entry so unique across all widget instances and overwrite default config
        var voClone = {}
        for (var eview in wobj.config.viewobject) {
          var robj = wobj.config.viewobject[eview];
          voClone[wobj.id + "_" + eview] = robj;        
        }
        wobj.config.viewobject = voClone;
        
        var viewobject = wobj.config.viewobject;

        for (var eview in viewobject) {
          var robj = viewobject[eview];
          var sNode = new _oneService({ id: eview, svcobj: robj, vimgwg: wobj });
          sNode.placeAt(wobj.chkboxNode);

        }       

  }, function(error) {     
      alert("Error reading configuration");
  }); 	

     },

   startup: function() {

    this.currentgraphic = null;
        this.vieworder = [];
        for (var j = 1; j < 5; j++) {
            this.vieworder["view" + j] = false;
        }    
   },
    onOpen: function(){
    this.toggleevent(true);
    },
    onClose: function(){
        this.toggleevent(false);
    },
    // onMinimize: function(){
    //   console.log('onMinimize');
    // },

     //onMaximize: function(){

       //console.log('onMaximize');
     //},

    // onSignIn: function(credential){
    //   /* jshint unused:false*/
    //   console.log('onSignIn');
    // },

    // onSignOut: function(){
    //   console.log('onSignOut');
    // }
      
    //onPositionChange: function(){
    //   console.log('onPositionChange');

    //},

    // resize: function(){
    //   console.log('resize');

    // }

_tboxpress: function (event) {
        if (event.keyCode == 13) {
                this._searchGeo();
                return false;
            }
 },
_searchGeo: function () {
        var svalue = this.get("geoTextNode").value;
            svalue = dojo.trim(svalue);
            var llPattern = /^-?\d{1,2}(\.\d+|),\s?-?\d{1,3}(\.\d+|)$/g;

            if (llPattern.test(svalue)) {
                svalue = svalue.replace(/\s/g, "");
                var inputSR = new esri.SpatialReference({ wkid: 4326 });
                var lat = svalue.split(",")[0];
                var lon = svalue.split(",")[1];
                var pntgeom = new esri.geometry.Point(parseFloat(lon), parseFloat(lat), inputSR);
                var mgeom = esri.geometry.geographicToWebMercator(pntgeom);
                this.map.centerAndZoom(mgeom, 14);
                this.showview(pntgeom);
            } else {
                alert("Invalid latitude,longitude pair");               
            }

    },
     clickMap: function (e) {
            var clickpnt = e.mapPoint;
            var spoint = e.screenPoint;
            var geopnt = esri.geometry.webMercatorToGeographic(clickpnt);
            this.showview(geopnt);
        },
    showview: function (gpnt) {
        	var viewobject = this.config.viewobject;
            this.imageLayer.clear();
            var mgeom = esri.geometry.geographicToWebMercator(gpnt);
            var lat = gpnt.y.toFixed(6);
            var lon = gpnt.x.toFixed(6);
            var pointstr = "Point of interest: " + lat + ", " + lon;
            this.decNode.innerHTML = pointstr;
            this.geoTextNode.value = lat + ", " + lon;
            var showpin = false;            
            var frm = this.viewform;

            var pcount = 0;
            for (var k = 0; k < frm.viewtype.length; k++) {
                if (frm.viewtype[k].checked) {
                    pcount = pcount + 1;
                    var viewvalue = frm.viewtype[k].value;                                     
                    var pid = viewobject[viewvalue].pid;
                    this.popupview(viewvalue, lat, lon, pid, pcount);
                    showpin = true;
                }
            }
            if (showpin) {

                var graphic = new esri.Graphic(mgeom);
                this.imageLayer.add(graphic);
                this.currentgraphic = graphic;
            } else {
                alert("Please check at least one checkbox to see image view.");
            }
        },
        popupview: function (pname, lat, lon, cid, pindex) {
            
            var viewobject = this.config.viewobject;
            this.vieworder["view" + pindex] = true;
            viewobject[pname].order = pindex;
            var baseurl = viewobject[pname].baseurl;      
            var popurl = baseurl + "lat=" + lat + "&lon=" + lon;
            var order = parseInt(cid);
            var startleft = 300;
            var starttop = 50;
            var dwidth = 410;
            var dheight = 350;
            var pl = pindex;
            var pt = 0;
            if (pindex > 2) {
                pl = pindex - 2;
                pt = 1;
            }
            var leftx = (pl - 1) * dwidth + startleft;
            var topy = pt * dheight + starttop;
            //alert(pindex + "; " + cid + ": " + leftx + ", " + topy);
            viewobject[pname].left = leftx;
            viewobject[pname].top = topy;
            var paneid = "popupdiv" + cid + "_" + this.id;
            if (dojo.byId(paneid)) {
                dijit.byId(paneid).show();
                dojo.byId(paneid).style.left = leftx + "px";
                dojo.byId(paneid).style.top = topy + "px";

                document.getElementById('popframe' + cid + "_" + this.id).src = popurl;

            } else {
                var vtitle = viewobject[pname].desc;

                var fwidth = viewobject[pname].width;
                var fheight = viewobject[pname].height;
                var zIndex = 200 + order;

                var div = document.createElement("div");
                div.id = paneid;


                document.body.appendChild(div);

                var stylestr = "position: absolute; padding:0; left: " + leftx + "px; top: " + topy + "px; visibility:visible; width: " + fwidth + "px; background-color: White; height: " + fheight + "px; z-index: " + zIndex + ";";


                var tmp = new FloatingPane({
                    title: vtitle,
                    closable: false,
                    resizable: true,
                    dockable: false,
                    id: paneid,
                    style: stylestr
                }, dojo.byId(paneid));
                tmp.startup();
	
         

                var qtitlestr = '#' + paneid + ' .dojoxFloatingPaneTitle';
                var titlePane = dojo.query(qtitlestr)[0];
                //add close button to title pane
                var closeDiv = domConstruct.create("div", {
                    className: "closeClass",
                    innerHTML: "<img  src='" + this.folderUrl + "images/close.png'  alt='close'/>"
                }, titlePane);

                on(closeDiv, "click", lang.hitch(this, this._closeImageView, paneid, cid));


                var qcontentstr = '#' + paneid + ' .dojoxFloatingPaneContent';
                var qcontentPane = dojo.query(qcontentstr)[0];
                var paneDiv = domConstruct.create("iframe", {
                    id: "popframe" + cid + "_" + this.id,
                    width: "100%",
                    height: "96%",
                    frameborder: "0",
                    src: popurl

                }, qcontentPane);




            }


	
        },
        _closeImageView: function (panid, boxid) {
           
            var viewobject = this.config.viewobject;
            var boxnum = parseInt(boxid);           
            var frm = this.viewform;
            frm.viewtype[boxnum].checked = false;
            var viewvalue = frm.viewtype[boxnum].value;
            var o = viewobject[viewvalue].order;
            this.vieworder["view" + o] = false;
            this._restorePane(panid, viewvalue);
            dijit.byId(panid).hide();
            var showPoint = false;
            for (var j = 1; j < 5; j++) {
                if (this.vieworder["view" + j] == true) {
                    showPoint = true;
                    break;
                }
            }
            if (showPoint == false) {
                if (this.map.getLayer("imageLayer_" + this.id)) this.map.getLayer("imageLayer_" + this.id).clear();
                this.currentgraphic = null;
                this.decNode.innerHTML = "";
                this.geoTextNode.value = "";
            }
        },
_restorePane: function (paneid, eview) {
            var viewobject = this.config.viewobject;
            if (dojo.byId(paneid)) {
                var leftx = viewobject[eview].left;
                var topy = viewobject[eview].top;
                var fwidth = viewobject[eview].width;
                var fheight = viewobject[eview].height;
                dojo.byId(paneid).style.top = topy + "px";
                dojo.byId(paneid).style.left = leftx + "px";
                dojo.byId(paneid).style.width = fwidth + "px";
                dojo.byId(paneid).style.height = fheight + "px";

            }
        },
    toggleevent: function (status) {           
            var viewobject = this.config.viewobject;
            if (status) {
                this.viewimageclick = on(this.map, "click", lang.hitch(this, this.clickMap));                
                 var frm = this.viewform;
                for (var k = 0; k < frm.viewtype.length; k++) {
                    var chkvalue = frm.viewtype[k].value;
                    var vi = viewobject[chkvalue].visible;
                    frm.viewtype[k].checked = vi;

                }

            } else {
                this.viewimageclick.remove();

                this.closeWidget();
            }
        },
        restorePaneSize: function () {            
            var viewobject = this.config.viewobject;
             for (var eview in viewobject) {
                var cid = viewobject[eview].pid;
                var paneid = "popupdiv" + cid + "_" + this.id;
                if (dojo.byId(paneid)) {
                    var leftx = viewobject[eview].left;
                    var topy = viewobject[eview].top;
                    var fwidth = viewobject[eview].width;
                    var fheight = viewobject[eview].height;
                    dojo.byId(paneid).style.top = topy + "px";
                    dojo.byId(paneid).style.left = leftx + "px";
                    dojo.byId(paneid).style.width = fwidth + "px";
                    dojo.byId(paneid).style.height = fheight + "px";

                }
            }
        },        
        closeWidget: function () {
            this.restorePaneSize();
            this.togglesel();
        },
    togglesel: function () {	
        
         var frm = this.viewform;
        for (var k = 0; k < frm.viewtype.length; k++) {
            var paneid = "popupdiv" + k + "_" + this.id;
            if (dojo.byId(paneid)) dijit.byId(paneid).hide();
            frm.viewtype[k].checked = false;

        }
        for (var j = 1; j < 5; j++) {
            this.vieworder["view" + j] = false;
        }
        if (this.map.getLayer("imageLayer_" + this.id)) this.map.getLayer("imageLayer_" + this.id).clear();
        this.currentgraphic = null;
        this.decNode.innerHTML = "";
        this.geoTextNode.value = "";

    }

  });
});

