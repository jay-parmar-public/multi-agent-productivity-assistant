// Mock Company Knowledge Base Data

export const companyPriorities = {
  Q1: [
    "Accelerate Cloud Modernization (Project Phoenix)",
    "Enhance Customer Self-Service Capabilities",
    "Establish Industry Leadership in Industrial AI",
    "Improve Engineering Velocity & CI/CD",
  ],
  Q2: [
    "Scale Edge Computing Infrastructure",
    "Expand APAC Market Footprint",
    "Achieve SOC 2 Compliance Across All Services",
  ],
};

export const strategicProjects = [
  {
    name: "Project Phoenix",
    priority: "P0",
    budget_tier: "$2M+",
    department: "Platform Engineering",
    strategic_alignment: "Accelerate Cloud Modernization",
    description: "Full migration of 47 legacy monolith services to GCP microservices.",
  },
  {
    name: "Customer Self-Service Portal",
    priority: "P1",
    budget_tier: "$500K-$1M",
    department: "Customer Success & Product",
    strategic_alignment: "Enhance Customer Self-Service Capabilities",
    description: "New web portal allowing enterprise customers to manage their own billing and configuration.",
  },
  {
    name: "Predictive Maintenance 2.0",
    priority: "P1",
    budget_tier: "$1M+",
    department: "IoT & Data Science",
    strategic_alignment: "Establish Industry Leadership in Industrial AI",
    description: "Next-gen AI models for factory sensor anomaly detection.",
  },
  {
    name: "SOC 2 Audit",
    priority: "P0",
    budget_tier: "Under $100K",
    department: "Security & Compliance",
    strategic_alignment: "Achieve SOC 2 Compliance",
    description: "Company-wide security posture upgrade and external audit coordination.",
  },
  {
    name: "ArgoCD & GitOps Rollout",
    priority: "P2",
    budget_tier: "Under $100K",
    department: "DevOps",
    strategic_alignment: "Improve Engineering Velocity & CI/CD",
    description: "Standardizing deployment workflows using GitOps principles across 15+ teams.",
  },
];

// Mock team information — ~6 teams matching the seed achievement data
export const teams = [
  {
    team_name: "Team Alpha",
    size: 12,
    department: "Platform Engineering",
    manager: "Sarah Chen",
    focus_areas: ["Cloud Migration", "Infrastructure Modernization", "CI/CD Automation"],
    recent_wins: ["Project Phoenix Phase 1 completion", "Redis caching layer deployment"],
  },
  {
    team_name: "Team Beta",
    size: 9,
    department: "Customer Success & Product",
    manager: "James Rodriguez",
    focus_areas: ["Customer-Facing Products", "Internationalization", "AI Chatbots"],
    recent_wins: ["Self-service portal launch", "Multi-language chat rollout"],
  },
  {
    team_name: "Team Gamma",
    size: 14,
    department: "IoT & Data Science",
    manager: "Priya Sharma",
    focus_areas: ["Predictive Maintenance", "Sensor Analytics", "Edge AI"],
    recent_wins: ["Anomaly detection system v1 deployment", "50K sensor integration"],
  },
  {
    team_name: "Team Delta",
    size: 8,
    department: "Security & Compliance",
    manager: "Michael Park",
    focus_areas: ["Compliance Audits", "Identity & Access Management", "Partnerships"],
    recent_wins: ["SOC 2 Type II certification", "CloudTech partnership signed"],
  },
  {
    team_name: "Team Epsilon",
    size: 10,
    department: "Core Engineering",
    manager: "Lisa Wang",
    focus_areas: ["Billing Platform", "Identity Services", "Innovation R&D"],
    recent_wins: ["Billing microservices rewrite", "Industry conference Best Innovation award"],
  },
  {
    team_name: "Team Zeta",
    size: 7,
    department: "DevOps & Engineering Enablement",
    manager: "Kevin Okonkwo",
    focus_areas: ["GitOps Adoption", "Developer Experience", "Thought Leadership"],
    recent_wins: ["ArgoCD rollout to 15 teams", "Financial reporting automation"],
  },
];
