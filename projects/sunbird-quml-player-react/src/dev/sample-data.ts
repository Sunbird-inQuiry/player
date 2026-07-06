import type { PlayerConfig } from '../types';

/**
 * DEV-ONLY sample data — a QuML-shaped questionset used by the local dev harness
 * (App.tsx) so `npm run dev` renders the real player. NOT part of the
 * library/web-component build. Replace with real data via playerConfig.data.
 *
 * Shaped to mirror the Assessment Overview design: 7 sections / 12 questions,
 * 15-minute limit, covering all question types including Boolean (True/False).
 */
export const sampleConfig: PlayerConfig = {
  context: { uid: 'dev-user', sid: 'dev-session', channel: 'dev' },
  config: { language: 'en', showFeedback: true, maxAttempts: 3 },
  data: {
    identifier: 'do_sample_set',
    name: 'Sunbird Assessment',
    description:
      'Complete all sections to finish the assessment. Your responses are saved automatically as you go.',
    timeLimits: { questionSet: { max: 900, min: 0 } },
    sections: [
      {
        identifier: 'do_section_a',
        name: 'Knowledge Check',
        description: 'Recognise the right answer',
        timeLimits: { questionSet: { max: 0, min: 0 } },
        allowSkip: 'Yes',
        children: [
          {
            identifier: 'do_mcq_single',
            body:
              '<p>Which planet is known as the “Red Planet”?</p>' +
              "<p><img src=\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><circle cx='80' cy='80' r='64' fill='%23a85236'/><circle cx='58' cy='64' r='10' fill='%238f4630'/><circle cx='104' cy='92' r='14' fill='%238f4630'/></svg>\" alt=\"A red planet\" style=\"max-width:200px\" /></p>",
            primaryCategory: 'Multiple Choice Question',
            interactions: {
              response1: {
                options: [
                  { value: 0, label: 'Mercury' },
                  { value: 1, label: 'Venus' },
                  { value: 2, label: 'Mars' },
                  { value: 3, label: 'Jupiter' },
                ],
              },
            },
            responseDeclaration: {
              response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 2 } },
            },
            // Demo: backend-supplied hint + solution. Visibility is presence-based —
            // Show Hint shows immediately, View Solution unlocks after answering.
            hints: [{ hint: '<p>Its surface is covered in iron-oxide (rust) dust.</p>' }],
            solutions: [
              { value: '<p><strong>Mars</strong> is the “Red Planet” — iron oxide gives it the reddish hue.</p>' },
            ],
          },
          {
            identifier: 'do_mcq_multi',
            // Demonstrates the QuML media path: an empty <figure class="image">
            // placeholder filled from `media` (matches the Angular player).
            body:
              '<p>Which of these are warm-blooded (endothermic)? Select all.</p>' +
              '<figure class="image"></figure>',
            media: [
              {
                id: 'img-1',
                type: 'image',
                src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='90'><rect width='220' height='90' rx='10' fill='%23e3f2fd'/><text x='110' y='52' font-size='18' text-anchor='middle' fill='%23376673'>media figure image</text></svg>",
              },
            ],
            primaryCategory: 'Multiple Choice Question',
            interactions: {
              response1: {
                options: [
                  { value: 0, label: 'Dolphin' },
                  { value: 1, label: 'Crocodile' },
                  { value: 2, label: 'Eagle' },
                  { value: 3, label: 'Salmon' },
                ],
              },
            },
            responseDeclaration: {
              response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 2 } },
            },
          },
        ],
      },
      {
        identifier: 'do_section_b',
        name: 'Concepts & Recall',
        description: 'Show what you remember',
        timeLimits: { questionSet: { max: 0, min: 0 } },
        allowSkip: 'Yes',
        children: [
          {
            identifier: 'do_ftb',
            body: '<p>Plants make food through a process called [[response1]], in organelles called [[response2]].</p>',
            primaryCategory: 'Fill in the blank question',
            responseDeclaration: {
              response1: { cardinality: 'single', type: 'string', correctResponse: { value: 'photosynthesis' } },
              response2: { cardinality: 'single', type: 'string', correctResponse: { value: 'chloroplasts' } },
            },
          },
        ],
      },
      {
        identifier: 'do_section_c',
        name: 'Connections',
        description: 'Link and order ideas',
        timeLimits: { questionSet: { max: 0, min: 0 } },
        allowSkip: 'Yes',
        children: [
          {
            identifier: 'do_mtf',
            body: '<p>Match each country with its capital.</p>',
            primaryCategory: 'Match the following question',
            interactions: {
              response1: {
                options: {
                  left: [
                    { value: 'A', label: 'France' },
                    { value: 'B', label: 'Japan' },
                    { value: 'C', label: 'Brazil' },
                  ],
                  right: [
                    { value: '1', label: 'Paris' },
                    { value: '2', label: 'Tokyo' },
                    { value: '3', label: 'Brasília' },
                  ],
                },
              },
            },
            responseDeclaration: {
              response1: {
                cardinality: 'single',
                type: 'map',
                correctResponse: { value: { A: '1', B: '2', C: '3' } },
              },
            },
          },
          {
            identifier: 'do_seq',
            body: '<p>Arrange the steps of the scientific method.</p>',
            primaryCategory: 'Sequence question',
            interactions: {
              response1: {
                options: [
                  { value: 'obs', label: 'Make an observation' },
                  { value: 'hyp', label: 'Form a hypothesis' },
                  { value: 'exp', label: 'Run an experiment' },
                  { value: 'con', label: 'Draw a conclusion' },
                ],
              },
            },
            responseDeclaration: {
              response1: {
                cardinality: 'ordered',
                type: 'string',
                correctResponse: { value: ['obs', 'hyp', 'exp', 'con'] },
              },
            },
          },
        ],
      },
      {
        identifier: 'do_section_d',
        name: 'Subjective Assessment',
        description: 'Construct your own answer',
        timeLimits: { questionSet: { max: 0, min: 0 } },
        allowSkip: 'Yes',
        children: [
          {
            identifier: 'do_sa',
            body: '<p>Explain why biodiversity matters for ecosystem stability.</p>',
            primaryCategory: 'Subjective Question',
            answer: '<p>Biodiversity increases resilience: diverse species fill ecological roles so the system recovers from disturbances.</p>',
          },
          {
            identifier: 'do_sa_2',
            body: '<p>Describe how the carbon cycle moves carbon between the atmosphere and living things.</p>',
            primaryCategory: 'Subjective Question',
            answer: '<p>Photosynthesis fixes atmospheric CO₂ into plants; respiration, decomposition, and combustion return it to the atmosphere.</p>',
          },
        ],
      },
      {
        identifier: 'do_section_e',
        name: 'Critical Thinking',
        description: 'Evaluate and assess concepts',
        timeLimits: { questionSet: { max: 0, min: 0 } },
        allowSkip: 'Yes',
        children: [
          {
            identifier: 'do_reo',
            body: '<p>Rebuild the sentence about the water cycle.</p>',
            primaryCategory: 'Reorder question',
            interactions: {
              response1: {
                options: [
                  { value: 'w1', label: 'Water' },
                  { value: 'w2', label: 'evaporates' },
                  { value: 'w3', label: 'and' },
                  { value: 'w4', label: 'condenses' },
                ],
              },
            },
            responseDeclaration: {
              response1: {
                cardinality: 'ordered',
                type: 'string',
                correctResponse: { value: ['w1', 'w2', 'w4', 'w3'] },
              },
            },
          },
        ],
      },
      {
        identifier: 'do_section_f',
        name: 'Reflection & Metacognition',
        description: 'Reflect on your learning journey',
        timeLimits: { questionSet: { max: 0, min: 0 } },
        allowSkip: 'Yes',
        children: [
          {
            identifier: 'do_sa_3',
            body: '<p>What was the most challenging idea in this assessment, and how did you work through it?</p>',
            primaryCategory: 'Subjective Question',
            answer: '<p>Open reflection — describe the concept and the strategy you used to understand it.</p>',
          },
        ],
      },
      {
        identifier: 'do_section_g',
        name: 'True or False',
        description: 'Decide whether each statement is true or false',
        timeLimits: { questionSet: { max: 0, min: 0 } },
        allowSkip: 'Yes',
        children: [
          {
            identifier: 'do_bool_001',
            body: '<p>The Great Wall of China is visible from space with the naked eye.</p>',
            primaryCategory: 'Boolean Question',
            qType: 'BOOL',
            templateId: 'boolean',
            interactions: {
              response1: {
                type: 'choice',
                options: [
                  { value: 0, label: 'True' },
                  { value: 1, label: 'False' },
                ],
              },
            },
            responseDeclaration: {
              response1: {
                cardinality: 'single',
                type: 'integer',
                correctResponse: { value: 1 },
                mapping: [{ value: 1, score: 1 }],
              },
            },
            solutions: [
              {
                value: '<p><strong>False.</strong> The Great Wall is only about 15–30 feet wide — far too narrow to resolve from the International Space Station without aid.</p>',
              },
            ],
          },
          {
            identifier: 'do_bool_002',
            body: '<p>Water boils at 100 °C at standard atmospheric pressure (1 atm).</p>',
            primaryCategory: 'Boolean Question',
            qType: 'BOOL',
            templateId: 'boolean',
            interactions: {
              response1: {
                type: 'choice',
                options: [
                  { value: 0, label: 'True' },
                  { value: 1, label: 'False' },
                ],
              },
            },
            responseDeclaration: {
              response1: {
                cardinality: 'single',
                type: 'integer',
                correctResponse: { value: 0 },
                mapping: [{ value: 0, score: 1 }],
              },
            },
          },
          {
            identifier: 'do_bool_003',
            body: '<p>Light travels faster than sound.</p>',
            primaryCategory: 'Boolean Question',
            qType: 'BOOL',
            templateId: 'boolean',
            interactions: {
              response1: {
                type: 'choice',
                options: [
                  { value: 0, label: 'True' },
                  { value: 1, label: 'False' },
                ],
              },
            },
            responseDeclaration: {
              response1: {
                cardinality: 'single',
                type: 'integer',
                correctResponse: { value: 0 },
                mapping: [{ value: 0, score: 1 }],
              },
            },
            hints: [
              {
                hint: '<p>Think about how quickly lightning and thunder reach you during a storm.</p>',
              },
            ],
            solutions: [
              {
                value: '<p><strong>True.</strong> Light travels at ~3 × 10⁸ m/s in a vacuum; sound travels at ~343 m/s in air — roughly a million times slower.</p>',
              },
            ],
          },
        ],
      },
    ],
  },
};
