-- BioBloke Edventures — Development seed data
-- Mirrors the in-memory mock (src/data/people.ts + content.ts + progress.ts).
-- Run AFTER schema.sql and rls.sql.
-- NOTE: Auth users (teachers/admin) must be created separately via the
--       Supabase dashboard or the seed-auth.ts script.

-- ============================================================
-- Schools
-- ============================================================
insert into public.schools (id, name, location, active, subscription_status, last_active) values
  ('school-srhs',    'Sarah Redfern High School',     'Minto, NSW',      true,  'active',  '2026-07-04'),
  ('school-coastal', 'Coastal Ridge Public School',   'Wollongong, NSW', true,  'trial',   '2026-07-03'),
  ('school-outback', 'Outback Rivers College',        'Dubbo, NSW',      false, 'lapsed',  '2026-05-11')
on conflict (id) do nothing;

-- ============================================================
-- Users — admins and teachers
-- auth_id is set later by seed-auth.ts after Supabase creates auth accounts.
-- ============================================================
insert into public.users (id, name, email, role, school_id, created_at) values
  ('admin-bloke',    'Cameron Rodgers', 'thebiologybloke@gmail.com',        'admin',   null,            '2024-11-01'),
  ('teacher-jones',  'Ms Jones',        'jones@srhs.nsw.edu.au',            'teacher', 'school-srhs',   '2025-01-20'),
  ('teacher-patel',  'Mr Patel',        'patel@srhs.nsw.edu.au',            'teacher', 'school-srhs',   '2025-02-05'),
  ('teacher-nguyen', 'Ms Nguyen',       'nguyen@coastalridge.nsw.edu.au',   'teacher', 'school-coastal','2025-03-12')
on conflict (id) do nothing;

-- Students: no email, no real name — animal alias only.
insert into public.users (id, name, email, role, school_id, animal_id, created_at) values
  ('stu-1', 'Koala',      '', 'student', 'school-srhs',    'koala',      '2025-02-01'),
  ('stu-2', 'Tiger',      '', 'student', 'school-srhs',    'tiger',      '2025-02-01'),
  ('stu-3', 'Orangutan',  '', 'student', 'school-srhs',    'orangutan',  '2025-02-01'),
  ('stu-4', 'Wombat',     '', 'student', 'school-srhs',    'wombat',     '2025-02-01'),
  ('stu-5', 'Kookaburra', '', 'student', 'school-srhs',    'kookaburra', '2025-02-01'),
  ('stu-6', 'Crocodile',  '', 'student', 'school-srhs',    'crocodile',  '2025-02-01'),
  ('stu-7', 'Dolphin',    '', 'student', 'school-coastal', 'dolphin',    '2025-03-15'),
  ('stu-8', 'Echidna',    '', 'student', 'school-coastal', 'echidna',    '2025-03-15'),
  ('stu-9', 'Platypus',   '', 'student', 'school-coastal', 'platypus',   '2025-03-15')
on conflict (id) do nothing;

-- ============================================================
-- Classes
-- ============================================================
insert into public.classes (id, name, year_group, teacher_id, school_id, class_code) values
  ('class-5j',       '5J Science Explorers', 'Year 5', 'teacher-jones',  'school-srhs',    'KOALA-5J'),
  ('class-7science', '7 Science Blue',       'Year 7', 'teacher-jones',  'school-srhs',    'TIGER-7B'),
  ('class-9bio',     '9 Biology Elective',   'Year 9', 'teacher-patel',  'school-srhs',    'ORANG-9E'),
  ('class-6cr',      '6 Coastal Rangers',    'Year 6', 'teacher-nguyen', 'school-coastal', 'REEF-6CR')
on conflict (id) do nothing;

-- ============================================================
-- Class enrolments
-- ============================================================
insert into public.class_students (class_id, student_id) values
  ('class-5j',       'stu-1'),
  ('class-5j',       'stu-2'),
  ('class-5j',       'stu-3'),
  ('class-5j',       'stu-4'),
  ('class-7science', 'stu-5'),
  ('class-9bio',     'stu-6'),
  ('class-6cr',      'stu-7'),
  ('class-6cr',      'stu-8'),
  ('class-6cr',      'stu-9')
