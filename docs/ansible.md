# Ansible

Ansible assets live in `infra/ansible`.

## Files

```text
infra/ansible/ansible.cfg
infra/ansible/inventory.example.ini
infra/ansible/playbooks/bootstrap-vps.yml
infra/ansible/playbooks/deploy-compose.yml
infra/ansible/roles/docker/tasks/main.yml
infra/ansible/roles/firewall/tasks/main.yml
infra/ansible/roles/jobops/tasks/main.yml
infra/ansible/roles/jobops/templates/env.production.j2
```

## Purpose

The Ansible setup prepares a VPS for Docker Compose deployment and can render a production environment file from safe variables.

Copy `inventory.example.ini` before use. Do not commit real host secrets or private inventory values.

## Related Guide

See [Ansible VPS deployment](ansible-vps.md).
