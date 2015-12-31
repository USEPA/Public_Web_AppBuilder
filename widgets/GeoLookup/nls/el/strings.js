define(
   ({
    _widgetLabel : "GeoLookup",
    description : "Μεταβείτε σε ένα ή μεταφέρετε ένα <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> υπολογιστικό φύλλο </a> σε αυτό το σημείο, για απεικόνιση και προσάρτηση δεδομένων χάρτη σε αυτό.",
    selectCSV : "Επιλέξτε CSV",
    loadingCSV : "Φόρτωση CSV",
    savingCSV: "CSVExport",
    clearResults : "Απαλοιφή",
    downloadResults : "Λήψη",
    plotOnly : "Μόνο σημεία σχεδίασης",
    plottingRows : "Σειρές σχεδίασης",
    messages : "Μηνύματα",
    error : {
      fetchingCSV : 'Σφάλμα κατά τη λήψη αντικειμένων από τον χώρο αποθήκευσης CSV: ${0}',
      fileIssue : 'Δεν ήταν δυνατή η επεξεργασία του αρχείου.',
      notCSVFile : 'Προς το παρόν υποστηρίζονται μόνο αρχεία διαχωρισμένα με κόμματα (.csv).',
      invalidCoord : 'Τα πεδία τοποθεσίας δεν είναι έγκυρα. Ελέγξτε το αρχείο .csv.',
      tooManyRecords : 'Δυστυχώς, προς το παρόν δεν επιτρέπονται περισσότερες από ${0} εγγραφές.'
    },
    results : {
      csvLoaded : "Φορτώθηκαν ${0} εγγραφές από το αρχείο CSV",
      recordsPlotted : "Εντοπίστηκαν ${0}/${1} εγγραφές στον χάρτη",
      recordsEnriched : "Έγινε επεξεργασία ${0}/${1}, εμπλουτίστηκαν ${2} από ${3}",
      recordsError : "${0} εγγραφές είχαν σφάλματα",
      recordsErrorList : "Η σειρά ${0} είχε κάποιο πρόβλημα",
      label: "Αποτελέσματα CSV"
    }
  })
);
