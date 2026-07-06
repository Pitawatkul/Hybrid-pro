-- Seed exercise catalog — matched against injuries via movement_pattern / affected_by_body_parts

insert into exercises (name, primary_muscle_group, movement_pattern, affected_by_body_parts) values
  ('Back Squat', 'quads', 'squat', '{knee,lower_back,hip}'),
  ('Front Squat', 'quads', 'squat', '{knee,lower_back,wrist}'),
  ('Goblet Squat', 'quads', 'squat', '{knee}'),
  ('Bulgarian Split Squat', 'quads', 'squat', '{knee,hip}'),
  ('Leg Press', 'quads', 'squat', '{knee}'),
  ('Walking Lunge', 'quads', 'squat', '{knee,hip}'),

  ('Conventional Deadlift', 'hamstrings', 'hinge', '{lower_back,hip}'),
  ('Romanian Deadlift', 'hamstrings', 'hinge', '{lower_back,hamstring}'),
  ('Sumo Deadlift', 'hamstrings', 'hinge', '{lower_back,hip,groin}'),
  ('Kettlebell Swing', 'hamstrings', 'hinge', '{lower_back}'),
  ('Good Morning', 'hamstrings', 'hinge', '{lower_back,hamstring}'),
  ('Hip Thrust', 'glutes', 'hinge', '{lower_back,hip}'),

  ('Bench Press', 'chest', 'push', '{shoulder,elbow}'),
  ('Incline Dumbbell Press', 'chest', 'push', '{shoulder}'),
  ('Overhead Press', 'shoulders', 'push', '{shoulder,lower_back}'),
  ('Push-up', 'chest', 'push', '{shoulder,wrist}'),
  ('Dip', 'chest', 'push', '{shoulder,elbow}'),
  ('Dumbbell Lateral Raise', 'shoulders', 'push', '{shoulder}'),

  ('Pull-up', 'back', 'pull', '{shoulder,elbow}'),
  ('Lat Pulldown', 'back', 'pull', '{shoulder}'),
  ('Barbell Row', 'back', 'pull', '{lower_back,shoulder}'),
  ('Seated Cable Row', 'back', 'pull', '{lower_back}'),
  ('Face Pull', 'shoulders', 'pull', '{shoulder}'),
  ('Barbell Curl', 'biceps', 'pull', '{elbow,wrist}'),

  ('Farmers Carry', 'full_body', 'carry', '{grip,lower_back,shoulder}'),
  ('Suitcase Carry', 'core', 'carry', '{grip,lower_back}'),

  ('Plank', 'core', 'core', '{shoulder,lower_back}'),
  ('Hanging Leg Raise', 'core', 'core', '{shoulder,hip_flexor}'),
  ('Ab Wheel Rollout', 'core', 'core', '{lower_back,shoulder}'),
  ('Cable Woodchop', 'core', 'core', '{lower_back}');

-- Default injury-safe substitutions (deliberately lower joint stress than the original)
update exercises set substitute_exercise_id = (select id from exercises where name = 'Goblet Squat')
  where name in ('Back Squat', 'Front Squat', 'Bulgarian Split Squat', 'Walking Lunge');

update exercises set substitute_exercise_id = (select id from exercises where name = 'Kettlebell Swing')
  where name in ('Conventional Deadlift', 'Romanian Deadlift', 'Sumo Deadlift', 'Good Morning');

update exercises set substitute_exercise_id = (select id from exercises where name = 'Push-up')
  where name in ('Bench Press', 'Incline Dumbbell Press', 'Dip');

update exercises set substitute_exercise_id = (select id from exercises where name = 'Incline Dumbbell Press')
  where name = 'Overhead Press';

update exercises set substitute_exercise_id = (select id from exercises where name = 'Lat Pulldown')
  where name = 'Pull-up';

update exercises set substitute_exercise_id = (select id from exercises where name = 'Seated Cable Row')
  where name = 'Barbell Row';
