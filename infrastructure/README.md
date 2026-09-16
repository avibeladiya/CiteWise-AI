# Infrastructure

This directory contains the AWS SAM / CloudFormation infrastructure templates for CiteWise AI.

## Resources Provisioned

| Resource | Type | Purpose |
|----------|------|---------|
| `DocumentsBucket` | S3 Bucket | Private document storage with 7-day lifecycle |
| `DocumentsTable` | DynamoDB Table | Document metadata (PK: `document_id`) |
| `ChunksTable` | DynamoDB Table | Text chunks + embeddings (GSI: `document_id-index`) |
| `CiteWiseApi` | API Gateway HTTP API | REST endpoints with CORS |
| `SharedUtilsLayer` | Lambda Layer | Shared Python utilities (Bedrock clients, chunking) |
| `LambdaRole` | IAM Role | Least-privilege role for all Lambda functions |
| `UploadHandlerFunction` | Lambda | POST /upload |
| `DocumentProcessorFunction` | Lambda | S3-triggered processing |
| `DocumentManagerFunction` | Lambda | GET/DELETE /documents |
| `QueryHandlerFunction` | Lambda | POST /ask (RAG pipeline) |

## Deploy

The main template lives in `../backend/template.yaml`. To deploy:

```bash
cd ../backend
sam build --parallel
sam deploy --guided
```

Or from the repo root:

```bash
./deploy.sh --stage dev
```

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `Stage` | `dev` | Deployment stage (dev/staging/prod) |
| `BedrockRegion` | `us-east-1` | Region where Bedrock models are enabled |
| `CorsOrigin` | `*` | Allowed CORS origin (restrict in production) |
| `MaxPages` | `20` | Maximum PDF pages to process |
| `TopK` | `5` | Chunks retrieved per query |
| `SimilarityThreshold` | `0.25` | Minimum cosine similarity score |
