#!/bin/bash
# Generate self-signed SSL certificate for local development

CERT_DIR="$(dirname "$0")/../certs"
mkdir -p "$CERT_DIR"

DOMAIN="${1:-localhost}"
openssl req -x509 -newkey rsa:2048 -keyout "$CERT_DIR/key.pem" -out "$CERT_DIR/cert.pem" \
  -days 365 -nodes -subj "/CN=$DOMAIN"

echo "Certificates generated in $CERT_DIR"
