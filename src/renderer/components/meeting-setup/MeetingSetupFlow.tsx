import React, { useEffect } from 'react';
import { useMeetingSetupStore } from '../../stores/meeting-setup.store';
import { useSession } from '../../hooks/useSession';
import { trpc } from '../../api/trpc';
import { InfoStep } from './InfoStep';
import { QuestionsStep } from './QuestionsStep';
import { ChecklistStep } from './ChecklistStep';

interface MeetingSetupFlowProps {
  onCancel: () => void;
}

export function MeetingSetupFlow({ onCancel }: MeetingSetupFlowProps) {
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

  const { startRecording, isStarting } = useSession();

  const generateQuestionsMutation = trpc.meetingSetup.generateProbingQuestions.useMutation();
  const generateChecklistMutation = trpc.meetingSetup.generateChecklist.useMutation();

  // Start at 'info' step since sources are already selected in HomeView
  useEffect(() => {
    setStep('info');
  }, [setStep]);

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

  const handleStartRecording = async () => {
    // Get the meeting setup data to pass to the recording
    const setupData = getMeetingSetupData();

    // Start the recording with meeting setup data
    await startRecording(setupData);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {step === 'info' && (
        <InfoStep
          initialName={name}
          initialDescription={description}
          isGenerating={isGenerating}
          onBack={onCancel}
          onNext={handleInfoNext}
        />
      )}

      {step === 'questions' && (
        <QuestionsStep
          questions={questions}
          isGenerating={isGenerating}
          onBack={handleQuestionsBack}
          onNext={handleQuestionsNext}
          onAnswerChange={setQuestionAnswer}
        />
      )}

      {step === 'checklist' && (
        <ChecklistStep
          name={name}
          description={description}
          checklist={checklist}
          isStarting={isStarting}
          onBack={handleChecklistBack}
          onStart={handleStartRecording}
        />
      )}
    </div>
  );
}
