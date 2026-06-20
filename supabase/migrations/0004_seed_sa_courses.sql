-- Seed South African golf courses (MVP focus: Gauteng, Mpumalanga, North West)
-- OSM is deprecated as the primary source for SA due to sparse/incomplete coverage.
-- Coordinates sourced from public golf club listings; hole data should be refined by admins.

INSERT INTO courses (name, address, city, province, country, location, num_holes, source)
VALUES
  -- Gauteng
  ('ERPM Golf Club', 'Boksburg', 'Boksburg', 'Gauteng', 'South Africa', ST_MakePoint(28.2617, -26.2125)::geography, 18, 'community'),
  ('Randpark Golf Club', 'Setperk St, Randpark Ridge', 'Randburg', 'Gauteng', 'South Africa', ST_MakePoint(27.9600, -26.1300)::geography, 36, 'community'),
  ('Glendower Golf Club', 'Marais Rd, Bedfordview', 'Bedfordview', 'Gauteng', 'South Africa', ST_MakePoint(28.1469, -26.1833)::geography, 18, 'community'),
  ('Houghton Golf Club', '2nd Ave, Lower Houghton', 'Johannesburg', 'Gauteng', 'South Africa', ST_MakePoint(28.0597, -26.1703)::geography, 18, 'community'),
  ('Royal Johannesburg & Kensington Golf Club', 'Fairway Ave, Linksfield North', 'Johannesburg', 'Gauteng', 'South Africa', ST_MakePoint(28.1278, -26.1800)::geography, 36, 'community'),
  ('Wanderers Golf Club', '21 North St, Illovo', 'Johannesburg', 'Gauteng', 'South Africa', ST_MakePoint(28.0472, -26.1400)::geography, 18, 'community'),
  ('Bryanston Country Club', 'Bryanston Dr', 'Bryanston', 'Gauteng', 'South Africa', ST_MakePoint(28.0167, -26.0667)::geography, 18, 'community'),
  ('Dainfern Golf Estate', 'Dainfern Ridge, Fourways', 'Fourways', 'Gauteng', 'South Africa', ST_MakePoint(28.0097, -26.0200)::geography, 18, 'community'),
  ('Woodmead Golf Club', 'Woodmead Dr', 'Sandton', 'Gauteng', 'South Africa', ST_MakePoint(28.0850, -26.0550)::geography, 9, 'community'),
  ('Ebotse Golf Estate', 'Benoni', 'Benoni', 'Gauteng', 'South Africa', ST_MakePoint(28.3600, -26.1700)::geography, 18, 'community'),
  ('Serengeti Golf & Wildlife Estate', 'Kempton Park', 'Kempton Park', 'Gauteng', 'South Africa', ST_MakePoint(28.2600, -26.0600)::geography, 18, 'community'),
  ('Centurion Golf Club', 'Centurion', 'Centurion', 'Gauteng', 'South Africa', ST_MakePoint(28.1900, -25.8600)::geography, 18, 'community'),
  ('Silver Lakes Golf Estate', 'Silver Lakes Rd', 'Pretoria', 'Gauteng', 'South Africa', ST_MakePoint(28.3400, -25.8100)::geography, 18, 'community'),
  ('Pretoria Country Club', 'Sidney St, Waterkloof', 'Pretoria', 'Gauteng', 'South Africa', ST_MakePoint(28.2400, -25.7800)::geography, 18, 'community'),
  ('Irene Country Club', 'Irene', 'Centurion', 'Gauteng', 'South Africa', ST_MakePoint(28.2200, -25.8900)::geography, 18, 'community'),
  ('Modderfontein Golf Club', 'Modderfontein', 'Modderfontein', 'Gauteng', 'South Africa', ST_MakePoint(28.1600, -26.0900)::geography, 18, 'community'),
  ('Benoni Country Club', 'Country Club Ave', 'Benoni', 'Gauteng', 'South Africa', ST_MakePoint(28.3200, -26.1900)::geography, 18, 'community'),
  ('Reading Country Club', 'Albemarle', 'Alberton', 'Gauteng', 'South Africa', ST_MakePoint(28.1200, -26.2700)::geography, 18, 'community'),
  ('Soweto Country Club', 'Soweto', 'Soweto', 'Gauteng', 'South Africa', ST_MakePoint(27.8700, -26.2600)::geography, 18, 'community'),
  ('State Mines Golf Club', 'Springs', 'Springs', 'Gauteng', 'South Africa', ST_MakePoint(28.4300, -26.2100)::geography, 18, 'community'),

  -- Mpumalanga
  ('Leopard Creek Country Club', 'Malelane', 'Malelane', 'Mpumalanga', 'South Africa', ST_MakePoint(31.5300, -25.4700)::geography, 18, 'community'),
  ('White River Country Club', 'White River', 'White River', 'Mpumalanga', 'South Africa', ST_MakePoint(31.0100, -25.3300)::geography, 18, 'community'),
  ('Nelspruit Golf Club', 'Nelspruit', 'Mbombela', 'Mpumalanga', 'South Africa', ST_MakePoint(30.9700, -25.4700)::geography, 18, 'community'),
  ('Kruger Park Lodge Golf Club', 'Hazyview', 'Hazyview', 'Mpumalanga', 'South Africa', ST_MakePoint(31.1400, -25.1100)::geography, 9, 'community'),
  ('Sabi River Sun Golf Course', 'Hazyview', 'Hazyview', 'Mpumalanga', 'South Africa', ST_MakePoint(31.1300, -25.1300)::geography, 18, 'community'),
  ('Witbank Golf Club', 'Witbank', 'Witbank', 'Mpumalanga', 'South Africa', ST_MakePoint(29.2500, -25.8700)::geography, 18, 'community'),
  ('Middelburg Country Club', 'Middelburg', 'Middelburg', 'Mpumalanga', 'South Africa', ST_MakePoint(29.4700, -25.7800)::geography, 18, 'community'),
  ('Highlands Gate Golf Estate', 'Dullstroom', 'Dullstroom', 'Mpumalanga', 'South Africa', ST_MakePoint(30.1000, -25.2400)::geography, 18, 'community'),
  ('Sable Ranch Golf Club', 'Cullinan', 'Cullinan', 'Mpumalanga', 'South Africa', ST_MakePoint(28.5200, -25.6700)::geography, 18, 'community'),

  -- North West
  ('Sun City / Gary Player Country Club', 'Sun City', 'Sun City', 'North West', 'South Africa', ST_MakePoint(27.0900, -25.3400)::geography, 18, 'community'),
  ('Sun City / Lost City Golf Course', 'Sun City', 'Sun City', 'North West', 'South Africa', ST_MakePoint(27.0900, -25.3300)::geography, 18, 'community'),
  ('Pecanwood Golf Estate', 'Hartebeespoort', 'Hartbeespoort', 'North West', 'South Africa', ST_MakePoint(27.8600, -25.7400)::geography, 18, 'community'),
  ('Magalies Park Golf Club', 'Hartbeespoort', 'Hartbeespoort', 'North West', 'South Africa', ST_MakePoint(27.8900, -25.7300)::geography, 18, 'community'),
  ('Hartbeespoort Golf Club', 'Hartbeespoort', 'Hartbeespoort', 'North West', 'South Africa', ST_MakePoint(27.8500, -25.7600)::geography, 18, 'community'),
  ('Mooikloof Golf Club', 'Kameeldrift', 'Pretoria', 'North West', 'South Africa', ST_MakePoint(28.3300, -25.6500)::geography, 18, 'community'),
  ('Koster Golf Club', 'Koster', 'Koster', 'North West', 'South Africa', ST_MakePoint(26.9000, -25.8600)::geography, 9, 'community'),
  ('Rustenburg Golf Club', 'Rustenburg', 'Rustenburg', 'North West', 'South Africa', ST_MakePoint(27.2400, -25.6600)::geography, 18, 'community'),
  ('Pilanesberg Golf Club', 'Sun City', 'Sun City', 'North West', 'South Africa', ST_MakePoint(27.1200, -25.3000)::geography, 18, 'community')

ON CONFLICT DO NOTHING;

-- Add placeholder 18-hole data for each course that doesn't have holes yet
DO $$
DECLARE
  c RECORD;
  h INTEGER;
  pars INTEGER[] := ARRAY[4,4,3,5,4,4,3,4,5,4,3,5,4,4,3,4,5,4];
BEGIN
  FOR c IN SELECT id, num_holes FROM courses WHERE id NOT IN (SELECT DISTINCT course_id FROM holes)
  LOOP
    FOR h IN 1..LEAST(c.num_holes, 18)
    LOOP
      INSERT INTO holes (course_id, hole_number, par)
      VALUES (c.id, h, pars[h])
      ON CONFLICT DO NOTHING;
    END LOOP;
    -- For 27 or 36 hole courses, add remaining holes
    IF c.num_holes > 18 THEN
      FOR h IN 19..c.num_holes
      LOOP
        INSERT INTO holes (course_id, hole_number, par)
        VALUES (c.id, h, pars[((h-1) % 18) + 1])
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;