on conflict do nothing;

-- ============================================================
-- Units
-- ============================================================
insert into public.units (id, title, stage, year_groups, description, duration_lessons, outcomes, cover_image, published, created_at) values
  ('unit-survival',
   'Survival and Change', 'Stage 3', array['Year 5','Year 6'],
   'How living things survive, adapt and respond to a changing world, from koalas in the canopy to the food webs of the Australian bush.',
   10, array['ST3-4LW-S, examines how the structural features of living things help them survive','ST3-1WS-S, plans and conducts scientific investigations'],
   '/trees.png', true, '2025-01-14'),

  ('unit-wildsystems',
   'Wild Systems', 'Stage 4', array['Year 7','Year 8'],
   'Ecosystems as connected systems, energy flow, predator and prey relationships, and the growing footprint of humans on the wild.',
   12, array['SC4-14LW, relates the structure of living things to their function','SC4-15LW, explains how new evidence changes scientific understanding'],
   '/trees.png', true, '2025-02-02'),

  ('unit-frontlines',
   'Conservation Frontlines', 'Stage 5', array['Year 9','Year 10'],
   'The real fight to protect biodiversity, threatened species, habitat loss, rainforest conservation and the role of citizen science.',
   12, array['SC5-14LW, analyses interactions between components of ecosystems','SC5-15LW, evaluates the impact of human activity on ecosystems'],
   '/trees.png', true, '2025-02-20')
on conflict (id) do nothing;

-- ============================================================
-- Topics
-- ============================================================
insert into public.topics (id, unit_id, title, description, animal_focus, ecosystem_focus, difficulty) values
  -- unit-survival
  ('topic-adaptations',    'unit-survival',    'Adaptations',           'Structural, behavioural and physiological adaptations that help animals thrive in their habitat.',                        array['Koala','Orangutan'],      array['Australian Bushland','Rainforest'], 'core'),
  ('topic-plants',         'unit-survival',    'Plants',                'How plants capture energy, reproduce and adapt to survive.',                                                               array[]::text[],                array['Rainforest','Wetlands'],            'foundation'),
  ('topic-foodwebs',       'unit-survival',    'Food Webs',             'Producers, consumers and decomposers, tracing energy through the Australian bush.',                                       array['Dingo','Kangaroo'],       array['Australian Bushland'],              'core'),
  ('topic-aus-ecosystems', 'unit-survival',    'Australian Ecosystems', 'The unique ecosystems of Australia and the species they support.',                                                         array['Koala','Kangaroo'],       array['Australian Bushland','Wetlands'],   'core'),
  ('topic-climate',        'unit-survival',    'Climate Change',        'How a changing climate reshapes habitats and challenges wildlife.',                                                         array[]::text[],                array['Coral Reef'],                       'advanced'),
  -- unit-wildsystems
  ('topic-ecosystems',         'unit-wildsystems', 'Ecosystems',         'Biotic and abiotic components and how they interact.',                                                                   array[]::text[],                array['Savanna','Wetlands'],               'core'),
  ('topic-predators',          'unit-wildsystems', 'Predators and Prey', 'Hunting strategies, defence adaptations and population balance.',                                                        array['Tiger','Gorilla'],        array['Rainforest','Savanna'],             'core'),
  ('topic-energyflow',         'unit-wildsystems', 'Energy Flow',        'Trophic levels, energy pyramids and the 10% rule.',                                                                      array[]::text[],                array['Savanna'],                          'advanced'),
  ('topic-humanimpacts',       'unit-wildsystems', 'Human Impacts',      'Pollution, land clearing and the ecological footprint of people.',                                                       array[]::text[],                array['Coral Reef','Rainforest'],          'advanced'),
  ('topic-conservation-action','unit-wildsystems', 'Conservation Action','What individuals, communities and nations can do to protect nature.',                                                    array[]::text[],                array['Wetlands'],                         'core'),
  -- unit-frontlines
  ('topic-threatened',  'unit-frontlines', 'Threatened Species',      'IUCN categories, extinction drivers and recovery programs.',                                                               array['Orangutan','Tiger'],      array['Rainforest'],                       'advanced'),
  ('topic-habitatloss', 'unit-frontlines', 'Habitat Loss',            'Deforestation, fragmentation and the value of wildlife corridors.',                                                         array['Orangutan'],              array['Rainforest'],                       'advanced'),
  ('topic-rainforest',  'unit-frontlines', 'Rainforest Conservation', 'Why rainforests matter and how they are being protected.',                                                                  array['Orangutan','Gorilla'],    array['Rainforest'],                       'advanced'),
  ('topic-citizen',     'unit-frontlines', 'Citizen Science',         'How everyday people contribute real conservation data.',                                                                    array[]::text[],                array['Australian Bushland'],              'core'),
  ('topic-tourism',     'unit-frontlines', 'Ethical Wildlife Tourism','Balancing tourism, community livelihoods and animal welfare.',                                                              array['Gorilla'],                array['Rainforest','Savanna'],             'core')
