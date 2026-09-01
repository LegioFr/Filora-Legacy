# Agent loop sandbox specification

This directory exists only for the autonomous-agent experiment. It is not Filora product code.

The candidate program is `solution.mjs`.

Input: one JSON object on stdin with numeric fields `gross` and `tare`.

Rules:
- `gross` and `tare` must be finite numbers;
- both must be greater than or equal to zero;
- `tare` must not exceed `gross`;
- valid input returns one JSON object `{ "ok": true, "net": <number> }`;
- `net` is `gross - tare`, rounded to two decimal places;
- invalid input returns `{ "ok": false, "error": "INVALID_INPUT" }`;
- no additional stdout output is permitted.

Only `experiments/agent-loop/solution.mjs` is allowed to change in the candidate PR.
