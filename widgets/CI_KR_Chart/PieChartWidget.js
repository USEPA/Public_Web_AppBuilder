define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",

    "dojo/_base/array",

    "dojox/charting/Chart",
    "dojox/charting/axis2d/Default",
    "dojox/charting/plot2d/Pie",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/action2d/MoveSlice",
    "dojox/charting/Theme"
], function (
    declare, WidgetBase, TemplatedMixin, WidgetsInTemplateMixin,
    arrayUtil,
    Chart, Default, Pie, Tooltip, MoveSlice, Theme) {

    return declare([WidgetBase, TemplatedMixin, WidgetsInTemplateMixin], {
        baseClass: "jimu-widget-pieChart",
        name: "PieChart",
        templateString: "<div data-dojo-attach-point='chartContainerNode'></div>",
        pieChart: null,
        header: null,
        seriesName: null,

        /**
         * Widget postCreate: Init and render pie chart
         */
        postCreate: function () {
            this.inherited(arguments);

            var strokeStyle = { color: "#EFEFEF", width: 2 };
            var currentTheme = new Theme({
                colors: [
                    "#1F517F",
                    "#3A7532",
                    "#239999",
                    "#DB8F2A"
                ]
            });
            currentTheme.chart.fill = "transparent";
            currentTheme.plotarea.fill = "transparent";

            this.pieChart = new Chart(this.chartContainerNode, {
                title: this.title ? this.title : "Pie Chart",
                titleFont: "normal normal bold 10pt Tahoma",
                titleGap: 10
            });
            this.pieChart.addPlot("default", {
                type: "Pie",
                labels: false,
                font: "normal normal 8pt Tahoma",
                fontColor: "#333",
                labelOffset: -40,
                labelStyle: "columns",
                radius: 100,
                animate: true,
                markers: true,
                stroke: strokeStyle
            });
            this.pieChart.setTheme(currentTheme);
            this.pieChart.addAxis("x");
            this.pieChart.addAxis("y", {
                vertical: true,
                fixLower: "major",
                fixUpper: "major"
            });
            this.pieChart.addSeries(this.seriesName, [1]);
            var ms = new MoveSlice(this.pieChart, "default");
            var toolTip = new Tooltip(this.pieChart, "default");
            this.pieChart.render();
        },

        /**
         * Widget startup
         */
        startup: function () {
            console.log("PieChart started");
        },

        /**
         * Create a data store for the pie chart to render. Create labels and
         * tooltips for the pie chart
         * @param dataStore
         */
        updateSeries: function (dataStore) {
            //add tooltips to the data
            var updatedSeries = arrayUtil.map(dataStore.data, function (wedge) {
                var percentage = wedge.y / dataStore.total;
                percentage = percentage.toFixed(2);
                if (!wedge.y) {
                    wedge.y = 0;
                }
                return {
                    y: wedge.y,
                    text: wedge.text,
                    tooltip: wedge.text + ": <span style='font-weight:bold'>" +
                        wedge.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
                        "</span> (" + Math.round(percentage * 100) + "%)"
                };
            });

            this.pieChart.updateSeries(this.seriesName, updatedSeries);
            this.updateTitle(dataStore.name);
            this.pieChart.resize(325, 250);
            this.pieChart.render();
        },

        /**
         * Update the pie chart title
         * @param title
         */
        updateTitle: function (title) {
            this.pieChart.title = title;
            this.pieChart.dirty = true;
        }
    });
});