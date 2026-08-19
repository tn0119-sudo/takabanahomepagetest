/* ==========================================================================
   flow.js

   【このファイルの役割】
   1日の流れページ(flow.html)だけで使うJavaScript。
   data/flow.json を読み込み、タイムラインなど各セクションの中身を描画する。

   共通処理(ヘッダーのスクロール検知・site.jsonの読み込みなど)は
   common.js が担当している(考え方はrehab.js・about.jsと同じ)。 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     0. 共通ヘルパー
     ------------------------------------------------------------------------ */
  function getValueByPath(data, path) {
    return path.split(".").reduce(function (value, key) {
      return value && value[key] !== undefined ? value[key] : undefined;
    }, data);
  }

  /* ------------------------------------------------------------------------
     1. flow.json の読み込み
     ------------------------------------------------------------------------ */
  function loadFlowData() {
    fetch("data/flow.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("flow.jsonの読み込みに失敗しました: " + response.status);
        }
        return response.json();
      })
      .then(function (flowData) {
        applyFlowData(flowData);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function applyFlowData(flowData) {
    // data-flow="hero.title" のような属性を持つ要素すべてに、
    // 対応するテキストを流し込む(common.jsのdata-site属性と同じ考え方)。
    document.querySelectorAll("[data-flow]").forEach(function (el) {
      var path = el.getAttribute("data-flow");
      var value = getValueByPath(flowData, path);
      if (value !== undefined) {
        el.textContent = value;
      }
    });

    // ファーストビューの背景写真
    var heroImageEl = document.querySelector(".js-flow-hero-image");
    if (heroImageEl && flowData.hero && flowData.hero.image) {
      heroImageEl.style.backgroundImage = "url('" + flowData.hero.image + "')";
    }

    renderTimeline(flowData);

    var containerEl = document.querySelector(".js-business-hours");
    window.SiteUtils.renderInfoCards(containerEl, flowData.businessHoursCards);
  }

  /* ------------------------------------------------------------------------
     2. ③タイムライン(このページのメインコンテンツ)の描画
     ------------------------------------------------------------------------
     item.size の値によって見た目の強弱をつける:
       - "featured" : 各種リハビリ。もっとも目立たせる
       - "minor"    : 脳トレ。控えめに扱う
       - それ以外   : 通常の項目

     featuredの項目だけ複数枚(images配列)の写真を使い、
     それ以外は1枚(image)を想定している。

     写真は、規則正しいグリッドではなく自然に散りばめて見せたいため、
     1枚写真にはCSS側で用意した5パターンの「散らし方(サイズ・向き・傾き)」を
     順番に(1→2→3→4→5→1…)割り当てている。singlePhotoIndexという通し番号を
     使うことで、隣り合う項目が同じパターンにならないようにしている。 */
  function renderTimeline(flowData) {
    var containerEl = document.querySelector(".js-timeline");
    if (!containerEl || !flowData.timeline) return;

    var singlePhotoIndex = 0;

    var html = flowData.timeline
      .map(function (item) {
        var photosHtml = buildPhotosHtml(item, singlePhotoIndex);
        if (item.image && (!item.images || item.images.length === 0)) {
          singlePhotoIndex += 1;
        }

        // 「各種リハビリ」のカードにだけ、リハビリ紹介ページへの小さなリンクを添える。
        // ページの流れを止めないよう、ボタンではなく控えめなテキストリンクにしている。
        var rehabLinkHtml =
          item.size === "featured"
            ? '<a class="timeline-item__rehab-link" href="rehab.html">' + flowData.rehabLinkLabel + "</a>"
            : "";

        return (
          '<div class="timeline-item timeline-item--' + item.size + '">' +
          '<p class="timeline-item__time timeline-item__time--am">' + item.amTime + "</p>" +
          '<div class="timeline-item__center">' +
          '<span class="timeline-item__marker"></span>' +
          '<div class="timeline-item__card">' +
          '<p class="timeline-item__title">' + item.title + "</p>" +
          photosHtml +
          '<p class="timeline-item__text">' + item.text + "</p>" +
          rehabLinkHtml +
          "</div>" +
          "</div>" +
          '<p class="timeline-item__time timeline-item__time--pm">' + item.pmTime + "</p>" +
          "</div>"
        );
      })
      .join("");

    containerEl.innerHTML = html;
  }

  /* 写真が複数(images)か、1枚(image)かで、組み立てるHTMLを分ける。
     どちらも無ければ、写真なしのまま(文章だけ)で表示する。 */
  function buildPhotosHtml(item, singlePhotoIndex) {
    if (item.images && item.images.length > 0) {
      // 複数枚の写真は、少し重なりを持たせた「集合写真風」のレイアウトにする。
      // 並び方(位置・サイズ・傾き)はCSS側(.timeline-item__photos--scatter)で
      // 1枚目〜4枚目それぞれに指定している。
      var multipleHtml = item.images
        .map(function (imagePath) {
          return '<div class="timeline-item__photo" style="background-image: url(\'' + imagePath + "');\"></div>";
        })
        .join("");
      return '<div class="timeline-item__photos timeline-item__photos--scatter">' + multipleHtml + "</div>";
    }

    if (item.image) {
      // 1枚写真は、5パターンの散らし方を順番に割り当てる
      var variant = (singlePhotoIndex % 5) + 1;
      return (
        '<div class="timeline-item__photo timeline-item__photo--v' + variant + '" ' +
        'style="background-image: url(\'' + item.image + "');\"></div>"
      );
    }

    return "";
  }

  /* ------------------------------------------------------------------------
     初期化
     ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    loadFlowData();
  });
})();
