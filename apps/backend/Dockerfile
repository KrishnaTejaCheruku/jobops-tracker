FROM golang:1.26-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/jobops-api ./cmd/api

FROM alpine:3.21

RUN addgroup -S jobops && adduser -S jobops -G jobops

WORKDIR /app

COPY --from=builder /bin/jobops-api /app/jobops-api

USER jobops

EXPOSE 8000

CMD ["/app/jobops-api"]
