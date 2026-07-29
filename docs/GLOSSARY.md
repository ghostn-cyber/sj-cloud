# SJ Cloud Glossary

> Official terminology and definitions used throughout the SJ Cloud Platform documentation.

---

# Purpose

The glossary establishes a common language for engineers, operators, auditors, implementation partners, and stakeholders working with the SJ Cloud platform.

All documentation within this repository must use the terminology defined here. New terms should be added through the documentation review process.

---

# How to Use This Document

- Use the definitions in this glossary consistently across all documentation.
- Do not redefine terms in individual documents.
- Reference glossary terms where clarification is required.
- Avoid introducing new terminology without review.

---

# Core Platform Terminology

## Application

A software system deployed on the SJ Cloud platform.

Examples:

- CareCore
- Startup Jigawa
- NGO Portal
- Government Service Portal

---

## Architecture Decision Record (ADR)

A document that records an important architectural decision, including its context, rationale, alternatives, and consequences.

---

## Availability Zone

A logically isolated deployment location designed to improve service availability and resilience.

*Future capability.*

---

## Backup

A verified copy of data retained for recovery purposes.

Backups must be encrypted, versioned, and tested through restoration procedures.

---

## CI/CD

Continuous Integration and Continuous Deployment.

The automated process responsible for building, testing, validating, and deploying software.

Current implementation:

- GitHub Actions

---

## Cluster

A group of servers operating together as a single computing platform.

Docker Compose deployments are **not** considered clusters.

Kubernetes deployments are clusters.

---

## Container

A lightweight, isolated runtime environment used to package and execute software.

SJ Cloud standardizes on Docker containers.

---

## Control Plane

The collection of services responsible for managing the platform.

Examples include:

- Deployment management
- Authentication
- Scheduling
- Configuration
- Monitoring

---

## Data Plane

The infrastructure responsible for processing application traffic.

Examples include:

- Reverse proxy
- Application containers
- Databases
- Object storage

---

## Deployment

The process of releasing an application or infrastructure change into an environment.

---

## Environment

A logical stage of deployment.

Standard environments include:

- Development
- Testing
- Staging
- Production

---

## Gateway

The entry point into the platform.

Current implementation:

- Traefik

---

## Infrastructure

The shared compute, networking, storage, and operational services that support deployed applications.

---

## Infrastructure as Code (IaC)

The practice of managing infrastructure through version-controlled configuration files instead of manual operations.

---

## Instance

A running copy of an application or service.

Multiple instances may exist simultaneously for scaling or redundancy.

---

## Namespace

A logical boundary used to isolate workloads.

Namespaces become relevant during Kubernetes adoption.

---

## Node

A physical or virtual server participating in the platform.

Examples:

- Ubuntu VPS
- Bare-metal server
- Kubernetes worker node

---

## Object Storage

Scalable storage for unstructured data.

Current implementation:

- MinIO

---

## Platform

SJ Cloud as a complete engineering ecosystem providing shared infrastructure and operational capabilities.

---

## Platform Service

A reusable infrastructure capability provided by SJ Cloud.

Examples:

- Authentication
- Database
- Redis
- Object Storage
- Monitoring
- Logging

---

## Product

A business-facing software solution deployed on SJ Cloud.

Examples:

- CareCore
- Startup Jigawa

A product may contain one or more applications or services.

---

## Project

A logical engineering initiative represented by one or more Git repositories.

---

## Registry

A repository used for storing container images.

Future implementations may include:

- GitHub Container Registry (GHCR)
- Private OCI Registry

---

## Repository

A version-controlled source code repository.

Current standard:

- GitHub

---

## Reverse Proxy

A service responsible for routing incoming traffic to backend services.

Current implementation:

- Traefik v3

---

## Runtime

The environment in which an application executes.

Examples:

- PHP Runtime
- Node.js Runtime

---

## Service

A deployable software component responsible for a specific capability.

Examples:

- Authentication Service
- Notification Service
- API Service

---

## Service Mesh

An infrastructure layer that manages service-to-service communication.

Future capability.

---

## Tenant

An independent organization, customer, or product hosted on the SJ Cloud platform.

Examples:

- Startup Jigawa
- CareCore
- Government Agency
- NGO

Each tenant operates independently while sharing the underlying platform infrastructure.

---

## Tenant Isolation

The mechanisms that ensure tenants remain logically and operationally separated.

Isolation may include:

- Network boundaries
- Databases
- Storage
- Secrets
- Compute resources

---

## Workspace

A logical management boundary for a tenant's resources.

A workspace may contain:

- Applications
- Databases
- Storage
- Configuration
- Secrets

---

## Workload

Any deployable computing resource.

Examples:

- Application container
- Database
- Scheduled job
- Queue worker

---

# Reserved Platform Terms

The following names are reserved and should be used consistently throughout all documentation.

| Term | Meaning |
|------|---------|
| SJ Cloud | Platform |
| Tenant | Independent customer or organization |
| Workspace | Tenant management boundary |
| Product | Business software solution |
| Application | Deployable software |
| Service | Functional software component |
| Platform Service | Shared infrastructure capability |
| Environment | Deployment stage |
| Node | Physical or virtual server |
| Cluster | Group of coordinated servers |
| Instance | Running copy of software |
| Deployment | Software release process |

---

# Terminology Governance

The Platform Engineering Team owns this glossary.

Changes to terminology must be reviewed to ensure consistency across documentation and implementation.

New platform concepts should be added here before they appear elsewhere in the documentation.

---

**Document Version:** 1.0  
**Status:** Approved  
**Owner:** SJ Cloud Platform Engineering