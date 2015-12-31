define(
   ({
    _widgetLabel : "חיפוש נתונים גיאוגרפיים",
    description : "נתב אל <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> גליון אלקטרוני </a> או גרור גליון אלקטרוני לכאן כדי ליצור תצוגה חזותית שלו ולהוסיף לו נתוני מפה.",
    selectCSV : "בחר קובץ CSV",
    loadingCSV : "טוען קובץ CSV",
    savingCSV: "CSVExport",
    clearResults : "נקה",
    downloadResults : "הורד",
    plotOnly : "נקודות תרשים בלבד",
    plottingRows : "שורות בתרשים",
    messages : "הודעות",
    error : {
      fetchingCSV : 'אירעה שגיאה בעת הבאת פריטים ממאגר CSV‏: ${0}',
      fileIssue : 'לא ניתן לעבד את הקובץ.',
      notCSVFile : 'רק קבצים המופרדים בפסיקים, קבצי (‎.csv) נתמכים כעת.',
      invalidCoord : 'שדות המיקום שגויים. בדוק את קובץ ה-csv.',
      tooManyRecords : 'מצטערים, ניתן להשתמש ב-${0} רשומות לכל היותר כעת.'
    },
    results : {
      csvLoaded : "נטענו ${0} רשומות מקובץ ה-CSV",
      recordsPlotted : "אותרו ${0}/${1} רשומות במפה",
      recordsEnriched : "${0}/${1} עובדו, ${2} הועשרו לעומת ${3}",
      recordsError : "ב-${0} רשומות נמצאו שגיאות",
      recordsErrorList : "נמצאה בעיה בשורה ${0}",
      label: "תוצאות CSV"
    }
  })
);
