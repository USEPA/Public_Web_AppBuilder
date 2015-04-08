define([
        'dojo/_base/declare',
        "dojo/dom-class",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin"
    ],
    function (declare, domClass, _WidgetBase, _TemplatedMixin) {
        return declare([ _WidgetBase, _TemplatedMixin], {
            currentLayer: null,
            _hideNode: function (node) {
                if (!domClass.contains(node, "hidden")) {
                    domClass.add(node, "hidden");
                }
            },
            clear: function () {
            },
            _showNode: function (node) {
                if (domClass.contains(node, "hidden")) {
                    domClass.remove(node, "hidden");
                }
            },
            show: function () {
                this._showNode(this.domNode);
            },
            hide: function () {
                this._hideNode(this.domNode);
            },
            isVisible: function () {
                return   !domClass.contains(this.domNode, "hidden");
            },
            setLayer: function (layer) {
                this.clear();
                this.currentLayer = layer;
                this.reload();
                return this.isSupportedLayer();
            },
            reload: function () {

            },
            isSupportedLayer: function () {
                return false;
            }
        });

    });
