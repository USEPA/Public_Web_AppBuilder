define([
        "dojo/_base/declare",
        "dojo/dom-style",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        'dijit/_WidgetsInTemplateMixin',
    ],
    function (declare, domStyle, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin) {
        return declare(
            [  _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
            {
                boundsNumberBoxWidth: "5em",
                /**
                 * handles when values change
                 * @param valid  true when widget inputs are valid
                 */
                onValuesChanged: function (valid) {
                },
                /**
                 * returns the query geometry
                 * @return {null}
                 */
                getGeometry: function () {
                    return null;
                },
                /**
                 * returns true when the widgets inputs are valid
                 * @return {boolean}
                 */
                isValid: function () {
                    return true;
                },
                /**
                 * shows the widget
                 */
                show: function () {
                    domStyle.set(this.domNode, "display", "block");
                },
                /**
                 * hides the widget
                 */
                hide: function () {
                    domStyle.set(this.domNode, "display", "none");
                }
            });
    });