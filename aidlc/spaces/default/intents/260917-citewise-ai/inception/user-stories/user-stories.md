# User Stories

## US-01 Index a document
As a reviewer, I drop a PDF so I can question it.  
**Acceptance:** Status moves extract → chunk → index → ready. Page and chunk counts appear.

## US-02 Use a sample
As a judge, I click “Index this sample” without bringing a file.  
**Acceptance:** Financial or ML sample becomes ready and workspace opens.

## US-03 Ask with citations
As an analyst, I ask “What was Q3 operating margin?”  
**Acceptance:** Answer mentions 18.4% with `[n]`; sources rail shows the verbatim sentence and page.

## US-04 Audit a claim
As a reviewer, I click `[1]`.  
**Acceptance:** Sources rail highlights that citation.

## US-05 Survive missing LLM
As an operator without a key, I still get a cited extractive answer.  
**Acceptance:** `grounded: true`, citations non-empty or explicit not-found.

## US-06 Deploy
As the author, I deploy web to Vercel and API to Render.  
**Acceptance:** `render.yaml` present; `npm run build` emits Vercel output.
