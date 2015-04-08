// Dual Maps version 5.00
// Copyright (c) www.mapchannels.com 2008 - 2013
var dm5 = null;
var map = null;
var pan = null;
var defaultLng = -122.388581;
var defaultLat = 37.789536;
var defaultZoom = 18;

function DM5() {
    this.ar = 0;
    this.aD = 0;
    this.ap = defaultLat;
    this.aq = defaultLng;
    this.bj = defaultZoom;
    this.bv = 0;
    this.bG = 0;
    this.at = null;
    this.as = null;
    this.ac = null;
    this.bm = 0;
    this.bk = 0;
    this.bz = "";
    this.M = true;
    this.af = true;
    this.ag = "1";
    this.K = "";
    this.G = "";
    this.L = "";
    this.U = 1;
    this.Q = 1;
    this.dD = 0;
    this.dB = null;
    this.dz = null;
    this.C = true;
    this.o = true;
    this.t = true;
    this.B = false;
    this.aX = "Find Address";
    this.bu = 'http://www.mapchannels.com/DualMaps.aspx';
    this.aY = false;
    this.bl = false;
    this.bt = [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN];
    this.an = null;
    this.aB = false;
    this.I = null;
    this.aU = null;
    this.aw = null;
    this.aM = null;
    this.al = null;
    this.aA = null;
    this.aG = null;
};

function initPage() {
    if (!dm5) {
        dm5 = new DM5();
    }
    dm5.aV();
    if (dm5.aD > 0) {
        dm5.F();
    } else {
        setTimeout("initPage();", 50);
    }
};
DM5.prototype.F = function() {
    this.cC();
    this.dk();
    var bp = this.bz;
    if (bp == "") {
        this.bB();
    } else {
        if (!this.I) {
            this.I = new google.maps.Geocoder();
        }
        this.I.geocode({
            address: bp
        }, function(T, O) {
            if (O == google.maps.GeocoderStatus.OK) {
                var ad = T[0];
                var pt = ad.geometry.location;
                dm5.ap = pt.lat();
                dm5.aq = pt.lng();
                glog("geocoder found address @ " + pt);
                dm5.bB();
            } else {
                alert("Error, unable to find " + bp);
            }
        });
    }
};
DM5.prototype.bB = function() {
    var pt = new google.maps.LatLng(this.ap, this.aq);
    this.cI(pt);
    var j = null;
    if (this.at || this.as) {
        j = new google.maps.LatLng(this.at, this.as);
    } else {
        j = pt;
    }
    this.aC(this.o, j, this.ac, this.bm, this.bk);
    var dq = {
        point: pt,
        name: "Location",
        description: "",
        markerUrl: this.K
    };
    this.D = new Place(dq);
    this.D.cG();
};
DM5.prototype.cC = function() {
    var da = document.location.search.substring(1);
    var g = [];
    var cg = da.split("&");
    for (var i = 0; i < cg.length; i++) {
        var aJ = cg[i];
        var ix = aJ.indexOf("=");
        if (ix > 0) {
            var dh = aJ.substr(0, ix);
            var bO = "";
            if (ix < aJ.length - 1) {
                bO = aJ.substr(ix + 1);
                g[dh] = bO;
            }
        }
    }
    var cq = g["x"];
    if (cq) {
        this.aq = parseFloat(cq);
    }
    var cz = g["y"];
    if (cz) {
        this.ap = parseFloat(cz);
    }
    var bS = g["mg"];
    if (bS) {
        this.M = parseInt(bS);
    }
    var bU = g["mt"];
    if (bU) {
        this.G = bU;
    }
    var cy = g["svb"];
    if (cy) {
        this.ac = parseFloat(cy);
    }
    var cv = g["svp"];
    if (cv) {
        this.bm = parseFloat(cv);
    }
    var cw = g["svz"];
    if (cw) {
        this.bk = parseFloat(cw);
    }
    var bL = g["lng"];
    if (bL) {
        this.aq = parseFloat(bL);
    }
    var ce = g["lat"];
    if (ce) {
        this.ap = parseFloat(ce);
    }
    var co = g["z"];
    if (co) {
        this.bj = parseInt(co);
    }
    var cx = g["slng"];
    if (cx) {
        this.as = parseFloat(cx);
    }
    var ck = g["slat"];
    if (ck) {
        this.at = parseFloat(ck);
    }
    var cl = g["sh"];
    if (cl) {
        this.ac = parseFloat(cl);
    }
    var ct = g["sp"];
    if (ct) {
        this.bm = parseFloat(ct);
    }
    var cn = g["sz"];
    if (cn) {
        this.bk = parseFloat(cn);
    }
    var bK = g["gm"];
    if (bK) {
        this.bv = parseInt(bK);
    }
    var bY = g["bm"];
    if (bY) {
        this.bG = parseInt(bY);
    }
    var bT = g["mw"];
    if (bT) {
        this.U = bT > 0 ? true : false;
    }
    var cb = g["be"];
    if (cb) {
        this.Q = cb > 0 ? true : false;
    }
    var bV = g["bef"];
    if (bV) {
        this.aY = bV > 0 ? true : false;
    }
    var bR = g["ni"];
    if (bR) {
        this.bl = bR > 0 ? true : false;
    }
    var ao = g["panel"];
    if (ao) {
        this.C = ao.indexOf("m") > -1 ? true : false;
        this.o = ao.indexOf("s") > -1 ? true : false;
        this.t = ao.indexOf("b") > -1 ? true : false;
        this.B = ao.indexOf("i") > -1 ? true : false;
    }
    if (this.bl) {
        this.B = false;
    }
    var bJ = g["mv"];
    if (bJ) {
        this.M = parseInt(bJ);
    }
    var bI = g["md"];
    if (bI) {
        this.af = parseInt(bI);
    }
    var aa = g["mi"];
    if (aa) {
        if (aa.length == 1) {
            this.ag = aa;
            var cH = parseInt(aa);
            var am = "http://maps.google.com/mapfiles/ms/micons/";
            switch (cH) {
                case 2:
                    am += "green-dot.png";
                    break;
                default:
                    am += "red-dot.png";
                    break;
                case 3:
                    am += "yellow-dot.png";
                    break;
                case 4:
                    am += "blue-dot.png";
                    break;
            }
            this.K = am;
        } else if (aa.length > 1) {
            this.K = aa;
        }
    }
    if (!this.K) {
        this.K = "http://maps.google.com/mapfiles/ms/micons/red-dot.png";
    }
    var cu = g["pt"];
    if (cu) {
        this.G = unescape(cu);
    }
    var bQ = g["pd"];
    if (bQ) {
        this.L = unescape(bQ);
    }
    var bZ = g["addr"];
    if (bZ) {
        this.bz = unescape(bZ);
    }
    if (typeof(dmCreatePath) != "undefined") {
        this.bu = dmCreatePath;
    }
};
DM5.prototype.aV = function() {
    var cd = true;
    if (typeof(window.innerHeight) == "number") {
        cd = false;
    }
    if (cd) {
        this.ar = parseInt(document.documentElement.clientWidth);
        this.aD = parseInt(document.documentElement.clientHeight);
    } else {
        this.ar = parseInt(window.innerWidth);
        this.aD = parseInt(window.innerHeight);
    }
};
DM5.prototype.ah = function(ae, aP, x, y, wd, ht) {
    if (ae) {
        ae.style.left = x + "px";
        ae.style.top = y + "px";
        ae.style.width = wd + "px";
        ae.style.height = ht + "px";
        ae.style.display = aP ? "block" : "none";
    } else {}
};
DM5.prototype.dk = function() {
    var ab = eid("dmContainer");
    ab.innerHTML = "";
    this.aG = new HeaderPanel();
    this.aw = new MapPanel();
    this.aM = new StreetviewPanel();
    this.al = new BingMapPanel();
    this.aA = new InformationPanel();
    this.aG.F(ab);
    this.aw.F(ab);
    this.aM.F(ab);
    this.al.F(ab);
    this.aA.F(ab);
    this.R();
};

