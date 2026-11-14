/* 자기관리해요 — 기본 루틴 · 기구 사용법 데이터
 * 루틴: "헬스장 기구 기반 2분할 루틴" (요일 대신 A→G 순서, 원본의 화·목 순서 변경 반영)
 *   A 상체A · B 하체B · C 상체B · D 하체A · E 보충A · F 보충B · G 회복
 * 사진: img/ 폴더. 출처·라이선스는 각 사진의 credit 과 앱 '사진 출처' 화면에 표시.
 */
'use strict';

/* 기구 공통 사용 순서 */
const COMMON_STEPS = {
  upper: ['시트·패드 높이 맞추기', '손잡이 잡고 어깨 내리기', '배에 힘주고 숨 참기', '3초 천천히 밀고(당기고) 3초 천천히 돌아오기'],
  lower: ['시트 높이를 맞춰 관절 축과 기구 축을 일치시키기', '패드를 몸에 밀착하고 등·허리가 뜨지 않게 앉기', '배에 힘을 주고 2~3초 동안 밀거나 당기기', '끝 지점에서 1초 멈춰 근육 수축 확인', '돌아올 때는 3초, 무게에 끌려가지 않게 버티기'],
};

/* 기구·운동 라이브러리 (id → 정보) */
const LIB = {
  incline_press: { name: '인클라인 프레스', cat: '가슴', group: 'upper', target: '가슴 상부',
    steps: ['등받이에 어깨·엉덩이를 붙이기', '손잡이가 가슴 위쪽 높이에 오게 시트 조절', '어깨를 내리고 내쉬면서 가슴으로 밀기'] },
  decline_press: { name: '디클라인 프레스', cat: '가슴', group: 'upper', target: '가슴 하부',
    steps: ['손잡이가 가슴 아래쪽 높이에 오게 시트 조절', '팔꿈치를 몸통에서 45도로 두기', '내쉬면서 가슴으로 밀어내기'] },
  pec_fly: { name: '펙 플라이', cat: '가슴', group: 'upper', target: '가슴 안쪽',
    steps: ['손잡이가 어깨 높이에 오게 시트 조절', '팔꿈치를 살짝 굽힌 채 고정', '가슴 앞에서 모으고 1초 멈추기'] },
  shoulder_press: { name: '숄더 프레스', cat: '어깨', group: 'upper', target: '어깨 전면',
    steps: ['손잡이가 어깨 높이에 오게 시트 조절', '손목이 팔꿈치 바로 위에 오게', '허리를 젖히지 말고 정수리 위로 밀기'] },
  bent_lateral: { name: '벤트오버 레터럴 레이즈', cat: '어깨', group: 'upper', target: '어깨 후면',
    steps: ['상체를 45도 숙이고 허리는 곧게', '팔꿈치를 살짝 굽힌 채 덤벨 잡기', '팔꿈치로 옆을 밀어 올리듯 들어 올리기'] },
  front_pulldown: { name: '프론트 풀다운', cat: '등', group: 'upper', target: '광배근',
    steps: ['허벅지 패드를 조여 몸 고정', '가슴을 들고 어깨를 내리기', '쇄골 방향으로 당겨 등 조이기'] },
  mts_row: { name: '로우 (머신)', cat: '등', group: 'upper', target: '등 가운데',
    steps: ['가슴을 패드에 밀착', '어깨가 올라가지 않게 내리기', '팔꿈치를 뒤로 보내 등 가운데를 조이기'] },
  high_row: { name: '하이 로우', cat: '등', group: 'upper', target: '등 위쪽·광배근',
    steps: ['손잡이를 눈높이로 맞추기', '팔이 아니라 등으로 시작해 당기기', '끝에서 날개뼈를 모으고 천천히 돌아오기'] },
  tbar_row: { name: '티바 로우', cat: '등', group: 'upper', target: '등 전체',
    steps: ['무릎을 살짝 굽히고 엉덩이를 뒤로 빼 상체 숙이기', '허리 중립 유지, 배에 힘주기', '가슴 쪽으로 당기고 천천히 내리기'] },
  rear_delt: { name: '펙 플라이 리어 델토이드', cat: '어깨', group: 'upper', target: '어깨 후면',
    steps: ['가슴을 패드 쪽으로 보고 앉기(펙 플라이 기구 반대로)', '팔을 살짝 굽힌 채 손잡이 잡기', '어깨로 뒤를 그리듯 벌리기'] },
  assist_pullup: { name: '어시스트 풀업', cat: '등', group: 'upper', target: '광배근',
    steps: ['체중의 30~40% 도움 무게 설정', '무릎을 패드에 올리고 어깨를 내리기', '가슴을 바 쪽으로 끌어올리고 천천히 내려오기'] },
  wide_pulldown: { name: '와이드 풀다운', cat: '등', group: 'upper', target: '광배근 바깥쪽',
    steps: ['어깨보다 넓게 바 잡기', '가슴을 들고 어깨 내리기', '쇄골 쪽으로 당기고 천천히 올리기'] },
  iso_row: { name: '디와이 로우 (레터럴 로우)', cat: '등', group: 'upper', target: '등 좌우 균형',
    steps: ['가슴을 패드에 대고 앉기', '한쪽씩 당겨 좌우 감각 비교', '팔꿈치를 몸 옆으로 붙여 뒤로 보내기'] },
  long_pull: { name: '롱 풀 (시티드 케이블 로우)', cat: '등', group: 'upper', target: '등 가운데',
    steps: ['발판에 발을 대고 무릎 살짝 굽히기', '허리 중립 유지, 상체를 뒤로 젖히지 않기', '배꼽 쪽으로 당겨 날개뼈 모으기'] },

  leg_press: { name: '레그 프레스', cat: '하체', group: 'lower', target: '대퇴사두·둔근',
    steps: ['발판 중앙에 발 전체를 두기', '무릎이 안쪽으로 모이지 않게 발끝 방향으로', '엉덩이가 들리기 전 깊이에서 멈추고 밀기'] },
  hack_squat: { name: '핵 스쿼트', cat: '하체', group: 'lower', target: '대퇴사두',
    steps: ['등판에 등을 완전히 붙이기', '엉덩이부터 아래로 내려가기', '발뒤꿈치로 밀어 올라오기'] },
  squat_press: { name: '스쿼트 프레스', cat: '하체', group: 'lower', target: '대퇴사두·둔근',
    steps: ['발 위치를 높이면 둔근, 낮추면 대퇴사두', '패드에 어깨를 대고 허리 중립 유지', '통증 없는 깊이까지만 내려가기'] },
  leg_ext: { name: '레그 익스텐션', cat: '하체', group: 'lower', target: '대퇴사두',
    steps: ['기구 축이 무릎 관절과 일치하게 등받이 조절', '발목 패드는 발목 바로 위', '올린 지점에서 1초 정지, 반동 없이'] },
  hip_abd: { name: '힙 어브덕션', cat: '하체', group: 'lower', target: '둔근 옆쪽',
    steps: ['패드를 무릎 바깥쪽에 대기', '상체를 살짝 앞으로 숙이기', '천천히 끝까지 벌리고 천천히 모으기'] },
  hip_thrust: { name: '힙 쓰러스트', cat: '하체', group: 'lower', target: '둔근',
    steps: ['등 윗부분을 패드에 걸고 벨트·패드를 골반에', '턱을 당기고 갈비뼈를 내리기', '발뒤꿈치로 밀어 엉덩이로 들어 올리기'] },
  monster_glute: { name: '몬스터 글루트', cat: '하체', group: 'lower', target: '둔근',
    steps: ['허리를 패드에 붙이기', '엉덩이를 뒤로 빼며 내려가기', '무릎은 발끝 방향, 엉덩이로 밀어 올리기'] },
  standing_thrust: { name: '스탠딩 힙 쓰러스트', cat: '하체', group: 'lower', target: '둔근',
    steps: ['한 발씩 서서 골반에 패드·밴드 걸기', '골반이 옆으로 돌아가지 않게 고정', '엉덩이를 앞으로 밀어 끝에서 조이기'] },
  leg_curl: { name: '레그 컬', cat: '하체', group: 'lower', target: '햄스트링',
    steps: ['패드 축을 무릎에 맞추기', '발목 패드는 아킬레스건 위', '반동 없이 뒤꿈치를 엉덩이 쪽으로 당기기'] },
  hip_add: { name: '힙 어덕션', cat: '하체', group: 'lower', target: '허벅지 안쪽',
    steps: ['패드를 무릎 안쪽에 대기', '상체를 등받이에 고정', '다리를 모을 때 1초 멈추기'] },
  standing_abd: { name: '스탠딩 힙 어브덕션', cat: '하체', group: 'lower', target: '둔근 옆쪽',
    steps: ['기구 옆에 서서 손잡이 잡기', '상체를 곧게 두고 한쪽 다리를 옆으로', '골반이 기울지 않게 천천히'] },

  walk: { name: '걷기', cat: '유산소', type: 'cardio', group: 'rest', target: '회복',
    steps: ['편한 속도로 20~30분', '숨이 약간 차는 정도'] },
  foam_roller: { name: '폼롤러', cat: '기타', type: 'hold', group: 'rest', target: '근막 이완',
    steps: ['허벅지·엉덩이·등 순서로 부위당 30~60초', '아픈 지점은 멈춰서 호흡'] },
  stretch: { name: '전신 스트레칭', cat: '기타', type: 'hold', group: 'rest', target: '유연성',
    steps: ['부위당 20~30초 반동 없이 유지', '통증이 아닌 당기는 느낌까지만'] },
};

