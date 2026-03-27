import React, { useEffect } from 'react';
import { useMeetingSetupStore } from '../../stores/meeting-setup.store';
import { trpc } from '../../api/trpc';
import { InfoStep } from './InfoStep';
import { QuestionsStep } from './QuestionsStep';
import { ChecklistStep } from './ChecklistStep';
import type { ProbingQuestion } from '../../../shared/types/meeting-setup.types';

export interface MeetingSetupData {
  name: string;
  description: string;
  questions: ProbingQuestion[];
  checklist: string[];
}

export interface MeetingSetupLabels {
  primaryButton?: string;
  primaryButtonLoading?: string;
  skipButton?: string;
  skipButtonLoading?: string;
  checklistHeadingTitle?: string;
  checklistHeadingSubtitle?: string;
}

interface MeetingSetupFlowProps {
  onCancel: () => void;
  onComplete: (data: MeetingSetupData) => Promise<void>;
  onSkip?: (data: MeetingSetupData) => Promise<void>;
  isCompleting?: boolean;
  labels?: MeetingSetupLabels;
  showSkipButton?: boolean;
}

/**
 * Generate a default meeting name based on current time
 * Format: "Meeting at 10:30 AM"
 */
function generateDefaultMeetingName(): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `Meeting at ${timeStr}`;
}

export function MeetingSetupFlow({
  onCancel,
  onComplete,
  onSkip,
  isCompleting = false,
  labels = {},
  showSkipButton = true,
}: MeetingSetupFlowProps) {
  const {
    step,
    name,
    description,
    questions,
    checklist,
    isGenerating,
    error,
    setStep,
    setInfo,
    setQuestions,
    setQuestionAnswer,
    setChecklist,
    setIsGenerating,
    setError,
    getMeetingSetupData,
  } = useMeetingSetupStore();

  const generateQuestionsMutation = trpc.meetingSetup.generateProbingQuestions.useMutation();
  const generateChecklistMutation = trpc.meetingSetup.generateChecklist.useMutation();

  // Start at 'info' step since sources are already selected in HomeView
  // Only change step if we're at the initial 'sources' step (not if step was pre-set)
  useEffect(() => {
    if (step === 'sources') {
      setStep('info');
    }
  }, [step, setStep]);

  // Handle skip - generate checklist if context exists, then call onSkip or onComplete
  const handleSkip = async (overrideName?: string, overrideDescription?: string) => {
    const finalName = (overrideName ?? name).trim() || generateDefaultMeetingName();
    const finalDescription = (overrideDescription ?? description).trim();

    // Update store so the name is available to parent
    setInfo(finalName, finalDescription);

    const answeredQuestions = questions.filter(q => q.answer);
    const hasContext = finalDescription || answeredQuestions.length > 0;

    const completeHandler = onSkip || onComplete;

    if (hasContext) {
      // Generate checklist first if we have description or answered questions
      setIsGenerating(true);
      setError(null);

      try {
        const result = await generateChecklistMutation.mutateAsync({
          name: finalName,
          description: finalDescription,
          questions: answeredQuestions,
        });

        if (result.success && result.checklist.length > 0) {
          setChecklist(result.checklist);
          await completeHandler({
            name: finalName,
            description: finalDescription,
            questions: answeredQuestions,
            checklist: result.checklist,
          });
        } else {
          await completeHandler({
            name: finalName,
            description: finalDescription,
            questions: answeredQuestions,
            checklist: [],
          });
        }
      } catch {
        await completeHandler({
          name: finalName,
          description: finalDescription,
          questions: answeredQuestions,
          checklist: [],
        });
      } finally {
        setIsGenerating(false);
      }
    } else {
      await completeHandler({
        name: finalName,
        description: finalDescription,
        questions: [],
        checklist: [],
      });
    }
  };

  const handleInfoNext = async (newName: string, newDescription: string) => {
    setInfo(newName, newDescription);
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateQuestionsMutation.mutateAsync({
        name: newName,
        description: newDescription,
      });

      if (result.success && result.questions.length > 0) {
        setQuestions(result.questions);
        setStep('questions');
      } else {
        setError(result.error || 'Failed to generate questions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuestionsBack = () => {
    setStep('info');
  };

  const handleQuestionsNext = async (answeredQuestions: typeof questions) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateChecklistMutation.mutateAsync({
        name,
        description,
        questions: answeredQuestions,
      });

      if (result.success && result.checklist.length > 0) {
        setChecklist(result.checklist);
        setStep('checklist');
      } else {
        setError(result.error || 'Failed to generate checklist');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate checklist');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChecklistBack = () => {
    setStep('questions');
  };

  const handleComplete = async () => {
    const setupData = getMeetingSetupData();
    await onComplete(setupData);
  };

  const isSkipping = isCompleting && !isGenerating;

  return (
    <div className="w-full flex flex-col items-center relative">
      {/* Main content */}
      <div className="w-full max-w-[480px] px-6 relative z-10">
        {error && (
          <div className="mb-6 p-[16px] bg-[#fff5f5] border border-[#ffdfdf] rounded-[12px] flex items-start gap-[12px]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
              <circle cx="10" cy="10" r="8" stroke="#dc2626" strokeWidth="1.5" />
              <path d="M10 6v5M10 13.5v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-[13px] text-[#dc2626] leading-[20px]">{error}</p>
          </div>
        )}

        {step === 'info' && (
          <InfoStep
            initialName={name}
            initialDescription={description}
            isGenerating={isGenerating}
            isSkipping={isSkipping}
            onBack={onCancel}
            onNext={handleInfoNext}
            onSkip={handleSkip}
            skipButtonLabel={labels.skipButton}
            skipButtonLoadingLabel={labels.skipButtonLoading}
            showSkipButton={showSkipButton}
          />
        )}

        {step === 'questions' && (
          <QuestionsStep
            questions={questions}
            isGenerating={isGenerating}
            isSkipping={isSkipping}
            onBack={handleQuestionsBack}
            onNext={handleQuestionsNext}
            onAnswerChange={setQuestionAnswer}
            onSkip={handleSkip}
            skipButtonLabel={labels.skipButton}
            skipButtonLoadingLabel={labels.skipButtonLoading}
            showSkipButton={showSkipButton}
          />
        )}

        {step === 'checklist' && (
          <ChecklistStep
            name={name}
            description={description}
            checklist={checklist}
            isStarting={isCompleting}
            isSkipping={isSkipping}
            onBack={handleChecklistBack}
            onStart={handleComplete}
            onSkip={handleSkip}
            primaryButtonLabel={labels.primaryButton}
            primaryButtonLoadingLabel={labels.primaryButtonLoading}
            skipButtonLabel={labels.skipButton}
            skipButtonLoadingLabel={labels.skipButtonLoading}
            showSkipButton={showSkipButton}
            headingTitle={labels.checklistHeadingTitle}
            headingSubtitle={labels.checklistHeadingSubtitle}
          />
        )}
      </div>
    </div>
  );
}
