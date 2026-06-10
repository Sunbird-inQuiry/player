export const QUML_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    SELECT:       '— select —',
    BLANK:        'Blank {n}',
    ANSWER:       'Answer',
    PLACEHOLDER:  'Type your answer',
    MOVE_UP:      'Move up',
    MOVE_DOWN:    'Move down',
    COL_QUESTION: 'Question',
    COL_ANSWER:   'Answer',
  },
  fr: {
    SELECT:       '— sélectionner —',
    BLANK:        'Espace {n}',
    ANSWER:       'Réponse',
    PLACEHOLDER:  'Tapez votre réponse',
    MOVE_UP:      'Monter',
    MOVE_DOWN:    'Descendre',
    COL_QUESTION: 'Question',
    COL_ANSWER:   'Réponse',
  },
  pt: {
    SELECT:       '— selecionar —',
    BLANK:        'Lacuna {n}',
    ANSWER:       'Resposta',
    PLACEHOLDER:  'Digite sua resposta',
    MOVE_UP:      'Mover para cima',
    MOVE_DOWN:    'Mover para baixo',
    COL_QUESTION: 'Questão',
    COL_ANSWER:   'Resposta',
  },
  ar: {
    SELECT:       '— اختر —',
    BLANK:        'فراغ {n}',
    ANSWER:       'الإجابة',
    PLACEHOLDER:  'اكتب إجابتك',
    MOVE_UP:      'تحريك لأعلى',
    MOVE_DOWN:    'تحريك لأسفل',
    COL_QUESTION: 'السؤال',
    COL_ANSWER:   'الإجابة',
  },
  hi: {
    SELECT:       '— चुनें —',
    BLANK:        'रिक्त {n}',
    ANSWER:       'उत्तर',
    PLACEHOLDER:  'अपना उत्तर लिखें',
    MOVE_UP:      'ऊपर ले जाएं',
    MOVE_DOWN:    'नीचे ले जाएं',
    COL_QUESTION: 'प्रश्न',
    COL_ANSWER:   'उत्तर',
  },
};

/** Looks up a UI string. Falls back to English if key missing in target language. */
export function t(language: string, key: string, n?: number): string {
  const lang = QUML_TRANSLATIONS[language] ?? QUML_TRANSLATIONS['en'];
  const val  = lang[key] ?? QUML_TRANSLATIONS['en'][key] ?? key;
  return n !== undefined ? val.replace('{n}', String(n)) : val;
}
