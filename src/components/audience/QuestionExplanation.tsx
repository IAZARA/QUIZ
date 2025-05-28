import React from 'react';
import { useTranslation } from 'react-i18next';

interface QuestionExplanationProps {
  explanation: string;
  explanationImage?: string;
}

const QuestionExplanation: React.FC<QuestionExplanationProps> = ({
  explanation,
  explanationImage
}) => {
  const { t } = useTranslation();

  return (
    <div className="mt-6 p-4 bg-yellow-500/10 rounded-md border border-yellow-500/30">
      <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-500 mb-2">{t('explanation')}</h3>
      <p className="text-sm text-text-secondary whitespace-pre-wrap">{explanation}</p>

      {explanationImage && (
        <div className="mt-4">
          <img
            src={explanationImage}
            alt={t('explanationImageAlt')}
            className="max-w-full h-auto rounded-md"
          />
        </div>
      )}
    </div>
  );
};

export default QuestionExplanation;
