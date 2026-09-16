#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  CiteWise AI — Full-stack deploy script
#
#  Usage:  ./deploy.sh [OPTIONS]
#
#  Options:
#    --stage    dev|staging|prod   (default: dev)
#    --region   AWS region         (default: us-east-1)
#    --profile  AWS CLI profile    (default: default)
#    --guided   Interactive first-time deploy
#
#  After deploy, the script writes frontend/.env.local automatically.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

STAGE="dev"
REGION="us-east-1"
PROFILE="default"
GUIDED=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --stage)   STAGE="$2";   shift 2 ;;
    --region)  REGION="$2";  shift 2 ;;
    --profile) PROFILE="$2"; shift 2 ;;
    --guided)  GUIDED=true;  shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

STACK="citewise-ai-${STAGE}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║           CiteWise AI — Deploy                   ║"
echo "║  Stack :  ${STACK}"
echo "║  Region:  ${REGION}"
echo "║  Stage :  ${STAGE}"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Check prerequisites ────────────────────────────────────────────────────────
for cmd in sam aws docker node; do
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "❌  '$cmd' not found. Please install it before deploying."
    exit 1
  }
done

# ── Build Lambda functions and layer ──────────────────────────────────────────
echo "🔨  Building with SAM..."
cd "${SCRIPT_DIR}/backend"
sam build --parallel --cached

# ── Deploy ─────────────────────────────────────────────────────────────────────
if [ "$GUIDED" = true ]; then
  echo "🚀  Running guided deploy (interactive)..."
  sam deploy --guided
else
  echo "🚀  Deploying '${STACK}' to ${REGION}..."
  sam deploy \
    --stack-name   "${STACK}" \
    --region       "${REGION}" \
    --profile      "${PROFILE}" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides "Stage=${STAGE}" \
    --resolve-s3 \
    --no-fail-on-empty-changeset
fi

# ── Retrieve API URL ───────────────────────────────────────────────────────────
echo ""
echo "📋  Fetching stack outputs..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name  "${STACK}" \
  --region      "${REGION}" \
  --profile     "${PROFILE}" \
  --query       "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output      text 2>/dev/null || echo "")

if [ -z "$API_URL" ]; then
  echo "⚠️   Could not read ApiUrl. Check CloudFormation outputs in the AWS Console."
else
  echo "✅  API URL: ${API_URL}"

  ENV_FILE="${SCRIPT_DIR}/frontend/.env.local"
  printf "VITE_API_URL=%s\nVITE_USE_MOCK=false\n" "${API_URL}" > "${ENV_FILE}"
  echo ""
  echo "✅  Written to frontend/.env.local"
fi

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅  Deploy complete!"
echo ""
echo "  Start the frontend:"
echo "    cd frontend && npm install && npm run dev"
echo ""
echo "  Tail Lambda logs:"
echo "    cd backend && make logs-query STAGE=${STAGE}"
echo ""
echo "  Tear down:"
echo "    aws s3 rm s3://citewise-documents-\$(aws sts get-caller-identity --query Account --output text)-${STAGE} --recursive"
echo "    aws cloudformation delete-stack --stack-name ${STACK} --region ${REGION}"
echo "══════════════════════════════════════════════════"
