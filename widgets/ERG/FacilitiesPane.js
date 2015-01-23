define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/query",
    "dijit/_WidgetBase",
    "dijit/layout/AccordionContainer",
    "dijit/layout/ContentPane",
    "./FacilitiesView"
    ],
    function(
        dojoDeclare,
        dojoConstruct,
        dojoLang,
        dojoArray,
        dojoQuery,
        dijitBaseWidget,
        DijitAccordianPane,
        DijitContentPane,
        FacilitiesView
        ) {

        return dojoDeclare([dijitBaseWidget], {
            postCreate: function() {
                this.inherited(arguments);
            },
            buildRendering: function() {
                console.log("FacilitiesPane - BuildRendering");
                var titleText = dojoLang.replace(
                    "<div class='jimu-widget-bombThreat resultTitle'>Results: {count}</div>", {
                        count: this.resultsList.length
                    }
                );
                this.domNode = dojoConstruct.place(titleText, this.srcNodeRef);
                var featText;

                var h = dojoLang.replace("height: {ph}px", {
                    ph: Math.ceil(this.frameHeight * 0.75)
                });

                this.facilityList = dojoConstruct.place('<div></div>', this.domNode);
                var cp = dojoConstruct.place("<div class='jimu-widget-bombThreat PropertyInfoLayer'></div>", this.facilityList);
                var layerTitle = dojoLang.replace("<div class='jimu-widget-bombThreat featureList'>{title}</div>", {
                    title: "Critical Facilities"
                });
                dojoConstruct.place(layerTitle, cp);

                dojoArray.forEach(this.resultsList, function(fitem) {
                    featText = dojoConstruct.place("<div class='jimu-widget-bombThreat featureLabel'></div>", cp);
                    var fv = new FacilitiesView({
                        graphic: fitem,
                        gLayer: this.gLayer
                    }, featText);
                }, this);
            }
        }
    );
});
