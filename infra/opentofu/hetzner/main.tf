locals {
  ssh_public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "hcloud_ssh_key" "jobops" {
  name       = var.ssh_key_name
  public_key = local.ssh_public_key
  labels     = var.labels
}

resource "hcloud_firewall" "jobops" {
  name   = "${var.project_name}-firewall"
  labels = var.labels

  rule {
    description = "Allow SSH"
    direction   = "in"
    protocol    = "tcp"
    port        = "22"
    source_ips  = var.ssh_allowed_ips
  }

  rule {
    description = "Allow HTTP"
    direction   = "in"
    protocol    = "tcp"
    port        = "80"
    source_ips  = ["0.0.0.0/0", "::/0"]
  }

  rule {
    description = "Allow HTTPS"
    direction   = "in"
    protocol    = "tcp"
    port        = "443"
    source_ips  = ["0.0.0.0/0", "::/0"]
  }

  rule {
    description = "Allow ICMP"
    direction   = "in"
    protocol    = "icmp"
    source_ips  = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_server" "jobops" {
  name        = var.server_name
  image       = var.server_image
  server_type = var.server_type
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.jobops.id]
  firewall_ids = [
    hcloud_firewall.jobops.id
  ]

  labels = var.labels

  lifecycle {
    prevent_destroy = true
  }
}
