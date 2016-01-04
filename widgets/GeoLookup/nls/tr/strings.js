define(
   ({
    _widgetLabel : "GeoLookup",
    description : "Bir <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> elektronik tabloyu </a> görselleştirmek ve harita verilerini eklemek için tabloya gidin veya onu buraya sürükleyin.",
    selectCSV : "CSV Seç",
    loadingCSV : "CSV Yükleniyor",
    savingCSV: "CSV Aktar",
    clearResults : "Temizle",
    downloadResults : "Yükle",
    plotOnly : "Yalnızca Yerleşim Noktaları",
    plottingRows : "Yerleşim satırları",
    messages : "İletiler",
    error : {
      fetchingCSV : 'CSV deposundan öğe alma hatası: ${0}',
      fileIssue : 'Dosya işlenemedi.',
      notCSVFile : 'Şu anda yalnızca virgülle ayrılmış dosyalar (.csv) destekleniyor.',
      invalidCoord : 'Konum alanları geçersiz. .csv dosyasını denetleyin.',
      tooManyRecords : 'Üzgünüz, şu an için ${0} kayıttan fazlası seçilemez.'
    },
    results : {
      csvLoaded : "CSV dosyasından ${0} kayıt yüklendi",
      recordsPlotted : "${0}/${1} kayıt haritada yerleştirildi",
      recordsEnriched : "${0}/${1} işlendi, ${2} tanesi ${3} ile zenginleştirildi",
      recordsError : "${0} kayıtta hata var",
      recordsErrorList : "${0}. satırda sorun var",
      label: "CSV Sonuçları"
    }
  })
);
