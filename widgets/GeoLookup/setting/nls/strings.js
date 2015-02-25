define({
    root: {
        settingsHeader: "Set the details for the GeoLookup Widget",
        settingsDesc: "This widget uses 1 or more polygon layers in the map to intersect with a list of locations.  Fields from the polygon layers are appended to the coordinates.",
        layerTable: {
            colEnrich: "Enrich",
            colLabel: "Layer",
            colFieldSelector: "Fields"
        },
        fieldTable: {
            colAppend: "Append",
            colName: "Name",
            colAlias: "Alias"
        },
        symbolArea: {
            symbolLabelWithin: 'Select the symbol for locations within:',
            symbolLabelOutside: 'Select the symbol for locations outside:'
        },
        advSettings: {
            latFieldsDesc: "Possible field names for Latitude field.",
            longFieldsDesc: "Possible field names for Longitude field.",
            intersectFieldDesc: "The name of the field created to store value if lookup intersected a layer.",
            intersectInDesc: "Value to store when location intersected a polygon.",
            intersectOutDesc: "Value to store when location did not intersected a polygon.",
        },
        noPolygonLayers: "No Polygon Layers",
        errorOnOk: "Please fill out all parameters before saving config",
        saveFields: "Save Fields",
        cancelFields: "Cancel Fields",
        saveAdv: "Save Adv. Settings",
        cancelAdv: "Cancel Adv. Settings",
        advSettingsBtn: "Advance Settings"
    }
});
