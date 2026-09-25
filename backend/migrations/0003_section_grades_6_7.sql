-- Change Section Head scope from Grades 10/11 to Grades 6/7.
-- Preserve stable class IDs so existing assignments/attendance references remain valid.

INSERT OR IGNORE INTO grades(id,name,sort_order,is_active) VALUES
('grade-6','6',6,1),('grade-7','7',7,1);

UPDATE classes SET grade_id='grade-6', display_name='6-A' WHERE id='class-10-a';
UPDATE classes SET grade_id='grade-6', display_name='6-B' WHERE id='class-10-b';
UPDATE classes SET grade_id='grade-6', display_name='6-C' WHERE id='class-10-c';
UPDATE classes SET grade_id='grade-6', display_name='6-D' WHERE id='class-10-d';
UPDATE classes SET grade_id='grade-6', display_name='6-E' WHERE id='class-10-e';

UPDATE classes SET grade_id='grade-7', display_name='7-A' WHERE id='class-11-a';
UPDATE classes SET grade_id='grade-7', display_name='7-B' WHERE id='class-11-b';
UPDATE classes SET grade_id='grade-7', display_name='7-C' WHERE id='class-11-c';
UPDATE classes SET grade_id='grade-7', display_name='7-D' WHERE id='class-11-d';
UPDATE classes SET grade_id='grade-7', display_name='7-E' WHERE id='class-11-e';

UPDATE grades SET is_active=0 WHERE id IN ('grade-10','grade-11');