function resizePage() {
    if (dm5 && dm5.aR) {
        dm5.aR();
    }
};
DM5.prototype.aR = function() {
    if (map && !this.an) {
        this.an = map.getCenter();
    }
    this.aV();
    var V = 32;
    var ht = this.aD - V;
    var ht1 = Math.floor(ht / 2);
    var ht2 = ht - ht1;
    var wd = this.ar;
    var wd1 = Math.floor(wd / 2);
    var wd2 = wd - wd1;
    var aN = Math.floor(this.ar / 2);
    if (this.aG) {
        this.ah(this.aG.f, true, 0, 0, wd, V);
    }
    if (this.aM) {
        var cr = 0;
        var aQ = wd1;
        var aO = ht1;
        if (this.C) {
            if (!this.t && !this.B) {
                cr = wd1;
                aQ = wd2;
                aO = ht;
            }
        } else {
            aO = ht;
            if (!this.t && !this.B) {
                aQ = wd;
            }
        }
        this.ah(this.aM.f, this.o, cr, V, aQ, aO);
        if (this.o && pan) {
            pan.setVisible(true);
        } else if (pan) {
            pan.setVisible(false);
        }
    }
    if (this.aw) {
        var bH = 0;
        var bq = ht1;
        var aN = wd1;
        var bg = ht2;
        if (this.o) {
            if (!this.t && !this.B) {
                bH = 0;
                bq = 0;
                aN = wd2;
                bg = ht;
            }
        } else {
            bq = 0;
            bg = ht;
            if (!this.t && !this.B) {
                aN = wd;
            }
        }
        this.ah(this.aw.f, this.C, bH, bq + V, aN, bg);
    }
    if (this.aA) {
        var cc = wd1;
        var dp = 0;
        var cf = wd2;
        var bh = ht2;
        if (this.t) {
            if (!this.C && !this.o) {
                bh = ht;
            }
        } else {
            bh = ht;
            if (!this.C && !this.o) {
                cc = 0;
                cf = wd;
            }
        }
        this.ah(this.aA.f, this.B, cc, dp + V, cf, bh);
    }
    if (this.al) {
        var bc = wd1;
        var ba = ht1;
        var bf = wd2;
        var aT = ht1;
        if (this.B) {
            if (!this.C && !this.o) {
                bc = 0;
                ba = 0;
                bf = wd1;
                aT = ht;
            }
        } else {
            ba = 0;
            aT = ht;
            if (!this.C && !this.o) {
                bc = 0;
                bf = wd;
            }
        }
        this.ah(this.al.f, this.t, bc, ba + V, bf, aT);
    }
    if (pan) {
        google.maps.event.trigger(pan, "resize");
    }
    if (map) {
        google.maps.event.trigger(map, "resize");
    }
};
DM5.prototype.R = function() {
    var dy = this.o;
    this.C = eid("mapCheckbox").checked;
    this.o = eid("streetviewCheckbox").checked;
    if (eid("informationCheckbox")) {
        this.B = eid("informationCheckbox").checked;
    }
    if (eid("bingMapCheckbox")) {
        this.t = eid("bingMapCheckbox").checked;
    } else {
        if (!this.C && !this.o && !this.B) {
            this.t = true;
        } else {
            this.t = false;
        }
    }
    var ax = "#FFFFFF";
    var av = "#B9D3EE";
    if (eid("menuDiv1")) {
        eid("menuDiv1").style.backgroundColor = this.C ? av : ax;
    }
    if (eid("menuDiv2")) {
        eid("menuDiv2").style.backgroundColor = this.o ? av : ax;
    }
    if (eid("menuDiv3")) {
        eid("menuDiv3").style.backgroundColor = this.t ? av : ax;
    }
    if (eid("menuDiv4")) {
        eid("menuDiv4").style.backgroundColor = this.B ? av : ax;
    }
    dm5.aR();
    if (this.o && this.bw) {
        var pt = this.D.pt;
        if (!pt) {
            pt = map.getCenter();
        }
        this.bd(pt, 25, null, null, null);
        this.bw = false;
    }
    if (this.C && this.t) {
        this.au(false);
    }
};

