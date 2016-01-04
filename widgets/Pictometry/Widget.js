
define([
    "dojo/_base/declare",
  "jimu/BaseWidget",
  "dijit/form/ToggleButton",
  "dojo/dom",
  "dijit/registry",
  "dijit/form/Button",
  "dojo/on",
  "dojo/aspect",
  "esri/tasks/GeometryService",
  "esri/geometry/Geometry",
  "esri/geometry/Point",
  "esri/tasks/ProjectParameters",
  "esri/map"
   

],
function (declare, BaseWidget, ToggleButton, dom, registry, Button, on, aspect, GeometryService, Geometry, Point, ProjectParameters, map) {
    var handlerPictometry = {advice: null};

    var clazz = declare([BaseWidget], 


{
      templateString: '<div> <br /> <br />Click the "Select" Pictometry button to activate, then click on a point of interest on the map to display Pictometry imagery for this location in a new window.  <br /> <br /> <br /> ' +
            '<input type="button" style="background-color: rgb(125,125,125)!important; background: url(./widgets/Pictometry/images/icon.png) no-repeat;"  class="jimu-btn" id="btnPict" value=" &nbsp;&nbsp;&nbsp; Select" data-dojo-attach-event="click:_pictometryClick"> <br /> <br /> <br /></div> ',

      //handlerPictometry: '',

            _pictometryClick: function () {

            pictometryCloudURL = this.config.configText;
            map = this.map;
//         esri geometry service
            var EsrigeometryService = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
            // I recommend you set up your own geometry service and server //////


            //handlers 
            if (!handlerPictometry.advice) {

                //map.setMapCursor("crosshair");
                                map.setMapCursor("url(widgets/Pictometry/images/pictometryCursor.cur),auto");

                handlerPictometry = map.on("click", function (evt) {
                    
                    if (map.spatialReference.wkid === 102100 || map.spatialReference.wki === 3857 || map.spatialReference.wki === 102113) {
                         pt = esri.geometry.webMercatorToGeographic(evt.mapPoint);
                    var url = pictometryCloudURL + 'lat=' + pt.y + '&lon=' + pt.x;
                    window.open(url);
                    } else {
                        //convert to Geographic from current map projection
                    var outSR = new esri.SpatialReference({
                            wkid: 4326
                        });
                        var inLat = evt.mapPoint.y;
                        var inLon = evt.mapPoint.x;
                        var inSR = map.spatialReference;
                        var inputpoint = new Point(inLon, inLat, inSR);
                        var PrjParams = new ProjectParameters();
                        PrjParams.geometries = [inputpoint];
                        PrjParams.outSR = outSR;
                        EsrigeometryService.project(PrjParams, function (outputpoint) {
                            pt = outputpoint[0];
                            var url = pictometryCloudURL + 'lat=' + pt.y + '&lon=' + pt.x;
                            window.open(url);
                        });

                    };//end of else for wkids other than web mercator
                    /// remove after one click
                    //     handlerPictometry.remove();
                    map.setMapCursor("default");
                    Pict = false;
                    ////remove after one click
                    handlerPictometry.remove();
                    handlerPictometry.advice = null; //hm, should we disable after one click and re-wire other handlers? Revisit later..
                });

            };  /// end else for handlerPictometry

            /////  end of pictometry widget
            /////
        },

        startup: function () {
            this.inherited(arguments);
        },

        onClose:
    function () {
        this.inherited(arguments);
        map = this.map;
        map.setMapCursor("default");
        handlerPictometry.remove();
        handlerPictometry.advice = null;
    }
    });

    clazz.hasStyle = true;
    clazz.hasUIFile = false;
    clazz.hasLocale = false;
    clazz.hasConfig = true;
    return clazz;
});