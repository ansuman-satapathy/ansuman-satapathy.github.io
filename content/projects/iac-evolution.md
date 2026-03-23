---
title: "IaC Evolution: Deploying the Same App Three Ways to Understand Why Modern Infrastructure Exists"
date: 2026-03-15
description: "This project shows the journey from Bash to Terraform, demonstrating the evolution of Infrastructure as Code (IaC)."
tags: ["devops", "iac"]
github: "https://github.com/ansuman-satapathy/IaC-Evolution"
draft: false
---

[![View on GitHub](https://img.shields.io/badge/GitHub-View_on_GitHub-181717?style=for-the-badge&logo=github)](https://github.com/ansuman-satapathy/IaC-Evolution)
# IaC Evolution: From Bash to Terraform

This repository demonstrates the evolution of Infrastructure as Code (IaC) and Configuration Management. It is structured as a 3-part journey, taking a raw Linux environment and progressively upgrading the deployment methodology to solve the limitations of the previous stage.

## Tech Stack

- **Provisioning & Orchestration:** Terraform, Vagrant
- **Configuration Management:** Ansible, Bash
- **Cloud Provider:** Amazon Web Services (AWS)
- **Application Stack:** Node.js (Express), PostgreSQL, Redis, Nginx, PM2
- **Local Hypervisor:** KVM / libvirt

## Goal

To provision the infrastructure for a standard 3-tier web application using three entirely different DevOps philosophies.

A single, `dummy-node-app` is located at the root of this repository. **This exact same application is deployed across all three levels** to demonstrate how different infrastructure tools handle and scale the exact same workload.

---

## 3 Stages of Evolution

### Level 1: A Single Bash Script

- **The Architecture:** All services (Frontend, Cache, Database, Proxy) running on a single Ubuntu VM.
- **The Tooling:** A procedural Bash `bootstrap.sh` script.
- **The Engineering Focus:** Imperative execution.
- **The Lesson:** Demonstrates the foundational Linux commands required to configure OS-level services (systemd, UFW, PM2) and integrate official GPG-secured package repositories. It ultimately exposes the fragility, lack of native idempotency, and scaling limitations inherent in imperative shell scripting.

### Level 2: Configuration Management With Ansible

- **The Architecture:** A distributed 3-node environment consisting of a Web Server (`192.168.56.12`), Redis Server (`192.168.56.11`), and Postgres Server (`192.168.56.10`).
- **The Tooling:** Ansible Playbooks, modular Roles, and an optimized `ansible.cfg` with SSH Pipelining.
- **The Engineering Focus:** Declarative, idempotent configuration.
- **The Lesson:** Upgrades the infrastructure to a **declarative** state. Demonstrates native idempotency by abstracting the configuration away from the hardware. Showcases modular server configuration via the `roles/` directory structure and enforces secure internal communication using a "Default Deny" UFW policy across separate network interfaces.

### Level 3: Cloud-Native IaC on AWS (Terraform + Ansible)

- **The Architecture:** Production-grade AWS Cloud Infrastructure featuring a Custom VPC, Public Subnets (Web/Proxy), Private Subnets (Database/Cache), and a NAT Gateway for secure outbound traffic.
- **The Tooling:** **Terraform** for AWS hardware and network provisioning, handing off to **Ansible** for software configuration via Bastion Host SSH tunneling.
- **The Engineering Focus:** Separation of Concerns (Immutable Provisioning + Mutable Configuration) and State Management.
- **The Lesson:** Demonstrates how Terraform interacts directly with the AWS API to architect the cloud environment (tracking resources via `terraform.tfstate`), while Ansible securely connects to the live EC2 instances to configure the application stack. Successfully migrated the infrastructure by reusing 100% of the Level 2 Ansible roles and utilizing Ansible magic variables (`{{ groups['db'][0] }}`) to dynamically inject live AWS IPs into the Node.js environment. Overcame strict cloud network boundaries via `ProxyCommand` tunneling and private subnet isolation.

---

## Testing Environments

To ensure a clean, reproducible setup while managing costs:

- **Levels 1 & 2 (Local Testing):** Utilizes **Vagrant** with the **KVM/libvirt** hypervisor to spin up isolated, cost-free VMs locally. This allows for rapid iteration of configuration scripts before touching cloud resources.
- **Level 3 (Cloud Deployment):** Targets **Amazon Web Services (AWS)** using standard API credentials to provision real cloud infrastructure, mapped dynamically via Terraform state outputs. Leverages Free Tier eligible EC2 instances and temporary NAT Gateways.
