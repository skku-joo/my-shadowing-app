import React from 'react';
import { EducationalNotice } from './EducationalNotice';
import { Play, Sliders, Sparkles, Headphones, Repeat, Mic, Film } from 'lucide-react';
import { MOVIE_SETTINGS } from '../constants';

interface Props {
  onStartPractice: () => void;
  onOpenEdit: () => void;
  sentenceCount: number;
}

export const StartScreen: React.FC<Props> = ({
  onStartPractice,
  onOpenEdit,
  sentenceCount,
}) => {
  return (
    <div className="w-full flex flex-col gap-6 pb-8 animate-in fade-in duration-300">
      {/* Brand Hero Header */}
      <div className="text-center pt-3 pb-1 flex flex-col items-center">
        {/* Subtle movie clip badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 text-xs font-semibold tracking-wide mb-3 border border-amber-200/60 shadow-2xs">
          <Film className="w-3.5 h-3.5 text-amber-700" />
          <span>{MOVIE_SETTINGS.movieTitleEn} ({MOVIE_SETTINGS.movieTitleKo}) · 0:49–1:34</span>
        </div>

        {/* App Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 font-display flex items-center justify-center gap-1">
          <span>Shadowpop</span>
          <span className="text-emerald-600 font-black">!</span>
        </h1>

        {/* One-line explanation */}
        <p className="mt-2 text-stone-700 font-medium text-base sm:text-lg">
          Listen. Copy. Speak at the same time.
        </p>
        <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
          듣고, 따라하고, 동시에 말하는 쉐도잉 영어 훈련
        </p>
      </div>

      {/* Hero Clip Preview Card */}
      <div className="bg-linear-to-b from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-amber-400/20 blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <span className="text-emerald-200 text-xs font-medium uppercase tracking-wider">
            Featured Scene
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
            {MOVIE_SETTINGS.sceneDescription}
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xs leading-relaxed">
            주디 홉스의 경찰 첫날 밤, 부모님과의 따뜻하고 현실적인 대화로 배우는 생생한 미국 영어!
          </p>

          {/* Quick stats counter */}
          <div className="mt-4 pt-3 border-t border-white/15 w-full flex items-center justify-around text-center text-xs">
            <div>
              <span className="block text-lg font-bold text-white">{sentenceCount}</span>
              <span className="text-emerald-200">Sentences / 문장</span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <span className="block text-lg font-bold text-amber-300">4 Steps</span>
              <span className="text-emerald-200">Step Guide / 단계별</span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <span className="block text-lg font-bold text-white">10–15m</span>
              <span className="text-emerald-200">Session / 학습시간</span>
            </div>
          </div>
        </div>
      </div>

      {/* What is shadowing? Card (3 bullet points, simple English + Korean) */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-base">
              What is Shadowing? / 쉐도잉이란?
            </h3>
            <p className="text-xs text-stone-500">
              원어민의 소리를 그림자처럼 바짝 붙어 따라 말하는 효과적인 말하기 훈련법
            </p>
          </div>
        </div>

        <ul className="space-y-3 text-stone-700 text-sm">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
              1
            </div>
            <div>
              <p className="font-semibold text-stone-800">
                Listen & repeat almost at the same time
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                원어민 음성을 듣고 0.5초 뒤 그림자처럼 바짝 붙어 따라 말해요.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
              2
            </div>
            <div>
              <p className="font-semibold text-stone-800">
                Copy the rhythm, stress & intonation
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                단어 하나의 발음보다 문장 전체의 박자, 강세(굵은 글씨), 억양을 흉내 내요.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
              3
            </div>
            <div>
              <p className="font-semibold text-stone-800">
                Builds natural speaking muscle memory
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                머리로 번역하지 않고 입 근육이 기억하여 자신감 있게 튀어나오게 됩니다.
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-col gap-3 pt-1">
        {/* Big Start Practice Button (at least 48px) */}
        <button
          onClick={onStartPractice}
          className="w-full min-h-[56px] py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-lg shadow-lg shadow-emerald-700/20 flex flex-col items-center justify-center transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 fill-current" />
            <span>Start Practice</span>
          </div>
          <span className="text-xs font-normal text-emerald-100 -mt-0.5">연습 시작하기</span>
        </button>

        {/* Small link to Edit Sentences */}
        <div className="text-center pt-1">
          <button
            onClick={onOpenEdit}
            className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 text-sm py-2 px-3 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-stone-500" />
            <span className="font-medium">Edit Sentences</span>
            <span className="text-stone-400">/</span>
            <span className="text-xs text-stone-500">문장 편집</span>
          </button>
        </div>
      </div>

      {/* Educational Use Notice (PRD 0-3) */}
      <div className="pt-2">
        <EducationalNotice />
      </div>
    </div>
  );
};
