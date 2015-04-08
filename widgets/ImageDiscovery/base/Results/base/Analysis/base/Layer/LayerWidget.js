define([
        "dojo/_base/declare",
        "dojo/text!./template/LayerWidgetTemplate.html",
        "dojo/_base/lang",
        "dijit/form/Select",
        "dojo/dom-construct",
        "../BaseAnalysisWidget"
    ],
    function (declare, template, lang, Select, domConstruct, BaseAnalysisWidget) {

        return declare([BaseAnalysisWidget], {
            templateString: template,
            NO_LAYER: "*NoLayer",
            postCreate: function () {
                this.inherited(arguments);
                this.hide();
            },
            addLayer: function (layer) {
                if (!this.layerSelect) {
                    this.createLayerSelect();
                }
                this.layerSelect.addOption({
                    label: layer.label || layer.name,
                    value: layer.url
                });
                if (!this.isVisible()) {
                    this.show();
                }
            },
            clear: function () {
                this.inherited(arguments);
                this._destroySelect();
                this.hide();
            },
            _destroySelect: function () {
                if (this.layerSelect) {
                    this.layerSelect.destroy();
                    this.layerSelect = null;
                    domConstruct.empty(this.layerSelectContainer);
                }
            },
            createLayerSelect: function () {
                if (this.layerSelect) {
                    return;
                }
                this.layerSelect = new Select(
                    {
                        style: "width: 100%",
                        options: [
                            {
                                label: "--Select--",
                                value: this.NO_LAYER
                            }
                        ]
                    });
                this.layerSelect.placeAt(this.layerSelectContainer);
                this.layerSelect.on("change", lang.hitch(this, this._onLayerSelected))
            },
            _onLayerSelected: function (layerUrl) {
                this.onLayerSelected(layerUrl === this.NO_LAYER ? null : layerUrl);
            },
            onLayerSelected: function (layerUrl) {

            },
            resetLayerSelection: function(){
              if(this.layerSelect){
                  this.layerSelect.set("value",this.NO_LAYER);
              }
            }

        });
    });