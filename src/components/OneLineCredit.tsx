import React from 'react';
import { ONE_LINE_CREDIT } from '../constants';

interface Props {
  className?: string;
}

export const OneLineCredit: React.FC<Props> = ({ className = '' }) => {
  return (
    <p 
      className={`text-xs sm:text-[13px] text-stone-500 text-center leading-relaxed tracking-tight py-1.5 px-3 select-none ${className}`}
      style={{ fontSize: '13px' }}
    >
      {ONE_LINE_CREDIT}
    </p>
  );
};
