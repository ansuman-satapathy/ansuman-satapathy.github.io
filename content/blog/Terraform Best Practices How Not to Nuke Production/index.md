---
title: "Terraform Best Practices: How to Not Nuke Production"
date: 2026-01-25T20:30:00+05:30
draft: false
toc: false
categories: ["DevOps", "IaC"]
tags: ["terraform", "sre", "iac", "best practices"]
---

Writing Terraform is easy. Managing Terraform at scale without destroying your company’s infrastructure is hard.

If your idea of "state management" is a file on your laptop named `terraform.tfstate.backup2`, stop. Here are some tips to not embarrass yourself in front of management.

### 1. Remote State is Non-Negotiable

If you work on a team (or ever plan to), your state file cannot live on your local machine.

* **The Problem:** If two people run `terraform apply` at the same time with different local states, you get a race condition that corrupts everything.
* **The Fix:** Use a **Remote Backend** (like AWS S3).
* **The Lock:** Use **DynamoDB** for state locking. This prevents "Person B" from writing to the state while "Person A" is still deploying.

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "my-corp-terraform-state"
    key            = "prod/app-server/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}

```
<img src="fear.png" alt="Fear" style="width: 100%; height: auto; border-radius: 8px;">
*Fig: Actual footage of a DevOps engineer looking at a local state file.*

### 2. Keep it DRY Dummy!

Stop Copy-Pasting resource blocks. If you need 5 web servers, do not write the `aws_instance` block 5 times. Use **Modules**.

A module is just a folder with Terraform files in it. You treat it like a function: you pass inputs (variables), it does work, and returns outputs.

**The Structure:**

```text
.
├── main.tf           # Root module calling the child module
├── modules/
│   └── web_server/   # Reusable module
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf

```

**The Call (in your root `main.tf`):**

```hcl
module "frontend_cluster" {
  source        = "./modules/web_server"
  instance_count = 3
  instance_type  = "t3.micro"
  ami_id         = "ami-0123456789"
}

module "backend_cluster" {
  source        = "./modules/web_server"
  instance_count = 2
  instance_type  = "m5.large" # Different inputs, same code logic
  ami_id         = "ami-0987654321"
}

```

This ensures that if you need to update a security tag or change a monitoring agent, you do it in *one* place (the module), and it propagates everywhere.

### 3. Pin Your Provider Versions

"Latest" is not a version strategy; it’s a gamble.

* **The Problem:** Provider APIs change. If you don't lock the version, a `terraform init` on a new machine might pull a breaking change (Major version update) that creates syntax errors in your perfectly good code.
* **The Fix:** Use the pessimism operator `~>`. It allows patch updates but blocks breaking changes.

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Allows 5.1, 5.2, but blocks 6.0
    }
  }
}

```

### 4. Stop Hardcoding Secrets

If I see an `access_key` or `db_password` committed to Git in plain text, you’re doing it wrong.

* **The Fix:**
1. Use `variables` for secrets with `sensitive = true`.
2. Pass them via environment variables (`TF_VAR_db_password`).
3. Or use a `secrets.tfvars` file and **add it to your `.gitignore**`.



```gitignore
# .gitignore
*.tfstate
*.tfstate.*
*.tfvars
.terraform/

```

### 5. Tag Everything

Untagged resources are "orphan resources."

* **The Problem:** Six months from now, finance will ask, "What is this $500/month NAT Gateway for?" and nobody will know.
* **The Fix:** Use `default_tags` in the AWS provider. It applies tags to *every* resource automatically.

```hcl
provider "aws" {
  region = "ap-south-1"
  default_tags {
    tags = {
      Environment = "Production"
      Owner       = "DevOps-Team"
      ManagedBy   = "Terraform"
    }
  }
}

```

### 6. Format and Validate

Code readability isn't a "nice to have," it's a requirement for code review.

* **The Fix:** Run `terraform fmt -recursive` before you commit. It aligns your equals signs and brackets. It’s the "spellcheck" of IaC.
* **The Check:** Run `terraform validate` to catch syntax errors before you even try to plan.

### Summary

Treat your infrastructure code with the same rigor as your application code. Version it, review it, lock it, modularize it, and for the love of god, don't commit secrets.
