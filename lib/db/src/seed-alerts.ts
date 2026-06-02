import { db } from "./index.js";
import { alertsTable } from "./schema/alerts.js";

const alerts = [
  {
    communityId: "default", userId: "bilal", userName: "Bilal Raza", unitNumber: "A-101",
    type: "theft", title: "Motorbike stolen from parking",
    description: "My Honda CB150F (red, plate ABC-123) was stolen from the main parking area overnight. Last seen at 11 PM. Please inform security if you spot it.",
    locationDetail: "Main parking lot, Gate 2 side", imageUrl: null, severity: "high", isResolved: false,
  },
  {
    communityId: "default", userId: "sara", userName: "Sara Qureshi", unitNumber: "C-305",
    type: "suspicious", title: "Unknown person loitering near Block C",
    description: "A man in a blue jacket has been sitting near the Block C entrance for 3+ hours, watching residents come and go. Security has been informed but not responded.",
    locationDetail: "Block C entrance, near intercom", imageUrl: null, severity: "medium", isResolved: false,
  },
  {
    communityId: "default", userId: "imran", userName: "Imran Shah", unitNumber: "B-108",
    type: "water_shortage", title: "No water supply in Building B",
    description: "Building B has had no water since 6 AM this morning. The main supply valve seems to be closed. Please contact the management office urgently.",
    locationDetail: "All of Building B", imageUrl: null, severity: "medium", isResolved: false,
  },
  {
    communityId: "default", userId: "ahmed", userName: "Ahmed Khan", unitNumber: "B-204",
    type: "power_outage", title: "Power outage — Block D and E",
    description: "Complete power failure in Block D and E. Generator is running in D but not in E. LESCO informed, ETA 3–4 hours.",
    locationDetail: "Block D and Block E", imageUrl: null, severity: "high", isResolved: true,
  },
  {
    communityId: "default", userId: "nadia", userName: "Nadia Farooq", unitNumber: "D-212",
    type: "other", title: "Stray dogs near children's play area",
    description: "There are 3–4 stray dogs near the children's play area. Kids cannot play safely. Please arrange for animal control.",
    locationDetail: "Children's play area, Central Park", imageUrl: null, severity: "low", isResolved: false,
  },
];

const existing = await db.select().from(alertsTable).limit(1);
if (existing.length > 0) {
  console.log("Alerts already seeded, skipping.");
  process.exit(0);
}
await db.insert(alertsTable).values(alerts);
console.log(`Seeded ${alerts.length} alerts.`);
process.exit(0);
