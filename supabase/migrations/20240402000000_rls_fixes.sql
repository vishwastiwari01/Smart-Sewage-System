-- SmartFlow RLS & Permission Fixes
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. ENABLE RLS on nodes table (was missing)
-- ============================================================
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read nodes" ON nodes;
CREATE POLICY "Anyone can read nodes" ON nodes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage nodes" ON nodes;
CREATE POLICY "Admin can manage nodes" ON nodes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 2. CREW — allow UPDATE on alerts (to acknowledge/resolve)
-- ============================================================
DROP POLICY IF EXISTS "Crew update alerts in zone" ON alerts;
CREATE POLICY "Crew update alerts in zone" ON alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('crew', 'admin')
    )
  );

-- ============================================================
-- 3. SIMULATION — allow INSERT on alerts (for admin/sim)
-- ============================================================
DROP POLICY IF EXISTS "Admin insert alerts" ON alerts;
CREATE POLICY "Admin insert alerts" ON alerts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 4. CREW — allow SELECT on reports in their zone
-- ============================================================
DROP POLICY IF EXISTS "Crew view pending reports in zone" ON reports;
DROP POLICY IF EXISTS "Crew view reports in zone" ON reports;
CREATE POLICY "Crew view reports in zone" ON reports
  FOR SELECT USING (
    citizen_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'crew'
        AND p.zone = reports.zone
    )
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 5. CREW — allow UPDATE on reports (to claim/assign)
-- ============================================================
DROP POLICY IF EXISTS "Crew can claim reports" ON reports;
CREATE POLICY "Crew can claim reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('crew', 'admin')
    )
  );

-- ============================================================
-- 6. NOTIFICATIONS — allow INSERT for own user or admin
-- ============================================================
DROP POLICY IF EXISTS "Admin and system can insert notifications" ON notifications;
CREATE POLICY "Admin and system can insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 7. CITIZEN — allow CRUD on own reports
-- ============================================================
DROP POLICY IF EXISTS "Citizens manage own reports" ON reports;
CREATE POLICY "Citizens manage own reports" ON reports
  FOR ALL USING (citizen_id = auth.uid())
  WITH CHECK (citizen_id = auth.uid());

SELECT 'Migration complete! All RLS policies updated.' AS status;
