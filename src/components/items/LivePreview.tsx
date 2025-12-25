import React from 'react';
import { Form, Typography, Card, Divider, Tag } from 'antd';
import { FormInstance } from 'antd/es/form';
import { QuestionType } from '@/enums/question-type.enum';
import { ContentType } from '@/enums/content-type.enum';
import TextContentDisplay from '../shared/TextContentDisplay';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

const { Text, Title } = Typography;

interface LivePreviewProps {
  form: FormInstance;
  type?: string;
}

const EXAMPLE_DATA: Record<string, any> = {
  [ContentType.CONTENT_SENTENCES]: {
    instruction: "Ví dụ: Đọc và dịch các câu sau",
    sentences: [
      { chinese: "你好", pinyin: "nǐ hǎo", vietnamese: "Xin chào" },
      { chinese: "我是学生", pinyin: "wǒ shì xué shēng", vietnamese: "Tôi là học sinh" }
    ]
  },
  [ContentType.CONTENT_WORD_DEFINITION]: {
    word: "猫",
    pinyin: "māo",
    definition: "Con mèo (danh từ)",
    example: "我家有一只猫 (Nhà tôi có một con mèo)"
  },
  [QuestionType.SelectionTextText]: {
    instruction: "Chọn đáp án đúng",
    questionContent: { text: "Từ nào có nghĩa là 'Xin chào'?" },
    options: [
      { id: '1', content: { text: "你好 (Nǐ hǎo)" } },
      { id: '2', content: { text: "再见 (Zài jiàn)" } },
      { id: '3', content: { text: "谢谢 (Xiè xiè)" } },
      { id: '4', content: { text: "对不起 (Duì bu qǐ)" } },
    ],
    correctAnswer: '1'
  },
  // Add other examples as needed
};

const LivePreview: React.FC<LivePreviewProps> = ({ form, type }) => {
  // All hooks must be called at the top level, before any returns
  const formData = Form.useWatch('data', form);
  const formTypeWatch = Form.useWatch('type', form);
  
  // Determine if we are in "Example Mode" (type provided externally)
  const isExampleMode = !!type; 
  const currentType = type || formTypeWatch;

  const data = isExampleMode ? EXAMPLE_DATA[currentType!] : formData;

  if (!currentType) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
        <div className="mb-4 text-4xl opacity-30">📱</div>
        <p className="text-sm font-medium">Chọn một loại để xem ví dụ</p>
      </div>
    );
  }
  
  // If we have a type but no data (and no example), show placeholder
  if (!data && !isExampleMode) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <p className="text-sm">Đang chờ dữ liệu...</p>
        </div>
      )
  }

  const renderContentPreview = () => {
    switch (currentType) {
      case ContentType.CONTENT_SENTENCES:
        return <PreviewContentSentences data={data} />;
      case ContentType.CONTENT_WORD_DEFINITION:
         return <PreviewWordDefinition data={data} />;
      case QuestionType.SelectionTextText:
        return <PreviewSelectionTextText data={data} />;
      // Add other cases as needed
      default:
        return (
          <div className="text-gray-400 italic text-center text-sm p-4">
            <div className="mb-2">Mô phỏng hiển thị cho:</div>
            <Tag>{currentType}</Tag>
            {isExampleMode && <div className="mt-2 text-xs">(Chưa có dữ liệu mẫu)</div>}
          </div>
        );
    }
  };

  return (
    <div className="preview-container w-full relative">
         {isExampleMode && (
            <div className="absolute top-0 right-0 z-10">
                <Tag color="cyan">Mẫu Ví Dụ</Tag>
            </div>
         )}

         {/* Instruction / Header if available */}
         {data?.instruction && (
            <div className="bg-white p-3 rounded-lg shadow-sm mb-3 border border-gray-100">
                <Text className="text-xs text-gray-500 uppercase font-bold block mb-1">Hướng dẫn</Text>
                <Text className="text-sm text-gray-800">{data.instruction}</Text>
            </div>
         )}

         {/* Main Content Render */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[100px]">
            {renderContentPreview()}
         </div>
         
         {/* Explanation if available */}
         {data?.explanation && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                    <Tag color="blue" className="m-0 text-[10px] uppercase">Giải thích</Tag>
                </div>
                <Text className="text-xs text-blue-800">{data.explanation}</Text>
            </div>
         )}
    </div>
  );
};

// --- Sub-components for specific types ---

const PreviewContentSentences = ({ data }: { data: any }) => {
    // Check specific structure for ContentSentences
    // Usually it has a list of sentences or html content
    return (
        <div className="p-4">
            <Text>Nội dung câu (Preview Placeholder)</Text>
             <pre className="text-xs mt-2 text-gray-400">{JSON.stringify(data, null, 2)}</pre>
        </div>
    )
}

const PreviewWordDefinition = ({ data }: { data: any }) => {
     return (
        <div className="p-4">
             <Text strong>{data.word}</Text>
             <Text type="secondary" className="block text-sm">{data.pinyin}</Text>
             <Divider className="my-2"/>
             <Text>{data.definition}</Text>
        </div>
    )
}

const PreviewSelectionTextText = ({ data }: { data: any }) => {
  const { questionContent, options, correctAnswer } = data;

  return (
    <div className='flex flex-col h-full'>
      {/* Question */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <TextContentDisplay 
            content={questionContent} 
            className="text-lg font-medium text-gray-800" 
            size="large"
        />
      </div>

      {/* Options */}
      <div className="p-4 flex-col gap-3 flex">
        {options?.map((opt: any, idx: number) => {
            const isCorrect = opt.id === correctAnswer;
            return (
                <div 
                    key={opt.id || idx}
                    className={`
                        relative p-3 rounded-lg border text-sm transition-all
                        flex justify-between items-center group
                        ${isCorrect 
                            ? 'bg-green-50 border-green-200 text-green-900 shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border
                             ${isCorrect  
                                ? 'bg-green-100 border-green-300 text-green-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-400'
                             }
                        `}>
                            {String.fromCharCode(65 + idx)}
                        </div>
                        <TextContentDisplay content={opt.content} />
                    </div>
                    
                    {isCorrect && <CheckCircleFilled className="text-green-500" />}
                </div>
            )
        })}
        {!options?.length && (
            <div className="text-center text-gray-400 py-4 text-xs">Chưa có lựa chọn nào</div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;