on conflict (id) do nothing;

-- ============================================================
-- Videos
-- ============================================================
insert into public.videos (id, title, description, topic_id, unit_id, duration_seconds, tags, stage, year_groups, transcript, learning_intent, success_criteria, published) values
  ('vid-koala',
   'Why Koalas Sleep So Much',
   'Eucalyptus leaves are low in energy and mildly toxic, discover the adaptations that let koalas survive on them.',
   'topic-adaptations', 'unit-survival', 95,
   array['adaptation','marsupial','diet','Australian bush'],
   'Stage 3', array['Year 5','Year 6'],
   'Koalas sleep up to 20 hours a day. Their eucalyptus diet is fibrous, low in nutrients and mildly toxic, so they conserve energy by resting and rely on a specialised gut to detoxify their food...',
   'Understand how diet drives behavioural and physiological adaptation.',
   array['I can explain why koalas sleep so much','I can name one physiological adaptation of a koala'],
   true),

  ('vid-orangutan',
   'Orangutan Adaptations in the Rainforest',
   'Long arms, grasping feet and remarkable intelligence, how orangutans are built for life in the canopy.',
   'topic-adaptations', 'unit-survival', 110,
   array['adaptation','great ape','rainforest','Sumatra'],
   'Stage 3', array['Year 5','Year 6'],
   'An orangutan''s arm span can reach over two metres, perfect for swinging between trees...',
   'Identify structural adaptations for an arboreal lifestyle.',
   array['I can describe two structural adaptations of an orangutan','I can link each adaptation to its habitat'],
   true),

  ('vid-tiger',
   'Tiger Tracks and Predator Behaviour',
   'Stripes, silence and stealth, the adaptations that make the tiger a perfect ambush predator.',
   'topic-predators', 'unit-wildsystems', 120,
   array['predator','big cat','camouflage','behaviour'],
   'Stage 4', array['Year 7','Year 8'],
   'A tiger''s stripes break up its outline in tall grass. It stalks to within metres of prey before a short, explosive charge...',
   'Explain how predator adaptations improve hunting success.',
   array['I can describe two predator adaptations of a tiger','I can explain how camouflage aids hunting'],
   true),

  ('vid-foodwebs',
   'Food Webs in the Australian Bush',
   'From gum leaves to dingoes, trace how energy flows through a bushland food web.',
   'topic-foodwebs', 'unit-survival', 130,
   array['food web','energy','producers','consumers'],
   'Stage 3', array['Year 5','Year 6'],
   'Every food web starts with producers, plants that capture sunlight. Herbivores eat the plants, and predators eat the herbivores. Remove one link and the whole web can shift...',
   'Model energy flow through producers, consumers and decomposers.',
   array['I can build a simple food web','I can predict the effect of removing one species'],
   true),

  ('vid-gorilla',
   'Gorillas and Family Structures',
   'Silverbacks, troops and gentle giants, the social world of the mountain gorilla.',
   'topic-predators', 'unit-wildsystems', 105,
   array['great ape','social behaviour','family','rainforest'],
   'Stage 4', array['Year 7','Year 8'],
   'Gorilla troops are led by a dominant silverback who protects the family. Social bonds and communication are key to their survival...',
   'Describe how social structure supports survival.',
   array['I can explain the role of a silverback','I can describe one benefit of living in a troop'],
   true),

  ('vid-coral',
   'Climate Change and Coral Reefs',
   'Warming seas and coral bleaching, how climate change threatens the rainforests of the sea.',
   'topic-climate', 'unit-survival', 140,
   array['climate','coral','ocean','bleaching'],
   'Stage 3', array['Year 5','Year 6'],
   'Corals live in partnership with tiny algae that give them colour and food. When the water gets too warm, corals expel the algae and turn white, this is bleaching...',
   'Explain how rising temperatures cause coral bleaching.',
   array['I can explain what coral bleaching is','I can name one way to protect reefs'],
   true),

  ('vid-wetlands',
   'How Wetlands Protect Wildlife',
   'Nature''s kidneys, how wetlands filter water, store carbon and shelter species.',
   'topic-conservation-action', 'unit-wildsystems', 100,
   array['wetlands','ecosystem services','biodiversity'],
   'Stage 4', array['Year 7','Year 8'],
   'Wetlands act like giant sponges, soaking up floodwater and filtering pollutants. They are among the most biodiverse habitats on Earth...',
   'Describe the ecosystem services wetlands provide.',
   array['I can name two ecosystem services of wetlands','I can explain why wetlands are worth protecting'],
   true)