function layoutRefresh() {
    dm5.R();
};

function HeaderPanel() {
    this.f = null;
};
HeaderPanel.prototype.F = function(J) {
    this.f = document.createElement("div");
    this.f.id = "headerDiv";
    this.f.style.position = "absolute";
    this.f.style.display = "none";
    this.f.style.backgroundColor = "white";
    this.f.style.color = "black";
    this.aH = 0;
    var ca = "";
    var cj = "";
    var bW = "";
    var bX = "";
    if (!dm5.aY) {
        bW = "<div style='float:left;padding:2px'></div>" + "<div id='menuDiv3' style='float:left;padding:4px;background-color:#E6E6FA'>" + "<input id='bingMapCheckbox' type='checkbox' " + (dm5.t ? "checked" : "") + "  onclick='layoutRefresh()' /><a style='color:black' href='javascript:clickMode(3)'>Birds Eye</a>&nbsp;" + "</div>";
        ca = "<div style='float:left;padding:2px'></div>" + "<div style='float:left;padding-top:6px;'>" + "<a href='javascript:clickMode(0)' style='color:gray'>All</a> " + "</div>";
    }
    if (!dm5.bl) {
        cj = "<div style='float:left;padding:2px'></div>" + "<div id='menuDiv4' style='float:left;padding:4px;background-color:#FFFFFF'>" + "<input id='informationCheckbox' type='checkbox' " + (dm5.B ? "checked" : "") + " onclick='layoutRefresh()' /><a style='color:black' href='javascript:clickMode(4)'>Info</a>&nbsp;" + "</div>";
    }
    if (dm5.aY) {
        bX = "<div style='float:left;padding:2px'></div>" + "<div id='menuDiv3' style='float:left;padding:6px;background-color:#E6E6FA'>" + "<a style='color:gray' href='javascript:clickMode(3)'>Birds Eye</a>&nbsp;" + "</div>";
    }
    this.f.innerHTML = "<table style='width:100%'><tr valign='top'><td>" + "<div id='menuDiv1' style='float:left;padding:4px;background-color:#E6E6FA'>" + "<a id='bookmarkLink' target='_blank' href='' style='color:dodgerblue'>Full Page</a>" + "<input id='mapCheckbox' type='checkbox' " + (dm5.C ? "checked" : "") + " onclick='layoutRefresh()' /><a style='color:black' href='javascript:clickMode(1)'>Map</a>&nbsp;" + "</div>" + "<div style='float:left;padding:2px'></div>" + "<div id='menuDiv2' style='float:left;padding:4px;background-color:#E6E6FA'>" + "<input id='streetviewCheckbox' type='checkbox' " + (dm5.o ? "checked" : "") + " onclick='layoutRefresh()' /><a style='color:black' href='javascript:clickMode(2)'>Street View</a>&nbsp;" + "</div>" + bW + cj + ca + bX + "</td><td align='right' style='width:120px'>" + "<div style='padding-top:4px;'>" + "<a id='resetLink' href='" + document.location + "' style='color:dodgerblue'>Reset</a>" + "</div>" + "</td><td align='right' style='width:210px'>" + "<input id='geocoderText' type'text' style='color:gray; width:200px'  onfocus='focusGeocoder()' onblur='unfocusGeocoder()' onkeydown='geocoderKeyDown(event)' value='" + dm5.aX + "' /> " + "</td><td align='right' style='width:40px'>" + "<input id='findButton' type='button' value='Go' onclick='findAddress()' style='color:green;width:36px' />" + "</td></tr></table>";
    J.appendChild(this.f);
};

