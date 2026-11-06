import React, { useState, useRef } from 'react';
import { Sentence, SentenceProgress } from '../types';
import { YouTubePlayer, YouTubePlayerHandle } from './YouTubePlayer';
import { ChevronRight, Eye, EyeOff, Play, Sliders, ArrowLeft, Star, CheckCircle, Clock } from 'lucide-react';

interface Props {
  sentences: Sentence[];
  progressMap: Record<number, SentenceProgress>;
  onSelectSentence: (index: number) => void;
  onBackToStart: () => void;
  onOpenEdit: () => void;
}

export const SentenceListScreen: React.FC<Props> = ({
  sentences,
  progressMap,
  onSelectSentence,
  onBackToStart,
  onOpenEdit,
}) => {
  const [hideAllText, setHideAllText] = useState(false);
  const playerRef = useRef<YouTubePlayerHandle>(null);

  // Helper for speaker color badge
  const getSpeakerBadge = (speaker: string) => {
    const s = speaker.toLowerCase();
    if (s.includes('judy')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (s.includes('mum') || s.includes('mom')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (s.includes('dad')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-stone-100 text-stone-800 border-stone-200';
  };

  // Status icon / symbol per PRD:
  // ☆ not started, ◐ practiced, ★ done
  const renderProgressMark = (progress?: SentenceProgress) => {
    if (!progress || progress.status === 'new' || (progress.plays === 0 && progress.recordings === 0)) {
      return (
        <span className="inline-flex items-center gap-1 text-stone-400 text-sm font-semibold" title="Not started">
          <span className="text-base">☆</span>
          <span className="text-[11px] font-normal text-stone-400">new</span>
        </span>
      );
    }
    if (progress.status === 'done') {
      return (
        <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-semibold" title="Done">
          <span className="text-base text-amber-500">★</span>
          <span className="text-[11px] font-semibold text-emerald-700">done</span>
        </span>
      );
    }
    // practiced
    return (
      <span className="inline-flex items-center gap-1 text-teal-600 text-sm font-semibold" title="Practiced">
        <span className="text-base text-teal-600">◐</span>
        <span className="text-[11px] font-medium text-teal-700">practiced</span>
      </span>
    );
  };

  // Helper to render sentence with bold stress words
  const renderFormattedSentence = (text: string, stressWords: string[]) => {
    if (hideAllText) {
      return (
        <span className="text-stone-400 italic tracking-wider">
          •••••••• •••••••• •••••••• (hidden)
        </span>
      );
    }

    const words = text.split(/\s+/);
    const upperStress = (stressWords || []).map(w => w.toUpperCase().replace(/[^A-Z0-9]/g, ''));

    return (
      <span className="text-stone-900 leading-snug">
        {words.map((word, idx) => {
          const clean = word.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const isStressed = upperStress.includes(clean);
          return (
            <span
              key={idx}
              className={isStressed ? 'font-black text-stone-950 underline decoration-amber-400 decoration-2 underline-offset-2' : 'font-normal'}
            >
              {word}{' '}
            </span>
          );
        })}
      </span>
    );
  };

  const completedCount = sentences.filter(s => progressMap[s.id]?.status === 'done').length;

  return (
    <div className="w-full flex flex-col gap-4 pb-8 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <button
          onClick={onBackToStart}
          className="min-h-[44px] px-3 py-2 -ml-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 inline-flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
          <span className="text-xs text-stone-400">/ 홈</span>
        </button>

        <h2 className="font-bold text-stone-800 text-base">
          Sentence List / 문장 목록
        </h2>

        <button
          onClick={onOpenEdit}
          className="min-h-[44px] px-3 py-2 -mr-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 inline-flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-stone-500" />
          <span>Edit</span>
          <span className="text-stone-400">/ 편집</span>
        </button>
      </div>

      {/* Video Player (Screen 2: The video player at the top + one line credit) */}
      <YouTubePlayer ref={playerRef} showCredit={true} />

      {/* Overview & Global Controls */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">Progress:</span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
            {completedCount} / {sentences.length} Done
          </span>
        </div>

        {/* Global Hide/Show text toggle */}
        <button
          onClick={() => setHideAllText(!hideAllText)}
          className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 py-1 px-2.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer font-medium"
        >
          {hideAllText ? (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Show All Text</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-stone-500" />
              <span>Hide All Text</span>
            </>
          )}
        </button>
      </div>

      {/* Empty State Handler per PRD */}
      {sentences.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-dashed border-stone-300 text-center space-y-3">
          <p className="text-stone-600 font-medium">
            No sentences yet. Tap Edit Sentences to add some.
          </p>
          <p className="text-xs text-stone-400">
            등록된 문장이 없습니다. 문장 편집을 눌러 새로운 문장을 등록해주세요.
          </p>
          <button
            onClick={onOpenEdit}
            className="mt-2 min-h-[48px] px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Edit Sentences / 문장 편집</span>
          </button>
        </div>
      ) : (
        /* Sentence Cards List */
        <div className="flex flex-col gap-3">
          {sentences.map((sentence, index) => {
            const prog = progressMap[sentence.id];
            const duration = (sentence.end - sentence.start).toFixed(1);

            return (
              <div
                key={sentence.id}
                onClick={() => onSelectSentence(index)}
                className="bg-white hover:bg-emerald-50/30 active:scale-[0.99] border border-stone-200/90 hover:border-emerald-300 rounded-2xl p-4 transition-all shadow-xs cursor-pointer flex flex-col gap-2 group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectSentence(index);
                }}
              >
                {/* Header row: Number, Speaker, Time, Status */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-xs">
                      #{index + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${getSpeakerBadge(sentence.speaker)}`}>
                      {sentence.speaker}
                    </span>
                    <span className="text-[11px] text-stone-400 flex items-center gap-0.5 font-mono">
                      <Clock className="w-3 h-3" />
                      {sentence.start.toFixed(1)}s–{sentence.end.toFixed(1)}s ({duration}s)
                    </span>
                  </div>

                  {/* Progress mark: ☆ ◐ ★ */}
                  <div>
                    {renderProgressMark(prog)}
                  </div>
                </div>

                {/* Sentence English text (large, bold stress) */}
                <div className="text-base sm:text-lg font-medium text-stone-900 group-hover:text-emerald-900 transition-colors">
                  {renderFormattedSentence(sentence.text, sentence.stress)}
                </div>

                {/* Korean meaning */}
                {!hideAllText && sentence.korean && (
                  <p className="text-xs sm:text-sm text-stone-500 font-normal">
                    {sentence.korean}
                  </p>
                )}

                {/* Card footer CTA hint */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs text-stone-400">
                  <span className="text-[11px]">
                    {prog?.recordings ? `${prog.recordings} recording${prog.recordings > 1 ? 's' : ''}` : 'Tap to start practicing'}
                  </span>
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Practice / 연습하기</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Start from #1 CTA */}
      {sentences.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => onSelectSentence(0)}
            className="w-full min-h-[52px] py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Practice from #1 / 1번부터 연습</span>
          </button>
        </div>
      )}
    </div>
  );
};
