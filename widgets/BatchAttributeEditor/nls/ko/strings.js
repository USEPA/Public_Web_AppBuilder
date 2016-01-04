define(
   ({
    _widgetLabel: "일괄처리 속성 편집기",
    widgetIntroSelectByArea: "피처 모음을 선택하여 업데이트하려면 아래 도구 중 하나를 선택합니다. 행이 <font class=\'maxRecordInIntro\'>강조</font>된 경우 최대 레코드 수가 초과된 것입니다.",
    widgetIntroSelectByFeature: "<font class=\'layerInIntro\'>${0}</font> 레이어에서 피처를 선택하려면 아래 도구를 사용합니다. 이 피처는 교차되는 모든 피처를 선택하고 업데이트하는 데 사용됩니다. 행이 <font class=\'maxRecordInIntro\'>강조</font>된 경우 최대 레코드 수가 초과된 것입니다.",
    widgetIntroSelectByFeatureQuery: "<font class=\'layerInIntro\'>${0}</font> 레이어에서 피처를 선택하려면 아래 도구를 사용합니다. 이 피처의 <font class=\'layerInIntro\'>${1}</font> 속성은 아래 레이어를 쿼리하고 결과 피처를 업데이트하는 데 사용됩니다. 행이 <font class=\'maxRecordInIntro\'>강조</font>된 경우 최대 레코드 수가 초과된 것입니다.",
    widgetIntroSelectByQuery: "피처 모음을 선택하는 값을 입력합니다. 행이 <font class=\'maxRecordInIntro\'>강조</font>된 경우 최대 레코드 수가 초과된 것입니다.",
    layerTable: {
      colLabel: "레이어 이름",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "구성된 편집 가능한 레이어 없음",
    editorPopupTitle: "일괄처리 속성 편집기",
    editorPopupSaveBtn: "저장",
    editorPopupMultipleValues: "",
    clear: "선택 해제",
    featuresUpdated: "피처 ${0}/${1}개 업데이트함",
    featuresSelected: "피처 ${0}개 선택함",
    featuresSkipped: "무시함",
    search: "검색",
    queryInput: "쿼리할 값 입력",
    noFilterTip: "필터 식이 정의되지 않으면 이 쿼리 작업은 지정된 데이터 원본의 모든 피처를 나열합니다.",
    setFilterTip: "필터를 올바르게 설정하세요.",
    filterPopup: "레이어 필터",
    cancel: "취소",
    ok: "확인",
    drawBox: {
      point: "포인트",
      line: "라인",
      polyline: "폴리라인",
      freehandPolyline: "자유곡선 폴리라인",
      extent: "범위",
      polygon: "폴리곤",
      freehandPolygon: "자유곡선 폴리곤",
      clear: "선택 해제",
      addPointToolTip: "이 면적에서 클릭하여 선택합니다.",
      addShapeToolTip: "모양을 그려 피처를 선택합니다.",
      freehandToolTip: "길게 누르고 모양을 그려 피처를 선택합니다.",
      startToolTip: "모양을 그려 피처를 선택합니다."
    },
    errors: {
      layerNotFound: "ID가 ${1}인 ${0} 레이어를 이 맵에서 찾을 수 없습니다. 위젯 구성 후 맵이 변경된 것 같습니다.",
      queryNullID: "${0}의 피처가 잘못된 ID를 반환했습니다.",
      noSelectedLayers: "업데이트할 레코드와 함께 선택된 레이어가 없습니다.",
      inputValueError: "양식의 값이 잘못되었습니다."
    }
  })
);
