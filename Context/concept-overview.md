# NovaLance – Concept Overview

## Pain Points

1. Project owners often need to hire **2–7 freelance developers** per project, with careful consideration of:
   - Technical competence (skills, experience, tech stack)
   - Current availability

2. **Freelancer CVs are not always reliable**:
   - Skills and experience can be exaggerated or falsified
   - No verifiable record of active or past freelance projects
   - Lack of transparency regarding real project contributions

3. **Web2 limitations**:
   - Trust is centralized and platform-based
   - CVs, reviews, and work history are mutable and unverifiable
   - Payment disputes and post-delivery non-payment risks are common


## Core Idea: NovaLance

NovaLance is a **freelance job marketplace** that connects project owners and developers, with a strong emphasis on:

- **Verified and valid CVs**
- **KPI-based, milestone-driven payment terms**
- **Objective matching between job requirements and developer capabilities**

Key differentiators:
- CVs and work history are verifiable
- Project payments are released automatically based on KPI fulfillment
- Reduced fraud and payment risk for both parties

An **AI (LLM-based) matching system** rates the compatibility between:
- Job descriptions defined by project owners
- Skills, experience, and portfolio data in freelancer CVs


## Web3 Foundation

NovaLance leverages Web3 infrastructure to address trust and transparency issues:

1. **On-chain CV & Work History**
   - CV data stored or referenced on-chain
   - Immutable record of:
     - Past projects
     - Companies / employers
     - Roles and responsibilities
   - Ensures authenticity and prevents falsification

2. **On-chain, KPI-Based Payments**
   - Smart contracts handle escrow and fund distribution
   - Payments are released per KPI milestone
   - Eliminates unilateral withholding of payments


## User Roles

> Note: Roles are **not exclusive**. A single user can act as both a project owner and a freelancer.

### User: Freelancer
- Executes project work
- Typically sourced from platforms like Fiverr, LinkedIn, etc.
- Builds a verifiable on-chain portfolio within NovaLance

### User: Project Owner
- Posts jobs and manages projects
- Can also apply as a freelancer for other projects
- Can recruit other freelancers for collaboration


## Feature List

### 1. Portfolio & Experience Management
- Freelancers can **submit new experience entries** to their NovaLance portfolio
- Experience submissions are sent to the employer for validation
- Employers:
  - Approve or reject experience claims
  - Provide reviews (format to be finalized):
    - Text-based review
    - Rating system
    - Aggregated or weighted score


### 2. Job Offer System

Project owners can create and manage job offers:

- **Job Posting**
  - Define job scope, requirements, and KPIs
  - Specify project budget

- **Paid Features**
  - Approve and lock project budget via wallet (escrow)
  - Search and filter candidates based on job criteria
  - Promote job listings to top positions (advertising)

- **Application Flow**
  - Freelancers apply to job offers
  - Employers review verified portfolios
  - Employers decide to approve or reject candidates


### 3. Project Management (Milestone-Based)

An extension of the Job Offer once both parties agree:

- Projects are split into **multiple checkpoints (milestones)**  
  Example: 3 checkpoints

- Each checkpoint has:
  - Clearly defined KPI
  - Predefined reward percentage

#### Example Flow
- Checkpoint 1: Complete frontend system
  - Reward: 25% of total project payment
- Freelancer submits a checkpoint completion request
- Employer reviews and approves
- Upon approval:
  - Smart contract automatically releases 25% payment to freelancer

#### Risk Mitigation
- Prevents scams where payment is withheld after delivery
- If an employer fails to approve a completed checkpoint:
  - Freelancer can stop further work
  - Freelancer can submit a report for dispute resolution
  - Enables reassignment or intervention without total loss


## Summary

NovaLance combines:
- AI-based talent matching
- Web3-backed trust and verification
- KPI-driven, automated payments

to create a **trust-minimized freelance marketplace** that protects both project owners and freelancers while enabling scalable, multi-developer project collaboration.
