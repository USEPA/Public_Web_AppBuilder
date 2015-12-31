define(
   ({
    _widgetLabel : "GeoLookup",
    description : "เรียกดูหรือลาก <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> สเปรดชีต</a> เข้ามาจะเห็นภาพ และผนวกข้อมูลแผนที่ได้",
    selectCSV : "เลือก CSV",
    loadingCSV : "โหลด CSV",
    savingCSV: "ส่งออก CSV",
    clearResults : "ชัดเจน",
    downloadResults : "ดาวน์โหลด",
    plotOnly : "จุดที่พล็อตเท่านั้น",
    plottingRows : "แถวที่พล๊อต",
    messages : "ข้อความ",
    error : {
      fetchingCSV : 'ข้อผิดพลาดในการเรียกรายการจากการจัดเก็บ CSV: $ {0}',
      fileIssue : 'ไฟล์ไม่สามารถประมวลผลได้',
      notCSVFile : 'เฉพาะไฟล์ที่คั่นด้วยเครื่องหมายจุลภาค (.csv) เป็นไฟล์ที่ได้รับการสนับสนุนในครั้งนี้',
      invalidCoord : 'ที่อยู่ของฟิลด์ไม่ถูกต้อง กรุณาตรวจสอบ .csv',
      tooManyRecords : 'ขออภัย  ต้องไม่เกิน ${0} เรกคอร์ดในขณะนี้.'
    },
    results : {
      csvLoaded : "${0} บันทึกจากไฟล์ CSV ที่ถูกโหลด",
      recordsPlotted : "${0}/${1} เรคคอร์ดมีแล้วอยู่บนแผนที่",
      recordsEnriched : "${0}/${1} ประมวลผล, ${2} ผสานกับ ${3}",
      recordsError : "${0} เรกคอร์ดมีข้อผิดพลาด",
      recordsErrorList : "แถว ${0} มีปัญหา",
      label: "ผลลัพธ์ CSV"
    }
  })
);
