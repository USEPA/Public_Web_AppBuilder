define(
   ({
    _widgetLabel: "属性の一括編集",
    widgetIntroSelectByArea: "以下のツールのいずれかを使用して、更新するためのフィーチャの選択セットを作成します。行が<font class=\'maxRecordInIntro\'>ハイライト表示された</font>場合、レコードの最大数を超えています。",
    widgetIntroSelectByFeature: "以下のツールを使用して、<font class=\'layerInIntro\'>${0}</font> レイヤーからフィーチャを選択します。このフィーチャは、交差しているすべてのフィーチャの選択および更新に使用されます。行が<font class=\'maxRecordInIntro\'>ハイライト表示された</font>場合、レコードの最大数を超えています。",
    widgetIntroSelectByFeatureQuery: "以下のツールを使用して、<font class=\'layerInIntro\'>${0}</font> からフィーチャを選択します。このフィーチャの <font class=\'layerInIntro\'>${1}</font> 属性は、以下のレイヤーの検索、および検索で得られたフィーチャの更新に使用されます。行が<font class=\'maxRecordInIntro\'>ハイライト表示された</font>場合、レコードの最大数を超えています。",
    widgetIntroSelectByQuery: "値を入力して選択セットを作成します。行が<font class=\'maxRecordInIntro\'>ハイライト表示された</font>場合、レコードの最大数を超えています。",
    layerTable: {
      colLabel: "レイヤー名",
      numSelected: "#",
      colSyncStatus: ""
    },
    noConfiguredLayers: "編集可能なレイヤーが構成されていません",
    editorPopupTitle: "属性の一括編集",
    editorPopupSaveBtn: "保存",
    editorPopupMultipleValues: "",
    clear: "消去",
    featuresUpdated: "${0}/${1} 個のフィーチャが更新されました",
    featuresSelected: "${0} 個のフィーチャが選択されました",
    featuresSkipped: "バイパスされました",
    search: "検索",
    queryInput: "検索する値の入力",
    noFilterTip: "フィルターの条件式が定義されていない場合、このクエリ タスクは、指定したデータ ソース内のすべてのフィーチャをリストします。",
    setFilterTip: "フィルターを正しく設定してください。",
    filterPopup: "レイヤーのフィルター",
    cancel: "キャンセル",
    ok: "OK",
    drawBox: {
      point: "ポイント",
      line: "ライン",
      polyline: "ポリライン",
      freehandPolyline: "フリーハンド ポリライン",
      extent: "範囲",
      polygon: "ポリゴン",
      freehandPolygon: "フリーハンド ポリゴン",
      clear: "消去",
      addPointToolTip: "このエリア内でクリックして選択します",
      addShapeToolTip: "図形を描画してフィーチャを選択します",
      freehandToolTip: "マウス ボタンを押したまま図形を描画してフィーチャを選択します",
      startToolTip: "図形を描画してフィーチャを選択します"
    },
    errors: {
      layerNotFound: "ID ${1} を持つレイヤー ${0} がマップに見つかりませんでした。Web マップが、ウィジェットの構成後に変更された可能性があります。",
      queryNullID: "${0} のフィーチャが無効な ID を返しました",
      noSelectedLayers: "更新するレコードを持つレイヤーが選択されていません",
      inputValueError: "フォーム内の値が無効です。"
    }
  })
);