function clickMode(a) {
    eid("mapCheckbox").checked = (a == 0 || a == 1);
    eid("streetviewCheckbox").checked = (a == 0 || a == 2);
    if (eid("bingMapCheckbox")) {
        eid("bingMapCheckbox").checked = (a == 0 || a == 3);
    }
    if (eid("informationCheckbox")) {
        eid("informationCheckbox").checked = (a == 0 || a == 4);
    }
    dm5.R();
};

function MapPanel() {
    this.f = null;
};
MapPanel.prototype.F = function(J) {
    this.f = document.createElement("div");
    this.f.id = "mapDiv";
    this.f.style.position = "absolute";
    this.f.style.display = "none";
    this.f.style.backgroundColor = "white";
    this.f.style.color = "black";
    this.aH = 0;
    J.appendChild(this.f);
};
DM5.prototype.cI = function(pt) {
    var bM = eid("mapDiv");
    var aS = this.bt[this.bv];
    if (!aS) {
        aS = google.maps.MapTypeId.ROADMAP;
    }
    var du = {
        zoom: this.bj,
        center: pt,
        mapTypeId: aS,
        scaleControl: true,
        scrollwheel: this.U,
        tilt: 0
    };
    map = new google.maps.Map(bM, du);
    this.dw();
    google.maps.event.addListener(map, "idle", function() {
        dm5.au(false);
    });
    google.maps.event.addListener(map, "bounds_changed", function() {
        if (dm5.an) {
            map.setCenter(dm5.an);
            dm5.an = null;
        }
    });
};
DM5.prototype.dw = function() {
    this.aV();
    var cR = this.ar > (468 * 2) ? true : false;
    var cK = cR ? google.maps.adsense.AdFormat.BANNER : google.maps.adsense.AdFormat.HALF_BANNER;
    var cL = google.maps.ControlPosition.BOTTOM_CENTER;
    var bM = eid("mapDiv");
    var cW = {
        publisherId: "pub-5408854154696215",
        channelNumber: "5641077154",
        format: cK,
        position: cL,
        map: map,
        visible: true,
        backgroundColor: "#FFFFFF",
        borderColor: "#FFFFFF",
        textColor: "#000000",
        titleColor: "#000088",
        urlColor: "#444488"
    };
    var cP = document.createElement('div');
    this.dF = new google.maps.adsense.AdUnit(cP, cW);
};

