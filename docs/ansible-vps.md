# Ansible VPS Deployment

This guide covers the repository Ansible assets for preparing a VPS.

## Scope

The playbooks are intended to support a Docker Compose deployment with:

- Docker.
- Firewall setup.
- JobOps repository checkout.
- Production environment rendering.

## Inventory

Start from:

```text
infra/ansible/inventory.example.ini
```

Do not commit real VPS hostnames, private IPs, passwords, or private keys.

## Playbooks

Bootstrap:

```bash
ansible-playbook -i infra/ansible/inventory.example.ini infra/ansible/playbooks/bootstrap-vps.yml
```

Deploy Compose:

```bash
ansible-playbook -i infra/ansible/inventory.example.ini infra/ansible/playbooks/deploy-compose.yml
```

Inspect the playbooks and roles before running them against a real server.

## Production Deploy

The runtime deployment path is still documented in [Production deployment](production-deployment.md). Ansible is an automation option, not a replacement for reviewing production secrets and backups.
