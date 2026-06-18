# OpenTofu

OpenTofu/Terraform-style infrastructure files live in `infra/opentofu/hetzner`.

## Files

```text
main.tf
outputs.tf
variables.tf
versions.tf
terraform.tfvars.example
.terraform.lock.hcl
```

There is also a local `terraform.tfvars` file in the working tree. Do not commit real secrets or private infrastructure values.

## Purpose

The scaffold targets Hetzner infrastructure provisioning. Treat it as an infrastructure starting point and review all variables, provider settings, and outputs before applying.

## Basic Commands

From `infra/opentofu/hetzner`:

```bash
tofu init
tofu plan -var-file=terraform.tfvars
tofu apply -var-file=terraform.tfvars
```

Use safe placeholder files for documentation and examples. Keep real values outside the repository.
