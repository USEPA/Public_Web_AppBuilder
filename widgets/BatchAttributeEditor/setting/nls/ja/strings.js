define(
   ({
    page1: {
      selectToolHeader: "一括して更新するレコードを選択する方法を選択します。",
      selectToolDesc: "このウィジェットは、更新するレコードの選択セットを生成する 3 つの方法をサポートしています。これらの方法のうち選択できるのは 1 つだけです。2 つ以上が必要な場合は、ウィジェトの新規インスタンスを作成してください。",
      selectByShape: "エリアによる選択",
      selectBySpatQuery: "フィーチャによる選択",
      selectByAttQuery: "フィーチャおよび関連フィーチャによる選択",
      selectByQuery: "クエリによる選択",
      toolNotSelected: "選択方法を選択してください。"
    },
    page2: {
      layersToolHeader: "更新するレイヤーおよび、もしあれば、選択ツールのオプションを選択してください。",
      layersToolDesc: "1 ページ目で選択した選択方法が、以下に示されたレイヤーのセットの選択および更新に使用されます。複数のレイヤーのチェックボックスをオンにした場合、共通する編集可能なフィールドのみが、更新に使用可能になります。選択ツールの選択に応じて、その他のオプションの指定が必要になります。",
      layerTable: {
        colUpdate: "更新",
        colLabel: "レイヤー",
        colSelectByLayer: "レイヤーによる選択",
        colSelectByField: "クエリ フィールド",
        colhighlightSymbol: "ハイライト シンボル"
      },
      toggleLayers: "開いたときと閉じたときのレイヤーの表示設定を切り替える",
      noEditableLayers: "編集可能なレイヤーがありません",
      noLayersSelected: "進む前に 1 つ以上のレイヤーを選択してください"
    },
    page3: {
      commonFieldsHeader: "一括して更新するフィールドを選択してください。",
      commonFieldsDesc: "共通する編集可能なフィールドのみが以下に表示されます。更新するフィールドを選択してください。異なるレイヤーの同じフィールドが異なるドメインを持っている場合、1 つのドメインのみが表示されて使用されます。",
      noCommonFields: "共通のフィールドがありません",
      fieldTable: {
        colEdit: "編集可能",
        colName: "名前",
        colAlias: "エイリアス",
        colAction: "操作"
      }
    },
    tabs: {
      selection: "選択タイプの定義",
      layers: "更新するレイヤーの定義",
      fields: "更新するフィールドの定義"
    },
    errorOnOk: "構成を保存する前に、すべてのパラメーターに入力してください",
    next: "次へ",
    back: "戻る",
    save: "シンボルの保存",
    cancel: "キャンセル",
    ok: "OK",
    symbolPopup: "シンボルの選択"
  })
);
