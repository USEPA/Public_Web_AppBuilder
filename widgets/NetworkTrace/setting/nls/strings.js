define({
  root: {
    taskUrl: "Task URL",
    setTask: "Set",
    validate: "Set",
    inValidGPService: "Please enter valid geoprocessing service.",
    GPFeatureRecordSetLayerERR: "Please enter a geoprocessing service with inputs of type 'GPFeatureRecordSetLayer' only.",
    invalidInputParameters: "Number of input parameters is either less than 1 or more than 3. Please enter a valid geoprocessing service.",
    // Common
    inputName: "Name",
    inputLabel: "Label",
    inputTooltip: "Tooltip",
    symbol: "Symbol",
    // Input details
    inputPanel: {
      inputTask: "Input",
      inputType: "Type",
      inputTypeFlag: "Flag",
      inputTypeBarriers: "Barriers",
      inputTypeSkip: "Skip"
    },
    // Output details
    outputPanel: {
      outputTask: "Output",
      outputExport: "Export to CSV",
      outputLayer: "Save to layer",
      outputLayerType: "Target layer",
      outputDisplay: "Display text",
      outputSummary: "Summary text",
      skip: "Skippable",
      uniqueIDField: "Unique ID field",
      outputminScale: "Min scale",
      outputmaxScale: "Max scale"
    },
    // Summary expression builder
    summaryTab: {
      summaryTabText: "Summary",
      summaryFieldsetText: "Summary settings",
      inputOutput: "Inputs/Outputs",
      field: "Fields",
      operator: "Operators",
      inputOperatorCountOption: "Count",
      outputOperatorCountOption: "Count",
      outputOperatorSkipCountOption: "SkipCount",
      fieldOperatorSumOption: "Sum",
      fieldOperatorMinOption: "Min",
      fieldOperatorMaxOption: "Max",
      fieldOperatorMeanOption: "Mean",
      expressionAddButtonText: "Add",
      expressionVerifyButtonText: "Verify",
      summaryEditorText: "Summary text"
    },
    // Outage details
    outagePanel: {
      bufferDistance: "Buffer distance",
      esriUnits: "Unit",
      outageFieldTagName: "Save summary options",
      outage: "Overview",
      isvisible: "Visible",
      OutageFieldName: "Field name",
      OutageParamName: "Parameter name",
      fieldMappingHint_1: "Select a field to store a summary of the output parameter.",
      fieldMappingHint_2: "Currently only the count of items is supported.",
      esriMeters: "Meters",
      esriMiles: "Miles",
      esriFeets: "Feet",
      esriKilometers: "Kilometers",
      outageNoneText: "None"
    },
    // Other details
    OthersHighlighter: {
      others: "Other",
      pixel: "(pixels)",
      milliseconds: "(milliseconds)",
      displayTextForButtonLegend: "Display text for 'Run' button",
      displayTextforButtonDefaultValue: "Run",
      displayTextForButton: "Display text",
      othersHighlightertext: "Highlighter image parameters",
      selectImage: "Image",
      height: "Image height",
      width: "Image width",
      timeout: "Timeout",
      autoZoomAfterTrace: "Zoom options",
      zoomText: "Auto zoom after trace"
    },
    // Validation messages
    validationErrorMessage: {
      webMapError: "No layers available in the webmap. Please select a valid webmap.",
      inputTypeFlagGreaterThanError: "Input of type flag cannot be more than one.",
      inputTypeFlagLessThanError: "At least one input of type flag is required.",
      inputTypeBarrierErr: "Input of type barrier cannot be more than one.",
      inputTypeSkipErr: "Input of type skip cannot be more than one.",
      outputLabelDataErr: "Output Label text cannot be blank.",
      outputSummaryDataErr: "Output 'Summary text' cannot be blank.",
      outputDisplayDataErr: "Output 'Display text' cannot be blank.",
      outputMinScaleDataErr: "Output 'Min scale' cannot be blank or negative value.",
      outputMaxScaleDataErr: "Output 'Max scale' cannot be blank or negative value.",
      outageFieldMappingErr: "Same field is mapped for two or more outputs. Field mapping to save summary of the output(s) should be unique.",
      outputSummaryDataText: "Invalid summary text.",
      outputDisplayDataText: "Invalid display text format.",
      otherHighlighterImage: "Please select highlighter image.",
      otherHighlighterImageHeight: "Image height should not be less than 0 or blank.",
      otherHighlighterImageWidth: "Image width should not be less than 0 or blank.",
      otherHighlighterImageTimeout: "Image timeout should not be less than 0 or blank.",
      saveToLayerTargetLayers: "Target layer should be unique or cannot be blank.",
      displayTextForButtonError: "Display text for 'Run' button cannot be blank.",
      BufferDisatanceOverview: "Buffer distance should not be blank or 0 or less than 0.",
      UnableToLoadGeoprocessError: "Unable to load geoprocessing service.",
      invalidSummaryExpression: "Invalid expression",
      validSummaryExpression: "Success !"
    },
    // Hint text
    hintText: {
      inputTypeHint: "Hint: Select the type/purpose of this input parameter.",
      labelTextHint: "Hint: Provide display label for result panel of output parameter.",
      skippableHint: "Hint: Enable/disable skip functionality for this output parameter.",
      skippableFieldHint: "Hint: Select unique ID Field for skip functionality, do not use the OBJECTID.",
      summaryTextHint: "Hint: This will be displayed in the summary panel for this output parameter. Optionally you can include the following fields:",
      displayTextHint: "Hint: This will be displayed in the details panel for this output parameter. Optionally you can include the following fields:",
      exportToCSVHint: "Hint: Enable/disable export to CSV functionality for this output parameter.",
      saveToLayerHint: "Hint: Enable/disable save to layer functionality for this output parameter.",
      outputLayerType: "Hint: Select feature layer in which results for this output parameter would be saved.",
      visibilityHint: "Hint: Enable/disable visibility of overview area.",
      fieldNameHint: "Hint: Select field name.",
      paramNameHint: "Hint: Select parameter name.",
      imgTimeoutHintText: "Hint: Specify numeric value for highlight animation timeout.",
      imageHeightHintText: "Hint: Specify numeric value for image height.",
      imageWidthHintText: "Hint: Specify numeric value for image width.",
      selectImageHintText: "Hint: Please click on the image to select any other highlighter image.",
      inputTextHint: "Hint:Build your expression above by selectig input,output and fieldnames",
      expressionHint: "Hint: Select items and click add to build expression"
    },
    // Symbol chooser
    symbolSelecter: {
      selectSymbolLabel: "Select symbol from SymbolChooser",
      okButton: "OK",
      symbolPreviewLabal: "Preview"
    }
  }
});