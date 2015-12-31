define(
   ({
    _widgetLabel: "Toplu Öznitelik Düzenleyici",
    widgetIntroSelectByArea: "Aşağıdaki araçlardan birini kullanarak seçili güncellenecek detay kümesi oluşturun.  Satır <font class=\'maxRecordInIntro\'>vurgulanırsa</font>, kayıt sayısı üst sayısı aşılmış demektir.",
    widgetIntroSelectByFeature: "Aşağıdaki aracı kullanarak <font class=\'layerInIntro\'>${0}</font> katmanından bir detay seçin.  Bu detay tüm kesişen detayları seçmek ve güncellemek için kullanılacak.  Satır <font class=\'maxRecordInIntro\'>vurgulanırsa</font>, kayıt sayısı üst sayısı aşılmış demektir.",
    widgetIntroSelectByFeatureQuery: "Aşağıdaki aracı kullanarak <font class=\'layerInIntro\'>${0}</font> içinden bir detay seçin.  Bu detayın <font class=\'layerInIntro\'>${1}</font> özniteliği kullanılarak aşağıdaki katmanlar sorgulanacak ve ortaya çıkan detaylar güncellenecek.  Satır <font class=\'maxRecordInIntro\'>vurgulanırsa</font>, kayıt sayısı üst sayısı aşılmış demektir.",
    widgetIntroSelectByQuery: "Seçim kümesi oluşturmak için bir değer girin.  Satır <font class=\'maxRecordInIntro\'>vurgulanırsa</font>, kayıt sayısı üst sayısı aşılmış demektir.",
    layerTable: {
      colLabel: "Katman Adı",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Yapılandırılmış düzenlenebilir katman yok",
    editorPopupTitle: "Toplu Öznitelik Düzenleyici",
    editorPopupSaveBtn: "Kaydet",
    editorPopupMultipleValues: "",
    clear: "Temizle",
    featuresUpdated: "${0} / ${1} detay güncellendi",
    featuresSelected: "${0} detay seçildi",
    featuresSkipped: "Atlandı",
    search: "Ara",
    queryInput: "Sorgulanacak değer girin",
    noFilterTip: "Tanımlı filtre ifadesi olmadan, bu sorgu görevi belirtilen veri kaynağındaki tüm detayları listeleyecektir.",
    setFilterTip: "Filtreyi düzgün şekilde ayarlayın.",
    filterPopup: "Katmanı Filtrele",
    cancel: "İptal",
    ok: "Tamam",
    drawBox: {
      point: "Nokta",
      line: "Çizgi",
      polyline: "Çoklu çizgi",
      freehandPolyline: "Serbest Çizim Çoklu Çizgi",
      extent: "Yayılım",
      polygon: "Poligon",
      freehandPolygon: "Serbest Çizim Alan",
      clear: "Temizle",
      addPointToolTip: "Bu alanda seçim yapmak için tıklayın",
      addShapeToolTip: "Detay seçmek için şekil çizin",
      freehandToolTip: "Detay seçmek üzere şekil çizmek için basın ve basılı tutun",
      startToolTip: "Detay seçmek için şekil çizin"
    },
    errors: {
      layerNotFound: "${1} kimlikli ${0} katmanı haritada bulunamadı, araç yapılandırmasından sonra harita değiştirilmiş olabilir",
      queryNullID: "${0} detayı geçersiz bir kimlik döndürdü",
      noSelectedLayers: "Güncellenecek kayıt içeren seçili katman yok",
      inputValueError: "Formda geçersiz değer var"
    }
  })
);
