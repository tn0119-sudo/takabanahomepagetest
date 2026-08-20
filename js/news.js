/* ==========================================================================
   news.js

   【このファイルの役割】
   お知らせ一覧ページ(news.html)専用のJavaScript。
   data/news.json を読み込み、日付の新しい順に並べ替えてから全件表示する。

   トップページ(index.html)の「最新のお知らせ」表示は index.js が
   既に独自に持っているため、このファイルはnews.htmlだけで読み込む
   (index.htmlには追加しない)。

   お知らせを追記・編集したいときは data/news.json を編集するだけでよい。
   日付の並び順に関わらず、常に新しい日付順に並び替えて表示されるため、
   配列のどこに追記しても構わない。
   ========================================================================== */

(function () {
  "use strict";

  // "2026-07-01" のような形式を "2026.07.01" のような表示用の形式に変換する
  function formatDate(dateString) {
    return dateString.replace(/-/g, ".");
  }

  // 日付(date)が新しい順に並び替える。date文字列は "YYYY-MM-DD" 形式のため、
  // そのまま文字列比較しても日付順に並び替えられる。
  function sortByDateDesc(newsList) {
    return newsList.slice().sort(function (a, b) {
      if (a.date === b.date) return 0;
      return a.date < b.date ? 1 : -1;
    });
  }

  function renderNewsList(containerEl, newsList) {
    // innerHTMLをまとめて組み立ててから1回だけ差し込むことで、
    // 描画のたびにブラウザへ負荷をかけないようにする。
    // 個別のお知らせ記事ページは用意していないため、タイトルはリンクにはしない。
    var html = newsList
      .map(function (newsItem) {
        return (
          '<li class="news-item">' +
          '<span class="news-item__date">' + formatDate(newsItem.date) + "</span>" +
          '<span class="news-item__category">' + newsItem.category + "</span>" +
          '<span class="news-item__title">' + newsItem.title + "</span>" +
          "</li>"
        );
      })
      .join("");

    containerEl.innerHTML = html;
  }

  function setupNewsList() {
    var containerEl = document.querySelector(".js-news-list");
    if (!containerEl) return;

    fetch("data/news.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("news.jsonの読み込みに失敗しました: " + response.status);
        }
        return response.json();
      })
      .then(function (newsList) {
        var sortedList = sortByDateDesc(newsList);
        renderNewsList(containerEl, sortedList);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  document.addEventListener("DOMContentLoaded", setupNewsList);
})();
