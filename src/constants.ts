import { Sentence, ShadowingStepInfo } from './types';

export const MOVIE_SETTINGS = {
  movieTitleEn: "Zootopia",
  movieTitleKo: "주토피아",
  releaseYear: "2016",
  director: "Rich Moore, Byron Howard",
  screenplay: "Unknown", // Unknown, so left out of display per PRD 0-3
  productionCompany: "Walt Disney Animation Studios",
  distributionCompany: "Walt Disney Studios Motion Pictures",
  sceneDescription: "주디와 부모님의 영상통화 (Judy's video call with her parents)",
  youtubeTitle: "Zootopia Judys First Night",
  youtubeChannel: "Judy & Nick Wilde",
  youtubeUrl: "https://youtu.be/QB35SFVE5O4?si=LijASpGBN1ljXJqs",
  videoId: "QB35SFVE5O4",
  startSeconds: 49.0, // 0:49
  endSeconds: 94.0,   // 1:34
  madeBy: "김주은",
};

export const ONE_LINE_CREDIT = 
  `Clip: ${MOVIE_SETTINGS.movieTitleEn} (${MOVIE_SETTINGS.releaseYear}), ${MOVIE_SETTINGS.distributionCompany} / ${MOVIE_SETTINGS.productionCompany} · via YouTube · For educational use only`;

export const EDUCATIONAL_NOTICE_EN = 
  `This app was made only for non-commercial English learning in the university course AI and English Language Education (ENG3088, Sungkyunkwan University). The film clip is used only to practice listening and speaking (shadowing). It is not sold, shared for profit, downloaded, or edited. All rights to the film belong to its copyright holders.`;

export const EDUCATIONAL_NOTICE_KO = 
  `이 앱은 성균관대학교 「인공지능과 영어교육」(ENG3088) 수업의 비영리 영어 학습 목적으로만 제작되었습니다. 영화 장면은 듣기·말하기(쉐도잉) 연습에만 사용하며, 판매·영리적 배포·다운로드·편집을 하지 않습니다. 영화의 모든 권리는 저작권자에게 있습니다.`;

export const DEFAULT_SENTENCES: Sentence[] = [
  {
    id: 1,
    speaker: "Judy",
    text: "Oh hey its my parents",
    korean: "아 우리 부모님이네",
    stress: ["HEY", "PARENTS"],
    start: 49.0,
    end: 52.0
  },
  {
    id: 2,
    speaker: "Mum",
    text: "Oh there she is, hi sweetheart",
    korean: "아, 저기 있네! 안녕, 우리 딸!",
    stress: ["THERE", "SHE", "HI", "SWEETHEART"],
    start: 51.0,
    end: 54.0
  },
  {
    id: 3,
    speaker: "Dad",
    text: "How was your first day on the force?",
    korean: "경찰 첫 출근은 어땠어?",
    stress: ["FIRST", "DAY", "FORCE"],
    start: 54.0,
    end: 57.0
  },
  {
    id: 4,
    speaker: "Judy",
    text: "It was real great!",
    korean: "진짜 끝내줬어요!",
    stress: ["REAL", "GREAT"],
    start: 56.0,
    end: 59.0
  },
  {
    id: 5,
    speaker: "Mum",
    text: "Yeah, everything you ever hoped?",
    korean: "그래, 네가 바라던 대로 다 잘됐어?",
    stress: ["EVERYTHING", "HOPED"],
    start: 58.0,
    end: 60.0
  },
  {
    id: 6,
    speaker: "Judy",
    text: "Absolutely and more. Everyone's so nice and I feel like I'm really making a difference",
    korean: "그럼요! 기대했던 것보다 훨씬 더 좋아요. 다들 정말 친절하고, 제가 세상을 조금씩 바꾸고 있다는 느낌도 들어요.",
    stress: ["ABSOLUTELY", "MORE", "EVERYONE", "NICE", "REALLY", "MAKING", "DIFFERENCE"],
    start: 60.0,
    end: 67.0
  }
];

export const SHADOWING_STEPS: ShadowingStepInfo[] = [
  {
    id: 1,
    nameEn: "Step 1: Listen",
    nameKo: "1단계: 듣기",
    shortDescEn: "Text hidden, just listen 2–3 times",
    shortDescKo: "자막 없이 귀를 열고 소리 리듬에만 2~3번 집중하세요",
    defaultTextHidden: true,
  },
  {
    id: 2,
    nameEn: "Step 2: Mumble",
    nameKo: "2단계: 웅얼거리기",
    shortDescEn: "Text hidden, quietly follow the sound",
    shortDescKo: "자막 없이 작은 소리로 웅얼거리며 억양과 박자를 흉내 내보세요",
    defaultTextHidden: true,
  },
  {
    id: 3,
    nameEn: "Step 3: Read & Shadow",
    nameKo: "3단계: 보며 따라하기",
    shortDescEn: "Text shown, speak together with the video",
    shortDescKo: "자막을 보며 배우의 음성과 거의 동시에 맞춰 큰 소리로 말해보세요",
    defaultTextHidden: false,
  },
  {
    id: 4,
    nameEn: "Step 4: Shadow",
    nameKo: "4단계: 안 보고 쉐도잉",
    shortDescEn: "Text hidden, speak together with the video",
    shortDescKo: "자막을 완전히 가리고 배우와 한 호흡으로 완벽하게 동시 발화하세요",
    defaultTextHidden: true,
  },
];
