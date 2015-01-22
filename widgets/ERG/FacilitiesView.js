define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dojo/dom-class",
    "dojo/mouse",
    "dijit/_WidgetBase",
    "esri/graphic",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/geometry/Circle"
], function(
    dojoDeclare,
    dojoConstruct,
    dojoLang,
    dojoArray,
    dojoOn,
    dojoDomClass,
    dojoMouse,
    _WidgetBase,
    EsriGraphic,
    EsriSMS,
    EsriSLS,
    EsriSFS,
    EsriCircle
    ){
    return dojoDeclare([_WidgetBase], {

        NonDisplayedFieldNames: ["SHAPE", "OBJECTID", "SHAPE_LENGTH", "SHAPE_AREA", "AREA_", "PERIMETER"],

        postCreate: function() {
            console.log("FacilitiesView - postCreate");
        },
        checkFieldName: function(forFld) {
            var x = dojoArray.indexOf(this.NonDisplayedFieldNames, forFld.toUpperCase()) === -1;
            return x;
        },

        showField: function(forFld, cfgFields) {
            if (cfgFields === null) {
                return true;
            }

            return dojoArray.indexOf(cfgFields, forFld) > -1;
        },
        createFieldElement: function(forFldName, withFldValue) {

            if (withFldValue.slice(0, 5) === 'http:' || withFldValue.slice(0, 4) === 'ftp:' || withFldValue.slice(0, 6) === 'https:') {
                return dojoLang.replace(
                    "<div class='jimu-widget-bombThreat att'><a href='{v}' target='_blank' class='jimu-widget-bombThreat linkValue'>{f}</a></div>", {
                        f: forFldName,
                        v: withFldValue
                    }
                );
            }

            return dojoLang.replace(
                "<div class='jimu-widget-bombThreat att'><label class='jimu-widget-bombThreat fieldName'>{f} : </label> <label class='jimu-widget-bombThreat fieldValue'> {v}</label></div>", {
                    f: forFldName,
                    v: withFldValue
                }
            );
        },
        getGraphicSymbol: function() {
            return new EsriSMS({
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [88, 211, 247],
                "size": 8,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline": {
                    "color": [255, 255, 255],
                    "width": 2
                }
            });
        },
        drawGraphic: function() {

            this.selGraphic = new EsriGraphic(this.graphic.geometry, this.getGraphicSymbol());
            this.gLayer.add(this.selGraphic);
        },

        removeGraphic: function() {
            this.gLayer.remove(this.selGraphic);
        },

        /*
         *
         */
        mouseEnteredGraphic: function() {
            dojoDomClass.add(this.domNode, "over");
            this.drawGraphic();
        },

        /*
         *
         */
        mouseLeaveGraphic: function() {
            dojoDomClass.remove(this.domNode, "over");
            this.removeGraphic();
        },
        ZoomToFeature: function() {
            var gExtent = new EsriCircle(this.selGraphic.geometry, {
                "radius": 5
            });
            this.gLayer.getMap().setExtent(gExtent.getExtent());
        },
        buildRendering: function() {
            console.log("FacilitiesView - buildRendering");

            var fAtt;
            var v;
            var flds;
            var fieldsConfig;

            this.domNode = dojoConstruct.place("<div class='jimu-widget-Identify featureView'></div>", this.srcNodeRef);

            dojoOn(this.domNode, dojoMouse.enter, dojoLang.hitch(this, "mouseEnteredGraphic"));

            dojoOn(this.domNode, dojoMouse.leave, dojoLang.hitch(this, "mouseLeaveGraphic"));

            fAtt = this.graphic;

            for (v in fAtt.attributes) {
                if (fAtt.attributes.hasOwnProperty(v)) {
                    if (this.checkFieldName(v)) {
                        if (fAtt.attributes[v] != null) {
                            dojoConstruct.place(this.createFieldElement(v, fAtt.attributes[v]), this.domNode);
                        }
                    }
                }
            }

            this.zoomBtnContainer = dojoConstruct.place("<div class='zoomBtnContainer'></div>", this.domNode);
            this.zoomToControl = dojoConstruct.place("<span class='zoomToBtn'>Zoom To</span>", this.zoomBtnContainer);
            dojoOn(this.zoomToControl, 'click', dojoLang.hitch(this, "ZoomToFeature"));
        }
    });
});