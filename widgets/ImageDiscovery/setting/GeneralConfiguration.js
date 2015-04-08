define([
    'dojo/_base/declare',
    "dojo/text!./GeneralConfiguration.html",
    "dojo/_base/lang",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin"
],
    function (declare, template, lang, _WidgetBase, _TemplatedMixin) {
        return declare(
            [_WidgetBase, _TemplatedMixin],
            {
                defaultWhereClauseAppend: "Category = 1",
                serviceUrl: "",
                serviceDescription: null,
                ignoreFields: ["Shape", "Shape_Length", "Shape_Area"],
                templateString: template,


                hideNode: function (node) {
                    if (!domClass.contains(node, "hidden")) {
                        domClass.add(node, "hidden");
                    }
                },
                showNode: function (node) {
                    if (domClass.contains(node, "hidden")) {
                        domClass.remove(node, "hidden");
                    }
                }
            });
    });
