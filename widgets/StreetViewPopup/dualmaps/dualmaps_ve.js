// Dual Maps version 5.00
// Copyright (c) www.mapchannels.com 2008 - 2013
var map = null;
var vx = 0;
var vy = 0;
var vz = 0;
var vm = 0;
var sx = null;
var sy = null;
var bz = 0;
var bd = VEOrientation.North;
var mapType = 0;
var shape = null;
var mousewheelScroll = 1;
var autoBirdseye = 1;
var birdsEyeZoomLevel = 18;
var defaultMapStyle = VEMapStyle.Hybrid;
var defaultBirdseyeMapStyle = VEMapStyle.BirdseyeHybrid;
var mapStyleIds = [VEMapStyle.Road, VEMapStyle.Aerial, VEMapStyle.Hybrid];
var birdseyeMapStyleIds = [VEMapStyle.Birdseye, VEMapStyle.BirdseyeHybrid];
var mapWidth = 0;
var mapHeight = 0;
var markerX = 0;
var markerY = 0;
var markerImage = "";
var markerVisible = true;
var markerTitle = null;
var markerDescription = null;
var timeCreated = 0;
var marker = null;
var pegmanMarker = null;

function eid(id) {
    return document.getElementById(id);
};

function getParams() {
    var queryString = document.location.search.substring(1);
    var parameters = [];
    var fields = queryString.split("&");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var ix = field.indexOf("=");
        if (ix > 0) {
            var parameterName = field.substr(0, ix);
            var parameterValue = "";
            if (ix < field.length - 1) {
                parameterValue = field.substr(ix + 1);
                parameters[parameterName] = parameterValue;
            }
        }
    }
    var sh = null;
    if (parameters["lng"]) vx = parseFloat(parameters["lng"]);
    if (parameters["lat"]) vy = parseFloat(parameters["lat"]);
    if (parameters["z"]) vz = parseInt(parameters["z"]);
    if (parameters["slng"]) sx = parseFloat(parameters["slng"]);
    if (parameters["slat"]) sy = parseFloat(parameters["slat"]);
    if (parameters["sh"]) sh = parseInt(parameters["sh"]);
    if (parameters["bz"]) bz = parseInt(parameters["bz"]);
    if (parameters["mi"]) markerImage = parameters["mi"];
    if (parameters["mv"]) markerVisible = parseInt(parameters["mv"]);
    if (parameters["mw"]) mousewheelScroll = parseInt(parameters["mw"]);
    if (parameters["be"]) autoBirdseye = parseInt(parameters["be"]);
    if (sh != null) {
        bd = Math.floor((sh + 45) / 90);
        while (bd < 0) {
            bd += 4;
        }
        while (bd >= 4) {
            bd -= 4;
        }
    }
    var bm = 0;
    if (parameters["bm"]) bm = parseInt(parameters["bm"]);
    defaultMapStyle = mapStyleIds[bm];
    if (!defaultMapStyle) defaultMapStyle = mapStyleIds[0];
    defaultBirdseyeMapStyle = birdseyeMapStyleIds[1];
    if (!defaultBirdseyeMapStyle) defaultBirdseyeMapStyle = birdseyeMapStyleIds[0];
    if (markerImage) {
        if (markerImage.length == 1) {
            var l = parseInt(markerImage);
            var c = "http://maps.google.com/mapfiles/ms/micons/";
            switch (l) {
                case 2:
                    c += "green-dot.png";
                    break;
                default:
                    c += "red-dot.png";
                    break;
                case 3:
                    c += "yellow-dot.png";
                    break;
                case 4:
                    c += "blue-dot.png";
                    break;
            }
            markerImage = c;
        }
    } else {
        markerImage = "http://maps.google.com/mapfiles/ms/micons/red-dot.png";
    }
};

function changeMapStyleHandler() {
    var style = map.GetMapStyle();
    if (style == VEMapStyle.Birdseye || style == VEMapStyle.BirdseyeHybrid) {
        defaultBirdseyeMapStyle = style;
    } else {
        defaultMapStyle = style;
    }
};

function changeBirdseyeHandler(a) {
    if (a) {
        bd = a.birdseyeSceneOrientation;
    }
};

function mousewheelHandler() {
    return true;
};

