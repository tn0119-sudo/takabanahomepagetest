/* ==========================================================================
   index.js

   【このファイルの役割】
   トップページだけで使うJavaScriptをまとめる。
   ・ファーストビューの写真スライダー
   ・お知らせ一覧の描画(data/news.json を読み込んで表示)
   ・店舗一覧の描画(data/site.json を読み込んで表示)

   共通処理(ヘッダーのスクロール検知など)は common.js にあるため、
   このファイルは「トップページ固有の見た目」だけに集中している。
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. ファーストビューの写真スライダー
     ------------------------------------------------------------------------
     やり方:
       1. スライドとなる要素(.hero__slide)をあらかじめ全部HTMLに書いておく
       2. 一定時間ごとに "is-active" クラスを次の要素へ付け替える
       3. 見た目の切り替え(フェード)はCSSのtransitionに任せる

     こうすることで、JSは「どの要素がis-activeか」を管理するだけのシンプルな
     役割に専念できる。 */
  function setupHeroSlider() {
    var slides = document.querySelectorAll(".js-hero-slide");
    if (slides.length === 0) return;

    var SLIDE_INTERVAL_MS = 5000; // 5秒ごとに切り替え
    var currentIndex = 0;

    function showSlide(index) {
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
    }

    // 最初のスライドを表示
    showSlide(currentIndex);

    // 一定時間ごとに次のスライドへ切り替える
    setInterval(function () {
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    }, SLIDE_INTERVAL_MS);
  }

  /* ------------------------------------------------------------------------
     2. お知らせ一覧の描画
     ------------------------------------------------------------------------
     data/news.json を読み込み、新しい日付順に並んでいる前提で
     先頭から3件だけをトップページに表示する。
     (お知らせを増やしたいときは、news.jsonに追記するだけでよい) */
  function setupNewsList() {
    var newsListEl = document.querySelector(".js-news-list");
    if (!newsListEl) return;

    var MAX_NEWS_COUNT = 3;

    fetch("data/news.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("news.jsonの読み込みに失敗しました: " + response.status);
        }
        return response.json();
      })
      .then(function (newsList) {
        renderNewsList(newsListEl, newsList.slice(0, MAX_NEWS_COUNT));
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function renderNewsList(containerEl, newsList) {
    // innerHTMLをまとめて組み立ててから1回だけ差し込むことで、
    // 描画のたびにブラウザへ負荷をかけないようにする。
    var html = newsList
      .map(function (newsItem) {
        return (
          '<li class="news-item">' +
          '<span class="news-item__date">' + formatDate(newsItem.date) + "</span>" +
          '<span class="news-item__category">' + newsItem.category + "</span>" +
          '<a class="news-item__title" href="' + newsItem.url + '">' + newsItem.title + "</a>" +
          "</li>"
        );
      })
      .join("");

    containerEl.innerHTML = html;
  }

  // "2026-07-01" のような形式を "2026.07.01" のような表示用の形式に変換する
  function formatDate(dateString) {
    return dateString.replace(/-/g, ".");
  }

  /* ------------------------------------------------------------------------
     3. 店舗一覧の描画
     ------------------------------------------------------------------------
     店舗情報は data/site.json の "stores" と "currentStore" を使う。
     このホームページ自体がどの店舗のものかを "currentStore" で判定し、
     自分自身の店舗にはリンクボタンを表示しない(他の店舗にだけ表示する)。
     店舗が増えた場合も、site.jsonのstores配列に追記するだけで対応できる。

     site.json自体の読み込みは common.js が担当しているため、
     ここでは common.js が発行する "siteDataLoaded" というイベントを
     受け取ってから描画する(common.jsとindex.jsの役割分担を明確にするため)。 */
  function setupStoresList() {
    var storesListEl = document.querySelector(".js-stores-list");
    if (!storesListEl) return;

    document.addEventListener("siteDataLoaded", function (event) {
      var siteData = event.detail;
      if (siteData && siteData.stores) {
        renderStoresList(storesListEl, siteData);
      }
    });
  }

  function renderStoresList(containerEl, siteData) {
    var stores = siteData.stores || [];
    var currentStore = siteData.currentStore;

    // 店舗ごとのカードを作成する。
    // 画像は images/stores/ に "store-1.jpg" のような連番で用意する想定。
    var html = stores
      .map(function (store, index) {
        var imageNumber = index + 1;

        // このホームページ自体の店舗(currentStore)には、
        // 自分自身へのリンクボタンを表示しない。
        // それ以外の店舗にだけ「○○店のホームページはこちら」ボタンを表示する。
        var isCurrentStore = store.name === currentStore;
        var linkButtonHtml = isCurrentStore
          ? ""
          : '<a class="button button--navy" href="' +
            store.url +
            '" target="_blank" rel="noopener">' +
            store.name +
            "のホームページはこちら</a>";

        return (
          '<div class="card store-card">' +
          '<div class="store-card__image" style="background-image: url(images/stores/store-' +
          imageNumber +
          '.jpg);"></div>' +
          '<div class="store-card__body">' +
          '<p class="store-card__name">' + store.name + "</p>" +
          linkButtonHtml +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    containerEl.innerHTML = html;
  }

  /* ------------------------------------------------------------------------
     初期化
     ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    setupHeroSlider();
    setupNewsList();
    setupStoresList();
  });
})();
