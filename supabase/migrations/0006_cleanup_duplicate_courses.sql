-- Clean up duplicate courses from repeated seed runs
-- Keep only the first inserted course for each name

DELETE FROM holes
WHERE course_id IN (
  SELECT id FROM courses
  WHERE id NOT IN (
    SELECT DISTINCT ON (name) id
    FROM courses
    ORDER BY name, created_at ASC
  )
);

DELETE FROM courses
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id
  FROM courses
  ORDER BY name, created_at ASC
);

-- Prevent future duplicates
ALTER TABLE courses
ADD CONSTRAINT IF NOT EXISTS courses_name_unique UNIQUE (name);
