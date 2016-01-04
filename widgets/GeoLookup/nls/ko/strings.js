define(
   ({
    _widgetLabel : "지오룩업",
    description : "여기에서 <a href=\'./widgets/GeoLookup/data/sample.csv\' tooltip=\'Download an example sheet\' target=\'_blank\'>스프레드시트</a>를 찾거나 드래그하여 시각화하고 맵 데이터를 추가합니다.",
    selectCSV : "CSV 선택",
    loadingCSV : "CSV를 불러오는 중",
    savingCSV: "CSV 내보내기",
    clearResults : "선택 해제",
    downloadResults : "다운로드",
    plotOnly : "포인트만 그리기",
    plottingRows : "행 그리기",
    messages : "메시지",
    error : {
      fetchingCSV : 'CSV 저장소에서 항목 불러오기 오류: ${0}',
      fileIssue : '파일을 처리할 수 없습니다.',
      notCSVFile : '지금은 쉼표로 구분된 파일(.csv)만 지원됩니다.',
      invalidCoord : '위치 필드가 잘못되었습니다. .csv를 확인하세요.',
      tooManyRecords : '죄송합니다. 현재 ${0}개를 초과하는 레코드는 허용되지 않습니다.'
    },
    results : {
      csvLoaded : "CSV 파일에서 ${0}개의 레코드를 불러왔습니다.",
      recordsPlotted : "맵에서 ${0}/${1}개 레코드를 찾았습니다.",
      recordsEnriched : "${0}/${1}개가 처리되었습니다. ${2}이(가) ${3}에 대해 보강되었습니다.",
      recordsError : "${0}개 레코드에 오류가 있습니다.",
      recordsErrorList : "${0}개 행에 문제가 있습니다.",
      label: "CSV 결과"
    }
  })
);
