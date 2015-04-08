define([
    "dojo/_base/declare",
    "dijit/_Widget",
  "dijit/_Templated"
], function(declare, _Widget,_Templated){
    return declare("oneService", [_Widget, _Templated], {
        templateString: '<div><input data-dojo-attach-point="checkNode" data-dojo-attach-event="onclick:_onClick" name="viewtype" value="${svcvalue}" checked="" type="checkbox" /><span data-dojo-attach-point="labelNode"></span></div>',
        constructor: function (a) {
            this.svcvalue = a.id;
            this.svcobj = a.svcobj;
            this.vimgwg = a.vimgwg;
            this.map = this.vimgwg.map;
            this.viewobject = this.vimgwg.config.viewobject;
            dojo.mixin(this, a)
        },
        postCreate: function () {

            var labelstr = "";
            if (this.svcobj.linkurl) {
                labelstr += "<a href='" + this.svcobj.linkurl + "' target='_blank'>";
                labelstr += this.svcobj.desc;
            } else {
                labelstr += this.svcobj.desc;
            }
            this.labelNode.innerHTML = labelstr;

            if (this.svcobj.visible) {
                this.checkNode.checked = true;
            } else {
                this.checkNode.checked = false;

            }

        },


        _onClick: function () {
            var viewobject = this.viewobject;
            var pid = this.svcobj.pid;           
            var frm = this.vimgwg.viewform;
            var bcount = 0;
            for (var k = 0; k < frm.viewtype.length; k++) {
                if (frm.viewtype[k].checked) {
                    bcount = bcount + 1;

                }
            }
            if (bcount == 0) {
              if (this.map.getLayer("imageLayer_" + this.vimgwg.id)) this.map.getLayer("imageLayer_" + this.vimgwg.id).clear();
                this.vimgwg.currentgraphic = null;
                this.vimgwg.decNode.innerHTML = "";
                this.vimgwg.geoTextNode.value = "";
            } else if (bcount > 4) {
                this.checkNode.checked = false;
                alert("You can only check maximum 4 images to display at a time.");
                return false;
            }

            if (this.checkNode.checked) {
                var cgraphic = this.vimgwg.currentgraphic;

                if (cgraphic != null) {
                    var viewvalue = this.checkNode.value;
                    var geom = esri.geometry.webMercatorToGeographic(cgraphic.geometry);
                    var lat = geom.y;
                    var lon = geom.x;
                    var pcount = 0;
                    for (var j = 1; j < 5; j++) {
                        if (this.vimgwg.vieworder["view" + j] == false) {
                            pcount = j;
                            break;
                        }
                    }

                    this.vimgwg.popupview(viewvalue, lat, lon, pid, pcount);
                }
            } else {
                var panid = "popupdiv" + pid + "_" + this.vimgwg.id;
                var viewvalue = this.checkNode.value;
                var o = viewobject[viewvalue].order;
                this.vimgwg.vieworder["view" + o] = false;
                this.vimgwg._restorePane(panid, viewvalue);
                if (dijit.byId(panid)) dijit.byId(panid).hide();

            }

        },

        destroy: function () {
            dojo.empty(this.domNode);
            this.inherited(arguments);
        }
        
    });
});



