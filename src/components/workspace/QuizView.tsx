import { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileStore } from '@/stores/fileStore';
import { cn } from '@/lib/utils';
import { QuizQuestion } from '@/types';
import { toast } from 'sonner';

interface QuizViewProps {
  fileId: string;
}

export function QuizView({ fileId }: QuizViewProps) {
  const quiz = useFileStore((state) => state.getQuiz(fileId));
  const updateQuizAnswer = useFileStore((state) => state.updateQuizAnswer);
  const [showAnswers, setShowAnswers] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <HelpCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground mb-2">
          No Quiz Available
        </h3>
        <p className="text-muted-foreground max-w-sm">
          The quiz for this file is being generated. Please check back shortly.
        </p>
      </div>
    );
  }

  const handleSubmit = () => {
    setSubmitted(true);
    const correct = quiz.questions.filter(
      (q) => q.userAnswer?.toLowerCase() === q.correctAnswer.toLowerCase()
    ).length;
    toast.success(`You got ${correct} out of ${quiz.questions.length} correct!`);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    updateQuizAnswer(fileId, questionId, answer);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 lg:p-8 max-w-3xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Quiz</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnswers(!showAnswers)}
          >
            {showAnswers ? (
              <EyeOff className="w-4 h-4 mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {showAnswers ? 'Hide Answers' : 'Show Answers'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {quiz.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            showAnswer={showAnswers}
            submitted={submitted}
            onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={handleSubmit} disabled={submitted}>
          Submit Answers
        </Button>
      </div>
    </motion.div>
  );
}

function QuestionCard({
  question,
  index,
  showAnswer,
  submitted,
  onAnswerChange,
}: {
  question: QuizQuestion;
  index: number;
  showAnswer: boolean;
  submitted: boolean;
  onAnswerChange: (answer: string) => void;
}) {
  const isCorrect =
    submitted && question.userAnswer?.toLowerCase() === question.correctAnswer.toLowerCase();
  const isWrong = submitted && question.userAnswer && !isCorrect;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'card-elevated p-6',
        isCorrect && 'ring-2 ring-green-500 ring-offset-2',
        isWrong && 'ring-2 ring-destructive ring-offset-2'
      )}
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm shrink-0">
          {index + 1}
        </span>
        <p className="font-medium text-foreground leading-relaxed">{question.question}</p>
      </div>

      {question.type === 'multiple-choice' || question.type === 'true-false' ? (
        <div className="space-y-2 pl-12">
          {question.options?.map((option) => {
            const isSelected = question.userAnswer === option;
            const isCorrectOption = option === question.correctAnswer;

            return (
              <button
                key={option}
                onClick={() => !submitted && onAnswerChange(option)}
                disabled={submitted}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg border transition-all',
                  isSelected && !submitted && 'border-primary bg-accent',
                  !isSelected && !submitted && 'border-border hover:border-primary/50 hover:bg-accent/50',
                  submitted && isCorrectOption && 'border-green-500 bg-green-50 text-green-700',
                  submitted && isSelected && !isCorrectOption && 'border-destructive bg-red-50 text-destructive'
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {submitted && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {submitted && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="pl-12">
          <input
            type="text"
            value={question.userAnswer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={submitted}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {showAnswer && (
        <div className="mt-4 pl-12 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Correct Answer:</span>{' '}
            {question.correctAnswer}
          </p>
        </div>
      )}
    </motion.div>
  );
}
