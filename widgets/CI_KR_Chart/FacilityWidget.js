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
    "esri/geometry/Circle"
], function (declare, domConstruct, lang, array, on, domClass, mouse,
             _WidgetBase,
             Graphic, SimpleMarkerSymbol, EsriCircle) {
    return declare([_WidgetBase], {
        baseClass: "jimu-widget-facilities",
        name: "Facilities",

        excludeFieldNames: ["SHAPE", "OBJECTID", "SHAPE_LENGTH", "SHAPE_AREA", "AREA_", "PERIMETER"],
        domNode: null,
        inputGraphic: null,
        graphicsLayer: null,


        /**
         * Widget postCreate
         */
        postCreate: function () {
            this.inherited(arguments);
        },

        /**
         * Widget startup
         */
        startup: function () {
            this.inherited(arguments);
            this._createFacilitiesInfo();
        },

        /**
         * Widget buildRendering: creates the list of impacted facilities
         */
        buildRendering: function () {
            this.domNode = domConstruct.place("<div class='jimu-widget-Identify featureView'></div>", this.srcNodeRef);

            //Wire up the mouse events
            on(this.domNode, mouse.enter, lang.hitch(this, "onMouseEnteredGraphic"));
            on(this.domNode, mouse.leave, lang.hitch(this, "onMouseLeaveGraphic"));

            //Create the
            var fAtt = this.inputGraphic;
            for (var v in fAtt.attributes) {
                if (fAtt.attributes.hasOwnProperty(v)) {
                    if (this._checkFieldName(v)) {
                        if (fAtt.attributes[v] !== null) {
                            domConstruct.place(this._createFieldElement(v, fAtt.attributes[v]), this.domNode);
                        }
                    }
                }
            }
            //Create the zoom button and wire up the click event
            var zoomBtnContainer = domConstruct.place("<div class='zoomBtnContainer'></div>", this.domNode);
            var zoomToControl = domConstruct.place("<span class='zoomToBtn'>Zoom To</span>", zoomBtnContainer);
            on(zoomToControl, 'click', lang.hitch(this, this._zoomToFeature));
        },

        /**
         * Creates a new graphic highlight symbol
         */
        onMouseEnteredGraphic: function () {
            domClass.add(this.domNode, "over");
            this._drawGraphic();
        },

        /**
         * Removes graphic highlight symbol
         */
        onMouseLeaveGraphic: function () {
            domClass.remove(this.domNode, "over");
            this._removeGraphic();
        },

        /**
         * Checks for valid field names
         * @param forFld
         * @returns {boolean}
         * @private
         */
        _checkFieldName: function (forFld) {
            return array.indexOf(this.excludeFieldNames, forFld.toUpperCase()) === -1;
        },

        /**
         * Checks if field is part of acceptable list of fields
         * @param forFld
         * @param cfgFields
         * @returns {boolean}
         * @private
         */
        _showField: function (forFld, cfgFields) {
            if (cfgFields === null) {
                return true;
            }
            return array.indexOf(cfgFields, forFld) > -1;
        },

        /**
         * Create the field name and value labels
         * @param forFldName
         * @param withFldValue
         * @returns {string}
         * @private
         */
        _createFieldElement: function (forFldName, withFldValue) {
            return lang.replace(
                "<label class='fieldName'>{f}: </label><label class='fieldValue'> {v}</label><br>", {
                    f: forFldName,
                    v: withFldValue
                }
            );
        },

        /**
         * Creates the highlight graphic symbol
         * @returns {esri.symbols.SimpleMarkerSymbol}
         * @private
         */
        _getGraphicSymbol: function () {
            return new SimpleMarkerSymbol({
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

        /**
         * Create the highlight graphic symbol and add to the map
         * @private
         */
        _drawGraphic: function () {
            this.selGraphic = new Graphic(this.inputGraphic.geometry, this._getGraphicSymbol());
            this.graphicsLayer.add(this.selGraphic);
        },

        /**
         * Remove the highlight graphic symbol from the map
         * @private
         */
        _removeGraphic: function () {
            this.graphicsLayer.remove(this.selGraphic);
        },

        /**
         * Creates a circle from the impacted facility location and zooms to it
         * @private
         */
        _zoomToFeature: function () {
            var gExtent = new EsriCircle(this.selGraphic.geometry, {
                "radius": 20
            });
            this.graphicsLayer.getMap().setExtent(gExtent.getExtent());
        }
    });
});