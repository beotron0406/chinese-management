"use client";
import React, { useState } from 'react';
import { QuestionType } from '@/enums/question-type.enum';
import { Button, Modal, Select } from 'antd'; // Assuming you use Antd for UI
import { PlusOutlined } from '@ant-design/icons'; // If using Ant Design icons
import QuestionFormModal from '@/components/question/QuestionFormModal';
import QuestionList from '@/components/question/QuestionList';

export default function QuestionPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType | null>(null);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleQuestionTypeSelect = (questionType: QuestionType) => {
    setSelectedQuestionType(questionType);
    setIsModalVisible(false);
    setIsFormModalVisible(true);
  };

  const handleFormModalClose = () => {
    setIsFormModalVisible(false);
    setSelectedQuestionType(null);
  };

  // Map QuestionType enum to human-readable names
  const questionTypeOptions = Object.entries(QuestionType).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    value: value
  }));

  return (
    <div className="question-page">
      <div className="page-header">
        <h1>Question Management</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showModal}
        >
          Add Question
        </Button>
      </div>

      {/* Question List Component */}
      <QuestionList lessonId={1} />

      {/* Question Type Selection Modal */}
      <Modal
        title="Select Question Type"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <div className="question-type-selection">
          {questionTypeOptions.map(option => (
            <Button
              key={option.value}
              className="question-type-button"
              onClick={() => handleQuestionTypeSelect(option.value as QuestionType)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </Modal>

      {/* Question Form Modal */}
      {selectedQuestionType && (
        <QuestionFormModal
          open={isFormModalVisible}
          onCancel={handleFormModalClose}
          questionType={selectedQuestionType}
        />
      )}
    </div>
  );
}