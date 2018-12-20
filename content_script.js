// 検索ページの表示時に読み込まれる。
// ex ) https://www.google.co.jp/?*
// ex ) https://www.google.co.jp/search*
// 主に、検索結果の修正を行う。

blocklist.searchpage = {};

blocklist.searchpage.blocklist = [];

blocklist.searchpage.SEARCH_RESULT_DIV_BOX = "div.g";

blocklist.searchpage.PWS_REGEX = new RegExp('(&|[?])pws=0');

blocklist.searchpage.handleGetBlocklistResponse = function(response) {
  if (response.blocklist != undefined) {
    blocklist.searchpage.blocklist = response.blocklist;
  }
};

blocklist.searchpage.isHostLinkInBlocklist = function(hostlink) {
  if (blocklist.searchpage.blocklist.indexOf(hostlink) != -1) {
    return true;
  } else {
    return false;
  }
};

blocklist.searchpage.handleAddBlocklistFromSerachResult = function(response) {
  if (response.blocklist != undefined) {
    blocklist.searchpage.blocklist = response.blocklist;
  }
};

blocklist.searchpage.showAddBlocklistMessage = function(pattern, section) {
  let showMessage = document.createElement('p');
  showMessage.style.cssText = 'background:#dff0d8;color:#3c763d;padding:10px;';
  showMessage.innerHTML = '<b>' + pattern + '</b>をブロックリストに追加しました。';
  let parent = section.parentNode;
  parent.insertBefore(showMessage, section);
  let begin = new Date() - 0;
  setTimeout(function() {
    showMessage.style.visibility = "hidden";
  }, 1000);

}

blocklist.searchpage.deleteSectionsFromSearchResult = function(pattern){
  var searchResultPatterns = document.querySelectorAll(blocklist.searchpage.SEARCH_RESULT_DIV_BOX);

  for (let i = 0; i < searchResultPatterns.length; i++) {
    var searchResultPattern = searchResultPatterns[i];
    var searchResultHostLink = searchResultPattern.querySelector("div.r > a");
    if (searchResultHostLink) {
      var HostLinkHref = searchResultHostLink.getAttribute("href");
      var sectionLink  = HostLinkHref.replace(blocklist.common.HOST_REGEX, '$2');
      if(pattern === sectionLink){
        searchResultPattern.style.display = "none";
      }
    }
  }
};

blocklist.searchpage.addBlocklistFromSearchResult = function(hostlink, searchresult) {
  var pattern = hostlink;
  chrome.runtime.sendMessage({
      type: blocklist.common.ADD_TO_BLOCKLIST,
      pattern: pattern
    },
    blocklist.searchpage.handleAddBlocklistFromSerachResult);
  blocklist.searchpage.deleteSectionsFromSearchResult(pattern);
  blocklist.searchpage.showAddBlocklistMessage(pattern, searchresult);
};

blocklist.searchpage.insertAddBlockLinkInSearchResult = function(searchresult, hostlink) {
  var insertLink = document.createElement('p');
  insertLink.innerHTML = hostlink + 'をブロックする';
  insertLink.style.cssText =
    "color:#1a0dab;margin:0;text-decoration:underline;cursor: pointer;";
  searchresult.appendChild(insertLink);
  insertLink.onclick = function() {
    blocklist.searchpage.addBlocklistFromSearchResult(hostlink, searchresult);
  }
};

// パーソナライズ検索がオフの場合は、検索結果の修正を止める
blocklist.searchpage.isPwsParamUsed = function() {
  return blocklist.searchpage.PWS_REGEX.test(location.href);
};

blocklist.searchpage.modifySearchResults = function() {

  if (blocklist.searchpage.isPwsParamUsed()) {
    return;
  }

  var searchResultPatterns = document.querySelectorAll(blocklist.searchpage.SEARCH_RESULT_DIV_BOX);

  for (let i = 0; i < searchResultPatterns.length; i++) {
    var searchResultPattern = searchResultPatterns[i];
    var searchResultHostLink = searchResultPattern.querySelector("div.r > a");
    if (searchResultHostLink) {
      var HostLinkHref = searchResultHostLink.getAttribute("href");
      var HostLinkPattern = blocklist.common.handleHostLinkHref(HostLinkHref);

      if (blocklist.searchpage.isHostLinkInBlocklist(HostLinkPattern)) {
        searchResultPattern.style.display = "none";
      } else {
        blocklist.searchpage.insertAddBlockLinkInSearchResult(
          searchResultPattern, HostLinkPattern);
      }
    }
  }
};

// WebStorageに保存してあるblocklistを取得する
blocklist.searchpage.refreshBlocklist = function() {
  chrome.runtime.sendMessage({
      type: blocklist.common.GET_BLOCKLIST
    },
    blocklist.searchpage.handleGetBlocklistResponse);
};

blocklist.searchpage.refreshBlocklist();

// window.addEventListener("load",function(){
//   blocklist.searchpage.modifySearchResults()
// },false)
// では上手く動かない。代替案として、setTimeoutを使用。
// 200msである必要性はない。
setTimeout(function() {
  blocklist.searchpage.modifySearchResults();
}, 200);