on conflict (id) do nothing;

-- ============================================================
-- Resources
-- ============================================================
insert into public.resources (id, title, type, file_url, topic_id, unit_id, stage, difficulty, tags, teacher_notes, published, downloads) values
  ('res-adaptations-ws',  'Adaptations Worksheet',                    'worksheet',   '#', 'topic-adaptations',     'unit-survival',    'Stage 3', 'core',       array['adaptation','printable'],       'Best used after the koala and orangutan reels.',                       true, 342),
  ('res-foodwebs-ppt',    'Food Webs PowerPoint',                     'powerpoint',  '#', 'topic-foodwebs',        'unit-survival',    'Stage 3', 'core',       array['food web','presentation'],      null,                                                                   true, 289),
  ('res-conservation-guide','Conservation Action Teacher Guide',      'teacherGuide','#', 'topic-conservation-action','unit-wildsystems','Stage 4','core',      array['conservation','teacher'],       'Includes discussion prompts and a project rubric.',                    true, 156),
  ('res-ecosystem-quiz',  'Australian Ecosystem Quiz',                'assessment',  '#', 'topic-aus-ecosystems',  'unit-survival',    'Stage 3', 'core',       array['ecosystem','assessment'],       null,                                                                   true, 201),
  ('res-rainforest-reflect','Rainforest Reflection Task',             'activity',    '#', 'topic-rainforest',      'unit-frontlines',  'Stage 5', 'core',       array['rainforest','reflection'],      null,                                                                   true,  98),
  ('res-corridor-ext',    'Extension Challenge: Design a Wildlife Corridor','extension','#','topic-conservation-action','unit-wildsystems','Stage 4','advanced', array['extension','design','habitat'], 'For students ready for a challenge, pairs or small groups.',           true,  74),
  ('res-support-match',   'Support Task: Match the Adaptation',       'support',     '#', 'topic-adaptations',     'unit-survival',    'Stage 3', 'foundation', array['support','matching','scaffold'],'Visual matching for students needing extra support.',                  true, 187)
on conflict (id) do nothing;

-- ============================================================
-- Quizzes
-- ============================================================
insert into public.quizzes (id, title, topic_id) values
  ('quiz-adaptations', 'Adaptations Quick Check', 'topic-adaptations'),
  ('quiz-foodwebs',    'Food Webs Quick Check',    'topic-foodwebs'),
  ('quiz-ecosystems',  'Ecosystems Quick Check',   'topic-aus-ecosystems')
on conflict (id) do nothing;

