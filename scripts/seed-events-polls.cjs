const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

const today = new Date();
const fmt = d => d.toISOString().slice(0, 10);
const future = (days) => { const d = new Date(today); d.setDate(d.getDate() + days); return fmt(d); };
const past = (days) => { const d = new Date(today); d.setDate(d.getDate() - days); return fmt(d); };
const hrs = (h) => new Date(Date.now() + h * 3600000).toISOString();
const hrsAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();

async function seed() {
  await client.connect();

  await client.query(`
    INSERT INTO events (community_id, user_id, user_name, unit_number, title, description, date, time, location, rsvp_count)
    VALUES
      ('default','ahmed','Ahmed Khan','B-204','Rooftop BBQ this Saturday',
       'Calling all neighbours! Bring your lawn chairs. Food and drinks provided. Families welcome.',
       '${future(3)}','18:30','Rooftop, Building B',7),
      ('default','fatima','Fatima Malik','C-302','Yoga & Wellness Morning',
       'Start your week right with a 45-minute community yoga session. All levels welcome.',
       '${future(7)}','07:00','Lawn near Gate 2',12),
      ('default','omar','Omar Malik','A-305','Annual General Meeting',
       'Yearly community meeting: budget review, maintenance updates, and elections for block representatives.',
       '${future(14)}','19:00','Community Hall',0),
      ('default','sara','Sara Iqbal','D-115','Back-to-School Supplies Drive',
       'Collecting stationery and school bags for underprivileged children in the area. Drop off at lobby.',
       '${past(5)}','10:00','Building A Lobby',23),
      ('default','raza','Raza Shah','A-101','Eid Mela 2025',
       'Annual Eid gathering with food stalls, games for kids, and live music in the main courtyard.',
       '${past(20)}','16:00','Main Courtyard',118)
    ON CONFLICT DO NOTHING
  `);
  console.log('Events seeded');

  await client.query(`
    INSERT INTO polls (community_id, user_id, user_name, unit_number, question, options, ends_at)
    VALUES
      ('default','ahmed','Ahmed Khan','B-204',
       'What time works best for the community meeting?',
       ARRAY['6:00 PM weekday','8:00 PM weekday','10:00 AM Saturday','4:00 PM Saturday'],
       '${hrs(72)}'),
      ('default','fatima','Fatima Malik','C-302',
       'Should we add a covered parking area for bikes and motorcycles?',
       ARRAY['Yes, definitely','No, not needed','Maybe, if cost is shared equally'],
       '${hrs(48)}'),
      ('default','bilal','Bilal Ahmed','E-201',
       'Which amenity should we upgrade next?',
       ARRAY['Swimming pool renovation','Gym equipment','Children playground','Jogging track'],
       '${hrs(120)}'),
      ('default','sara','Sara Iqbal','D-115',
       'How often should we hold community events?',
       ARRAY['Monthly','Every 2 months','Quarterly','Only on occasions'],
       '${hrsAgo(2)}')
    ON CONFLICT DO NOTHING
  `);
  console.log('Polls seeded');

  // Votes on the ended poll
  const ended = await client.query("SELECT id FROM polls WHERE ends_at < NOW() LIMIT 1");
  if (ended.rows[0]) {
    const pid = ended.rows[0].id;
    const votes = [
      ['ahmed', 'Ahmed Khan', 0], ['tariq', 'Tariq Mahmood', 2], ['ayesha', 'Ayesha Khan', 2],
      ['hassan', 'Hassan Ali', 0], ['zainab', 'Zainab Hussain', 1], ['bilal', 'Bilal Ahmed', 3],
    ];
    for (const [uid, uname, oi] of votes) {
      await client.query(
        'INSERT INTO poll_votes (poll_id, user_id, user_name, option_index) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
        [pid, uid, uname, oi]
      ).catch(() => {});
    }
    console.log('Votes on ended poll seeded');
  }

  // Votes on first active poll
  const active = await client.query("SELECT id FROM polls WHERE ends_at > NOW() ORDER BY ends_at ASC LIMIT 1");
  if (active.rows[0]) {
    const pid = active.rows[0].id;
    const votes = [
      ['tariq', 'Tariq Mahmood', 1], ['ayesha', 'Ayesha Khan', 2], ['hassan', 'Hassan Ali', 0],
    ];
    for (const [uid, uname, oi] of votes) {
      await client.query(
        'INSERT INTO poll_votes (poll_id, user_id, user_name, option_index) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
        [pid, uid, uname, oi]
      ).catch(() => {});
    }
    console.log('Votes on active poll seeded');
  }

  await client.end();
  console.log('Done!');
}

seed().catch(e => { console.error(e); process.exit(1); });
