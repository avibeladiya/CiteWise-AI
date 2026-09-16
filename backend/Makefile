# CiteWise AI – Backend Makefile
# Prerequisites: AWS CLI v2, SAM CLI >= 1.100, Python 3.12, Docker (for sam build)

STACK   ?= citewise-ai
STAGE   ?= dev
REGION  ?= us-east-1
PROFILE ?= default

.PHONY: help install build deploy destroy logs test-upload test-query

help:          ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS=":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install:       ## Install Python dev dependencies locally
	pip install boto3 pypdf pytest

build:         ## SAM build (resolves Lambda layers and dependencies)
	sam build --parallel --cached

deploy: build  ## Build + deploy to AWS (interactive first time)
	sam deploy \
	  --stack-name $(STACK)-$(STAGE) \
	  --region $(REGION) \
	  --profile $(PROFILE) \
	  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
	  --parameter-overrides Stage=$(STAGE) \
	  --resolve-s3

deploy-guided: ## First-time interactive deploy (creates samconfig.toml)
	sam deploy --guided

destroy:       ## Tear down the CloudFormation stack
	aws cloudformation delete-stack \
	  --stack-name $(STACK)-$(STAGE) \
	  --region $(REGION) \
	  --profile $(PROFILE)
	@echo "Stack deletion initiated. Monitor in CloudFormation console."

logs-processor: ## Tail document-processor Lambda logs
	sam logs -n DocumentProcessorFunction --stack-name $(STACK)-$(STAGE) --tail

logs-query:    ## Tail query-handler Lambda logs
	sam logs -n QueryHandlerFunction --stack-name $(STACK)-$(STAGE) --tail

outputs:       ## Show CloudFormation stack outputs (API URL etc.)
	aws cloudformation describe-stacks \
	  --stack-name $(STACK)-$(STAGE) \
	  --region $(REGION) \
	  --query "Stacks[0].Outputs" \
	  --output table

# ── Quick smoke tests (requires API_URL env var) ───────────────────────────────
test-upload:   ## Quick smoke test: POST /upload
	@echo "Testing POST /upload ..."
	curl -s -X POST $(API_URL)/upload \
	  -H "Content-Type: application/json" \
	  -d '{"filename":"test.txt","content_type":"text/plain","file_size":1024}' | python -m json.tool

test-docs:     ## Quick smoke test: GET /documents
	@echo "Testing GET /documents ..."
	curl -s $(API_URL)/documents | python -m json.tool

test-query:    ## Quick smoke test: POST /ask (set DOCUMENT_ID env var)
	@echo "Testing POST /ask ..."
	curl -s -X POST $(API_URL)/ask \
	  -H "Content-Type: application/json" \
	  -d '{"question":"What is the main topic?","document_id":"$(DOCUMENT_ID)"}' | python -m json.tool
