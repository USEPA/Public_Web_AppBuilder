define(
   ({
    _widgetLabel: "แก้ไขแอตทริบิวต์ของชุดงาน",
    widgetIntroSelectByArea: "ใช้เครื่องมือด้านล่างเพื่อสร้างชุดการเลือกคุณสมบัติที่ต้องการปรับปรุง หากเป็นข้อมูลแถว <font class=\'maxRecordInIntro\'>เน้น</font> เกินจำนวนสูงสุดของเรกคอร์ด",
    widgetIntroSelectByFeature: "ใช้เครื่องมือด้านล่างเพื่อเลือกคุณสมบัติจาก<font class=\'layerInIntro\'>${0}</font> ชั้นข้อมูล.  คุณสมบัตินี้จะถูกนำมาใช้และปรับปรุงคุณสมบัติการ intersec ทั้งหมด  ถ้าเป็นข้อมูลแถว<font class=\'maxRecordInIntro\'>เน้น</font> เกินจำนวนสูงสุดของเรกคอร์ด",
    widgetIntroSelectByFeatureQuery: "ใช้เครื่องมือด้านล่างเพื่อเลือกคุณสมบัติจาก <font class=\'layerInIntro\'>${0}</font>.  คุณลักษณะของ <font class=\'layerInIntro\'>${1}</font> คุณลักษณะที่จะใช้ในการค้นหาชั้นข้อมูลที่อยู่ด้านล่างและปรับปรุงคุณสมบัติที่เกิดขึ้นถ้าเป็นข้อมูลแถว <font class=\'maxRecordInIntro\'>เน้น</font> เกินจำนวนสูงสุดของเรกคอร์ด",
    widgetIntroSelectByQuery: "ป้อนค่าเพื่อสร้างการตั้งค่าที่เลือก ถ้าเป็นข้อมูลแถว <font class=\'maxRecordInIntro\'>เน้น</font> เกินจำนวนสูงสุดของเรกคอร์ด",
    layerTable: {
      colLabel: "ชื่อชั้นข้อมูล",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "ไม่มีชั้นข้อมูลที่สามารถกำหนดค่าการแก้ไขได้",
    editorPopupTitle: "แก้ไขแอตทริบิวต์ของชุดงาน",
    editorPopupSaveBtn: "บันทึก",
    editorPopupMultipleValues: "",
    clear: "ชัดเจน",
    featuresUpdated: "${0} / ${1} คุณลักษณะที่มีการอัพเดต",
    featuresSelected: "${0} คุณลักษณะที่เลือก",
    featuresSkipped: "ข้าม",
    search: "ค้นหา",
    queryInput: "ระบุค่าในการค้นหา",
    noFilterTip: "หากไม่กำหนดตัวกรอง  แบบสอบถามนี้จะแสดงรายการคุณลักษณะทั้งหมดในแหล่งข้อมูลที่ระบุ",
    setFilterTip: "โปรดตั้งค่าตัวกรองให้ถูกต้อง",
    filterPopup: "ตัวกรองชั้นข้อมูล",
    cancel: "ยกเลิก",
    ok: "ตกลง",
    drawBox: {
      point: "จุด",
      line: "เส้น",
      polyline: "เส้น",
      freehandPolyline: "การวาดเส้นหลายเส้นด้วยมือเปล่า",
      extent: "ขอบเขต",
      polygon: "พื้นที่",
      freehandPolygon: "การวาดรูปหลายเหลี่ยมด้วยมือเปล่า",
      clear: "ชัดเจน",
      addPointToolTip: "คลิกเพื่อเลือกในพื้นที่นี้",
      addShapeToolTip: "วาดรูปร่างเพื่อเลือกคุณสมบัติ",
      freehandToolTip: "กดค้างไว้เพื่อวาดรูปร่างเพื่อเลือกคุณสมบัติ",
      startToolTip: "วาดรูปร่างเพื่อเลือกคุณสมบัติ"
    },
    errors: {
      layerNotFound: "ชั้นข้อมูล ${0} กับ ID ${1} ไม่พบในแผนที่  แผนที่อาจมีการเปลี่ยนแปลงตั้งแต่การตั้งค่าเครื่องมือ",
      queryNullID: "คุณลักษณะจาก ${0} ถูกส่งกลับเนื่องจาก ID ไม่ถูกต้อง",
      noSelectedLayers: "ไม่ได้เลือกชั้นข้อมูลจากเรคคอร์ดที่มีการอัพเดต",
      inputValueError: "ค่าอยู่ในรูปแบบที่ไม่ถูกต้อง"
    }
  })
);