function setVEpos(y, x, z, d, m, j, k) {
    vx = x;
    vy = y;
    vz = z;
    vm = m;
    if (!map) {
        return;
    }
    var loc = new VELatLong(y, x);
    if (k) {
        var f = d;
        if (d != null) {
            f = VEOrientation.North;
            switch (d) {
                case 1:
                    f = VEOrientation.East;
                    break;
                case 2:
                    f = VEOrientation.South;
                    break;
                case 3:
                    f = VEOrientation.West;
                    break;
            }
        }
        bd = f;
    }
    var bz = (z > birdsEyeZoomLevel) ? 2 : 1;
    var style = map.GetMapStyle();
    if (style == VEMapStyle.Birdseye || style == VEMapStyle.BirdseyeHybrid) {
        if (z < birdsEyeZoomLevel && (!j)) {
            map.SetMapStyle(defaultMapStyle);
            map.SetCenterAndZoom(loc, z);
        } else {
            map.SetBirdseyeScene(loc, bd, bz);
        }
    } else {
        if (j) {
            map.SetBirdseyeScene(loc, bd, bz);
        } else {
            map.SetCenterAndZoom(loc, z);
        }
    }
};

function setVEStreetPos(y, x, heading, visible) {
    var pt = new VELatLong(y, x);
    if (visible) {
        if (!pegmanMarker) {
            pegmanMarker = new VEShape(VEShapeType.Pushpin, new VELatLong(y, x));
            var icon = new VECustomIconSpecification();
            icon.Image = "http://maps.gstatic.com/mapfiles/cb/man_arrow-0.png";
            icon.ImageOffset = new VEPixel(16, 16);
            pegmanMarker.SetCustomIcon(icon);
            map.AddShape(pegmanMarker);
        } else {
            var pts = [pt];
            pegmanMarker.SetPoints(pts);
            pegmanMarker.Show();
        }
    } else {
        if (pegmanMarker) {
            pegmanMarker.Hide();
        }
    }
};

function createPlaceMarker(y, x, image, visible) {
    if (visible) {
        if (map) {
            var pt = new VELatLong(y, x);
            if (marker) {
                marker.SetPoints(pt);
            } else {
                marker = new VEShape(VEShapeType.Pushpin, pt);
                var icon = new VECustomIconSpecification();
                icon.Image = image;
                marker.SetCustomIcon(icon);
                map.AddShape(marker);
            }
        } else {}
    }
};

function GetVEMapType() {
    var g = 0;
    for (var i in mapStyleIds) {
        if (defaultMapStyle == mapStyleIds[i]) {
            g = i;
        }
    }
    return g;
};

function getWindowSize() {
    if (navigator.userAgent.indexOf("MSIE") != -1) {
        mapWidth = parseInt(document.documentElement.clientWidth);
        mapHeight = parseInt(document.documentElement.clientHeight);
    } else {
        mapWidth = parseInt(window.innerWidth);
        mapHeight = parseInt(window.innerHeight);
    }
};

function resizePage() {
    getWindowSize();
    var mapDiv = eid("mapDiv");
    if (mapDiv && mapHeight > 0) {
        mapDiv.style.width = mapWidth + "px";
        mapDiv.style.height = mapHeight + "px";
        if (map) {
            var loc = map.GetCenter();
            map.Resize(mapWidth, mapHeight);
            map.SetCenter(loc);
        }
    }
    var termsDiv = eid("termsDiv");
    if (termsDiv) {
        var x = 84;
        var y = mapHeight - 14;
        termsDiv.style.display = "block";
        termsDiv.style.zIndex = 10000;
        termsDiv.style.left = x + "px";
        termsDiv.style.top = y + "px";
        if (!termsDiv.innerHTML) {
            termsDiv.innerHTML = "<a style='color:gray; font-size:10px; font-family:arial' target='_blank' href='http://www.microsoft.com/maps/product/terms.html' title='Terms of Use'>Terms of Use</a>";
        }
    }
};
var startTime = new Date();

function initPage() {
    startTime = new Date();
    getWindowSize();
    if (mapHeight > 0) {} else {
        setTimeout("initPage();", 50);
        return;
    }
    getParams();
    resizePage();
    map = new VEMap("mapDiv");
    var centre = new VELatLong(vy, vx);
    var options = new VEMapOptions();
    map.LoadMap(centre, vz, defaultMapStyle, false, VEMapMode.Mode2D, false, 1, options);
    map.AttachEvent("onchangemapstyle", changeMapStyleHandler);
    if (!mousewheelScroll) {
        map.AttachEvent("onmousewheel", mousewheelHandler);
    }
    map.AttachEvent("onobliquechange", changeBirdseyeHandler);
    createPlaceMarker(vy, vx, markerImage, markerVisible);
    setTimeout("initPage2()", 125);
};

function initPage2() {
    setVEpos(vy, vx, vz, bd, vm, autoBirdseye, true);
    if (sy != null && sy != null) {
        setVEStreetPos(sy, sx, bd, true);
    }
};

function glog(a) {
    if (typeof(console) != "undefined" && console && console.log) {
        var r = new Date();
        var o = r - startTime;
        console.log("ve[" + o + "] : " + a);
    }
}