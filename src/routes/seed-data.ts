// ---------------------------------------------------------------------------
// Seed data — 20 diverse achievement submissions from various teams
// Extracted into a shared module so it can be used by both
// prisma/seed.ts (local) and src/routes/admin.ts (Cloud Run)
// ---------------------------------------------------------------------------

export const seedAchievements = [
  {
    team: "Team Alpha",
    source: "google_sheets",
    text: "Successfully completed the Project Phoenix cloud migration, moving 47 microservices from on-premise to GCP. This reduced infrastructure costs by 35% and improved deployment frequency from monthly to daily releases. The migration was completed 2 weeks ahead of schedule.",
  },
  {
    team: "Team Beta",
    source: "google_sheets",
    text: "Launched the new customer self-service portal which has already onboarded 2,300 enterprise customers in the first month. Customer support ticket volume decreased by 42% as a result.",
  },
  {
    team: "Team Gamma",
    source: "google_sheets",
    text: "Implemented an AI-powered anomaly detection system for our manufacturing IoT sensors. The system identified 15 potential equipment failures before they occurred, saving an estimated $1.2M in downtime costs.",
  },
  {
    team: "Team Delta",
    source: "google_sheets",
    text: "Completed the SOC 2 Type II certification audit with zero critical findings. This opens up new enterprise sales opportunities worth approximately $5M in pipeline.",
  },
  {
    team: "Team Alpha",
    source: "google_sheets",
    text: "Reduced API response times by 60% through implementing a new caching layer using Redis and optimizing database queries. P99 latency dropped from 800ms to 320ms.",
  },
  {
    team: "Team Epsilon",
    source: "google_sheets",
    text: "Won the 'Best Innovation' award at the industry conference for our digital twin technology demo. Generated 50+ qualified leads and 3 partnership inquiries from Fortune 500 companies.",
  },
  {
    team: "Team Zeta",
    source: "google_sheets",
    text: "Automated the monthly financial reporting pipeline, reducing report generation time from 3 days to 4 hours. The new system also eliminated manual data entry errors which previously affected 12% of reports.",
  },
  {
    team: "Team Beta",
    source: "google_sheets",
    text: "Deployed a real-time language translation feature supporting 12 languages in our customer communication platform. Early adoption metrics show 28% increase in international customer engagement.",
  },
  {
    team: "Team Gamma",
    source: "google_sheets",
    text: "Established a cross-functional tiger team that resolved the critical supply chain bottleneck in Region APAC. Delivery times improved from 14 days to 6 days, directly impacting customer satisfaction scores.",
  },
  {
    team: "Team Delta",
    source: "google_sheets",
    text: "Mentored 8 junior engineers through the new graduate onboarding program. All participants successfully completed their first production deployments within 6 weeks, a 40% improvement over the previous cohort.",
  },
  {
    team: "Team Epsilon",
    source: "google_sheets",
    text: "Designed and implemented a new microservices architecture for the billing platform. The new system handles 3x the transaction volume and reduced billing errors by 95%.",
  },
  {
    team: "Team Zeta",
    source: "google_sheets",
    text: "Led the company-wide adoption of GitOps practices. 15 teams are now using ArgoCD for deployments, resulting in 70% fewer deployment-related incidents.",
  },
  {
    team: "Team Alpha",
    source: "google_sheets",
    text: "Project Phoenix cloud migration completed successfully with all services now running on GCP. Infrastructure costs reduced significantly and deployment cadence improved dramatically.",
  },
  {
    team: "Team Beta",
    source: "google_sheets",
    text: "Developed an internal knowledge base chatbot using Gemini that answers employee questions about company policies, benefits, and procedures. Achieved 89% accuracy on first-attempt responses, reducing HR inquiry volume by 55%.",
  },
  {
    team: "Team Gamma",
    source: "google_sheets",
    text: "Completed the Predictive Maintenance 2.0 rollout to all 12 manufacturing facilities globally. The system now monitors 50,000+ sensors and has prevented 23 unplanned outages this quarter.",
  },
  {
    team: "Team Delta",
    source: "google_sheets",
    text: "Negotiated and closed a strategic partnership with CloudTech Solutions, securing a 3-year co-development agreement worth $8M. The partnership will accelerate our edge computing product roadmap by 18 months.",
  },
  {
    team: "Team Epsilon",
    source: "google_sheets",
    text: "Refactored the legacy monolith authentication module into a standalone identity service. Migration was completed with zero downtime and the new service supports OAuth 2.0, SAML, and passkey authentication.",
  },
  {
    team: "Team Zeta",
    source: "google_sheets",
    text: "Published 4 blog posts and 2 whitepapers on our AI/ML best practices, generating 15,000+ views and establishing thought leadership in the industrial AI space.",
  },
  {
    team: "Team Alpha",
    source: "google_sheets",
    text: "Built an automated testing framework that increased code coverage from 45% to 87% across all Phoenix services. CI pipeline now catches 93% of bugs before code review.",
  },
  {
    team: "Team Gamma",
    source: "google_sheets",
    text: "Organized a company-wide hackathon with 120 participants across 6 offices. The winning project — an AR-based equipment maintenance guide — is now being fast-tracked for production deployment.",
  },
];
