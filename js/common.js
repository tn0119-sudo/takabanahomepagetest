/* ==========================================================================
   common.js

   【このファイルの役割】
   全ページで共通して使うJavaScriptをまとめる。
   ・ヘッダーのスクロール検知(白背景への切り替え)
   ・スマホ用ハンバーガーメニューの開閉
   ・data/site.json を読み込んで、電話番号・営業時間などをHTMLに反映する

   【設計のポイント】
   グローバル変数を増やしすぎないよう、全体を1つの関数(即時実行関数)で
   包んでいます。これにより、他のJSファイルの変数と名前が衝突する事故を防ぎます。
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. ヘッダーのスクロール検知
     ------------------------------------------------------------------------
     スクロール量が一定を超えたら、header要素に "is-scrolled" クラスを付ける。
     見た目(透明→白背景)の切り替えは全てCSS側(common.css)で行っているので、
     JS側はクラスの付け外しだけを担当する。 */
  function setupHeaderScroll() {
    var header = document.querySelector(".js-header");
    if (!header) return;

    var SCROLL_THRESHOLD = 40; // このピクセル数を超えたら背景を白にする

    function updateHeaderState() {
      if (window.scrollY > SCROLL_THRESHOLD) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }

    // ページ読み込み時点でのスクロール位置も反映しておく(リロード時の対策)
    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState);
  }

  /* ------------------------------------------------------------------------
     2. スマホ用メニューの開閉
     ------------------------------------------------------------------------
     ハンバーガーアイコンをクリックするたびに、
     モバイルメニューの表示・非表示を切り替える。 */
  function setupMobileMenu() {
    var menuButton = document.querySelector(".js-menu-button");
    var mobileNav = document.querySelector(".js-mobile-nav");
    if (!menuButton || !mobileNav) return;

    menuButton.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      // スクリーンリーダー向けに、開閉状態を伝える
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    // メニュー内のリンクをクリックしたら、メニューを自動的に閉じる
    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------------------
     3. site.json の読み込みと反映
     ------------------------------------------------------------------------
     電話番号・営業時間・住所や、各ページ固有の文章など、
     「HTMLを触らずに内容を差し替えたいもの」は data/site.json に集約している。
     HTML側では下記のように data-site 系の属性で「どの項目を表示するか」を指定する。

       <span data-site="tel"></span>
       → site.json の "tel" の値がテキストとして入る

       <img data-site="rehabPage.pillars.0.image">
       → data-site の値がimg要素の場合は、src属性に反映される
         (キー名はrehabPageのようにドット区切りで階層をたどれる)

       <a data-site-tel-link href="#">
       → site.json の "tel" の値を使って href="tel:00000000000" が自動設定される

       <a data-site-href="googleMapUrl">
       → site.json の googleMapUrl の値がhrefになる

       <ul data-site-list="rehabPage.pillars.0.tags"></ul>
       → tags配列の中身が<li>として1つずつ描画される

     この仕組みにより、電話番号や各ページの文章が変わったときに
     HTMLを触らずJSONファイルだけを直せば良い状態にしている。
     (将来、site.jsonをスプレッドシートから自動生成する形に変えることも想定) */
  function loadSiteData() {
    fetch("data/site.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("site.jsonの読み込みに失敗しました: " + response.status);
        }
        return response.json();
      })
      .then(function (siteData) {
        applySiteData(siteData);
      })
      .catch(function (error) {
        // fetchは file:// で直接HTMLを開くと動作しないため(ブラウザのセキュリティ制限)、
        // 開発時はVS Codeの「Live Server」拡張機能などでローカルサーバー経由で開く必要がある。
        console.error(error);
      });
  }

  function applySiteData(siteData) {
    // data-site="キー名" を持つ要素すべてに、対応する値を反映する。
    // 通常の要素(p, span, h1など)はテキストとして流し込み、
    // img要素の場合だけは画像のパスとして扱い、src属性に反映する。
    document.querySelectorAll("[data-site]").forEach(function (el) {
      var key = el.getAttribute("data-site");
      var value = getNestedValue(siteData, key);
      if (value === undefined) return;

      if (el.tagName === "IMG") {
        el.src = value;
      } else {
        el.textContent = value;
      }
    });

    // 電話番号リンク(tel:)にも同じ値を反映する
    document.querySelectorAll("[data-site-tel-link]").forEach(function (el) {
      if (siteData.tel) {
        el.href = "tel:" + siteData.tel.replace(/-/g, "");
      }
    });

    // data-site-href="キー名" を持つ要素には、対応する値をリンク先(href)として設定する。
    // 例: <a data-site-href="googleMapUrl"> → site.json の googleMapUrl の値がhrefになる
    document.querySelectorAll("[data-site-href]").forEach(function (el) {
      var key = el.getAttribute("data-site-href");
      var value = getNestedValue(siteData, key);
      if (value !== undefined) {
        el.href = value;
      }
    });

    // data-site-list="キー名" を持つ要素(ul/olなど)には、
    // 対応する配列の中身を <li> として1つずつ描画する。
    // 例: <ul data-site-list="rehabPage.pillars.0.tags"></ul>
    //   → tags配列(文字列のリスト)の数だけ<li>が作られる。
    // タグの数が増減しても、この仕組みだけで対応できる。
    document.querySelectorAll("[data-site-list]").forEach(function (el) {
      var key = el.getAttribute("data-site-list");
      var list = getNestedValue(siteData, key);
      if (!Array.isArray(list)) return;

      el.innerHTML = list
        .map(function (itemText) {
          return "<li>" + itemText + "</li>";
        })
        .join("");
    });

    // 他のJSファイル(index.jsなど)からも site.json のデータを使えるように、
    // window配下に保存しておく。
    window.siteData = siteData;

    // site.json の読み込みが完了したタイミングで、
    // ページ独自の処理(店舗一覧の描画など)を行いたい場合のための合図。
    document.dispatchEvent(new CustomEvent("siteDataLoaded", { detail: siteData }));
  }

  // "rehabPage.hero.copy" のようなドット区切りの文字列から、
  // オブジェクトの階層をたどって値を取り出す共通関数。
  // 該当する値が無い場合は undefined を返す(呼び出し側でエラーにならないように)。
  function getNestedValue(data, dotSeparatedKey) {
    var keys = dotSeparatedKey.split(".");
    var current = data;

    for (var i = 0; i < keys.length; i++) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[keys[i]];
    }

    return current;
  }

  /* ------------------------------------------------------------------------
     4. 共通の描画ヘルパー
     ------------------------------------------------------------------------
     「ラベル+値」のカードを並べるだけの単純な一覧(営業時間カードなど)は、
     ページをまたいで何度も出てくるため、ここに1つだけ用意して使い回す。
     about.js / flow.js などのページ専用JSから window.SiteUtils.renderInfoCards
     という形で呼び出す。 */
  function renderInfoCards(containerEl, items) {
    if (!containerEl || !items) return;

    var html = items
      .map(function (item) {
        return (
          '<div class="card business-hours-card">' +
          '<p class="business-hours-card__label">' + item.label + "</p>" +
          '<p class="business-hours-card__value">' + item.value + "</p>" +
          "</div>"
        );
      })
      .join("");

    containerEl.innerHTML = html;
  }

  window.SiteUtils = {
    renderInfoCards: renderInfoCards
  };

  /* ------------------------------------------------------------------------
     初期化
     ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    setupHeaderScroll();
    setupMobileMenu();
    loadSiteData();
  });
})();
