#!/usr/bin/env bash
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?Missing CLOUDFLARE_API_TOKEN}"
: "${CLOUDFLARE_ACCOUNT_ID:?Missing CLOUDFLARE_ACCOUNT_ID}"
: "${CLOUDFLARE_PAGES_PROJECT:?Missing CLOUDFLARE_PAGES_PROJECT}"
: "${CLOUDFLARE_D1_DB_NAME:?Missing CLOUDFLARE_D1_DB_NAME}"
: "${CLOUDFLARE_R2_BUCKET:?Missing CLOUDFLARE_R2_BUCKET}"

export CLOUDFLARE_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID

echo "Checking Pages project..."
if ! npx wrangler pages project list --json | jq -e --arg p "$CLOUDFLARE_PAGES_PROJECT" '.[] | select(.name == $p)' > /dev/null; then
  npx wrangler pages project create "$CLOUDFLARE_PAGES_PROJECT" --production-branch=main
fi

echo "Checking D1 database..."
D1_ID="$(npx wrangler d1 list --json | jq -r --arg n "$CLOUDFLARE_D1_DB_NAME" '.[] | select(.name == $n) | .uuid' | head -n1)"
if [ -z "$D1_ID" ] || [ "$D1_ID" = "null" ]; then
  npx wrangler d1 create "$CLOUDFLARE_D1_DB_NAME" > /tmp/d1_create.txt
  D1_ID="$(grep -Eo '([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})' /tmp/d1_create.txt | head -n1)"
fi

if [ -z "$D1_ID" ] || [ "$D1_ID" = "null" ]; then
  echo "Failed to resolve D1 database id" >&2
  exit 1
fi

echo "Checking R2 bucket..."
if ! npx wrangler r2 bucket list --json | jq -e --arg b "$CLOUDFLARE_R2_BUCKET" '.[] | select(.name == $b)' > /dev/null; then
  npx wrangler r2 bucket create "$CLOUDFLARE_R2_BUCKET"
fi

echo "Applying D1 schema migration..."
npx wrangler d1 execute "$CLOUDFLARE_D1_DB_NAME" --remote --file ./server/db/schema.sql

echo "D1_DATABASE_ID=$D1_ID" >> "$GITHUB_ENV"
echo "Resolved D1 id and provisioned resources."
