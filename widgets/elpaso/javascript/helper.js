//app level functions for widget

function validatebox(obj, pid) {

    var frm = obj.form;
    var bcount = 0;
    for (var k = 0; k < frm.viewtype.length; k++) {
        if (frm.viewtype[k].checked) {
            bcount = bcount + 1;

        }
    }
    if (bcount == 0) {
        if (map.getLayer("imageLayer")) map.getLayer("imageLayer").clear();
        dijit.byId('viewimagesTool').currentgraphic = null;
        dijit.byId('viewimagesTool').decNode.innerHTML = "";
        dijit.byId('viewimagesTool').geoTextNode.value = "";
    } else if (bcount > 4) {
        obj.checked = false;
        alert("You can only check maximum 4 images to display at a time.");
        return false;
    }

    if (obj.checked) {
        var cgraphic = null;
        if (dijit.byId('viewimagesTool')) cgraphic = dijit.byId('viewimagesTool').currentgraphic;
        if (cgraphic != null) {
            var viewvalue = obj.value;
            var geom = esri.geometry.webMercatorToGeographic(cgraphic.geometry);
            var lat = geom.y;
            var lon = geom.x;
            var pcount = 0;
            for (var j = 1; j < 5; j++) {
                if (dijit.byId('viewimagesTool').vieworder["view" + j] == false) {
                    pcount = j;
                    break;
                }
            }
            
            dijit.byId('viewimagesTool').popupview(viewvalue, lat, lon, pid, pcount);
        }
    } else {
        var panid = "popupdiv" + pid;
        var viewvalue = obj.value;
        var o = viewobject[viewvalue].order;
        dijit.byId('viewimagesTool').vieworder["view" + o] = false;
        restorePane(panid, viewvalue);
        if (dijit.byId(panid)) dijit.byId(panid).hide();
        
    }


}
function closeImageView(panid, boxid) {

    
    var boxnum = parseInt(boxid);
    var frm = document.getElementById("viewform");
    frm.viewtype[boxnum].checked = false;
    var viewvalue = frm.viewtype[boxnum].value;
    var o = viewobject[viewvalue].order;
    dijit.byId('viewimagesTool').vieworder["view" + o] = false;
    restorePane(panid, viewvalue);
    dijit.byId(panid).hide();
    var showPoint = false;
    for (var j = 1; j < 5; j++) {
        if (dijit.byId('viewimagesTool').vieworder["view" + j] == true) {
            showPoint = true;
            break;
        }
    }
    if (showPoint == false) {
        if (map.getLayer("imageLayer")) map.getLayer("imageLayer").clear();
        dijit.byId('viewimagesTool').currentgraphic = null;
        dijit.byId('viewimagesTool').decNode.innerHTML = "";
        dijit.byId('viewimagesTool').geoTextNode.value = "";
    }
}

function restorePane(paneid,eview) {
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