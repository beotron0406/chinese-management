"use client";

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, InputNumber, Switch, Spin, message, Tabs, Divider, Space, Alert } from 'antd';
import { debounce } from 'lodash';
import { 
  searchWord, 
  createWord, 
  updateWordSense, 
  deleteWordSense 
} from '@/services/wordApi';
import { Word, WordFormData, WordSense } from '@/types/wordTypes';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

interface WordFormProps {
  wordData?: Word;
  onSuccess: () => void;
}

const WordForm: React.FC<WordFormProps> = ({ wordData, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [existingWord, setExistingWord] = useState<Word | null>(null);
  const [activeTab, setActiveTab] = useState<string>('1');
  const [senseEditing, setSenseEditing] = useState<WordSense | null>(null);
  
  const isEdit = !!wordData;
  
  // Initialize form with existing data if editing
  useEffect(() => {
    if (wordData) {
      setExistingWord(wordData);
      
      // Set initial form values for the first sense or selected sense
      const primarySense = wordData.senses?.find(sense => sense.isPrimary) || wordData.senses?.[0];
      if (primarySense) {
        setSenseEditing(primarySense);
        form.setFieldsValue({
          word: {
            simplified: wordData.simplified,
            traditional: wordData.traditional || '',
          },
          sense: {
            pinyin: primarySense.pinyin,
            partOfSpeech: primarySense.partOfSpeech || '',
            hskLevel: primarySense.hskLevel || undefined,
            isPrimary: primarySense.isPrimary || false,
            imageUrl: primarySense.imageUrl || '',
            audioUrl: primarySense.audioUrl || '',
          },
          translation: {
            language: primarySense.translation?.language || 'vn',
            translation: primarySense.translation?.translation || '',
            additionalDetail: primarySense.translation?.additionalDetail || '',
          }
        });
      }
    }
  }, [wordData, form]);

  // Search for existing word when simplified character is entered
  const handleSimplifiedSearch = debounce(async (value: string) => {
    if (!value || value.length < 1) {
      setExistingWord(null);
      return;
    }

    // Skip search in edit mode
    if (isEdit) return;
    
    try {
      setSearchLoading(true);
      const response = await searchWord(value);
      if (response.exists && response.word) {
        setExistingWord(response.word);
        message.info(`Word "${value}" already exists. You can add a new sense.`);
      } else {
        setExistingWord(null);
      }
    } catch (error) {
      console.error('Error searching word:', error);
    } finally {
      setSearchLoading(false);
    }
  }, 500);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setLoading(true);
    
    try {
      const formData: WordFormData = {
        wordId: existingWord?.id,
        word: values.word,
        sense: values.sense,
        translation: values.translation,
      };
      
      if (isEdit && senseEditing?.id) {
        // Update existing word sense
        await updateWordSense(senseEditing.id, formData);
        message.success('Word updated successfully');
      } else {
        // Create new word or add sense to existing word
        await createWord(formData);
        message.success('Word created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error('Failed to save word');
    } finally {
      setLoading(false);
    }
  };

  // Handle sense deletion
  const handleDeleteSense = async (sense: WordSense) => {
    if (!sense.id) return;
    
    try {
      await deleteWordSense(sense.id);
      message.success('Sense deleted successfully');
      onSuccess();
    } catch (error) {
      console.error('Error deleting sense:', error);
      message.error('Failed to delete sense');
    }
  };

  // Change active sense in edit mode
  const handleSenseChange = (senseId: number) => {
    if (!wordData || !wordData.senses) return;
    
    const sense = wordData.senses.find(s => s.id === senseId);
    if (sense) {
      setSenseEditing(sense);
      form.setFieldsValue({
        sense: {
          pinyin: sense.pinyin,
          partOfSpeech: sense.partOfSpeech || '',
          hskLevel: sense.hskLevel || undefined,
          isPrimary: sense.isPrimary || false,
          imageUrl: sense.imageUrl || '',
          audioUrl: sense.audioUrl || '',
        },
        translation: {
          language: sense.translation?.language || 'vn',
          translation: sense.translation?.translation || '',
          additionalDetail: sense.translation?.additionalDetail || '',
        }
      });
    }
  };

  // Parts of speech options
  const partOfSpeechOptions = [
    'noun', 'verb', 'adjective', 'adverb', 'pronoun', 
    'preposition', 'conjunction', 'interjection', 'measure word'
  ].map(pos => ({ label: pos, value: pos }));

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Basic Info" key="1">
            {/* Word Info Section */}
            <Divider orientation="left">Word Information</Divider>
            
            {existingWord && !isEdit && (
              <Alert
                message="Word exists"
                description={`This word already exists in the database. You can add a new sense/meaning to it.`}
                type="info"
                showIcon
                className="mb-4"
              />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label="Simplified Chinese"
                name={['word', 'simplified']}
                rules={[{ required: true, message: 'Simplified Chinese is required' }]}
              >
                <Input 
                  onChange={(e) => handleSimplifiedSearch(e.target.value)}
                  disabled={isEdit || !!existingWord}
                  suffix={searchLoading ? <Spin size="small" /> : null}
                />
              </Form.Item>
              
              <Form.Item
                label="Traditional Chinese (optional)"
                name={['word', 'traditional']}
              >
                <Input disabled={isEdit || !!existingWord} />
              </Form.Item>
            </div>
            
            {/* Word Sense Section */}
            <Divider orientation="left">Sense Information</Divider>
            
            {isEdit && wordData?.senses && wordData.senses.length > 0 && (
              <div className="mb-4">
                <span className="mr-2">Edit Sense:</span>
                <Select 
                  value={senseEditing?.id} 
                  onChange={handleSenseChange}
                  style={{ width: 300 }}
                >
                  {wordData.senses.map((sense, index) => (
                    <Option key={sense.id} value={sense.id}>
                      Sense {sense.senseNumber}: {sense.pinyin} - {sense.translation?.translation}
                    </Option>
                  ))}
                </Select>
                
                {wordData.senses.length > 1 && senseEditing?.id && (
                  <Button 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteSense(senseEditing)}
                    className="ml-2"
                  >
                    Delete Sense
                  </Button>
                )}
                
                {isEdit && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setSenseEditing(null);
                      form.resetFields(['sense', 'translation']);
                      form.setFieldsValue({
                        sense: { isPrimary: false },
                        translation: { language: 'vn' }
                      });
                    }}
                    className="ml-2"
                  >
                    Add New Sense
                  </Button>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label="Pinyin"
                name={['sense', 'pinyin']}
                rules={[{ required: true, message: 'Pinyin is required' }]}
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                label="Part of Speech"
                name={['sense', 'partOfSpeech']}
              >
                <Select 
                  options={partOfSpeechOptions} 
                  allowClear
                  showSearch
                />
              </Form.Item>
              
              <Form.Item
                label="HSK Level"
                name={['sense', 'hskLevel']}
              >
                <InputNumber min={1} max={9} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                label="Primary Sense"
                name={['sense', 'isPrimary']}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </div>
          </TabPane>
          
          <TabPane tab="Media & Translation" key="2">
            {/* Media Section */}
            <Divider orientation="left">Media Resources</Divider>
            
            <div className="grid grid-cols-1 gap-4">
              <Form.Item
                label="Image URL"
                name={['sense', 'imageUrl']}
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                label="Audio URL"
                name={['sense', 'audioUrl']}
              >
                <Input />
              </Form.Item>
            </div>
            
            {/* Translation Section */}
            <Divider orientation="left">Translation</Divider>
            
            <Form.Item
              label="Language"
              name={['translation', 'language']}
              initialValue="vn"
            >
              <Select disabled>
                <Option value="vn">Vietnamese</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              label="Translation"
              name={['translation', 'translation']}
              rules={[{ required: true, message: 'Translation is required' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              label="Additional Details"
              name={['translation', 'additionalDetail']}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
          </TabPane>
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <Space>
            <Button onClick={onSuccess}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit && senseEditing?.id ? 'Update Word' : 'Create Word'}
            </Button>
          </Space>
        </div>
      </Form>
    </Spin>
  );
};

export default WordForm;