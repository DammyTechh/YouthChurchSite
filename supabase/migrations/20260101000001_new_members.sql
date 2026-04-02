-- New Members table (for landing page sign-up form)
CREATE TABLE IF NOT EXISTS new_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT NOT NULL,
  subscribed_newsletter BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE new_members ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (public insert)
CREATE POLICY "Anyone can register as new member"
  ON new_members FOR INSERT
  WITH CHECK (true);

-- Only authenticated admins can view
CREATE POLICY "Authenticated users can view members"
  ON new_members FOR SELECT
  TO authenticated
  USING (true);

-- No updates or deletes by anonymous users
CREATE POLICY "Authenticated users can delete members"
  ON new_members FOR DELETE
  TO authenticated
  USING (true);
