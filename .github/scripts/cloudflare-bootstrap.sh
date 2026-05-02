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
if ! npx wrangler pages project list 2>/dev/null | grep -Fq "$CLOUDFLARE_PAGES_PROJECT"; then
  npx wrangler pages project create "$CLOUDFLARE_PAGES_PROJECT" --production-branch=main || true
fi

resolve_d1_id() {
  local id=""

  # Try JSON first (newer wrangler)
  if out_json="$(npx wrangler d1 list --json 2>/dev/null)"; then
    id="$(printf "%s" "$out_json" | jq -r --arg n "$CLOUDFLARE_D1_DB_NAME" '.[] | select(.name == $n) | .uuid' | head -n1 || true)"
  fi

  # Fallback: parse table output
  if [ -z "${id:-}" ] || [ "$id" = "null" ]; then
    id="$(npx wrangler d1 list 2>/dev/null | grep -F "$CLOUDFLARE_D1_DB_NAME" | grep -Eo '([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})' | head -n1 || true)"
  fi

  printf "%s" "$id"
}

echo "Checking D1 database..."
D1_ID="$(resolve_d1_id)"
if [ -z "$D1_ID" ] || [ "$D1_ID" = "null" ]; then
  create_out="$(npx wrangler d1 create "$CLOUDFLARE_D1_DB_NAME" 2>&1 || true)"
  echo "$create_out"

  # If it already exists, resolve again; else parse from create output
  if echo "$create_out" | grep -qi "already exists"; then
    D1_ID="$(resolve_d1_id)"
  else
    D1_ID="$(printf "%s" "$create_out" | grep -Eo '([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})' | head -n1 || true)"
  fi
fi

if [ -z "$D1_ID" ] || [ "$D1_ID" = "null" ]; then
  echo "Failed to resolve D1 database id" >&2
  exit 1
fi

echo "Checking R2 bucket..."
if ! npx wrangler r2 bucket list 2>/dev/null | grep -Fxq "$CLOUDFLARE_R2_BUCKET"; then
  r2_create_out="$(npx wrangler r2 bucket create "$CLOUDFLARE_R2_BUCKET" 2>&1 || true)"
  echo "$r2_create_out"
  if echo "$r2_create_out" | grep -qi "already exists"; then
    echo "R2 bucket already exists, continuing."
  elif echo "$r2_create_out" | grep -qi "Successfully created"; then
    echo "R2 bucket created."
  else
    echo "Failed to create or validate R2 bucket." >&2
    exit 1
  fi
fi

echo "Patching wrangler.toml with resolved resource identifiers..."
sed -i "s/database_name = \"dentalsim-db\"/database_name = \"${CLOUDFLARE_D1_DB_NAME}\"/" wrangler.toml
sed -i "s/database_id = \"REPLACE_WITH_D1_DATABASE_ID\"/database_id = \"${D1_ID}\"/" wrangler.toml
sed -i "s/bucket_name = \"dentalsim-images\"/bucket_name = \"${CLOUDFLARE_R2_BUCKET}\"/" wrangler.toml

echo "Applying D1 schema migration..."
npx wrangler d1 execute "$CLOUDFLARE_D1_DB_NAME" --remote --file ./server/db/schema.sql

echo "D1_DATABASE_ID=$D1_ID" >> "$GITHUB_ENV"
echo "Resolved D1 id and provisioned resources."
