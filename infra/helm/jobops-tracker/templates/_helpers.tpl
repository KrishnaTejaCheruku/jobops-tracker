{{- define "jobops-tracker.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "jobops-tracker.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "jobops-tracker.labels" -}}
app.kubernetes.io/name: {{ include "jobops-tracker.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{- end -}}

{{- define "jobops-tracker.backendName" -}}
{{ include "jobops-tracker.fullname" . }}-backend
{{- end -}}

{{- define "jobops-tracker.frontendName" -}}
{{ include "jobops-tracker.fullname" . }}-frontend
{{- end -}}

{{- define "jobops-tracker.postgresName" -}}
{{ include "jobops-tracker.fullname" . }}-postgres
{{- end -}}

{{- define "jobops-tracker.caddyName" -}}
{{ include "jobops-tracker.fullname" . }}-caddy
{{- end -}}

{{- define "jobops-tracker.postgresSecretName" -}}
{{ include "jobops-tracker.fullname" . }}-postgres-secret
{{- end -}}

{{- define "jobops-tracker.backendConfigName" -}}
{{ include "jobops-tracker.fullname" . }}-backend-config
{{- end -}}

{{- define "jobops-tracker.caddyConfigName" -}}
{{ include "jobops-tracker.fullname" . }}-caddy-config
{{- end -}}

{{- define "jobops-tracker.migrationsConfigName" -}}
{{ include "jobops-tracker.fullname" . }}-migrations
{{- end -}}
