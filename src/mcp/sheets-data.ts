// Mock Google Sheet data — ~20 diverse achievement submissions from different teams
// Simulates a Google Form responses spreadsheet

export const mockSheetRows = [
  // --- Team Alpha (Platform Engineering) ---
  {
    row_id: "2",
    team: "Team Alpha",
    text: "Successfully completed the Project Phoenix cloud migration, moving 47 microservices from on-premise to GCP. This reduced infrastructure costs by 35% and improved deployment frequency from monthly to daily releases.",
    date: "2026-03-31",
    source: "google_sheets",
  },
  {
    row_id: "3",
    team: "Team Alpha",
    text: "Deployed a new Redis caching layer across all production services, reducing average API response time from 450ms to 120ms — a 73% improvement.",
    date: "2026-04-01",
    source: "google_sheets",
  },
  {
    row_id: "4",
    team: "Team Alpha",
    text: "Implemented automated blue-green deployments for 12 critical services, achieving zero-downtime releases for the first time in company history.",
    date: "2026-04-03",
    source: "google_sheets",
  },

  // --- Team Beta (Customer Success & Product) ---
  {
    row_id: "5",
    team: "Team Beta",
    text: "Launched the new customer self-service portal which has already onboarded 2,300 enterprise customers in the first month, reducing support ticket volume by 40%.",
    date: "2026-03-30",
    source: "google_sheets",
  },
  {
    row_id: "6",
    team: "Team Beta",
    text: "Rolled out multi-language support (Spanish, Japanese, German) for the customer chatbot, expanding coverage to 85% of our global user base.",
    date: "2026-04-02",
    source: "google_sheets",
  },
  {
    row_id: "7",
    team: "Team Beta",
    text: "Achieved a Net Promoter Score of 72 for Q1, up from 58 in Q4 — the highest NPS in the company's history.",
    date: "2026-04-04",
    source: "google_sheets",
  },

  // --- Team Gamma (IoT & Data Science) ---
  {
    row_id: "8",
    team: "Team Gamma",
    text: "Implemented an AI-powered anomaly detection system for our manufacturing IoT sensors. The system identified 15 potential equipment failures before they occurred, saving an estimated $1.2M in downtime costs.",
    date: "2026-03-29",
    source: "google_sheets",
  },
  {
    row_id: "9",
    team: "Team Gamma",
    text: "Completed integration of 50,000 new edge sensors across 3 manufacturing facilities, increasing real-time monitoring coverage from 60% to 95%.",
    date: "2026-04-01",
    source: "google_sheets",
  },
  {
    row_id: "10",
    team: "Team Gamma",
    text: "Published a peer-reviewed research paper on predictive maintenance using transformer models at the IEEE IoT Conference, positioning the company as a thought leader.",
    date: "2026-04-03",
    source: "google_sheets",
  },
  {
    row_id: "11",
    team: "Team Gamma",
    text: "Reduced false positive rate of the anomaly detection system from 12% to 2.3% through model retraining with 6 months of production data.",
    date: "2026-04-05",
    source: "google_sheets",
  },

  // --- Team Delta (Security & Compliance) ---
  {
    row_id: "12",
    team: "Team Delta",
    text: "Completed the SOC 2 Type II certification audit with zero critical findings. This was a Q2 strategic priority achieved ahead of schedule.",
    date: "2026-03-28",
    source: "google_sheets",
  },
  {
    row_id: "13",
    team: "Team Delta",
    text: "Signed a strategic partnership with CloudTech Solutions for joint security product development, projected to generate $3M in revenue over 2 years.",
    date: "2026-04-02",
    source: "google_sheets",
  },
  {
    row_id: "14",
    team: "Team Delta",
    text: "Implemented automated vulnerability scanning across all 200+ repositories, reducing mean time to patch from 14 days to 3 days.",
    date: "2026-04-04",
    source: "google_sheets",
  },

  // --- Team Epsilon (Core Engineering) ---
  {
    row_id: "15",
    team: "Team Epsilon",
    text: "Completed the billing microservices rewrite, migrating from a monolithic billing engine to event-driven architecture. Processing time dropped from 45 minutes to 90 seconds for monthly invoicing.",
    date: "2026-03-31",
    source: "google_sheets",
  },
  {
    row_id: "16",
    team: "Team Epsilon",
    text: "Won the 'Best Innovation' award at the Annual Industry Conference for our real-time fraud detection prototype.",
    date: "2026-04-01",
    source: "google_sheets",
  },
  {
    row_id: "17",
    team: "Team Epsilon",
    text: "Launched internal hackathon initiative resulting in 5 new product feature prototypes, two of which have been approved for production development in Q2.",
    date: "2026-04-05",
    source: "google_sheets",
  },

  // --- Team Zeta (DevOps & Engineering Enablement) ---
  {
    row_id: "18",
    team: "Team Zeta",
    text: "Led the company-wide adoption of GitOps practices. 15 teams are now using ArgoCD for deployments, resulting in 70% fewer deployment-related incidents.",
    date: "2026-03-30",
    source: "google_sheets",
  },
  {
    row_id: "19",
    team: "Team Zeta",
    text: "Built and deployed an automated financial reporting pipeline that reduced monthly close cycle from 5 days to 8 hours, freeing up 120 person-hours per month across Finance and Engineering.",
    date: "2026-04-02",
    source: "google_sheets",
  },
  {
    row_id: "20",
    team: "Team Zeta",
    text: "Created a developer experience survey and acting on results: reduced average CI/CD pipeline time from 22 minutes to 8 minutes across all teams.",
    date: "2026-04-04",
    source: "google_sheets",
  },

  // --- Duplicate entry (for deduplication testing) ---
  {
    row_id: "21",
    team: "Team Alpha",
    text: "Project Phoenix cloud migration completed — moved 47 microservices to GCP with 35% cost reduction and daily deployments.",
    date: "2026-04-05",
    source: "google_sheets",
  },
];
