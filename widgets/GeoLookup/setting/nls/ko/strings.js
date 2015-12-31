define(
   ({
    settingsHeader : "지오룩업 위젯에 대한 세부정보 설정",
    settingsDesc : "맵의 폴리곤 레이어에 대해 CSV 파일에서 위치 목록을 보강합니다. 폴리곤 레이어에서 선택한 필드가 위치에 추가됩니다.",
    settingsLoadingLayers: "레이어를 불러오는 동안 기다려 주세요.",
    settingsConfigureTitle: "레이어 필드 구성",
    layerTable : {
      colEnrich : "보강",
      colLabel : "레이어",
      colFieldSelector : "필드"
    },
    fieldTable : {
      colAppend : "추가",
      colName : "이름",
      colAlias : "별칭",
      colOrder : "순서",
      label : "추가할 필드를 선택합니다. 별칭을 변경하고, 순서를 정하고, 형식을 지정할 필드를 선택합니다."
    },
    symbolArea : {
      symbolLabelWithin : '다음 내에서 위치에 대한 심볼 선택:',
      symbolLabelOutside : '다음 바깥에서 위치에 대한 심볼 선택:'
    },
    advSettings : {
      label: "고급 설정",
      latFieldsDesc : "위도 필드에 사용할 수 있는 필드 이름입니다.",
      longFieldsDesc : "경도 필드에 사용할 수 있는 필드 이름입니다.",
      intersectFieldDesc : "조회 결과가 레이어와 교차하는 경우 값을 저장하기 위해 생성되는 필드 이름입니다.",
      intersectInDesc : "위치가 폴리곤과 교차할 때 저장되는 값입니다.",
      intersectOutDesc : "위치가 폴리곤과 교차하지 않을 때 저장되는 값입니다.",
      maxRowCount : "CSV 파일의 최대 행 수입니다.",
      cacheNumberDesc : "더 빠른 처리를 위한 포인트 군집 임계값입니다.",
      subTitle : "CSV 파일에 대한 값을 설정합니다."
    },
    noPolygonLayers : "폴리곤 레이어 없음",
    errorOnOk : "구성을 저장하기 전에 모든 매개변수를 입력하세요.",
    saveFields : "필드 저장",
    cancelFields : "필드 취소",
    saveAdv : "고급 설정 저장",
    cancelAdv : "고급 설정 취소",
    advSettingsBtn : "고급 설정",
    chooseSymbol: "심볼 선택",
    okBtn: "확인",
    cancelBtn: "취소"
  })
);
