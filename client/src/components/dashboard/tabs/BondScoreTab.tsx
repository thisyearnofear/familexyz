import React from 'react';
import { BondScoreDashboard } from '../bond-score';
import { useSearchParams } from 'react-router-dom';

export const BondScoreTab: React.FC = () => {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('familyId') || 'default-family';
  const familyName = searchParams.get('familyName') || 'My Family';

  return (
    <div className="w-full">
      <BondScoreDashboard 
        familyId={familyId} 
        familyName={familyName}
      />
    </div>
  );
};

export default BondScoreTab;
