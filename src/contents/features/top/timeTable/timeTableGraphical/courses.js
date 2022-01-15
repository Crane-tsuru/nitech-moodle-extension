import $ from 'jQuery';
import { isUndefined, isNullOrUndefined } from 'Lib/utils.js';
import promiseWrapper from 'Lib/promiseWrapper.js';

const coursesVersion = '0.0.0.2';

export async function getCourses() {
  // load courses
  const courseNumberTxtList = $('.course-listitem .text-muted div').text().slice(1).split('|'); // 取得してきたcourseの要素達
  if (isUndefined(courseNumberTxtList)) {
    console.error('[courses/getCourses] cannot load courseNumberTxtList');
    return undefined;
  }
  // console.log('courseNumberTxtList: ', courseNumberTxtList);

  const courseSize = $('.coursename').length;
  const courseList = loadCourseList();
  if (isUndefined(courseList)) {
    console.error('[courses/getCourses] cannot load courseList');
    return undefined;
  }
  // console.log('courseList: ', courseList);

  const oldCourses = (await promiseWrapper.storage.local.get('courses')).courses;
  console.log('oldCourses: ', oldCourses);

  return generateCourses(courseList, courseNumberTxtList, courseSize, oldCourses);
}

/**
 * courselist:
 * (授業名)(courseShortNumber)(前/後)期(月/...)曜(n-n')限_cls
 * SpecialCourseはcourseShortNumberが無い
 *
 * @return {Array} courseList
 */
function loadCourseList() {
  const courseList = $('.course-listitem .coursename')
    .text()
    .replace(/\s+/g, '')
    .split('コース星付きコース名');
  courseList.shift();

  return courseList;
}

/**
 * 取得してきたcourseの要素達から変換し、coursesを生成する。
 *
 * @param {Array} courseList: 通常コース: (授業名)(courseShortNumber)(前/後)期(月/...)曜(n-n')限_cls, 特殊コースはSpecialCourseはcourseShortNumberが無い。
 * @param {String} courseNumberTxtList: 授業番号表記(-あり)。 (-なしはshort付き)
 * @param {int} courseSize
 * @param {Object} oldCourses
 * @return {Object} courses = {term, shortYear, courseNumberTxt, shortCourseNumberTxt, name, dayOfWeeks = {月, 日}, times = {1-2, 9-10}, url} (ただし特殊授業の場合: term, dayOfWeek = undefined)
 */
function generateCourses(courseList, courseNumberTxtList, courseSize, oldCourses) {
  const courses = new Array(courseSize); // result
  courses.coursesVersion = coursesVersion;

  // 変数名がわかりづらいかもしれない
  const termArray = new Array(courseSize);
  const nameArray = new Array(courseSize);
  const dayOfWeeksArray = new Array(courseSize);
  const timesArray = new Array(courseSize);
  const urlArray = new Array(courseSize);
  for (let i = 0; i < courseSize; i++) {
    if (isUndefined(courseNumberTxtList[i])) {
      console.log('[courses/convertToCourses] courseNumberTxtList[i] is undefined.');
      continue;
    }
    if (isUndefined(courseList[i])) {
      console.log('[courses/convertToCourses] courseList[i] is undefined.');
      continue;
    }

    const shortCourseNumber = String(20) + courseNumberTxtList[i].replace(/-/g, ''); // -を消去し西暦と授業番号の組み合わせ、固有な値: 202010001 など
    const shortYear = courseNumberTxtList[i].split(new RegExp('-'))[0];
    const courseContainerArray = courseList[i]
      .split(new RegExp(shortCourseNumber + '|期|曜|限|_cls'))
      .filter(value => {
        return value != '';
      });
    // courseContainerArray: [授業名, (前/後), (月/...), (n-n'), ((月/...), (n-n'),) ...] ※複数時間に注意

    nameArray[i] = courseContainerArray[0];
    urlArray[i] = $('.course-listitem .coursename').eq(i).attr('href');

    if (courseContainerArray.length == 1) {
      // 特殊なクラス(時間割じゃないコース)
      termArray[i] = undefined;
      timesArray[i] = undefined;
    } else {
      // 通常クラス
      termArray[i] = courseContainerArray[1];

      // 週複数授業の曜日と時間(限)
      dayOfWeeksArray[i] = [];
      timesArray[i] = [];
      for (let j = 2; j < courseContainerArray.length; j += 2) {
        dayOfWeeksArray[i].push(courseContainerArray[j]);
        timesArray[i].push(courseContainerArray[j + 1]);
      }
    }

    courses[i] = {
      version: coursesVersion,
      term: termArray[i],
      shortYear: shortYear,
      courseNumberTxt: courseNumberTxtList[i],
      shortCourseNumber: shortCourseNumber,
      name: nameArray[i],
      dayOfWeeks: dayOfWeeksArray[i],
      times: timesArray[i],
      url: urlArray[i],
      isCompleted: getIsCompleted(oldCourses, nameArray[i]),
      completeDateTime: undefined,
    };
  }
  return courses;
}

function getIsCompleted(oldCourses, courseName) {
  if (
    !Array.isArray(oldCourses) ||
    oldCourses.length < 1 ||
    oldCourses.coursesVersion != coursesVersion
  ) {
    return false;
  }

  let isCompleted = false;

  const oldCourse = oldCourses.find(course => course.name == courseName);
  const oneDayTime = 1000 * 60 * 60 * 24; // millisec

  console.log('oldCourses, oldCourse: ', oldCourses, oldCourse);
  if (
    !isNullOrUndefined(oldCourse) &&
    !isNullOrUndefined(oldCourse.isCompleted) &&
    oldCourse.isCompleted
  ) {
    const now = Date.now();
    if (oldCourse.completeDate.completeDateTime - now <= oneDayTime) {
      // 完了時から現在の時間差が1日以下
      isCompleted = true;
    }
  }
  return isCompleted;
}
