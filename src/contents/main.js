import promiseWrapper from 'Lib/promiseWrapper.js';
import $ from 'jQuery';
import loadFeature from './featureLoader.js';

import extensionArea from 'Features/top/extensionArea/extensionArea.js';
import timeTable from 'Features/top/timeTable/timeTable.js';
import restoreNavigation from 'Features/general/restoreNavigation/restoreNavigation.js';
import restoreMiniCalendar from 'Features/general/restoreMiniCalendar/restoreMiniCalendar';
import deadlineUpdate from 'Features/top/deadlineUpdate/deadlineUpdate';
import calendar from 'Features/calendar/calendar.js'
import topMain from 'Features/top/top/top.js';
const features = [topMain, extensionArea, timeTable, restoreNavigation, restoreMiniCalendar, deadlineUpdate, calendar];

$(async function onLoad() {
  // pageのロードが終わった時
  // TODO: chrome拡張機能のapiでもok?

  console.log('[moodle assistant for NITech] page: ' + location.href);

  // オプションを読み込んで対応する処理を行う
  const options = await promiseWrapper.runtime.sendMessage({
    item: 'loadOptions',
  });
  console.log('response options: ', options);
  $('body').css('background-color', options.backgroundColor); // 背景色変更

  // ナビゲーションを非表示にして、動画表示サイズを大きくする(動画視聴時のみ…？)
  if (
    options.hideNavOnVideo === true &&
    location.href === 'https://cms6.ict.nitech.ac.jp/moodle38a/mod/scorm/player.php'
  ) {
    $('#page-content.blocks-pre').addClass('hidedenNavigation');
  }

  const topPageUrl = /^https:\/\/cms6.ict.nitech.ac.jp\/moodle38a\/my\/(#|(index.php))?/;
  let environment = '';
  if (topPageUrl.test(location.href)) {
    // topページでの処理
    environment = 'top';
  } else if (location.href === 'https://cms6.ict.nitech.ac.jp/moodle38a/login/index.php') {
    // loginページでの処理 -> 以降を処理しない
    environment = 'login';
    console.log('login page.');
    // return;
  } else {
    // topページ以外での処理
    environment = 'other';
    await onOtherPage(location.href);
  }

  // ポストプロセス
  console.log('[Preprocess Finished]');

  // featuerを読み込み
  loadFeature(features, environment);
});

async function onOtherPage(loc) {
  // topページ以外での処理
  // TODO: generalで良いと思われる
}