/* 순서 루틴: 요일과 상관없이 A → B → … → G → 다시 A. 마지막에 한 다음 순서를 이어서 한다.
 * (원본 PPT의 화·목 순서를 바꿔 B=하체B, D=하체A) alt = 대체 가능 운동 */
const ROUTINE = {
  id: 'split2x4seq',
  title: '기구 2분할 순서 루틴',
  desc: '요일 상관없이 A부터 G까지 차례로. 마지막에 한 다음 순서를 이어서 하세요.',
  seq: [
    { key: 'A', label: '상체 A', title: '가슴·어깨, 미는 날', time: '5종목 · 55분', level: '중상',
      tip: '무게는 12회를 깔끔하게 마칠 수 있는 수준에서 시작하세요.',
      items: [
        { id: 'incline_press', sets: 4, reps: '10~12' }, { id: 'decline_press', sets: 3, reps: '10~12' },
        { id: 'pec_fly', sets: 3, reps: '12~15' }, { id: 'shoulder_press', sets: 3, reps: '10~12' },
        { id: 'bent_lateral', sets: 3, reps: '15' }] },
    { key: 'B', label: '하체 B', title: '햄스트링·둔근, 펴는 날', time: '5종목 · 55분', level: '중상',
      tip: '힙 운동은 허리를 꺾는 대신 엉덩이 수축으로 끝까지 버티는 게 핵심입니다.',
      items: [
        { id: 'hip_thrust', sets: 4, reps: '10~12' }, { id: 'monster_glute', sets: 3, reps: '12' },
        { id: 'standing_thrust', sets: 3, reps: '12' }, { id: 'leg_curl', sets: 3, reps: '12~15' },
        { id: 'hip_add', sets: 3, reps: '20' }] },
    { key: 'C', label: '상체 B', title: '등·후면어깨, 당기는 날', time: '5종목 · 55분', level: '중상',
      tip: '당길 때 어깨가 으쓱 올라가면 무게를 한 단계 낮추세요.',
      items: [
        { id: 'front_pulldown', sets: 4, reps: '10~12' }, { id: 'mts_row', sets: 3, reps: '10~12' },
        { id: 'high_row', sets: 3, reps: '12' }, { id: 'tbar_row', sets: 3, reps: '10' },
        { id: 'rear_delt', sets: 3, reps: '15' }] },
    { key: 'D', label: '하체 A', title: '대퇴사두·둔근, 미는 날', time: '5종목 · 55분', level: '중상',
      tip: '하체는 첫 세트를 가볍게 15회 돌려 관절을 데운 뒤 본세트로 들어갑니다.',
      items: [
        { id: 'leg_press', sets: 4, reps: '10~12' }, { id: 'hack_squat', sets: 3, reps: '10' },
        { id: 'squat_press', sets: 3, reps: '12' }, { id: 'leg_ext', sets: 3, reps: '15' },
        { id: 'hip_abd', sets: 3, reps: '20' }] },
    { key: 'E', label: '보충 A', title: '못 다뤄본 상체 기구 적응', time: '4종목 · 2세트', level: '하',
      tip: 'RPE 6~7 · 세트 사이 60초 · 자세 익히기가 목적입니다.',
      items: [
        { id: 'assist_pullup', alt: 'wide_pulldown', sets: 2, reps: '12' }, { id: 'iso_row', sets: 2, reps: '12' },
        { id: 'long_pull', alt: 'tbar_row', sets: 2, reps: '12' }, { id: 'bent_lateral', sets: 2, reps: '15' }] },
    { key: 'F', label: '보충 B', title: '못 다뤄본 하체 기구 적응', time: '4종목 · 2세트', level: '하',
      tip: 'RPE 6~7 · 통증 없는 범위에서만 움직이세요.',
      items: [
        { id: 'standing_abd', sets: 2, reps: '15' }, { id: 'hack_squat', sets: 2, reps: '10' },
        { id: 'squat_press', sets: 2, reps: '12' }, { id: 'hip_add', alt: 'leg_curl', sets: 2, reps: '15' }] },
    { key: 'G', label: '회복', title: '가볍게 회복하는 날', time: '30~40분', level: '하', rest: true,
      tip: '걷기와 스트레칭으로 혈액순환만 돕습니다. 수면 7시간 이상 · 단백질 보충.',
      items: [{ id: 'walk', sets: 1, reps: '20~30분' }, { id: 'foam_roller', sets: 1, reps: '10분' }, { id: 'stretch', sets: 1, reps: '10분' }] },
  ],
  rules: [
    ['준비', '유산소 5분 + 해당 부위 가벼운 2세트'],
    ['세트·반복', '3~4세트 · 10~15회 · 마지막 1회가 힘든 무게'],
    ['휴식', '큰 근육 90~120초 · 작은 근육 60초'],
    ['증량', '12회를 2세트 깔끔하게 성공하면 한 칸 증량'],
    ['중단', '찌르는 통증 · 어지럼 · 호흡 곤란 시 즉시 중단'],
  ],
  notes: [
    '날짜와 상관없이 마지막에 한 다음 순서를 이어서 하세요. 하루 쉬어도 순서는 그대로입니다.',
    '쉬는 날은 따로 정하지 않습니다. 몸이 무거운 날은 쉬고, 다음에 이어서 하세요.',
    '3주 동안 같은 루틴이 지루해지면 종목을 1개씩만 교체합니다.',
    '통증이 2회 이상 반복되면 그 기구는 과감히 빼세요.',
    '처음 쓰는 기구는 빈 판(최저 중량)으로 10회, 자세를 눈으로 확인한 뒤 시작합니다.',
  ],
};
