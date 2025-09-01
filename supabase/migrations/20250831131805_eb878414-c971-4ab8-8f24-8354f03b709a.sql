-- First delete related forms and submissions for these users
DELETE FROM submissions WHERE user_id IN (
  SELECT id FROM users WHERE username IN ('Loishealy60', 'purpleone')
);

DELETE FROM forms WHERE user_id IN (
  SELECT id FROM users WHERE username IN ('Loishealy60', 'purpleone')  
);

-- Then delete the users
DELETE FROM users WHERE username IN ('Loishealy60', 'purpleone');