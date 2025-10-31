export enum QuestionType {
  // Selection
  SelectionTextText = "question_selection_text_text", //Question: text Answer: text
  SelectionTextImage = "question_selection_text_image", //Question: text Answer: image
  SelectionAudioText = "question_selection_audio_text", //Question: audio Answer: text
  SelectionAudioImage = "question_selection_audio_image", //Question: audio Answer: image
  SelectionImageText = "question_selection_image_text", //Question: image Answer: text

  // Matching
  MatchingTextText = "question_matching_text_text", //Question: text Answer: text
  MatchingTextImage = "question_matching_text_image", //Question: text Answer: image
  MatchingAudioText = "question_matching_audio_text", //Question: audio Answer: text
  MatchingAudioImage = "question_matching_audio_image", //Question: audio Answer: image

  // Fill
  FillTextText = "question_fill_text_text", //Question: text Answer: text

  // Bool
  BoolAudioText = "question_bool_audio_text", //Question: audio Answer: text
}
