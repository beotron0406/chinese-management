import React from 'react';
import { Modal, Form } from 'antd';
import { QuestionType } from '@/enums/question-type.enum';
import AudioImageQuestion from './AudioImageQuestion';
import TextSelectionQuestion from './TextSelectionQuestion';
import MatchingTextQuestion from './MatchingTextQuestion';
import FillBlankQuestion from './FillBlankQuestion';
import AudioBoolQuestion from './AudioBoolQuestion';

interface QuestionFormModalProps {
  open: boolean;
  onCancel: () => void;
  questionType: QuestionType;
  editQuestion?: any; // Add proper type for your question model
}

const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  open,
  onCancel,
  questionType,
  editQuestion
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      // Call your API to create/update question
      // questionApi.createQuestion({ ...values, type: questionType });
      onCancel();
      form.resetFields();
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };

  // Render different form based on question type
  const renderQuestionForm = () => {
    switch (questionType) {
      case QuestionType.AUDIO_IMAGE:
        return <AudioImageQuestion form={form} initialValues={editQuestion?.data} />;
      case QuestionType.TEXT_SELECTION:
        return <TextSelectionQuestion form={form} initialValues={editQuestion?.data} />;
      case QuestionType.MATCHING_TEXT:
        return <MatchingTextQuestion form={form} initialValues={editQuestion?.data} />;
      // case QuestionType.MATCHING_AUDIO:
      //   return <MatchingAudioQuestion form={form} initialValues={editQuestion?.data} />;
      case QuestionType.FILL_BLANK:
        return <FillBlankQuestion form={form} initialValues={editQuestion?.data} />;
      case QuestionType.AUDIO_BOOL:
        return <AudioBoolQuestion form={form} initialValues={editQuestion?.data} />;
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <Modal
      title={`${editQuestion ? 'Edit' : 'Create'} ${questionType.replace(/question_|_/g, ' ').trim()} Question`}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={editQuestion?.data}
      >
        {renderQuestionForm()}
      </Form>
    </Modal>
  );
};

export default QuestionFormModal;