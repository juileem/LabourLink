CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  contractor_id INTEGER NOT NULL,
  skill_required VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  salary NUMERIC(10, 2) NOT NULL CHECK (salary > 0),
  workers_needed INTEGER NOT NULL CHECK (workers_needed > 0),
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);
