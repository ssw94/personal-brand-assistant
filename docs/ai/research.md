# Research Boundary

Research is an optional, reviewable context source. Retrieved material is untrusted data and is never treated as an instruction or as a Professional Memory fact.

The current boundary accepts only explicitly supplied HTTPS URLs whose hosts are configured through the server-only `RESEARCH_ALLOWED_HOSTS` setting. Credentials, custom ports, redirects, private/loopback DNS targets, non-text responses, and oversized responses are rejected. When no approved provider or URL is available, the API returns an explicit `UNAVAILABLE` run rather than fake or empty research.

Each run is user-owned and records source hashes, fetch freshness, safety classification, and citations. `PROMPT_INJECTION_SUSPECTED` sources remain visible as unsafe data and must not be passed to an agent without an explicit safety-aware context assembler.

Future provider integrations must implement the same contract, preserve citations, use bounded timeouts, and remain behind the ModelGateway for any summarization or structured extraction.