-- ============================================================
-- Questions
-- ============================================================
insert into public.questions (id, quiz_id, question_text, type, options, correct_answer, explanation, difficulty, linked_concept, sort_order) values
  -- quiz-adaptations
  ('q-ad-1', 'quiz-adaptations',
   'Why do koalas sleep for up to 20 hours a day?',
   'multipleChoice',
   array['They are nocturnal hunters','Their eucalyptus diet is low in energy','They are avoiding predators','They hibernate through winter'],
   'Their eucalyptus diet is low in energy',
   'Eucalyptus leaves provide little energy and are hard to digest, so koalas rest to conserve energy.',
   'core', 'Behavioural adaptation', 1),

  ('q-ad-2', 'quiz-adaptations',
   'An orangutan''s long arms are an example of which type of adaptation?',
   'multipleChoice',
   array['Behavioural','Structural','Physiological','Seasonal'],
   'Structural',
   'Long arms are a physical (structural) feature that helps orangutans move through the canopy.',
   'core', 'Structural adaptation', 2),

  ('q-ad-3', 'quiz-adaptations',
   'Camouflage is a structural adaptation.',
   'trueFalse',
   array['True','False'],
   'True',
   'Camouflage relies on physical features like colour and pattern, so it is structural.',
   'foundation', 'Structural adaptation', 3),

  -- quiz-foodwebs
  ('q-fw-1', 'quiz-foodwebs',
   'What is at the base of every food web?',
   'multipleChoice',
   array['Predators','Producers','Decomposers','Herbivores'],
   'Producers',
   'Producers such as plants capture sunlight and form the base of the food web.',
   'core', 'Energy flow', 1),

  ('q-fw-2', 'quiz-foodwebs',
   'Roughly how much energy passes to the next trophic level?',
   'multipleChoice',
   array['10%','50%','90%','100%'],
   '10%',
   'About 90% of energy is lost as heat and life processes; only ~10% passes on.',
   'advanced', 'Trophic levels', 2),

  ('q-fw-3', 'quiz-foodwebs',
   'Removing a top predator can change the whole food web.',
   'trueFalse',
   array['True','False'],
   'True',
   'Removing a keystone predator can cause prey populations to boom and the web to shift.',
   'core', 'Interdependence', 3),

  -- quiz-ecosystems
  ('q-ec-1', 'quiz-ecosystems',
   'Which of these is an abiotic (non-living) factor?',
   'multipleChoice',
   array['Kangaroo','Rainfall','Eucalyptus tree','Fungi'],
   'Rainfall',
   'Rainfall is a non-living, physical part of an ecosystem.',
   'core', 'Biotic vs abiotic', 1),

  ('q-ec-2', 'quiz-ecosystems',
   'Wetlands are one of the least biodiverse habitats.',
   'trueFalse',
   array['True','False'],
   'False',
   'Wetlands are among the most biodiverse habitats on the planet.',
   'core', 'Biodiversity', 2),

  ('q-ec-3', 'quiz-ecosystems',
   'In one sentence, explain why Australian ecosystems are described as unique.',
   'shortResponse',
   array[]::text[],
   'Australia''s long isolation produced many species found nowhere else (endemism).',
   'Look for the idea of isolation leading to endemic species such as marsupials.',
   'advanced', 'Endemism', 3)
on conflict (id) do nothing;

-- ============================================================
-- Adaptive Tasks
-- ============================================================
insert into public.adaptive_tasks (id, title, type, topic_id, description, instructions, linked_resource_id, trigger_condition, estimated_time_minutes) values
  ('task-support-adapt', 'Match the Adaptation (Recap)',   'support',   'topic-adaptations',
   'A shorter visual recap with a drag-and-match activity.',
   'Re-watch the key 30-second clip, then match each animal to its adaptation.',
   'res-support-match', 'completion < 50% OR quizScore < 50%', 10),

  ('task-core-adapt',    'Adaptations Worksheet',          'core',      'topic-adaptations',
   'Consolidate your understanding with the standard worksheet.',
   'Complete the worksheet, giving one example of each type of adaptation.',
   'res-adaptations-ws', 'completion >= 80% AND quizScore 50-80%', 20),

  ('task-ext-adapt',     'Design a Wildlife Corridor',     'extension', 'topic-adaptations',
   'Apply your learning to a real conservation design challenge.',
   'Using your knowledge of habitat and adaptation, design and justify a wildlife corridor.',
   'res-corridor-ext', 'completion >= 90% AND quizScore > 80%', 30),

  ('task-support-fw',    'Food Web Starter Guide',         'support',   'topic-foodwebs',
   'A step-by-step guide to building a simple food web.',
   'Follow the guide to create a food web for the Australian bush.',
   null, 'completion < 60%', 10),

  ('task-core-fw',       'Food Webs PowerPoint Activity',  'core',      'topic-foodwebs',
   'Work through the PowerPoint slides and answer the embedded questions.',
   'Open the PowerPoint, read each slide, and answer the questions in your workbook.',
   'res-foodwebs-ppt', 'completion >= 70%', 20)
