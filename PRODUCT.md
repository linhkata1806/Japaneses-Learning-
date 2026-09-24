# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Manabi serves Vietnamese-speaking independent learners studying Japanese and preparing for the JLPT. They practice, revisit mistakes, track progress, and turn their own study documents into AI lesson drafts that they review before use or sharing.

Audience and purpose were confirmed by the product owner during init. Age groups, learner occupations, primary devices, and typical session length are not established.

## Product Purpose

Support independent JLPT study through practice with explanations, saved progress, and personally relevant lessons created from the learner's own materials. The intended learning progression runs from N5 toward N1.

The current product is a beta, not a complete JLPT course or question bank. Do not present planned curriculum coverage or exam readiness as delivered capabilities. No quantified learning outcomes have been established.

## Positioning

Manabi combines Vietnamese-language JLPT practice and progress tracking with a document-to-lesson workflow: private upload, consent to AI processing, draft generation, learner review and editing, then a choice of private use, link sharing, or moderated public publication.

This is the confirmed product mechanism, not a claim of market exclusivity or official JLPT affiliation.

## Operating Context

- Practice at `/learn`: answer a question, check the answer, read its Vietnamese explanation, and retry. Signing in enables stored history for the built-in sample and access to progress statistics and mistake review.
- Personal materials at `/documents`: upload a source document, consent to processing, generate a draft, inspect and edit its content and source references, then confirm it and choose visibility.
- Community learning at `/library` and `/lesson/[id]`: browse approved lessons and work through their questions. Shared lessons use `/share/[token]`; recipients must sign in.
- Publication review at `/admin`: authorized administrators compare a submitted lesson with its source, approve it, or reject it with a reason.
- Content transparency at `/sources`: explain source provenance and distinguish beta samples from reviewed or official material.

## Capabilities and Constraints

### Confirmed durable requirements

- Preserve Vietnamese-language learning support alongside Japanese study content.
- Uploaded source documents start private. Obtain learner consent before sending document content to the AI provider.
- Generated material remains a draft until the learner reviews and confirms it. Learner confirmation is not teacher verification or a guarantee of correctness.
- Public publication requires administrator approval in addition to learner confirmation. Preserve distinct private, link-sharing, and public visibility states.
- Preserve sequential N5-to-N1 progression. The documented intended unlock rule requires completion of the mandatory learning path and a passing estimated end-level exam result, including overall and section thresholds. Estimated practice results must not be represented as official JLPT scores.
- Preserve content sourcing and attribution requirements. Do not treat linked references or unreviewed community examples as a verified question bank.

The product owner confirmed these requirements and supplied no additional constraints during init.

### Current implementation boundaries

These facts were inspected in repository code; a deployed environment was not verified during init.

- The built-in practice flow contains one developer-authored N5 sample. It is not teacher-reviewed and is not an official JLPT question. N4–N1 built-in practice remains locked because the prerequisite curriculum and final exams do not exist yet.
- Signed-in sample attempts feed answer history, accuracy, XP, daily streaks, and mistake review. Generated and shared lesson quizzes currently retain quiz state locally; they do not contribute to the same saved-attempt history.
- Personal uploads accept PDF, DOCX, and TXT files up to 2 MB. Gemini generation is enabled only when configured, with up to three successful generations per account per Vietnam calendar day. The interface discloses provider data-use considerations before consent.
- AI drafts contain editable summaries, multiple-choice questions, answers, explanations, and source references. Generated lessons may carry N5–N1 labels even while higher-level built-in practice is locked; these labels do not unlock the curriculum.
- ChatGPT sign-in is provided by the hosted Sites environment; local portable development simulates it. Google uses direct OAuth with verified email and stable subject mapping in D1. Verified matching email identities can share progress; unverified email must not link accounts.
- The existing implementation uses React with Next.js App Router conventions through Vinext/Vite, Cloudflare Workers, D1, and Drizzle. File upload remains temporarily unavailable. The documented local command is `npm run dev`, serving port 5173. See `README.md` for runtime configuration and prerequisites.

### Open decisions

- The complete curriculum, end-level exam content, personal study planning, and rollout beyond the beta remain unfinished.
- Specific accessibility targets, learner subsegments, usage environments, and measurable learning-success criteria have not been agreed. Do not infer these from the beta interface.

## Brand Commitments

The product name is **Manabi**. Its confirmed language context is Vietnamese guidance with Japanese learning material. Preserve clear distinctions between a sample question, an AI draft, a learner-confirmed lesson, and an administrator-approved public lesson.

No new visual direction or additional brand-voice commitment was established during init.

## Evidence on Hand

- `README.md`: beta scope, intended progression, local operation, account behavior, and AI consent/quota notes.
- `app/layout.tsx` and `public/favicon.svg`: existing product name, Vietnamese document language, and identity asset.
- `app/learn/page.tsx`, `app/api/attempts/route.ts`, and `app/api/stats/route.ts`: built-in N5 practice, feedback, and persisted progress behavior.
- `app/documents/page.tsx`, `app/api/documents/`, and `lib/generated-content.ts`: upload, AI drafting, editing, confirmation, and visibility workflow.
- `components/lesson-view.tsx`, `app/api/library/route.ts`, `app/api/share/[token]/route.ts`, and `app/api/admin/reviews/`: generated lesson experience, access rules, and public moderation.
- `app/sources/page.tsx` and `app/api/examples/route.ts`: Tatoeba examples with source links, author, and license information. These support further reading and are not automatically validated questions or explanations.
- OpenJLPT is documented as a source under evaluation, not imported content. Official JLPT samples are linked for reference; links are not permission to reproduce their questions or audio.

No evidence of teacher endorsement, guaranteed results, official affiliation, testimonials, or a complete exam bank was established. Future work must not invent these claims.

## Product Principles

1. Help learners understand and revisit mistakes through explanations and accurate progress records.
2. Keep learners in control of their documents, AI processing consent, and lesson visibility.
3. Treat AI output as reviewable draft material; preserve human review and public moderation.
4. Make learning progression meaningful while stating beta limits and the estimated nature of practice scores honestly.
5. Keep learning content traceable to its sources and distinguish authored, generated, community, and official reference material.
