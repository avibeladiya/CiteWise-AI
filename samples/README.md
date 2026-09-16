# Sample Documents

This directory contains sample documents for testing CiteWise AI locally.

## Files

| File | Description | Best test questions |
|------|-------------|---------------------|
| `sample-ml-paper.txt` | Overview of machine learning concepts | "What is gradient descent?", "Explain backpropagation", "What are neural networks?" |
| `sample-financial-report.txt` | Fictional quarterly financial report | "What was the revenue growth?", "What are the risk factors?", "Describe the cloud segment performance" |

## Adding Your Own Test Files

Place any `.pdf` or `.txt` file in this directory and upload it through the UI.

**Tips for good test documents:**
- Documents with 5–15 pages work best for demo purposes
- Documents with clear sections and paragraph structure produce better chunks
- Academic papers, annual reports, and policy documents are ideal

## Notes

- These files are intentionally small and simple (plain text)
- For PDF testing in **mock mode**, any PDF will work — text extraction is simulated
- For PDF testing with **real AWS**, use actual PDF files ≤ 10 MB
