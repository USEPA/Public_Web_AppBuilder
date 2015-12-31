define(
   ({
    _widgetLabel : "Tra cứu Địa lý",
    description : "Duyệt đến hoặc Kéo <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'> trang tính </a> tại đây để mô phỏng và thêm các dữ liệu bản đồ vào trang tính đó.",
    selectCSV : "Chọn một CSV",
    loadingCSV : "Đang tải CSV",
    savingCSV: "Xuất CSV",
    clearResults : "Xóa",
    downloadResults : "Tải xuống",
    plotOnly : "Chỉ các Điểm Vẽ bản đồ",
    plottingRows : "Hàng vẽ bản đồ",
    messages : "Thông báo",
    error : {
      fetchingCSV : 'Đã xảy ra lỗi khi truy xuất các mục từ kho lưu trữ CSV: ${0}',
      fileIssue : 'Không xử lý được tệp.',
      notCSVFile : 'Hiện chỉ hỗ trợ các tệp được ngăn cách bằng dấu phẩy (.csv).',
      invalidCoord : 'Trường vị trí không hợp lệ. Vui lòng kiểm tra .csv.',
      tooManyRecords : 'Rất tiếc, hiện không được có quá ${0} bản ghi.'
    },
    results : {
      csvLoaded : "Đã tải ${0} bản ghi từ tệp CSV",
      recordsPlotted : "Đã định vị ${0}/${1} bản ghi trên bản đồ",
      recordsEnriched : "Đã xử lý ${0}/${1}, đã bổ sung ${2} so với ${3}",
      recordsError : "${0} bản ghi có lỗi",
      recordsErrorList : "Hàng ${0} có sự cố",
      label: "Kết quả CSV"
    }
  })
);
