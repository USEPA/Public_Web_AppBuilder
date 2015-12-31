define(
   ({
    _widgetLabel : "GeoLookup",
    description : "استعرض إلى <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> جدول البيانات </a> أو اسحبه هنا لتصوّر بيانات الخريطة وإلحاقها به.",
    selectCSV : "حدد CSV",
    loadingCSV : "Loading CSV",
    savingCSV: "CSVExport",
    clearResults : "مسح",
    downloadResults : "تنزيل",
    plotOnly : "نقاط قطع أرض فقط",
    plottingRows : "رسم صفوف",
    messages : "رسائل",
    error : {
      fetchingCSV : 'خطأ في إحضار العناصر من متجر CSV: ${0}',
      fileIssue : 'يتعذر معالجة الملف',
      notCSVFile : 'لا يتم دعم إلا الملفات المفصولة بفاصلة (CSV) حاليًا.',
      invalidCoord : 'حقول الموقع غير صحيحة. يرجى التأشير على .csv.',
      tooManyRecords : 'عذرًا، لا يوجد أكثر من ${0} سجل حاليًا.'
    },
    results : {
      csvLoaded : "تم تحميل ${0} سجل من ملف CSV",
      recordsPlotted : "يقع ${0}/${1} سجل على الخريطة",
      recordsEnriched : "تم معالجة ${0}/${1} وتحسين ${2} مقابل ${3}",
      recordsError : "${0} سجل يحتوي على أخطاء",
      recordsErrorList : "توجد مشكلة في صف ${0}",
      label: "نتائج CSV"
    }
  })
);