function StreetviewPanel() {
    this.f = null;
};
StreetviewPanel.prototype.F = function(J) {
    this.f = document.createElement("div");
    this.f.id = "panDiv";
    this.f.style.position = "absolute";
    this.f.style.display = "none";
    this.f.style.backgroundColor = "white";
    this.f.style.color = "black";
    this.aH = 0;
    J.appendChild(this.f);
};
DM5.prototype.dj = function() {
    if (!this.dn) {
        this.dn = true;
        google.maps.event.addListener(pan, "position_changed", function() {
            var pt = pan.getPosition();
            map.setCenter(pt);
            dm5.bD();
        });
        google.maps.event.addListener(pan, "visible_changed", function() {
            var pt = pan.getPosition();
            map.setCenter(pt);
            dm5.bD();
        });
        google.maps.event.addListener(pan, "pov_changed", function() {
            dm5.au(true);
        });
        google.maps.event.addListener(pan, "closeclick", function() {
            eid("streetviewCheckbox").checked = false;
            dm5.R();
        });
    }
};
DM5.prototype.aC = function(aP, cN, aL, ay, aF) {
    if (!pan) {
        var di = {
            enableCloseButton: true,
            scrollwheel: this.U
        };
        pan = new google.maps.StreetViewPanorama(eid("panDiv"), di);
        if (map) {
            map.setStreetView(pan);
        }
    }
    if (aP) {
        this.bd(cN, 25, aL, ay, aF);
    } else {
        this.bw = true;
        if (!this.aB) {
            this.aZ();
        }
    }
};
DM5.prototype.bd = function(pt, bi, aL, ay, aF) {
    if (!this.aU) {
        this.aU = new google.maps.StreetViewService();
    }
    this.aU.getPanoramaByLocation(pt, bi, function(cT, O) {
        if (O == google.maps.StreetViewStatus.OK) {
            var ds = cT.location;
            var j = ds.latLng;
            var l = aL;
            var bP = 0;
            var aE = 1;
            if (l == null) {
                l = google.maps.geometry.spherical.computeHeading(j, pt);
            } else {
                bP = ay;
                aE = aF;
            }
            pan.setPov({
                heading: l,
                pitch: bP,
                zoom: aE
            });
            pan.setPosition(j);
            map.setCenter(j);
            dm5.at = j.lat();
            dm5.as = j.lng();
            dm5.ac = l;
            dm5.dj();
            if (!dm5.aB) {
                dm5.aZ();
            }
        } else {
            if (bi < 500) {
                var de = bi < 50 ? 100 : 500;
                dm5.bd(pt, de, aL, ay, aF);
            } else {
                eid("streetviewCheckbox").checked = false;
                dm5.R();
                if (!dm5.aB) {
                    dm5.aZ();
                }
            }
        }
    });
};

function BingMapPanel() {
    this.f = null;
};
BingMapPanel.prototype.F = function(J) {
    this.f = document.createElement("div");
    this.f.id = "bingMapDiv";
    this.f.style.position = "absolute";
    this.f.style.display = "none";
    this.f.style.backgroundColor = "white";
    this.f.style.color = "black";
    this.aH = 0;
    J.appendChild(this.f);
};
var bingMap = null;
DM5.prototype.aZ = function() {
    this.aB = true;
    var cS = this.al.f;
    var url = "vemap.htm?lat=" + this.ap + "&lng=" + this.aq;
    url += "&z=" + this.bj;
    if (this.o) {
        url += "&slat=" + this.at;
        url += "&slng=" + this.as;
        if (this.ac != null) {
            url += "&sh=" + this.ac;
        }
    }
    url += "&bm=" + this.bG;
    if (this.ag) {
        url += "&mi=" + this.ag;
    } else {
        url += "&mi=" + this.K;
    }
    url += "&mv=" + (this.M ? "1" : "0");
    url += "&mw=" + (this.U ? "1" : "0");
    url += "&be=" + (this.Q ? "1" : "0");
    cS.innerHTML = "<iframe name='veFrame' id='veFrame' src='" + url + "' style='width:100%;height:100%' frameborder='0' marginwidth='0' marginheight='0' scrolling='off' ></iframe>";
};
DM5.prototype.dr = function(bx, cA, cF) {
    if (!this.I) {
        this.I = new google.maps.Geocoder();
    }
    this.I.geocode({
        address: bx
    }, function(T, O) {
        if (O == google.maps.GeocoderStatus.OK) {
            var ad = T[0];
            var pt = ad.geometry.location;
            var dg = ad.formatted_address;
            cA(pt, dg);
        } else {
            var be = "Error, unable to find " + bx;
            cF(be);
        }
    });
};

function findAddress() {
    var cJ = eid("geocoderText").value;
    dm5.dr(cJ, cbGeocoderSuccess, cbGeocoderError);
};

function cbGeocoderSuccess(pt, cX) {
    glog("cb geocoder success " + pt);
    var k = dm5.D;
    if (k) {
        k.pt = pt;
        dm5.G = cX;
        dm5.L = "";
        k.ai.setPosition(pt);
        dm5.aj();
        k.cY();
        k.bC();
        dm5.bA();
    }
    map.setCenter(pt);
    glog("cb geocoder success, dm5.aC at " + pt);
    dm5.aC(dm5.o, pt, null, null, null);
};

function cbGeocoderError(aK) {
    glog("cb geocoder error: " + aK);
};

function geocoderKeyDown(a) {
    if (a.keyCode) {
        if (a.keyCode == 13) {
            findAddress();
            return false;
        }
    }
};

