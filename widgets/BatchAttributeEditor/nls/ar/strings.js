define(
   ({
    _widgetLabel: "محرر بيانات جدولية دَفعِي",
    widgetIntroSelectByArea: "استخدام إحدى الأدوات المدرجة أدناه لإنشاء مجموعة محددة من المعالم لتحديثها.  إذا تم <font class=\'maxRecordInIntro\'>تمييز</font>الصف، سيتم تجاوز الحد الأقصى من عدد السجلات.",
    widgetIntroSelectByFeature: "استخدم الأداة أدناه لتحديد معلم من طبقة <font class=\'layerInIntro\'>${0}</font>.  وسيتم استخدام هذا المعلم لتحديد كل المعالم المتقاطعة وتحديثها.  إذا تم <font class=\'maxRecordInIntro\'>تمييز</font>الصف، سيتم تجاوز الحد الأقصى من عدد السجلات.",
    widgetIntroSelectByFeatureQuery: "استخدم الأداة أدناه لتحديد معلم من <font class=\'layerInIntro\'>${0}</font>.  سيتم استخدام جدول بيانات <font class=\'layerInIntro\'>${1}</font> هذا المعلم للاستعلام عن الطبقات أدناه، كما سيتم تحديث المعالم الناتجة.  إذا تم <font class=\'maxRecordInIntro\'>تمييز</font>الصف، سيتم تجاوز الحد الأقصى من عدد السجلات.",
    widgetIntroSelectByQuery: "أدخل قيمة لإنشاء مجموعة تحديد,  إذا تم <font class=\'maxRecordInIntro\'>تمييز</font>الصف، سيتم تجاوز الحد الأقصى من عدد السجلات.",
    layerTable: {
      colLabel: "اسم الطبقة",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "لم يتم تكوين طبقات قابلة للتحرير",
    editorPopupTitle: "محرر بيانات جدولية دَفعِي",
    editorPopupSaveBtn: "حفظ",
    editorPopupMultipleValues: "",
    clear: "مسح",
    featuresUpdated: "تم تحديث ${0} / ${1} معلم",
    featuresSelected: "تم تحديد ${0} معلم",
    featuresSkipped: "تجاوز",
    search: "بحث",
    queryInput: "أدخل قيمة للاستعلام عنها",
    noFilterTip: "بدون تعريف تعبير عوامل التصفية، ستقوم هذه المهمة بإدراج جميع المعالم في مصدر البيانات المًحدد.",
    setFilterTip: "يرجى تعيين عامل التصفية بشكل صحيح.",
    filterPopup: "طبقة التصفية",
    cancel: "إلغاء الأمر",
    ok: "موافق",
    drawBox: {
      point: "نقطة",
      line: "الخط",
      polyline: "متعدد الخطوط",
      freehandPolyline: "خط يدوي حر متعدد",
      extent: "المدى",
      polygon: "مضلع",
      freehandPolygon: "مضلع مسوم بخط يدوي حر",
      clear: "مسح",
      addPointToolTip: "انقر للتحديد في هذه المنطقة",
      addShapeToolTip: "ارسم شكلاً لتحديد المعالم",
      freehandToolTip: "اضغط مع متابعة الضغط لرسم شكل لتحديد المعالم",
      startToolTip: "ارسم شكلاً لتحديد المعالم"
    },
    errors: {
      layerNotFound: "لم يتم العثور على طبقة ${0} ذات المُعرّف ${1} في الخريطة، وقد يتم تغيير الخريطة بسبب تكوين عناصر واجهة الاستخدام",
      queryNullID: "قم معلم ${0} بإرجاع مُعرّف غير صحيح.",
      noSelectedLayers: "لا توجد طبقات محددة ذات سجلات لتحديدها",
      inputValueError: "قيمة غير صحيحة في النموذج"
    }
  })
);
