# Med-Seo-Blog

AI-powered Medical Tourism SEO & Blog Engine — designed for [ThaiTurk / AntiGravity Ventures](https://github.com/Leblepito/Med-UI-Tra) platform.

## Architecture

```
src/
├── agents/
│   ├── llm_provider.py        # Multi-LLM: Gemini / Claude / OpenAI
│   ├── llm_router.py          # Task-based smart LLM routing
│   ├── blog_writer.py         # AI blog content generation
│   ├── seo_optimizer.py       # SEO analysis, scoring, optimization
│   ├── keyword_researcher.py  # Keyword research & expansion
│   ├── schema_generator.py    # Schema.org structured data (JSON-LD)
│   └── orchestrator.py        # Main orchestrator
├── api/endpoints/
│   ├── blog.py                # Blog generation endpoints
│   ├── seo.py                 # SEO analysis endpoints
│   └── content.py             # Content & reference data
├── data/
│   └── medical_keywords.py    # 9 procedures x 5 languages keyword DB
├── models/
│   └── content.py             # Pydantic models
├── config.py
└── main.py                    # FastAPI app (port 8083)
```

## Capabilities

| Feature | Description |
|---------|-------------|
| AI Blog Generation | LLM-powered medical tourism blog posts (800+ words) |
| SEO Scoring | Content analysis with 0-100 score + suggestions |
| Keyword Research | 9 procedures x 5 languages + AI expansion |
| Schema.org | MedicalWebPage, FAQPage, Hospital JSON-LD |
| Meta Tags | Title, OG, Twitter Card generation |
| Sitemap | XML sitemap generation |
| Content Optimization | AI-powered improvement suggestions |
| Keyword Gap Analysis | Competitor keyword gap detection |

## Supported Procedures

Hair Transplant, Dental, Aesthetic/Plastic Surgery, Bariatric, IVF, Ophthalmology, Check-up, Dermatology, Oncology

## Supported Languages

Turkish (TR), English (EN), Russian (RU), Arabic (AR), Thai (TH)

## LLM Routing Strategy

| Task | Primary | Fallback |
|------|---------|----------|
| Blog Writing | Claude (creative) | Gemini Pro → OpenAI |
| SEO Analysis | Gemini Flash (fast) | OpenAI → Claude |
| Keyword Research | Gemini Flash | OpenAI → Claude |
| Content Optimization | Claude | Gemini Pro → OpenAI |

## Quick Start

```bash
cd Med-Seo-Blog
pip install -e .
cp .env.example .env  # Add your API keys
uvicorn src.main:app --reload --port 8083
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check + LLM status |
| GET | `/router-status` | Full system status |
| POST | `/api/blog/generate` | AI blog post generation |
| POST | `/api/blog/full-package` | Blog + SEO + Schema package |
| POST | `/api/seo/keywords/analyze` | Keyword analysis |
| POST | `/api/seo/keywords/expand` | AI keyword expansion |
| GET | `/api/seo/keywords/all` | Full keyword database |
| POST | `/api/seo/keywords/gap` | Competitor gap analysis |
| POST | `/api/seo/score` | Content SEO scoring |
| POST | `/api/seo/optimize` | AI content optimization |
| POST | `/api/seo/meta-tags` | Meta tag generation |
| POST | `/api/seo/sitemap` | XML sitemap generation |
| POST | `/api/seo/schema` | Schema.org generation |
| POST | `/api/content/schema/blog` | Blog schema package |
| POST | `/api/content/schema/json-ld` | JSON-LD script tag |
| GET | `/api/content/schema/hospitals` | Hospital schemas |
| GET | `/api/content/procedures` | Procedure list |
| GET | `/api/content/regions` | Region list |
| GET | `/api/content/hospitals` | Partner hospitals |

## Integration with ThaiTurk

Med-Seo-Blog connects to the ThaiTurk backend via `THAITURK_API_URL` for:
- Syncing partner hospital data
- Pulling procedure pricing for blog content
- Feeding SEO-optimized content back to the frontend

## Tech Stack

- **Framework:** FastAPI + Pydantic v2
- **AI:** Google Gemini, Anthropic Claude, OpenAI (multi-LLM with smart routing)
- **Deploy:** Docker, Railway
- **Languages:** Python 3.12+