function focusGeocoder() {
    var H = eid("geocoderText");
    if (H.style.color == "gray") {
        H.style.color = "black";
        if (H.value == dm5.aX) {
            H.value = "";
        }
    }
    H.select();
};

function unfocusGeocoder() {
    var H = eid("geocoderText");
    var cD = H.value;
    if (cD == "") {
        H.style.color = "gray";
        H.value = dm5.aX;
    }
};

function findGeoLocation(ak, P) {
    ak = ak || function() {};
    P = P || function() {};
    var ci = navigator.geolocation;
    if (ci) {
        try {
            function cO(cV) {
                ak(cV.coords);
            };
            ci.getCurrentPosition(cO, P, {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 60000
            });
        } catch (err) {
            glog("Error: unable to obtain geolocation");
            P();
        }
    } else {
        glog("Error: geolocation is not supported");
        P();
    }
};
DM5.prototype.dE = function(ak, P) {
    findGeoLocation(function(bE) {
        var pt = new google.maps.LatLng(bE.latitude, bE.longitude);
        glog("GeoLocation success :  " + pt);
        (ak)(pt, "");
    }, function() {
        glog("GeoLocation error");
        var be = "Unable to find your location";
        (P)(null, be);
    });
};

function cbGeolocateSuccess(pt, aK) {
    if (map) {
        map.setCenter(pt);
    }
};

function cbGeolocateError(pt, aK) {
    if (map) {
        alert(aK);
    }
    var dC = eid("geoLocateButton");
};

function Place(az) {
    this.name = az.name;
    this.description = az.description;
    this.pt = az.point;
    this.cZ = az.markerUrl;
    this.ai = null;
    this.dG = null;
    this.dx = null;
};
Place.prototype.dA = function() {
    var r = "<b>" + this.name + "</b><br/>" + this.description;
    return r;
};
Place.prototype.bC = function() {
    dm5.af = true;
    this.ai.setDraggable(true);
    this.ai.setTitle("Drag and drop marker to change location");
};
Place.prototype.cY = function() {
    dm5.M = true;
    this.ai.setVisible(true);
};
Place.prototype.cG = function() {
    var k = this;
    var bo = {
        position: this.pt,
        map: map,
        tooltip: this.name,
        icon: this.cZ
    };
    if (dm5.G) {
        bo.title = dm5.G;
    }
    bo.visible = dm5.M ? true : false;
    var bn = new google.maps.Marker(bo);
    this.ai = bn;
    if (dm5.af) {
        this.bC();
    }
    google.maps.event.addListener(bn, "dragend", function(dH) {
        k.pt = bn.getPosition();
        map.setCenter(k.pt);
        dm5.aC(dm5.o, k.pt, null, null, null);
        dm5.aj();
        dm5.bA();
        k.db();
    });
    dm5.aj();
};
Place.prototype.db = function() {
    var k = this;
    if (!dm5.I) {
        dm5.I = new google.maps.Geocoder();
    }
    dm5.I.geocode({
        'latLng': this.pt
    }, function(T, O) {
        if (O == google.maps.GeocoderStatus.OK) {
            if (T[1]) {
                var ad = T[1];
                dm5.G = ad.formatted_address;
                dm5.L = "";
                dm5.aj();
            } else {
                glog('Reverse Geocoder : No results found');
            }
        } else {
            glog('Reverse Geocoder : failed due to: ' + O);
        }
    });
};

