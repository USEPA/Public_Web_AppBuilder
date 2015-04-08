define([
        'dojo/_base/declare',
        "dojo/text!./template/AnalysisWidgetTemplate.html",
        "dojo/_base/lang",
        "dijit/_WidgetBase",
        "dojo/dom-class",
        "dijit/_TemplatedMixin",
        "./base/Band/BandWidget",
        "./base/Renderer/RendererWidget",
        "./base/Transparency/TransparencyWidget",
        "./base/Layer/LayerWidget",
        "esri/layers/RasterFunction"
    ],
    function (declare, template, lang, _WidgetBase, domClass, _TemplatedMixin, BandWidget, RendererWidget, TransparencyWidget, LayerWidget, RasterFunction) {
        return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            constructor: function (params) {
                lang.mixin(this,params || {});
                this._layersByUrl = {};
            },
            postCreate: function () {
                this.inherited(arguments);
                this._createLayersWidget();
                this._createBandWidget();
                this._createTransparencyWidget();
                this._createRendererWidget();
            },
            clear: function () {
                this._layersByUrl = {};
                this.currentLayer = null;
                this.layerWidget.clear();
                this.bandWidget.clear();
                this.rendererWidget.clear();
                this.transparencyWidget.clear();
                this.showNoLayersActiveContainer();
            },

            addLayer: function (layer) {
                if (layer && layer.url && !this._layersByUrl[layer.url]) {
                    this._layersByUrl[layer.url] = layer;
                    this.layerWidget.addLayer(layer);
                    this.showLayersActiveContainer();
                }
            },
            _createLayersWidget: function () {
                if (this.layerWidget) {
                    return;
                }
                this.layerWidget = new LayerWidget({
                    nls: this.nls
                });
                this.layerWidget.placeAt(this.layerWidgetContainer);
                this.layerWidget.on("layerSelected", lang.hitch(this, this.handleLayerSelected));
            },
            showAnalysisWidgets: function (layer) {
                this._showNode(this.analysisContent);
                this.bandWidget.setLayer(layer);
                this.rendererWidget.setLayer(layer);
                this.transparencyWidget.setLayer(layer);

                if (this.bandWidget.isSupportedLayer() && this.rendererWidget.isSupportedLayer()) {
                    this._showAnalysisTabs();
                    if (this.currentLayer && this.currentLayer.bandIds && this.currentLayer.bandIds.length > 0) {
                        this.showBandsWidget();
                    }
                    else {
                        this.showRendererWidget();
                    }
                }
                else {
                    this._hideAnalysisTabs();
                    if (this.bandWidget.isSupportedLayer()) {
                        this.showBandsWidget();
                    }
                    else if (this.rendererWidget.isSupportedLayer()) {
                        this.showRendererWidget();
                    }

                }
            },
            _showAnalysisTabs: function () {
                this._showNode(this.imageAnalysisTabs);
                if (domClass.contains(this.imageAnalysisTabContent, "noBorder")) {
                    domClass.remove(this.imageAnalysisTabContent, "noBorder");
                }

            },
            _hideAnalysisTabs: function () {
                this._hideNode(this.imageAnalysisTabs);
                if (!domClass.contains(this.imageAnalysisTabContent, "noBorder")) {
                    domClass.add(this.imageAnalysisTabContent, "noBorder");
                }
            },
            hideAnalysisWidgets: function () {
                this._hideNode(this.analysisContent);
            },
            handleLayerSelected: function (layerUrl) {
                if (!layerUrl) {
                    this.currentLayer = null;
                    this.hideAnalysisWidgets();
                }
                else {
                    this.currentLayer = this._layersByUrl[layerUrl];
                    this.showAnalysisWidgets(this.currentLayer);
                }
            },
            _createBandWidget: function () {
                if (this.bandWidget) {
                    return;
                }
                this.bandWidget = new BandWidget({
                    nls: this.nls
                });
                this.bandWidget.placeAt(this.bandWidgetContainer);
            },
            _createTransparencyWidget: function () {
                if (this.transparencyWidget) {
                    return;
                }
                this.transparencyWidget = new TransparencyWidget({
                    nls: this.nls
                });
                this.transparencyWidget.placeAt(this.transparencyWidgetContainer);
            },
            _createRendererWidget: function () {
                if (this.rendererWidget) {
                    return;
                }
                this.rendererWidget = new RendererWidget({
                    nls: this.nls
                });
                this.rendererWidget.placeAt(this.rendererWidgetContainer);
                this.rendererWidget.setLayer(null);

            },
            isVisible: function () {
                return   !domClass.contains(this.domNode, "hidden");
            },
            toggle: function () {
                if (domClass.contains(this.domNode, "hidden")) {
                    this.show();
                }
                else {
                    this.hide();
                }
            },
            show: function () {
                if (domClass.contains(this.domNode, "hidden")) {
                    domClass.remove(this.domNode, "hidden");
                }

            },
            hide: function () {
                if (!domClass.contains(this.domNode, "hidden")) {
                    domClass.add(this.domNode, "hidden");
                }
            },
            showLayersActiveContainer: function () {
                if(this.layerWidget){
                    this.layerWidget.resetLayerSelection();
                }
                this._hideNode(this.noLayersActiveContainer);
                this._showNode(this.layersActiveContainer);
            },
            showNoLayersActiveContainer: function () {
                this.hideAnalysisWidgets();
                this._showNode(this.noLayersActiveContainer);
                this._hideNode(this.layersActiveContainer);
            },
            _hideNode: function (node) {
                if (!domClass.contains(node, "hidden")) {
                    domClass.add(node, "hidden");
                }
            },
            _showNode: function (node) {
                if (domClass.contains(node, "hidden")) {
                    domClass.remove(node, "hidden");
                }
            },
            showRendererWidget: function () {
                if (!domClass.contains(this.renderersTab, "enabled")) {
                    domClass.add(this.renderersTab, "enabled");
                }
                this.hideBandsWidget();
                this._showNode(this.rendererWidgetContainer);

                //clear and band ordering on the current layer
                if (this.currentLayer && this.currentLayer.bandIds && this.currentLayer.bandIds.length > 0) {
                    this.currentLayer.setBandIds([]);
                }
                this.rendererWidget.setLayer(this.currentLayer);
            },
            hideRendererWidget: function () {
                if (domClass.contains(this.renderersTab, "enabled")) {
                    domClass.remove(this.renderersTab, "enabled");
                }
                this._hideNode(this.rendererWidgetContainer);
            },
            showBandsWidget: function () {
                if (!domClass.contains(this.bandsTab, "enabled")) {
                    domClass.add(this.bandsTab, "enabled");
                }
                this.hideRendererWidget();
                this._showNode(this.bandWidgetContainer);
                if (this.currentLayer.renderingRule && this.currentLayer.renderingRule.functionName) {
                    this.currentLayer.setRenderingRule(null);
                }
                this.bandWidget.setLayer(this.currentLayer);
            },
            hideBandsWidget: function () {
                if (domClass.contains(this.bandsTab, "enabled")) {
                    domClass.remove(this.bandsTab, "enabled");
                }
                this._hideNode(this.bandWidgetContainer);
            }
        });
    });
