# Storytopia LLM Observability with Datadog

This document explains how the Storytopia backend is instrumented with Datadog’s LLM Observability (LLMObs) SDK. It focuses on what is instrumented, how it is implemented conceptually, and why these choices were made, without using code snippets.

The Storytopia backend is a FastAPI-based service that orchestrates several AI components: a Visionizer that analyzes children’s drawings, a Quest Creator that designs lesson-aligned story arcs, an Illustrator that generates visual scenes, and a Text-to-Speech (TTS) component that narrates the stories. Datadog LLM Observability is used to understand the quality, safety, and reliability of these AI components by attaching rich, semantic evaluations to the traces generated for each request.

## High-Level Architecture of Instrumentation

The integration with Datadog LLM Observability builds on top of standard Datadog tracing. When a user interacts with the Storytopia application, the request flows through the FastAPI server, which is already traced by Datadog. LLM calls, agents, and tools participate in traces through Datadog integrations.

On top of these traces, LLMObs is used to attach external evaluations to the currently active span. These evaluations encode concepts such as whether a drawing is age-appropriate, how well a story aligns with an intended lesson, how consistent the illustrations are, and whether TTS succeeded or failed. Each evaluation is associated with a specific metric name, a numeric score, contextual tags, a pass/fail assessment, and a human-readable reasoning string.

The overall pattern is:

- Identify a meaningful point in the workflow, such as the completion of Visionizer analysis, the end of a Quest Creator run, the evaluation of an illustration, or the success or failure of a TTS call.
- Export the currently active LLM or request span from Datadog’s tracing context.
- Submit an evaluation to LLMObs that attaches to this span and records the metric value and context.
- Ensure that any failures in observability do not affect user-facing behavior.

This design makes it possible to correlate user-level behavior and AI quality metrics inside Datadog, while keeping observability logic separate from core business logic.

## Core Ideas Behind the LLMObs Integration

The Storytopia integration focuses on external evaluations rather than low-level raw signals. Instead of only tracking latency, errors, or token counts, the system records domain-relevant metrics like creativity, lesson alignment, safety flags, and TTS status. These metrics are computed either directly from the AI outputs or by calling an external evaluation system (AgentOps) that analyzes the outputs and produces structured scores and explanations.

Each evaluation is associated with a label that describes what is being measured, such as a creative intent score or an inappropriate content flag. The metric values are normalized scores, typically between zero and one, or binary flags represented as zero or one. Alongside the value, the instrumentation provides a pass/fail assessment derived from configurable thresholds, as well as a textual reasoning field that explains how the value was derived or interpreted.

The evaluations are enriched with tags that describe the context in which they were generated. Tags can include the name of the agent or component, the type of task being performed, which scene of a story is being evaluated, the specific lesson a quest is intended to teach, or which TTS voice was used. These tags are essential for filtering and aggregating metrics in Datadog dashboards and queries.

To ensure stability, all interactions with LLMObs are wrapped in error handling so that issues with observability (for example, connectivity problems with Datadog) never break the main user flows. The system aims for graceful degradation: when observability fails, the request still completes, and users are not exposed to internal failures.

## Visionizer Instrumentation: Safety and Creativity

The Visionizer component is responsible for analyzing children’s drawings. It produces structured analysis data that includes whether the drawing is age-appropriate. This analysis influences whether the drawing is accepted, and it also drives safety and quality metrics in Datadog.

There are two primary evaluations associated with the Visionizer:

- An inappropriate content flag that tracks whether a drawing is considered appropriate or inappropriate for children.
- A creative intent score that captures how well the drawing and its analysis reflect the intended character description and creative goals.

When a Visionizer run fails for any reason, such as tool or model errors, the system still emits an evaluation. In these failure paths, the instrumentation marks the run as inappropriate from a monitoring perspective, assigns a failing value to the inappropriate content metric, and tags the evaluation to indicate that the Visionizer run itself failed. This allows Datadog to capture both the safety implications and the operational reliability of the Visionizer.

On successful runs, the inappropriate content metric is derived from the Visionizer’s assessment of whether the drawing is age-appropriate. Appropriate drawings are recorded with a value indicating safety, while inappropriate ones are recorded with a value indicating a safety failure. The associated assessment is recorded as pass or fail, depending on the age-appropriateness.

In parallel, Storytopia uses AgentOps to compute a creative intent score. The system passes both the structured analysis and the character description to AgentOps, which responds with a numerical score and a textual explanation. This score is then submitted as an external evaluation, tagged as belonging to the Visionizer and the kids’ drawing task. A threshold is used to determine whether the evaluation is considered a pass or a fail, and the explanation from AgentOps is preserved in the reasoning field for later inspection.

## Quest Creator and Illustrator Instrumentation: Lesson Alignment and Consistency

The quest and illustration pipeline introduces two additional quality metrics: lesson alignment and illustration consistency. These metrics are again derived via AgentOps, which evaluates the outputs of the Quest Creator and Illustrator.

The lesson alignment score measures how well the generated quest narrative aligns with a target lesson, such as sharing or kindness. The system passes the generated scenes and the intended lesson to AgentOps, which returns a score and a textual reasoning. This score is recorded as an evaluation attached to the active span, labeled as a lesson alignment metric. The evaluation is tagged with the quest creator agent and with a representation of the lesson being targeted. A relatively strict threshold is used to determine whether the lesson alignment is considered a pass or fail, reflecting the importance of educational quality.

