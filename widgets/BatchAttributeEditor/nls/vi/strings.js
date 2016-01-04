define(
   ({
    _widgetLabel: "Trình biên tập Thuộc tính Theo đợt",
    widgetIntroSelectByArea: "Sử dụng một trong những công cụ bên dưới để tạo tập hợp đối tượng được chọn để cập nhật. Nếu hàng được <font class=\'maxRecordInIntro\'>tô sáng</font> thì sẽ vượt quá số bản ghi tối đa.",
    widgetIntroSelectByFeature: "Sử dụng công cụ bên dưới để chọn một đối tượng từ lớp <font class=\'layerInIntro\'>${0}</font>. Chúng ta sẽ sử dụng đối tượng này để chọn và cập nhật tất cả các đối tượng giao cắt. Nếu hàng được <font class=\'maxRecordInIntro\'>tô sáng</font> thì sẽ vượt quá số lượng bản ghi tối đa.",
    widgetIntroSelectByFeatureQuery: "Sử dụng công cụ bên dưới để chọn một đối tượng từ <font class=\'layerInIntro\'>${0}</font>. Chúng ta sẽ sử dụng thuộc tính <font class=\'layerInIntro\'>${1}</font> của đối tượng này để truy vấn các lớp bên dưới và cập nhật đối tượng kết quả. Nếu hàng được <font class=\'maxRecordInIntro\'>tô sáng</font> thì sẽ vượt quá số lượng bản ghi tối đa.",
    widgetIntroSelectByQuery: "Nhập giá trị để tạo tập hợp lựa chọn. Nếu hàng được <font class=\'maxRecordInIntro\'>tô sáng</font> thì sẽ vượt quá số lượng bản ghi tối đa.",
    layerTable: {
      colLabel: "Tên lớp",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "Không có lớp có thể chỉnh sửa nào được cấu hình",
    editorPopupTitle: "Trình biên tập Thuộc tính Theo đợt",
    editorPopupSaveBtn: "Lưu",
    editorPopupMultipleValues: "",
    clear: "Xóa",
    featuresUpdated: "Đã cập nhật (các) đối tượng ${0} / ${1}",
    featuresSelected: "Đã chọn ${0} đối tượng",
    featuresSkipped: "Đã vượt qua",
    search: "Tìm kiếm",
    queryInput: "Nhập giá trị để truy vấn",
    noFilterTip: "Nếu biểu thức bộ lọc không được xác định, tác vụ truy vấn này sẽ liệt kê tất cả các đối tượng trong nguồn dữ liệu đã chỉ định.",
    setFilterTip: "Vui lòng thiết lập bộ lọc chính xác.",
    filterPopup: "Lớp Lọc",
    cancel: "Hủy",
    ok: "OK",
    drawBox: {
      point: "Điểm",
      line: "Đường",
      polyline: "Hình nhiều đường",
      freehandPolyline: "Đa tuyến vẽ tay",
      extent: "Phạm vi",
      polygon: "Hình đa giác",
      freehandPolygon: "Đa giác vẽ tay",
      clear: "Xóa",
      addPointToolTip: "Bấm để chọn trong diện tích này",
      addShapeToolTip: "Vẽ một hình để chọn đối tượng",
      freehandToolTip: "Nhấn và giữ để vẽ một hình để chọn đối tượng",
      startToolTip: "Vẽ một hình để chọn đối tượng"
    },
    errors: {
      layerNotFound: "Không tìm thấy lớp ${0} có ID ${1} trong bản đồ, bản đồ có thể đã thay đổi do cấu hình của các tiện ích",
      queryNullID: "Đối tượng từ ${0} đã trả về ID không hợp lệ",
      noSelectedLayers: "Không có lớp được chọn nào có bản ghi cần cập nhật",
      inputValueError: "Giá trị không hợp lệ trong biểu mẫu"
    }
  })
);
