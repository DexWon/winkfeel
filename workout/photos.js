/* 기구 사진 (libId → 사진 목록)
 * - 앱 제작자 촬영 사진: 아래 PHOTOS_OWN
 * - 위키미디어 공용 사진: photos-commons.js(자동 생성)의 PHOTOS_COMMONS
 */
'use strict';
const PHOTOS_OWN = {
  incline_press: [{ src: 'img/incline-press.jpg', caption: '인클라인 프레스 머신' }, { src: 'img/incline-press-guide.jpg', caption: '기구에 붙은 사용법 스티커' }],
  shoulder_press: [{ src: 'img/shoulder-press-guide.jpg', caption: '기구에 붙은 사용법 스티커' }],
  mts_row: [{ src: 'img/row-machine.jpg', caption: '로우 머신' }, { src: 'img/row-guide.jpg', caption: '기구에 붙은 사용법 스티커' }],
  front_pulldown: [{ src: 'img/pulldown-guide.jpg', caption: '기구에 붙은 사용법 스티커' }, { src: 'img/cable-station.jpg', caption: '케이블 로우·풀다운 스테이션' }],
  long_pull: [{ src: 'img/cable-station.jpg', caption: '케이블 스테이션에서 낮은 손잡이 사용' }],
  leg_press: [{ src: 'img/leg-press.jpg', caption: '레그 프레스' }],
  hip_thrust: [{ src: 'img/hip-thrust.jpg', caption: '힙 쓰러스트 머신' }],
  iso_row: [{ src: 'img/iso-row.jpg', caption: '디와이(아이소 래터럴) 로우' }],
  monster_glute: [{ src: 'img/monster-glute.jpg', caption: '몬스터 글루트' }],
  leg_ext: [{ src: 'img/leg-extension.jpg', caption: '레그 익스텐션 — 축을 무릎에' }],
};
const PHOTOS = (() => {
  const out = {};
  const add = (src) => { for (const [k, arr] of Object.entries(src || {})) out[k] = [...(out[k] || []), ...arr]; };
  add(PHOTOS_OWN);
  add(typeof PHOTOS_COMMONS !== 'undefined' ? PHOTOS_COMMONS : {});
  return out;
})();
