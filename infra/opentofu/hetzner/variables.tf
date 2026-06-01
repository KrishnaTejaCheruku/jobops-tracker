variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
  default     = "jobops-tracker"
}

variable "server_name" {
  description = "Hetzner server name."
  type        = string
  default     = "jobops-vps"
}

variable "server_type" {
  description = "Hetzner Cloud server type."
  type        = string
  default     = "cx23"
}

variable "server_image" {
  description = "Server operating system image."
  type        = string
  default     = "ubuntu-24.04"
}

variable "location" {
  description = "Hetzner location. nbg1 = Nuremberg, fsn1 = Falkenstein, hel1 = Helsinki."
  type        = string
  default     = "nbg1"
}

variable "ssh_key_name" {
  description = "Name of the SSH key stored in Hetzner Cloud."
  type        = string
  default     = "jobops-macbook"
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key used for server login."
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "ssh_allowed_ips" {
  description = "CIDR ranges allowed to SSH into the VPS. Restrict this later to your own IP."
  type        = list(string)
  default     = ["0.0.0.0/0", "::/0"]
}

variable "labels" {
  description = "Common labels for Hetzner resources."
  type        = map(string)
  default = {
    app        = "jobops-tracker"
    managed_by = "opentofu"
    env        = "production"
  }
}
