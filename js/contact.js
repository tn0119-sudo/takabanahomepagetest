/* ==========================================================================
   contact.js

   【このファイルの役割】
   お問い合わせ・アクセスページ(contact.html)だけで使うJavaScript。
   data/contact.json を読み込んで文章を反映するほか、
   common.js が読み込んだ site.json の住所を使って、
   Googleマップの埋め込み表示を組み立てる。

   （考え方はrehab.js・about.js・flow.js・guide.jsと同じ） */

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
     1. contact.json の読み込み
     ------------------------------------------------------------------------ */
  function loadContactData() {
    fetch("data/contact.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("contact.jsonの読み込みに失敗しました: " + response.status);
        }
        return response.json();
      })
      .then(function (contactData) {
        applyContactData(contactData);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function applyContactData(contactData) {
    // data-contact="hero.title" のような属性を持つ要素すべてに、
    // 対応するテキストを流し込む(common.jsのdata-site属性と同じ考え方)。
    document.querySelectorAll("[data-contact]").forEach(function (el) {
      var path = el.getAttribute("data-contact");
      var value = getValueByPath(contactData, path);
      if (value !== undefined) {
        el.textContent = value;
      }
    });

    // ファーストビューの背景写真
    var heroImageEl = document.querySelector(".js-contact-hero-image");
    if (heroImageEl && contactData.hero && contactData.hero.image) {
      heroImageEl.style.backgroundImage = "url('" + contactData.hero.image + "')";
    }
  }

  /* ------------------------------------------------------------------------
     2. ④Googleマップの埋め込み
     ------------------------------------------------------------------------
     住所はsite.jsonの1箇所だけで管理したいため、ここでは持たない。
     common.jsがsite.jsonの読み込みを終えたタイミングで発行する
     "siteDataLoaded" イベントを受け取り、そのaddressを使って
     マップのiframeのsrcを組み立てる。 */
  function setupMapEmbed() {
    document.addEventListener("siteDataLoaded", function (event) {
      var siteData = event.detail;
      var mapFrameEl = document.querySelector(".js-map-frame");
      if (mapFrameEl && siteData && siteData.address) {
        mapFrameEl.src = "https://www.google.com/maps?q=" + encodeURIComponent(siteData.address) + "&output=embed";
      }
    });
  }

  /* ------------------------------------------------------------------------
     初期化
     ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    loadContactData();
    setupMapEmbed();
  });
})();
