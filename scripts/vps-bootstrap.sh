#!/usr/bin/env bash
set -euo pipefail

APP_USER="${APP_USER:-$USER}"
SWAP_SIZE="${SWAP_SIZE:-1G}"

echo "Bootstrapping VPS for JobOps Tracker"
echo "Target user: ${APP_USER}"

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required"
  exit 1
fi

echo "Updating packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo "Installing base packages..."
sudo apt-get install -y \
  ca-certificates \
  curl \
  git \
  ufw \
  htop \
  nano

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sudo sh
else
  echo "Docker already installed."
fi

echo "Enabling Docker..."
sudo systemctl enable docker
sudo systemctl start docker

echo "Adding ${APP_USER} to docker group..."
sudo usermod -aG docker "${APP_USER}"

echo "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

if [ ! -f /swapfile ]; then
  echo "Creating ${SWAP_SIZE} swap file..."
  sudo fallocate -l "${SWAP_SIZE}" /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile

  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
else
  echo "Swap file already exists."
fi

echo "Bootstrap completed."
echo
echo "IMPORTANT:"
echo "Log out and log back in so Docker group membership applies."
echo "Then verify with:"
echo "  docker version"
echo "  docker compose version"