function InformationPanel() {
    this.f = null;
};
InformationPanel.prototype.F = function(J) {
    this.f = document.createElement("div");
    this.f.id = "informationDiv";
    this.f.style.position = "absolute";
    this.f.style.display = "none";
    this.f.style.backgroundColor = "white";
    this.f.style.color = "black";
    this.aH = 0;
    this.f.innerHTML = "<div style='width:100%; height:100%; overflow-y:scroll'>" + "<div style='padding:4px'>" + "<div id='placeInfo'></div>" + "<br/>" + "<div id='streetviewInfo'></div>" + "<br/>" + "<table cellpadding=0 cellspacing=0><tr valign=top><td style='width:60px' align=center>" + "</td><td>" + "<input id='autoBirdseye' type='checkbox' " + (dm5.Q ? "checked " : "") + "' onclick='autoBirdseyeClick(this)' /> Auto Bird's Eye" + "<br/><br/>" + "<a href='javascript:zoomFit()'>Zoom Fit</a> &nbsp; " + "<a id='fullpageLink' target='_blank' href=''>Full Page Map</a> &nbsp; " + "<a id='createMapLink' href='http://www.mapchannels.com/DualMaps.aspx' target='_blank'>Create New Map</a>" + "</td></tr></table>" + "<br/><br/>" + "</div></div>";
    J.appendChild(this.f);
};
DM5.prototype.aj = function() {
    if (this.D) {
        var pt = this.D.pt;
        var r = "<table cellpadding=0 cellspacing=0><tr valign=top><td style='width:60px' align=center>" + "<div style='cursor:pointer' onclick='placeClick()'><img src='" + this.K + "' alt='' /></div>" + "</td><td>";
        if (this.G || this.L) {
            if (this.G) {
                r += "<b> " + this.G + "</b><br/>";
            }
            if (this.L) {
                r += this.L + "<br/>";
            }
            r += "<div style='height:8px'></div>";
        }
        r += "<table cellspacing=0 cellpadding=0>" + "<tr><td style='color:gray; width:80px'>lat: </td><td>" + formatFloat(pt.lat(), 6) + "&deg;</td></tr>" + "<tr><td style='color:gray'>lng: </td><td>" + formatFloat(pt.lng(), 6) + "&deg;</td></tr>" + "<tr><td style='color:gray'>zoom: </td><td>" + map.getZoom() + "</td></tr>" + "</table>";
        r += "</td></tr></table>";
        eid("placeInfo").innerHTML = r;
    }
};
DM5.prototype.bF = function() {
    var aI = eid("streetviewInfo");
    if (aI) {
        if (pan) {
            var pt = pan.getPosition();
            var v = pan.getPov();
            var r = "";
            if (pt && v && pan.getVisible()) {
                r = "<table cellpadding=0 cellspacing=0><tr valign=top><td style='width:60px' align=center>" + "<div style='cursor:pointer' onclick='streetviewClick()'><img src='http://maps.gstatic.com/mapfiles/cb/man_arrow-0.png' alt='' /></div>" + "</td><td>";
                r += "<table cellspacing=0 cellpadding=0>" + "<tr><td style='color:gray; width:80px'>lat:</td><td>" + formatFloat(pt.lat(), 6) + "&deg;</td></tr>" + "<tr><td style='color:gray'>lng:</td><td>" + formatFloat(pt.lng(), 6) + "&deg;</td></tr>" + "<tr><td style='color:gray'>heading:</td><td>" + formatFloat(v.heading, 2) + "&deg;</td></tr>" + "<tr><td style='color:gray'>pitch:</td><td>" + formatFloat(v.pitch, 2) + "&deg;</td></tr>" + "<tr><td style='color:gray'>zoom:</td><td>" + formatFloat(pan.getZoom(), 2) + "</td></tr>";
                var bs = null;
                if (this.D) {
                    bs = this.D.pt;
                }
                if (bs) {
                    var cE = google.maps.geometry.spherical.computeDistanceBetween(pt, bs);
                    r += "<tr><td style='color:gray'>distance:</td><td>" + formatFloat(cE, 1) + " metres</td></tr>";
                }
                r += "</table>";
                r += "</td></tr></table>";
            }
            aI.innerHTML = r;
            aI.style.display = "inline";
        } else {
            aI.style.display = "none";
        }
    }
};

function placeClick() {
    var k = dm5.D;
    if (k) {
        var pt = k.pt;
        if (pt) {
            map.setCenter(pt);
        }
    }
};

function streetviewClick() {
    if (pan) {
        var pt = pan.getPosition();
        if (pt) {
            map.setCenter(pt);
        }
    }
};

function autoBirdseyeClick(a) {
    dm5.Q = a.checked;
    dm5.au(false);
};