Illustration consistency is evaluated for a specific scene in the story, chosen to represent a key moment where character identity and style should be consistent. AgentOps examines the illustration and returns a score that measures how well the visuals preserve the intended character design and style. This score is recorded as an evaluation labeled for illustrator consistency, tagged with the illustrator agent, the scene being evaluated, and the associated lesson or task context. A high threshold is used here to ensure that only strongly consistent illustrations are considered passes.

These two metrics allow Datadog dashboards to show how well Storytopia’s generated content adheres to its educational goals and visual standards, and help diagnose regressions or issues in specific agents or lesson types.

## Text-to-Speech Instrumentation: Reliability and Voice-Level Behavior

The Text-to-Speech component converts story text into narrated audio using Gemini-based TTS models. It also uploads the generated audio to cloud storage so that the front end can access it.

For observability, the TTS tool reports a status metric whenever it runs. On successful TTS synthesis and upload, the instrumentation records an evaluation indicating a successful status. The recorded metric uses a value that clearly represents success, along with tags that specify that the metric came from the TTS component, which voice was used, and that the status is success. The reasoning field explains that synthesis and upload completed without error.

If the TTS operation fails at any point, for example due to API errors or storage issues, the tool still attempts to record an evaluation that captures this failure. In that case, the metric value reflects a failed status, and the tags indicate that this came from the TTS component with a failure status. The reasoning field includes a description of the error, which may help correlate recurring failure patterns in Datadog. Regardless of whether the evaluation itself succeeds, the TTS tool then raises an error for the calling code to handle, so users see a controlled failure message rather than an obscure internal exception.

The TTS metrics can be broken down by voice, making it possible to see whether certain voices are more prone to failures or performance issues. Over time, this visibility can guide configuration changes or model selection.

## Tracing Hook for Agent Integrations

The Storytopia codebase includes a minimal tracing module that exists primarily to satisfy Datadog’s OpenAI agents integration requirements. This module exposes a trace processor registration function but does not currently apply custom logic to spans.

The purpose of this stub is to allow Datadog’s agent instrumentation to import the expected tracing hooks without error while maintaining a simple behavior profile. At present, Storytopia relies on Datadog’s default tracing behavior and does not customize span processing. However, this module provides a natural extension point for the future, should the team choose to add additional span transformations or enrichments before data is sent to Datadog.

## Design Principles Behind the Instrumentation

Several principles guide how Storytopia uses Datadog LLM Observability:

- The focus is on capturing **semantic, user-focused metrics** rather than only low-level technical signals. Metrics like creative intent, lesson alignment, safety flags, and TTS status better reflect the quality of the user experience.

- Evaluations are always **attached to the appropriate trace or span** so they can be correlated with request paths, upstream and downstream services, and infrastructure behavior. This is achieved by exporting the currently active span and attaching evaluations to it.

- **Rich tagging** is used systematically so that metrics can be filtered and aggregated along dimensions that matter to the product, such as which agent was involved, what task or lesson was being handled, which scene was evaluated, or which TTS voice was used.

- The system defines **clear pass/fail semantics** for each score through explicit thresholds. These thresholds are chosen to reflect the importance of different quality dimensions, such as setting a higher threshold for lesson alignment and illustration consistency.

- Observability is implemented with **graceful degradation**. Whenever an evaluation is submitted, error handling ensures that problems with Datadog or LLMObs do not propagate to end users or break core functionality. Observability is treated as an important but non-critical layer.

## Extending the LLMObs Instrumentation

To extend the existing instrumentation for new agents or features, developers should follow the established patterns:

- Identify new quality, safety, or reliability metrics that are meaningful at the product level, such as coherence of dialogue, toxicity scores, or reranking quality.

- Decide where in the workflow these metrics should be computed, typically at the end of a logical step where all needed outputs are available.

- Compute the metric value, normalize it where appropriate, and define a threshold that maps the metric to a pass/fail assessment.

- Attach the evaluation to the active trace context, providing a clear label, numeric value, relevant tags, an assessment, and a reasoning string that explains the result.

- Wrap all observability logic in robust error handling to maintain graceful degradation.

By following these practices, Storytopia maintains a consistent, interpretable observability layer across all of its LLM-powered features and tools, enabling systematic monitoring, debugging, and improvement of the user experience.

## Running Storytopia with Datadog LLM Observability

To run the Storytopia backend locally with Datadog LLM Observability enabled, set the Datadog environment variables and start the app under the Datadog tracer wrapper:

```bash
export DD_API_KEY=<your_datadog_api_key>
export DD_SITE=us5.datadoghq.com
export DD_LLMOBS_ENABLED=1
export DD_LLMOBS_ML_APP=storytopia-backend
export DD_SERVICE=storytopia-backend
export DD_ENV=dev
export DD_VERSION=0.1.0

cd agents_service
ddtrace-run python main.py
```

After the server starts, open Datadog APM and LLM Observability and confirm that Storytopia traces are present and that evaluations such as creative intent, lesson alignment, inappropriate content flags, and TTS status are attached to requests.

## Traffic Generator: Usage and Expected Datadog Signals

To exercise the full Storytopia flow and trigger LLMObs metrics and alerts (including inappropriate content flags), run the traffic generator against a running backend:

```bash
cd agents_service/traffic_generator
STORYTOPIA_BACKEND_URL=http://localhost:8000 python generate_traffic.py --iterations 5 --sleep 5
```

Place a few PNG or JPEG drawings into the `agents_service/traffic_generator/images` directory before running. As the generator calls `generate-character`, `create-quest`, and `text-to-speech`, you should see evaluations for creative intent, inappropriate content flags, lesson alignment, illustrator consistency, and TTS status appear in your Datadog LLM Observability dashboards and any monitors you have configured.
