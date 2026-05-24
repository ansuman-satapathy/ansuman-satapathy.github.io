---
title: "Building a Production GitOps Platform on AWS"
date: 2026-05-24
description: "A production-grade GitOps platform built from scratch using Flux, EKS, Terraform, and Helm to automatically orchestrate and deploy a 5-service food delivery application with observability and security built-in."
tags: ["kubernetes", "gitops", "terraform", "fluxcd", "aws", "prometheus", "grafana"]
github: "https://github.com/ansuman-satapathy/foodbyte-gitops"
draft: false
---

[![View on GitHub](https://img.shields.io/badge/GitHub-View_on_GitHub-181717?style=for-the-badge&logo=github)](https://github.com/ansuman-satapathy/foodbyte-gitops)

I have always wanted to build a project where I own everything. Not just the application code, but the entire system around it. How it gets built, how it gets deployed, how it runs, and how you know when something is wrong.

So I started building. A food delivery platform as the workload, but the project was never about the application. It was about building the infrastructure and delivery pipeline that runs it.

---

## The Idea

Most side projects stop at "it works on my machine." I wanted to go further and build the way a real engineering team would. That meant separate repositories per service, automated pipelines, proper infrastructure, and full visibility into what the system is doing at runtime.

The workload is a food delivery platform with 5 services: users, orders, restaurants, notifications, and a React frontend. Each one is an independent service with its own database and its own deployment lifecycle. The services exist to give the platform something real to run.

---

## Phase 1: CI Pipelines

The first thing I built was the delivery pipeline, before touching any cloud infrastructure.

Every service lives in its own GitHub repository. When code gets merged, a GitHub Actions pipeline runs automatically:

- Lint the code (Ruff for Python, ESLint for the frontend)
- Run the test suite with pytest, enforcing 75%+ coverage
- Build a Docker image using a multi-stage Alpine build to keep the image small and secure
- Scan the image for known vulnerabilities using Grype
- Push the image to GitHub Container Registry tagged with the exact commit SHA

That last part matters. Every image is tagged with an immutable commit SHA, not a floating tag like "latest". This means every deployment is fully traceable. You can always look at what is running in the cluster and know exactly which commit it came from.

By the end of this phase, 5 services, 5 independent pipelines, all green.

---

## Phase 2: Infrastructure

With the pipelines done I moved on to provisioning the actual AWS infrastructure using Terraform. To manage state securely and prevent concurrent modifications, the project uses **S3 native state locking** for the Terraform backend.

The setup is a 3-tier VPC:

- **Public subnet** for the load balancer, the only thing exposed to the internet
- **Private subnet** for the Kubernetes nodes where the application runs
- **Intra subnet** for the databases, no internet access at all, only reachable from within the cluster

On top of that sits an EKS cluster running Kubernetes 1.35 with managed EC2 node groups across two availability zones.

I originally planned to use managed AWS services for the databases. RDS for Postgres, DocumentDB for MongoDB, Amazon MQ for RabbitMQ. AWS free tier had other ideas and blocked most of them. So I ended up self-hosting all four databases inside the cluster itself using Helm. That decision made everything harder but also more interesting.

Finding the right node size took longer than expected. Smaller instances did not have enough memory to run 5 services plus 4 databases plus all the Kubernetes system pods at the same time. Larger instances were blocked on free tier. I eventually landed on 3x m7i-flex.large nodes after spending time in that gap.

---

## Phase 3: GitOps with Flux CD

Once the infrastructure was up I needed a way to deploy the services. I chose Flux CD, which follows the GitOps model: the Git repository is the source of truth and the cluster automatically reconciles itself to match whatever is declared there.

The setup follows a 3-repo pattern:

- **Service repos** own the application code and produce Docker images
- **The helm charts repo** holds the Helm chart templates for all 5 services
- **The GitOps repo** is the command center. It pins specific image SHAs and owns the desired state of the cluster

When a new image is pushed to GHCR, Flux detects it and deploys it automatically. No manual kubectl commands, no deploy scripts. A commit to Git is all it takes.

One problem I hit early on was Flux sync deadlocks. Flux was trying to apply ExternalSecret resources before the External Secrets Operator was actually installed, so it kept failing. The fix was implementing multi-wave synchronization:

- Wave 1 installs the operators (Envoy Gateway, External Secrets Operator, monitoring stack)
- Wave 2 applies the configurations (secrets mapping, storage classes, routing rules)
- Wave 3 deploys the applications

Each wave waits for the previous one to be fully healthy before proceeding. Once this was in place the deadlocks stopped entirely.

---

## Secrets and Security

No secrets exist in any Git repository. Not in values files, not in environment variables, nowhere.

All credentials live in AWS Secrets Manager. The External Secrets Operator running inside the cluster syncs them into Kubernetes Secrets at runtime. Authentication is handled by EKS Pod Identity, which gives each pod a scoped IAM identity without any long-lived credentials.

The result is a zero-git-secrets model. Even if every repository in this project were public, there would be nothing sensitive to find.

---

## Networking

All inbound traffic enters through a single AWS load balancer and hits Envoy Gateway, which handles routing to the right service based on the URL path. So `/api/orders` goes to the order service, `/api/users` goes to the user service, and so on. Everything under one domain, one entry point, one place to manage routing rules.

This is the Kubernetes Gateway API, the modern replacement for the older Ingress spec(was archived recently). It gives significantly more control over routing.

---

## Observability

The last piece was visibility. I deployed a full observability stack inside the cluster:

- **Prometheus** scrapes metrics from every service and the cluster itself
- **Loki** aggregates all logs with persistent storage on AWS EBS
- **Grafana** brings it together in dashboards where you can query both metrics and logs in one place

This part had its own problems. The Loki Helm chart ships with enterprise defaults and tried to spin up a cache pod requesting 9.8GB of RAM. My nodes were 8GB each. A single pod was asking for more memory than an entire node had. Had to dig into the Helm values and explicitly disable the cache components and set sane resource limits.

Prometheus had the opposite problem. It was using so much CPU for metric scraping that it was starving the application pods. Fixed by putting strict CPU limits on Prometheus so it could never take enough to actually impact the services.

After all that, being able to see the full cluster clearly for the first time was genuinely satisfying.

## What I learned

- Terraform for real infrastructure, not just tutorials
- Kubernetes resource management, node sizing, and debugging pod failures
- GitOps with Flux, including operator dependency ordering and reconciliation
- Secrets management with AWS Secrets Manager and External Secrets Operator
- Production observability with Prometheus, Loki, and Grafana

