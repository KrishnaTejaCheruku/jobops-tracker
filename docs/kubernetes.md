# JobOps Tracker Kubernetes Deployment

This document explains how to run JobOps Tracker on a local Kubernetes cluster using raw Kubernetes manifests.

## Current Kubernetes Setup

The local Kubernetes setup uses a 2-node kind cluster:

```text
jobops-local-control-plane
jobops-local-worker
