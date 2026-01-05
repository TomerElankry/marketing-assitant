# AI Marketing Assistant — Cost Overview (Short Summary)

This document outlines the primary cost drivers of the system, grouped by category.  
Each section includes a short description of what generates cost and typical considerations.

---

## 1. LLM API Costs (GPT / Gemini / Claude / Grok)
LLM calls are typically the highest cost driver.

- Inference per token (input + output tokens).
- Multi‑model fan‑out (3× in M1+).
- Retries/backoff add token usage.
- Streaming responses increase output size.

**Mitigation:** caching, prompt compression, batching requests.

---

## 2. API Gateway & External API Costs
Includes 3rd‑party services:

- Authentication providers  
- Figma API  
- Market research APIs  
- Email/SMS APIs  

Costs scale with request volume.

---

## 3. Compute Costs (Agents + Orchestrator)

- Containerized agent workloads  
- PDF/Figma rendering tasks  
- Autoscaling clusters  
- Memory use for embeddings and parsing

**Mitigation:** scale‑to‑zero, serverless agents, batching.

---

## 4. Event Bus (NATS)

- Node compute for the cluster  
- Message throughput  
- Replication overhead

Usually low cost but grows with system traffic.

---

## 5. Databases

### a. Postgres
- Jobs  
- Artifacts metadata  
- Agent state  
- Audit logs  

Cost based on storage + IOPS + replication.

### b. Vector Database (Optional)
- Embeddings  
- Retrieval memory  

Can become expensive at scale.

---

## 6. Object Storage (MinIO / S3)

Used for:
- PDFs  
- Figma exports  
- Raw agent output  
- Logs/traces (optional)

Costs:
- Storage GB/month  
- GET/PUT operations  

---

## 7. Observability Costs

- Tracing (Jaeger/Otel collectors)  
- Log storage  
- Metrics (Prometheus/Datadog/etc.)

High log cardinality significantly increases cost.

---

## 8. Networking Costs

- Egress to LLM APIs  
- Inter‑service communication  
- CDN bandwidth (frontend)

Often overlooked; depends on job volume.

---

## 9. Development & Tooling Costs

- CI/CD pipelines  
- GitHub Actions runners  
- Security scanning (Snyk, Prisma, etc.)  
- Artifact scanning tools  

---

# Summary Table

| Cost Type | What Drives Cost | Notes |
|----------|------------------|-------|
| **LLM APIs** | Token usage × #models | Highest cost |
| **External APIs** | Request count | Fixed per-call billing |
| **Compute (Agents)** | CPU/RAM & autoscaling | Includes PDF/Figma generation |
| **Event Bus** | Message volume | Low to moderate |
| **Postgres** | Storage + IOPS | Grows with workloads |
| **Vector DB** | Embedding volume | Expensive at scale |
| **Object Storage** | GB stored + GET/PUT | Lifecycle rules needed |
| **Observability** | Logs/traces/metrics | Can spike costs |
| **Networking** | Egress to LLMs | High‑traffic impact |
| **Dev Tooling** | CI/CD + scanners | Monthly fixed |

