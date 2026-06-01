output "server_name" {
  description = "Created Hetzner server name."
  value       = hcloud_server.jobops.name
}

output "server_ipv4" {
  description = "Public IPv4 address of the server."
  value       = hcloud_server.jobops.ipv4_address
}

output "server_ipv6" {
  description = "Public IPv6 address of the server."
  value       = hcloud_server.jobops.ipv6_address
}

output "ssh_command" {
  description = "SSH command for the server."
  value       = "ssh root@${hcloud_server.jobops.ipv4_address}"
}
