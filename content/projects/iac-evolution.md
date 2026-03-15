---
title: "Iac Evolution"
date: 2026-03-15
description: "This project shows the journey from Bash to Terraform, demonstrating the evolution of Infrastructure as Code (IaC)."
tags: ["DevOps", "IaC"]
github: "https://github.com/ansuman-satapathy/IaC-Evolution"
draft: false
---

[![View on GitHub](https://img.shields.io/badge/GitHub-View_on_GitHub-181717?style=for-the-badge&logo=github)](https://github.com/ansuman-satapathy/IaC-Evolution)

This blog post captures the full trajectory of the project, including the transition to cloud-native automation using Terraform. It highlights the shift from managing a single operating system to architecting a global cloud environment.

---

### The DevOps Evolution: From Manual Scripts to Cloud-Native Architecture

DevOps is often misunderstood as simply knowing Linux commands. In reality, it is the discipline of managing state, scale, and complexity through automation. This project documents my journey from writing procedural scripts for a single server to architecting a distributed, cloud-native environment on AWS.

#### Level 1: The Fragility of Imperative Scripting

In the first phase, I built a "Startup Monolith." This involved placing Nginx, Node.js, PostgreSQL, and Redis on a single Ubuntu machine. While a Bash script successfully automated the installation, the process was purely imperative—a list of "do this, then do that" commands.

The primary lesson was the lack of **idempotency**. If the script failed halfway through, running it again would often cause errors because it would try to recreate users or modify files that were already changed. It was a functional start, but it was not scalable infrastructure.

#### Level 2: Mastering Declarative Orchestration

Level 2 represented a significant leap in maturity. I moved away from the monolith and split the application into three distinct nodes: a Web Server, a Database Server, and a Cache Server.

By switching to **Ansible**, I transitioned to a declarative philosophy. Instead of writing commands, I defined the desired final state of the system through modular **Roles**.

**Key Technical Achievements in Level 2:**

* **Distributed Security:** I implemented a "Default Deny" UFW policy across the cluster, manually "punching holes" for internal traffic on ports 5432 (Postgres) and 6379 (Redis).
* **Service Binding:** I automated the configuration of `postgresql.conf` and `redis.conf` to allow services to listen on private network interfaces rather than just `localhost`.
* **Runtime Injection:** I solved service discovery by using Ansible's `environment` keyword to inject remote database and cache IPs directly into the Node.js process at startup, keeping the application code portable.

#### Level 3: Immutable Infrastructure with Terraform and AWS

The final stage of this evolution is the migration to **Amazon Web Services (AWS)**. This level introduces the most critical distinction in modern engineering: the separation of **Infrastructure** from **Configuration**.

In this phase, I utilized **Terraform** as the "Architect." Using HCL (HashiCorp Configuration Language), I defined the virtual hardware: a custom VPC, public and private subnets, and EC2 instances. Terraform interacts directly with the AWS API to provision this environment in a repeatable, version-controlled manner.

Once the "hardware" was ready, I leveraged the **Ansible Roles** developed in Level 2 to configure the software. This hybrid approach demonstrates the industry-standard workflow:

1. **Terraform** provisions the network and compute resources (Infrastructure as Code).
2. **Ansible** connects to the live EC2 instances to deploy the application stack (Configuration Management).

#### Conclusion: The Path Forward

The transition from Bash to Terraform represents more than just a change in tools; it is a change in mindset. I have moved from managing a single server to managing an entire ecosystem. This project proves that with the right automation strategy, infrastructure can be treated exactly like code: versioned, tested, and deployed with a single command.