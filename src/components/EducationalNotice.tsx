import React, { useState } from 'react';
import { MOVIE_SETTINGS, EDUCATIONAL_NOTICE_EN, EDUCATIONAL_NOTICE_KO } from '../constants';
import { ExternalLink, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export const EducationalNotice: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-stone-100/90 border border-stone-200/90 rounded-2xl p-4 sm:p-5 text-stone-700 shadow-xs">
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(prev => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(prev => !prev); }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <h3 className="font-semibold text-stone-800 text-sm sm:text-base">
            Educational Use & Source / 교육용 고지 및 출처
          </h3>
        </div>
        <button 
          className="text-stone-500 hover:text-stone-700 p-1"
          aria-label={isExpanded ? "Collapse notice" : "Expand notice"}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary summary notice always visible, expandable details */}
      <div className="mt-2.5 text-xs sm:text-sm text-stone-600 space-y-2 leading-relaxed">
        <p className="font-medium text-stone-700">
          <span className="text-emerald-700 font-semibold">[Educational use only / 교육 목적 전용]</span> 성균관대학교 「인공지능과 영어교육」(ENG3088) 비영리 영어 학습용
        </p>
        
        {isExpanded && (
          <div className="pt-2 border-t border-stone-200 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600 bg-white/70 p-3 rounded-xl border border-stone-200/60">
              <p className="leading-normal">{EDUCATIONAL_NOTICE_KO}</p>
              <p className="leading-normal text-stone-500 pt-1 border-t border-stone-100">{EDUCATIONAL_NOTICE_EN}</p>
            </div>

            <div className="bg-white/80 rounded-xl p-3 border border-stone-200/60 text-xs space-y-1.5">
              <div className="font-semibold text-stone-800 pb-1 border-b border-stone-100">
                Source Information / 출처 정보
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-stone-600">
                <span className="text-stone-400">Movie Title:</span>
                <span className="font-medium text-stone-800">{MOVIE_SETTINGS.movieTitleEn} ({MOVIE_SETTINGS.movieTitleKo})</span>

                <span className="text-stone-400">Release Year:</span>
                <span>{MOVIE_SETTINGS.releaseYear}</span>

                <span className="text-stone-400">Director:</span>
                <span>{MOVIE_SETTINGS.director}</span>

                <span className="text-stone-400">Production:</span>
                <span>{MOVIE_SETTINGS.productionCompany}</span>

                <span className="text-stone-400">Distribution:</span>
                <span>{MOVIE_SETTINGS.distributionCompany}</span>

                <span className="text-stone-400">Scene:</span>
                <span>{MOVIE_SETTINGS.sceneDescription}</span>

                <span className="text-stone-400">YouTube Video:</span>
                <span className="truncate">{MOVIE_SETTINGS.youtubeTitle}</span>

                <span className="text-stone-400">Channel:</span>
                <span>{MOVIE_SETTINGS.youtubeChannel}</span>

                <span className="text-stone-400">Practice Range:</span>
                <span className="font-semibold text-emerald-700">0:49 – 1:34 (49s – 94s)</span>

                <span className="text-stone-400">Made by:</span>
                <span className="font-medium text-stone-800">{MOVIE_SETTINGS.madeBy}</span>

                <span className="text-stone-400">Original Link:</span>
                <a 
                  href={MOVIE_SETTINGS.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 font-medium underline"
                >
                  Watch on YouTube
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {!isExpanded && (
          <p className="text-[12px] text-stone-500">
            {MOVIE_SETTINGS.movieTitleEn} ({MOVIE_SETTINGS.releaseYear}) · 0:49 – 1:34 · Made by {MOVIE_SETTINGS.madeBy} (Click to see full notice & credits)
          </p>
        )}
      </div>
    </div>
  );
};
