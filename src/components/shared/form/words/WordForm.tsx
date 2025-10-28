"use client";

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, InputNumber, Switch, Spin, message, Tabs, Divider, Space, Alert, Upload, Tag } from 'antd';
import { debounce } from 'lodash';
import { pinyin } from 'pinyin-pro';
import { 
  searchWord, 
  createWord, 
  updateWordSense, 
  deleteWordSense 
} from '@/services/wordApi';
import { Word, WordFormData, WordSense, WordTranslation } from '@/types/wordTypes';
import { DeleteOutlined, PlusOutlined, UploadOutlined, ReloadOutlined, PictureOutlined, SoundOutlined } from '@ant-design/icons';
import { uploadImageByType, uploadAudioByType, validateFile, UploadProgress } from '@/utils/s3Upload';
import UploadModal from '@/components/common/UploadModal';

const { TabPane } = Tabs;
const { Option } = Select;

// Dev mode flag - set to false to hide individual upload buttons
const DEV_MODE = true;

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
  const [generatedPinyin, setGeneratedPinyin] = useState<string>('');
  
  // Upload state
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error' | 'idle'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | undefined>(undefined);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string>('');
  
  const isEdit = !!wordData;
  
  // Helper to get first translation object from sense
  const firstTranslation = (sense?: WordSense): WordTranslation | undefined => {
    return sense?.translations?.[0];
  };

  // Generate pinyin for Chinese text
  const generatePinyin = (text: string): string => {
    if (!text || !text.trim()) return "";

    try {
      return pinyin(text, { toneType: "symbol" });
    } catch (error) {
      console.warn("Failed to generate pinyin:", error);
      return "";
    }
  };

  // Auto-generate pinyin when simplified Chinese changes
  const handleSimplifiedChange = (value: string) => {
    if (!value || !value.trim()) {
      setGeneratedPinyin('');
      return;
    }

    // Generate pinyin
    const pinyinText = generatePinyin(value);
    setGeneratedPinyin(pinyinText);

    // Auto-fill pinyin field if it's empty
    const currentPinyin = form.getFieldValue(['sense', 'pinyin']);
    if (!currentPinyin || currentPinyin.trim() === '') {
      form.setFieldsValue({
        sense: {
          ...form.getFieldValue('sense'),
          pinyin: pinyinText,
        }
      });
    }
  };

  // Manually regenerate pinyin
  const handleRegeneratePinyin = () => {
    const simplified = form.getFieldValue(['word', 'simplified']);
    if (!simplified || !simplified.trim()) {
      message.warning('Please enter simplified Chinese first');
      return;
    }

    const pinyinText = generatePinyin(simplified);
    setGeneratedPinyin(pinyinText);
    
    form.setFieldsValue({
      sense: {
        ...form.getFieldValue('sense'),
        pinyin: pinyinText,
      }
    });
    
    message.success('Pinyin regenerated');
  };

  // Image upload handlers
  const handleImageFileChange = (file: File | null) => {
    setSelectedImageFile(file);
    return false;
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      message.warning('Please select an image file to upload');
      return;
    }

    const imageValidation = validateFile(selectedImageFile, 'image', 10);
    if (!imageValidation.isValid) {
      message.error(imageValidation.error);
      return;
    }

    setUploadModalVisible(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      const result = await uploadImageByType(
        selectedImageFile,
        'word',
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success) {
        setUploadedImageUrl(result.url);
        form.setFieldsValue({
          sense: {
            ...form.getFieldValue('sense'),
            imageUrl: result.url,
          }
        });
        setUploadStatus('success');
        setUploadProgress(100);
        setSelectedImageFile(null);
        message.success('Image uploaded successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Upload failed. Please try again.');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setUploadedImageUrl(undefined);
    form.setFieldsValue({
      sense: {
        ...form.getFieldValue('sense'),
        imageUrl: null,
      }
    });
  };

  // Audio upload handlers
  const handleAudioFileChange = (file: File | null) => {
    setSelectedAudioFile(file);
    return false;
  };

  const handleUploadAudio = async () => {
    if (!selectedAudioFile) {
      message.warning('Please select an audio file to upload');
      return;
    }

    const audioValidation = validateFile(selectedAudioFile, 'audio', 10);
    if (!audioValidation.isValid) {
      message.error(audioValidation.error);
      return;
    }

    setUploadModalVisible(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      const result = await uploadAudioByType(
        selectedAudioFile,
        'word',
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.percentage));
        }
      );

      if (result.success) {
        setUploadedAudioUrl(result.url);
        form.setFieldsValue({
          sense: {
            ...form.getFieldValue('sense'),
            audioUrl: result.url,
          }
        });
        setUploadStatus('success');
        setUploadProgress(100);
        setSelectedAudioFile(null);
        message.success('Audio uploaded successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      message.error('Upload failed. Please try again.');
    }
  };

  const handleRemoveAudio = () => {
    setSelectedAudioFile(null);
    setUploadedAudioUrl(undefined);
    form.setFieldsValue({
      sense: {
        ...form.getFieldValue('sense'),
        audioUrl: null,
      }
    });
  };

  // Initialize form with existing data if editing
  useEffect(() => {
    if (wordData) {
      setExistingWord(wordData);
      
      // Set initial form values for the first sense or selected sense
      const primarySense = wordData.senses?.find(sense => sense.isPrimary) || wordData.senses?.[0];
      if (primarySense) {
        setSenseEditing(primarySense);
        const t = firstTranslation(primarySense);
        
        // Set generated pinyin for display
        if (primarySense.pinyin) {
          setGeneratedPinyin(primarySense.pinyin);
        }

        // Set existing image/audio URLs
        if (primarySense.imageUrl) {
          setUploadedImageUrl(primarySense.imageUrl);
        }
        if (primarySense.audioUrl) {
          setUploadedAudioUrl(primarySense.audioUrl);
        }
        
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
            language: t?.language || 'vn',
            translation: t?.translation || '',
            additionalDetail: t?.additionalDetail || '',
          }
        });
      }
    } else {
      form.resetFields();
      setSelectedImageFile(null);
      setSelectedAudioFile(null);
      setUploadedImageUrl(undefined);
      setUploadedAudioUrl(undefined);
      setGeneratedPinyin('');
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

  // Combined handler for simplified input
  const handleSimplifiedInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleSimplifiedChange(value);
    handleSimplifiedSearch(value);
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    setLoading(true);
    
    try {
      const formData: WordFormData = {
        wordId: existingWord?.id,
        word: values.word,
        sense: {
          ...values.sense,
          imageUrl: uploadedImageUrl || values.sense.imageUrl || null,
          audioUrl: uploadedAudioUrl || values.sense.audioUrl || null,
        },
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
      const t = firstTranslation(sense);
      
      // Update generated pinyin
      if (sense.pinyin) {
        setGeneratedPinyin(sense.pinyin);
      }

      // Update uploaded URLs
      setUploadedImageUrl(sense.imageUrl || undefined);
      setUploadedAudioUrl(sense.audioUrl || undefined);
      
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
          language: t?.language || 'vn',
          translation: t?.translation || '',
          additionalDetail: t?.additionalDetail || '',
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
              <div>
                <Form.Item
                  label="Simplified Chinese"
                  name={['word', 'simplified']}
                  rules={[{ required: true, message: 'Simplified Chinese is required' }]}
                >
                  <Input 
                    onChange={handleSimplifiedInput}
                    disabled={isEdit || !!existingWord}
                    suffix={searchLoading ? <Spin size="small" /> : null}
                    placeholder="e.g., 你好"
                  />
                </Form.Item>
                
                {/* Display auto-generated pinyin preview */}
                {generatedPinyin && (
                  <div style={{ marginTop: -16, marginBottom: 16 }}>
                    <Tag color="blue">Auto-generated: {generatedPinyin}</Tag>
                  </div>
                )}
              </div>
              
              <Form.Item
                label="Traditional Chinese (optional)"
                name={['word', 'traditional']}
              >
                <Input 
                  disabled={isEdit || !!existingWord}
                  placeholder="e.g., 你好"
                />
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
                  {wordData.senses.map((sense) => {
                    const t = firstTranslation(sense);
                    return (
                      <Option key={sense.id} value={sense.id}>
                        Sense {sense.senseNumber}: {sense.pinyin} - {t?.translation || ''}
                      </Option>
                    );
                  })}
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
                      setGeneratedPinyin('');
                      setUploadedImageUrl(undefined);
                      setUploadedAudioUrl(undefined);
                      setSelectedImageFile(null);
                      setSelectedAudioFile(null);
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
                label={
                  <Space>
                    <span>Pinyin</span>
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<ReloadOutlined />}
                      onClick={handleRegeneratePinyin}
                      style={{ padding: 0 }}
                    >
                      Regenerate
                    </Button>
                  </Space>
                }
                name={['sense', 'pinyin']}
                rules={[{ required: true, message: 'Pinyin is required' }]}
              >
                <Input placeholder="e.g., nǐ hǎo" />
              </Form.Item>
              
              <Form.Item
                label="Part of Speech"
                name={['sense', 'partOfSpeech']}
              >
                <Select 
                  options={partOfSpeechOptions} 
                  allowClear
                  showSearch
                  placeholder="Select part of speech"
                />
              </Form.Item>
              
              <Form.Item
                label="HSK Level"
                name={['sense', 'hskLevel']}
              >
                <InputNumber min={1} max={9} style={{ width: '100%' }} placeholder="1-9" />
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
              {/* Hidden field to store image URL */}
              <Form.Item name={['sense', 'imageUrl']} hidden>
                <Input />
              </Form.Item>

              <Form.Item label="Upload Image">
                <div>
                  <Upload
                    accept="image/*"
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleImageFileChange(file);
                      return false;
                    }}
                    disabled={!!uploadedImageUrl}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      disabled={!!uploadedImageUrl}
                      style={{ marginBottom: 8 }}
                    >
                      {selectedImageFile ? selectedImageFile.name : 'Select Image'}
                    </Button>
                  </Upload>
                  {uploadedImageUrl && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PictureOutlined style={{ color: '#52c41a' }} />
                        <span style={{ color: '#52c41a' }}>Image uploaded</span>
                        <Button
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={handleRemoveImage}
                          type="text"
                          danger
                        />
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <img
                          src={uploadedImageUrl}
                          alt="Word"
                          style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  )}
                  {DEV_MODE && selectedImageFile && !uploadedImageUrl && (
                    <div style={{ marginTop: 8 }}>
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={handleUploadImage}
                        loading={uploadStatus === 'uploading'}
                      >
                        Upload Image to S3 (Dev Mode)
                      </Button>
                    </div>
                  )}
                </div>
              </Form.Item>

              {/* Hidden field to store audio URL */}
              <Form.Item name={['sense', 'audioUrl']} hidden>
                <Input />
              </Form.Item>
              
              <Form.Item label="Upload Audio">
                <div>
                  <Upload
                    accept="audio/*"
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleAudioFileChange(file);
                      return false;
                    }}
                    disabled={!!uploadedAudioUrl}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      disabled={!!uploadedAudioUrl}
                      style={{ marginBottom: 8 }}
                    >
                      {selectedAudioFile ? selectedAudioFile.name : 'Select Audio'}
                    </Button>
                  </Upload>
                  {uploadedAudioUrl && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <SoundOutlined style={{ color: '#52c41a' }} />
                        <span style={{ color: '#52c41a' }}>Audio uploaded</span>
                        <Button
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={handleRemoveAudio}
                          type="text"
                          danger
                        />
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <audio controls style={{ width: '100%' }}>
                          <source src={uploadedAudioUrl} />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>
                  )}
                  {DEV_MODE && selectedAudioFile && !uploadedAudioUrl && (
                    <div style={{ marginTop: 8 }}>
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={handleUploadAudio}
                        loading={uploadStatus === 'uploading'}
                      >
                        Upload Audio to S3 (Dev Mode)
                      </Button>
                    </div>
                  )}
                </div>
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
              <Input placeholder="Enter Vietnamese translation" />
            </Form.Item>
            
            <Form.Item
              label="Additional Details"
              name={['translation', 'additionalDetail']}
              extra="Add usage notes, example sentences, or cultural context"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="e.g., Common greeting used in formal and informal situations"
              />
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

      <UploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        uploadedUrls={{ 
          imageUrl: uploadedImageUrl,
          audioUrl: uploadedAudioUrl 
        }}
        errorMessage={uploadError}
        fileNames={{
          imageName: selectedImageFile?.name,
          audioName: selectedAudioFile?.name,
        }}
      />
    </Spin>
  );
};

export default WordForm;