on conflict (id) do nothing;

-- ============================================================
-- Assignments
-- ============================================================
insert into public.assignments (id, class_id, unit_id, due_date, adaptive_tasks_enabled, explorer_points_enabled, delivery_mode, assigned_at) values
  ('assign-1', 'class-5j',       'unit-survival',    '2026-07-18', true,  true,  'student-led', '2026-07-01'),
  ('assign-2', 'class-7science', 'unit-wildsystems', '2026-07-20', true,  true,  'student-led', '2026-07-02'),
  ('assign-3', 'class-6cr',      'unit-survival',    '2026-07-22', false, true,  'teacher-led', '2026-07-03')
on conflict (id) do nothing;

insert into public.assignment_topics (assignment_id, topic_id) values
  ('assign-1', 'topic-adaptations'),
  ('assign-1', 'topic-foodwebs'),
  ('assign-2', 'topic-predators'),
  ('assign-3', 'topic-adaptations')
on conflict do nothing;

-- ============================================================
-- Student Progress
-- ============================================================
insert into public.student_progress
  (id, student_id, class_id, unit_id, topic_id, video_id,
   watch_time_seconds, video_completion_percentage, replay_count,
   skipped, clicked_curious, clicked_help,
   quiz_score, quiz_attempts, worksheet_completed,
   adaptive_focus_area, engagement_level, recommended_task_type, last_active)
values
  ('prog-1',  'stu-1', 'class-5j',       'unit-survival',    'topic-adaptations', 'vid-koala',     92, 97,  1, false, true,  false, 100,  1, true,  'Extension',           'high',   'extension', '2026-07-04'),
  ('prog-2',  'stu-2', 'class-5j',       'unit-survival',    'topic-adaptations', 'vid-koala',     78, 82,  0, false, false, false,  67,  2, true,  'Core consolidation',  'high',   'core',      '2026-07-04'),
  ('prog-3',  'stu-3', 'class-5j',       'unit-survival',    'topic-adaptations', 'vid-koala',     40, 42,  0, true,  false, true,   33,  1, false, 'Re-engagement',       'low',    'support',   '2026-07-02'),
  ('prog-4',  'stu-4', 'class-5j',       'unit-survival',    'topic-adaptations', 'vid-koala',     71, 75,  1, false, false, false,  47,  2, false, 'Concept understanding','medium', 'support',   '2026-07-03'),
  ('prog-5',  'stu-1', 'class-5j',       'unit-survival',    'topic-foodwebs',    'vid-foodwebs', 128, 98,  0, false, true,  false, 100,  1, true,  'Extension',           'high',   'extension', '2026-07-04'),
  ('prog-6',  'stu-2', 'class-5j',       'unit-survival',    'topic-foodwebs',    'vid-foodwebs',  60, 46,  0, true,  false, false, null, 0, false, 'Re-engagement',       'low',    'support',   '2026-07-01'),
  ('prog-7',  'stu-5', 'class-7science', 'unit-wildsystems', 'topic-predators',   'vid-tiger',    118, 98,  2, false, true,  false,  90,  1, true,  'Extension',           'high',   'extension', '2026-07-04'),
  ('prog-8',  'stu-6', 'class-9bio',     'unit-frontlines',  'topic-threatened',  'vid-orangutan', 88, 80,  0, false, false, false,  72,  1, true,  'Core consolidation',  'high',   'core',      '2026-07-03'),
  ('prog-9',  'stu-7', 'class-6cr',      'unit-survival',    'topic-adaptations', 'vid-orangutan',105, 95,  1, false, true,  false,  83,  1, true,  'Extension',           'high',   'extension', '2026-07-03'),
  ('prog-10', 'stu-8', 'class-6cr',      'unit-survival',    'topic-adaptations', 'vid-orangutan', 30, 27,  0, true,  false, true,  null, 0, false, 'Re-engagement',       'low',    'support',   '2026-06-30')
on conflict (id) do nothing;
