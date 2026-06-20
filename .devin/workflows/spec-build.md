---
description: Read the full spec chain for a feature and implement its tasks. Reads Documentation/[feature]/prd.md, technical-spec.md, implementation-plan.md, and tasks.md.
---

Use the @spec-build skill to start implementing a feature from its specification chain. Provide the feature name, and the skill will read all spec documents and work through the tasks in `tasks.md` one by one.

The skill enforces the spec boundaries: it only implements features listed in the PRD and only uses APIs/contracts defined in the technical spec.

Example: /spec-build payment-gateway
