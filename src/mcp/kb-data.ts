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
