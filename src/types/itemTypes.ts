export interface ILesson {
  id: number;
  name: string;
  description: string;
  content: LessonItem[];
}

export interface LessonItem {
  id: number;
  itemType: "content" | "question";
  orderIndex: number;
  type: string;
  isActive: boolean;
  data:
    | ContentWordDefinition
    | ContentSentences
    | QuestionSelectionTextText
    | QuestionSelectionTextImage
    | QuestionSelectionAudioText
    | QuestionSelectionAudioImage
    | QuestionSelectionImageText
    | QuestionMatchingTextText
    | QuestionMatchingTextImage
    | QuestionMatchingAudioText
    | QuestionMatchingAudioImage
    | QuestionBoolAudioText
    | QuestionFillTextText;
}

export interface ContentWordDefinition {
  pinyin: string;
  speech: string;
  audio_url: string;
  picture_url: string;
  translation: string;
  chinese_text: string;
}

export interface ContentSentences {
  pinyin: string[];
  audio_url: string;
  picture_url: string;
  chinese_text: string[];
  explaination: string;
  additional_info: string;
}

// ---- Question types ----

// 1️⃣ Selection (text → text)
export interface QuestionSelectionTextText {
  options: { id: string; text: string }[];
  question: string;
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

// 2️⃣ Selection (text → image)
export interface QuestionSelectionTextImage {
  options: { id: string; alt: string; image: string }[];
  question: string;
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

// 3️⃣ Selection (audio → text)
export interface QuestionSelectionAudioText {
  audio: string;
  audio_url: string;
  audio_transcript_pinyin: string;
  audio_transcript_chinese: string;
  audio_transcript_translation: string;
  options: { id: string; text: string }[];
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

// 4️⃣ Selection (audio → image)
export interface QuestionSelectionAudioImage {
  audio: string;
  audio_url: string;
  audio_transcript_pinyin: string;
  audio_transcript_chinese: string;
  audio_transcript_translation: string;
  options: { id: string; alt: string; image: string }[];
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

// 5️⃣ Selection (image → text)
export interface QuestionSelectionImageText {
  image: string;
  options: { id: string; text: string }[];
  explanation: string;
  instruction: string;
  correctAnswer: string;
}

// 6️⃣ Matching (text ↔ text)
export interface QuestionMatchingTextText {
  leftColumn: { id: string; text: string; pinyin: string }[];
  rightColumn: { id: string; text: string }[];
  correctMatches: { left: string; right: string }[];
  explanation: string;
  instruction: string;
}

// 7️⃣ Matching (text ↔ image)
export interface QuestionMatchingTextImage {
  leftColumn: { id: string; text: string; pinyin: string }[];
  rightColumn: { id: string; text: string; image: string; alt?: string }[];
  correctMatches: { left: string; right: string }[];
  explanation: string;
  instruction: string;
}

// 8️⃣ Matching (audio ↔ text)
export interface QuestionMatchingAudioText {
  leftColumn: {
    id: string;
    audio: string;
    audio_url: string;
    transcript: string;
    pinyin?: string;
  }[];
  rightColumn: { id: string; text: string; image?: string; alt?: string }[];
  correctMatches: { left: string; right: string }[];
  explanation: string;
  instruction: string;
}

// 9️⃣ Matching (audio ↔ image)
export interface QuestionMatchingAudioImage {
  leftColumn: { id: string; audio: string; audio_url: string; transcript: string }[];
  rightColumn: { id: string; image: string; text?: string; alt?: string }[];
  correctMatches: { left: string; right: string }[];
  explanation: string;
  instruction: string;
}

// 🔟 Boolean (audio → true/false)
export interface QuestionBoolAudioText {
  audio: string;
  pinyin: string;
  english: string;
  transcript: string;
  explanation: string;
  instruction: string;
  correctAnswer: boolean;
}

// 11️⃣ Fill-in-the-blank (text → text)
export interface QuestionFillTextText {
  blanks: { index: number; correct: string[] }[];
  pinyin: string[];
  sentence: string[];
  optionBank: string[];
  vietnamese: string;
  explanation: string;
  instruction: string;
}
// {
//     "id": 1,
//     "name": "Lesson 1: Hanzi",
//     "description": "lesson 1 desc",
//     "content": [
//         {
//             "id": 1,
//             "itemType": "content",
//             "orderIndex": 1,
//             "type": "content_word_definition",
//             "isActive": true,
//             "data": {
//                 "pinyin": "niǎo rù duǒ sǎo zhuī",
//                 "speech": "saqadsas",
//                 "audio_url": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/content-word-definition/audio/1760502509855-Vine boom sound effect - Business Goose.mp3",
//                 "picture_url": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/content-word-definition/images/1760502509841-©1995 VNPT Group.png",
//                 "translation": "trnassssssssss",
//                 "chinese_text": "鳥入躲掃追"
//             }
//         },
//         {
//             "id": 2,
//             "itemType": "content",
//             "orderIndex": 2,
//             "type": "content_sentences",
//             "isActive": true,
//             "data": {
//                 "pinyin": [
//                     "nán tíng mào sì yè yù",
//                     "hǔ wán bā fēi mù dàn",
//                     "jù bō rèn kàn hù hēi"
//                 ],
//                 "audio_url": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/content-sentences/audio/1760520530108-Vine boom sound effect - Business Goose.mp3",
//                 "picture_url": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/content-sentences/images/1760520530094-©1995 VNPT Group.png",
//                 "chinese_text": [
//                     "男亭帽寺葉玉",
//                     "虎玩八飛目旦",
//                     "具波刃看戶黑"
//                 ],
//                 "explaination": "This is explaination",
//                 "additional_info": "Nothing additional info"
//             }
//         },
//         {
//             "id": 1,
//             "itemType": "question",
//             "orderIndex": 3,
//             "type": "question_selection_text_text",
//             "isActive": true,
//             "data": {
//                 "options": [
//                     {
//                         "id": "1",
//                         "text": "苹果"
//                     },
//                     {
//                         "id": "2",
//                         "text": "香蕉"
//                     },
//                     {
//                         "id": "3",
//                         "text": "橙子"
//                     },
//                     {
//                         "id": "4",
//                         "text": "西瓜"
//                     }
//                 ],
//                 "question": "(Từ “apple” có nghĩa là gì trong tiếng Trung?)",
//                 "explanation": "正确答案是 “苹果” (píngguǒ)，意思是 apple（quả táo）。\n其他选项分别是：\n\n香蕉 (xiāngjiāo) → banana（chuối）\n\n橙子 (chéngzi) → orange（cam）\n\n西瓜 (xīguā) → watermelon（dưa hấu）\n\n因此，“apple”的中文翻译是“苹果”",
//                 "instruction": "“apple” 的中文是什么意思？",
//                 "correctAnswer": "1"
//             }
//         },
//         {
//             "id": 2,
//             "itemType": "question",
//             "orderIndex": 4,
//             "type": "question_selection_text_image",
//             "isActive": true,
//             "data": {
//                 "options": [
//                     {
//                         "id": "1",
//                         "alt": "test 1",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-text-image/images/1761927155509-images.jpg"
//                     },
//                     {
//                         "id": "2",
//                         "alt": "test 2",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-text-image/images/1761927165253-images.jpg"
//                     },
//                     {
//                         "id": "3",
//                         "alt": "test 3",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-text-image/images/1761927171925-images.jpg"
//                     },
//                     {
//                         "id": "4",
//                         "alt": "test 4",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-text-image/images/1761927178323-images.jpg"
//                     }
//                 ],
//                 "question": "test",
//                 "explanation": "test",
//                 "instruction": "“apple” 的中文是什么意思？",
//                 "correctAnswer": "1"
//             }
//         },
//         {
//             "id": 3,
//             "itemType": "question",
//             "orderIndex": 5,
//             "type": "question_selection_audio_text",
//             "isActive": true,
//             "data": {
//                 "audio": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-audio-text/audio/1761927242792-Vine boom sound effect - Business Goose.mp3",
//                 "options": [
//                     {
//                         "id": "1",
//                         "text": "test 1"
//                     },
//                     {
//                         "id": "2",
//                         "text": "test 2"
//                     },
//                     {
//                         "id": "3",
//                         "text": "test 3"
//                     },
//                     {
//                         "id": "4",
//                         "text": "test 4"
//                     }
//                 ],
//                 "audio_url": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-audio-text/audio/1761927242792-Vine boom sound effect - Business Goose.mp3",
//                 "explanation": "昔巾目點字寺課羽",
//                 "instruction": "“apple” 的中文是什么意思？",
//                 "correctAnswer": "1",
//                 "audio_transcript_pinyin": "xī jīn mù diǎn zì sì kè yǔ",
//                 "audio_transcript_chinese": "昔巾目點字寺課羽",
//                 "audio_transcript_translation": "test"
//             }
//         },
//         {
//             "id": 4,
//             "itemType": "question",
//             "orderIndex": 6,
//             "type": "question_selection_audio_image",
//             "isActive": true,
//             "data": {
//                 "audio": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-audio-image/audio/1761927484098-Vine boom sound effect - Business Goose.mp3",
//                 "options": [
//                     {
//                         "id": "1",
//                         "alt": "test",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-audio-image/images/1761927496305-images.jpg"
//                     },
//                     {
//                         "id": "2",
//                         "alt": "test",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-audio-image/images/1761927505177-images.jpg"
//                     },
//                     {
//                         "id": "3",
//                         "alt": "test",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-audio-image/images/1761927515879-images.jpg"
//                     },
//                     {
//                         "id": "4",
//                         "alt": "test",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-audio-image/images/1761927523003-images.jpg"
//                     }
//                 ],
//                 "audio_url": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-selection-audio-image/audio/1761927484098-Vine boom sound effect - Business Goose.mp3",
//                 "explanation": "test",
//                 "instruction": "“apple” 的中文是什么意思？",
//                 "correctAnswer": "1",
//                 "audio_transcript_pinyin": "t e s t",
//                 "audio_transcript_chinese": "test",
//                 "audio_transcript_translation": "test"
//             }
//         },
//         {
//             "id": 5,
//             "itemType": "question",
//             "orderIndex": 7,
//             "type": "question_selection_image_text",
//             "isActive": true,
//             "data": {
//                 "image": "C:\\fakepath\\images.jpg",
//                 "options": [
//                     {
//                         "id": "1",
//                         "text": "英"
//                     },
//                     {
//                         "id": "2",
//                         "text": "快"
//                     },
//                     {
//                         "id": "3",
//                         "text": "右"
//                     },
//                     {
//                         "id": "4",
//                         "text": "冬"
//                     }
//                 ],
//                 "explanation": "test test",
//                 "instruction": "“apple” 的中文是什么意思？",
//                 "correctAnswer": "1"
//             }
//         },
//         {
//             "id": 6,
//             "itemType": "question",
//             "orderIndex": 8,
//             "type": "question_matching_text_text",
//             "isActive": true,
//             "data": {
//                 "leftColumn": [
//                     {
//                         "id": "1",
//                         "text": "t1",
//                         "pinyin": "t 1"
//                     },
//                     {
//                         "id": "2",
//                         "text": "t2",
//                         "pinyin": "t 2"
//                     },
//                     {
//                         "id": "3",
//                         "text": "t3",
//                         "pinyin": "t 3"
//                     },
//                     {
//                         "id": "4",
//                         "text": "t4",
//                         "pinyin": "t 4"
//                     }
//                 ],
//                 "explanation": "test",
//                 "instruction": "昔巾目點字寺課羽",
//                 "rightColumn": [
//                     {
//                         "id": "A",
//                         "text": "ta"
//                     },
//                     {
//                         "id": "B",
//                         "text": "tb"
//                     },
//                     {
//                         "id": "C",
//                         "text": "tc"
//                     },
//                     {
//                         "id": "D",
//                         "text": "td"
//                     }
//                 ],
//                 "correctMatches": [
//                     {
//                         "left": "1",
//                         "right": "B"
//                     },
//                     {
//                         "left": "2",
//                         "right": "C"
//                     },
//                     {
//                         "left": "3",
//                         "right": "A"
//                     },
//                     {
//                         "left": "4",
//                         "right": "D"
//                     }
//                 ]
//             }
//         },
//         {
//             "id": 7,
//             "itemType": "question",
//             "orderIndex": 9,
//             "type": "question_matching_text_image",
//             "isActive": true,
//             "data": {
//                 "leftColumn": [
//                     {
//                         "id": "1",
//                         "text": "t1",
//                         "pinyin": "t 1"
//                     },
//                     {
//                         "id": "2",
//                         "text": "t2",
//                         "pinyin": "t 2"
//                     },
//                     {
//                         "id": "3",
//                         "text": "t3",
//                         "pinyin": "t 3"
//                     }
//                 ],
//                 "explanation": "test",
//                 "instruction": "test",
//                 "rightColumn": [
//                     {
//                         "id": "A",
//                         "text": "",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-text-image/images/1761927699776-images.jpg"
//                     },
//                     {
//                         "id": "B",
//                         "alt": "",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-text-image/images/1761927714544-images.jpg"
//                     },
//                     {
//                         "id": "C",
//                         "alt": "",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-text-image/images/1761927722115-images.jpg"
//                     }
//                 ],
//                 "correctMatches": [
//                     {
//                         "left": "1",
//                         "right": "A"
//                     },
//                     {
//                         "left": "2",
//                         "right": "B"
//                     },
//                     {
//                         "left": "3",
//                         "right": "C"
//                     }
//                 ]
//             }
//         },
//         {
//             "id": 8,
//             "itemType": "question",
//             "orderIndex": 10,
//             "type": "question_matching_audio_text",
//             "isActive": true,
//             "data": {
//                 "leftColumn": [
//                     {
//                         "id": "1",
//                         "text": "",
//                         "audio": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-text/audio/1761927758701-Vine boom sound effect - Business Goose.mp3",
//                         "pinyin": "",
//                         "audio_url": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-text/audio/1761927758701-Vine boom sound effect - Business Goose.mp3",
//                         "transcript": "test"
//                     },
//                     {
//                         "id": "2",
//                         "audio": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-text/audio/1761927768825-Vine boom sound effect - Business Goose.mp3",
//                         "audio_url": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-text/audio/1761927768825-Vine boom sound effect - Business Goose.mp3",
//                         "transcript": ""
//                     },
//                     {
//                         "id": "3",
//                         "audio": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-text/audio/1761927777521-Vine boom sound effect - Business Goose.mp3",
//                         "audio_url": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-text/audio/1761927777521-Vine boom sound effect - Business Goose.mp3",
//                         "transcript": ""
//                     }
//                 ],
//                 "explanation": "1",
//                 "instruction": "test",
//                 "rightColumn": [
//                     {
//                         "id": "A",
//                         "alt": "",
//                         "text": "1",
//                         "image": ""
//                     },
//                     {
//                         "id": "B",
//                         "text": "2"
//                     },
//                     {
//                         "id": "C",
//                         "text": "3"
//                     }
//                 ],
//                 "correctMatches": [
//                     {
//                         "left": "1",
//                         "right": "B"
//                     },
//                     {
//                         "left": "2",
//                         "right": "A"
//                     },
//                     {
//                         "left": "3",
//                         "right": "C"
//                     }
//                 ]
//             }
//         },
//         {
//             "id": 9,
//             "itemType": "question",
//             "orderIndex": 11,
//             "type": "question_matching_audio_image",
//             "isActive": true,
//             "data": {
//                 "leftColumn": [
//                     {
//                         "id": "1",
//                         "audio": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-image/audio/1761927813997-Vine boom sound effect - Business Goose.mp3",
//                         "audio_url": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-image/audio/1761927813997-Vine boom sound effect - Business Goose.mp3",
//                         "transcript": ""
//                     },
//                     {
//                         "id": "2",
//                         "audio": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-image/audio/1761927821865-Vine boom sound effect - Business Goose.mp3",
//                         "audio_url": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-image/audio/1761927821865-Vine boom sound effect - Business Goose.mp3",
//                         "transcript": ""
//                     }
//                 ],
//                 "explanation": "test",
//                 "instruction": "testttt",
//                 "rightColumn": [
//                     {
//                         "id": "A",
//                         "text": "",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-image/images/1761927827409-images.jpg"
//                     },
//                     {
//                         "id": "B",
//                         "alt": "",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-image/images/1761927834163-images.jpg"
//                     },
//                     {
//                         "id": "C",
//                         "alt": "",
//                         "image": "https://hanzii-lab.s3.ap-southeast-2.amazonaws.com/question-matching-audio-image/images/1761927840786-images.jpg"
//                     }
//                 ],
//                 "correctMatches": [
//                     {
//                         "left": "1",
//                         "right": "A"
//                     },
//                     {
//                         "left": "1",
//                         "right": "B"
//                     },
//                     {
//                         "left": "2",
//                         "right": "C"
//                     }
//                 ]
//             }
//         },
//         {
//             "id": 10,
//             "itemType": "question",
//             "orderIndex": 12,
//             "type": "question_bool_audio_text",
//             "isActive": true,
//             "data": {
//                 "audio": "C:\\fakepath\\Vine boom sound effect - Business Goose.mp3",
//                 "pinyin": "mén ěr gè hòu dàn wō tóu wǎn huà mó xū duì zhǐ xiǎng tiào jí jīn",
//                 "english": "test etst etstetstets",
//                 "transcript": "們耳個候但蝸頭晚畫麼許對止想跳吉金",
//                 "explanation": "tét昔巾目點字寺課羽",
//                 "instruction": "昔巾目點字寺課羽",
//                 "correctAnswer": true
//             }
//         },
//         {
//             "id": 11,
//             "itemType": "question",
//             "orderIndex": 13,
//             "type": "question_fill_text_text",
//             "isActive": true,
//             "data": {
//                 "blanks": [
//                     {
//                         "index": 1,
//                         "correct": [
//                             "你"
//                         ]
//                     },
//                     {
//                         "index": 2,
//                         "correct": [
//                             "我"
//                         ]
//                     }
//                 ],
//                 "pinyin": [
//                     "[1]",
//                     "hǎo",
//                     "[2]",
//                     "shì   lǐ   míng ."
//                 ],
//                 "sentence": [
//                     "[1]",
//                     "好",
//                     "[2]",
//                     "是 李 明."
//                 ],
//                 "optionBank": [
//                     "你",
//                     "我",
//                     "他",
//                     "她"
//                 ],
//                 "vietnamese": "[1] xin chào, [2] là Lý Minh.",
//                 "explanation": "你好 = 你(you)+好(good). ‘我是…’ dùng 我 cho ‘Tôi là ...",
//                 "instruction": "Điền từ tiếng Trung thích hợp vào chỗ trống."
//             }
//         }
//     ]
// }