import React from 'react';
import { Sentence, SentenceProgress } from '../types';
import { OneLineCredit } from './OneLineCredit';
import { Trophy, RotateCcw, List, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  sentences: Sentence[];
  progressMap: Record<number, SentenceProgress>;
  onPracticeAgainSentence: (sentenceIndex: number) => void;
  onRestartAll: () => void;
  onViewList: () => void;
  onGoHome: () => void;
}

export const FinishScreen: React.FC<Props> = ({
  sentences,
  progressMap,
  onPracticeAgainSentence,
  onRestartAll,
  onViewList,
  onGoHome,
}) => {
  // Count completed and total recordings
  const completedSentences = sentences.filter(s => progressMap[s.id]?.status === 'done');
  const totalRecordings = Object.values(progressMap).reduce((acc, p) => acc + (p.recordings || 0), 0);

  // Sentences that received 😐 ('needs_work') on any of the 3 self-check questions
  const needsWorkList = sentences.map((sentence, index) => {
    const prog = progressMap[sentence.id];
    const hasNeedsWork = prog?.selfCheck?.some(r => r === 'needs_work');
    return { sentence, index, hasNeedsWork };
  }).filter(item => item.hasNeedsWork);

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
      {/* Celebration Header Card */}
      <div className="bg-linear-to-b from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-6 text-white text-center shadow-lg relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xs text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Trophy className="w-9 h-9" />
        </div>

        <span className="text-emerald-200 text-xs font-semibold uppercase tracking-widest">
          Session Complete / 쉐도잉 완료
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight">
          Great Job!
        </h1>
        <p className="text-emerald-100 text-sm mt-1">
          오늘의 주토피아 쉐도잉 훈련을 성공적으로 마쳤습니다!
        </p>

        {/* Stats strip */}
        <div className="mt-5 pt-4 border-t border-white/20 grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="block text-2xl sm:text-3xl font-extrabold text-amber-300">
              {completedSentences.length} / {sentences.length}
            </span>
            <span className="text-xs text-emerald-100">
              Completed / 완료 문장
            </span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="block text-2xl sm:text-3xl font-extrabold text-white">
              {totalRecordings}
            </span>
            <span className="text-xs text-emerald-100">
              Recordings / 녹음 횟수
            </span>
          </div>
        </div>
      </div>

      {/* Sentences marked 😐 with Practice Again button (PRD requirement) */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              😐
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm sm:text-base">
                Needs More Practice / 조금 더 연습할 문장
              </h3>
              <p className="text-xs text-stone-500">
                스스로 점검에서 😐로 체크했던 문장들입니다
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            {needsWorkList.length} items
          </span>
        </div>

        {needsWorkList.length === 0 ? (
          <div className="py-6 px-4 text-center bg-stone-50 rounded-xl space-y-1">
            <Sparkles className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
            <p className="text-stone-700 font-semibold text-sm">
              All sentences checked Great or Good!
            </p>
            <p className="text-xs text-stone-500">
              어려움 없이 모든 문장을 훌륭하게 소화하셨습니다!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {needsWorkList.map(({ sentence, index }) => (
              <div
                key={sentence.id}
                className="p-3 bg-stone-50 hover:bg-amber-50/50 rounded-xl border border-stone-200 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-500">#{index + 1}</span>
                    <span className="text-xs font-semibold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {sentence.speaker}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-stone-900 truncate">
                    {sentence.text}
                  </p>
                  {sentence.korean && (
                    <p className="text-xs text-stone-500 truncate">{sentence.korean}</p>
                  )}
                </div>

                <button
                  onClick={() => onPracticeAgainSentence(index)}
                  className="min-h-[40px] px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Practice again / 다시 연습</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Options */}
      <div className="space-y-2.5 pt-1">
        <button
          onClick={onRestartAll}
          className="w-full min-h-[52px] py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Practice All Again / 처음부터 다시 연습</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onViewList}
            className="min-h-[48px] py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <List className="w-4 h-4" />
            <span>Sentence List / 목록 보기</span>
          </button>

          <button
            onClick={onGoHome}
            className="min-h-[48px] py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Home / 홈 화면으로</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* One-line credit at the bottom (PRD 0-3 requirement) */}
      <div className="pt-4 border-t border-stone-200">
        <OneLineCredit />
      </div>
    </div>
  );
};
