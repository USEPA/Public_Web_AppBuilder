define({
    root: {
        _widgetLabel: "GeoLookup",
        description: "Browse to or Drag a <a href='./widgets/geolookup/data/sample.csv' tooltip='Download an example sheet'> spreadsheet </a> here to visualize, and append map data to it.",
        selectCSV: "Select a CSV",
        error: {
            fetchingCSV: 'Error fetching items from CSV store: ${0}'
        },
        results: {
            csvLoaded: "${0} records from the CSV file have been loaded",
            recordsPlotted: "${0}/${1} records have been located on the map",
            recordsEnriched: "${0}/${1} enriched against ${2}",
            recordsError: "${0} records had errors"
        }

    },
    "zh-cn": true
});