function zoomFit(a) {
    var pt = null;
    var j = null;
    var k = dm5.D;
    if (k) {
        pt = k.pt;
    }
    if (pan && pan.getVisible()) {
        j = pan.getPosition();
    }
    if (j) {
        if (pt) {
            var bb = new google.maps.LatLngBounds();
            bb.extend(j);
            bb.extend(pt);
            map.fitBounds(bb);
        } else {
            map.setCenter(j);
            map.setZoom(18);
        }
    } else if (pt) {
        map.setCenter(pt);
        map.setZoom(18);
    }
};
DM5.prototype.au = function(cQ) {
    var pt = null;
    if (map) {
        pt = map.getCenter();
    }
    if (pt) {
        var l = null;
        if (pan) {
            l = 0;
            var v = pan.getPov();
            if (v) {
                l = Math.floor((v.heading + 45) / 90);
                while (l < 0) {
                    l += 4;
                }
                while (l >= 4) {
                    l -= 4;
                }
            }
        }
        if (window.frames.veFrame && window.frames.veFrame.setVEpos && window.frames.map) {
            var dm = pt.lat();
            var dv = pt.lng();
            var m = 1;
            var aE = map.getZoom();
            try {
                window.frames.veFrame.setVEpos(dm, dv, aE, l, m, this.Q, cQ);
            } catch (ex) {}
        }
        this.bF();
    }
    this.aj();
    this.by();
};
DM5.prototype.bD = function() {
    var j = null;
    if (pan) {
        j = pan.getPosition();
        if (map) {
            map.setCenter(j);
        }
        if (pan.getVisible() && !eid("streetviewCheckbox").checked) {
            eid("streetviewCheckbox").checked = true;
            this.R();
            return;
        }
        if (!pan.getVisible() && eid("streetviewCheckbox").checked) {
            eid("streetviewCheckbox").checked = false;
            this.R();
            return;
        }
        if (window.frames.veFrame && window.frames.veFrame.setVEStreetPos) {
            var cp = null;
            var cs = null;
            if (j) {
                cp = j.lat();
                cs = j.lng();
            }
            var l = 0;
            var v = pan.getPov();
            if (v) {
                l = Math.floor((v.heading + 45) / 90);
                while (l < 0) {
                    l += 4;
                }
                while (l >= 4) {
                    l -= 4;
                }
            }
            var cB = pan.getVisible() && (j != null);
            try {
                window.frames.veFrame.setVEStreetPos(cp, cs, l, cB);
            } catch (ex) {}
        }
    }
    this.bF();
    this.by();
};
DM5.prototype.by = function() {
    if (map) {
        var pt = null;
        if (this.D && this.D.pt) {
            pt = this.D.pt;
        } else {
            pt = map.getCenter();
        }
        var x = formatFloat(pt.lng(), 6);
        var y = formatFloat(pt.lat(), 6);
        var z = map.getZoom();
        if (z > 19) {
            z = 19;
        }
        var aW = "streetmap.html";
        var A = "?lat=" + y + "&lng=" + x + "&z=" + z;
        if (pan && pan.getVisible()) {
            var v = pan.getPov();
            var j = pan.getPosition();
            if (v && j) {
                var sx = formatFloat(j.lng(), 6);
                var sy = formatFloat(j.lat(), 6);
                var sh = formatFloat(v.heading, 3);
                var sp = formatFloat(v.pitch, 3);
                var sz = v.zoom;
                A += "&slat=" + sy + "&slng=" + sx + "&sh=" + sh + "&sp=" + sp + "&sz=" + sz;
            }
        }
        var dc = map.getMapTypeId();
        var bN = 0;
        for (var i = 0; i < this.bt.length; i++) {
            if (this.bt[i] == dc) {
                bN = i;
            }
        }
        A += "&gm=" + bN;
        if (window.frames.veFrame && window.frames.veFrame.GetVEMapType) {
            A += "&bm=" + window.frames.veFrame.GetVEMapType();
        }
        var df = (this.C ? "m" : "") + (this.o ? "s" : "") + (this.t ? "b" : "") + (this.B ? "i" : "");
        A += "&panel=" + df;
        if (this.ag) {
            A += "&mi=" + this.ag;
        } else {
            A += "&mi=" + this.K;
        }
        if (!this.U) {
            A += "&mw=" + this.U;
        }
        if (!this.Q) {
            A += "&be=" + this.Q;
        }
        if (!this.M) {
            A += "&mv=" + this.M;
        }
        if (!this.af) {
            A += "&md=" + this.af;
        }
        if (this.G) {
            A += "&pt=" + this.G;
        }
        if (this.L) {
            A += "&pd=" + this.L;
        }
        aW += A;
        eid("bookmarkLink").href = aW;
        eid("fullpageLink").href = aW;
        eid("createMapLink").href = this.bu + A;
    }
};
DM5.prototype.bA = function() {
    if (window.frames.veFrame && window.frames.veFrame.createPlaceMarker) {
        var k = this.D;
        if (k) {
            var pt = k.pt;
            window.frames.veFrame.createPlaceMarker(pt.lat(), pt.lng(), this.K, this.M);
        }
    }
};

function eid(id) {
    return document.getElementById(id);
};

function glog(a) {
    if (typeof(console) != "undefined" && console && console.log) {
        console.log(a);
    }
};

function formatFloat(n, d) {
    var m = Math.pow(10, d);
    return Math.round(n * m, 10) / m;
};
String.prototype.trim = function() {
    return this.replace(/^\s*|\s*$/g, '');
};
String.prototype.normalise = function() {
    var str = "";
    var src = this;
    var len = src.length;
    var lc = 0;
    for (var i = 0; i < len; i++) {
        var c = src.substr(i, 1);
        if (c != "\r" && c != "\n" && c != "\t") {
            if (c != " " || lc != " ") {
                str += c;
            }
            lc = c;
        }
    }
    return str;
};

function DirFromBearing(a) {
    var cU = Math.round(a + 360) % 360;
    var d = parseInt((cU + 45) / 90) % 4;
    return d;
}