![Storytopia LLM Observability Banner](https://raw.githubusercontent.com/Harpita-P/Storytopia-LLMObs/5114a5aaa49093debd250772204cf2c492c6d65a/Github-Banner.png)

We built a **Datadog-powered observability layer** into our existing app **Storytopia** using **Datadog’s LLM Observability SDK** to capture rich telemetry on our AI agents. To learn more about how the Storytopia app works, **watch our demo video** - https://youtu.be/BhiitgdIuEI?si=FYKTivFRG2D_bhGR


What makes our observability approach unique is that we go beyond standard LLM telemetry – such as cost, latency, errors, and request traces – to also stream **custom AI Agent Evaluation telemetry** that reflects how our multi-agent system behaves in production. We stream 5 custom evaluation signals to Datadog to measure **agent quality, safety indicators, and creative consistency** across different user drawings and story inputs.  On top of these signals, we configured custom Datadog alert monitors that trigger when evaluation metrics degrade, with actionable case context to quickly investigate and respond to issues. We created a custom Datadog dashboard with multiple widgets to monitor LLM operational insights.  

---
🔗 **View Storytopia's Datadog Dashboard**  
https://p.us5.datadoghq.com/sb/c7d3a3fb-e381-11f0-84dd-828a698ac737-4c196bb0c4c7eefb0add01f19bff8a5f

Organization Name: LayerZero

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
----
## Traffic Generator: Usage and Expected Datadog Signals

To trigger LLMObs metrics and alerts (including inappropriate content flags), run our traffic generator against a running backend:

```bash
cd agents_service/traffic_generator
STORYTOPIA_BACKEND_URL=http://localhost:8000 python generate_traffic.py --iterations 5 --sleep 5
```
We have placed a few sample drawings into the `agents_service/traffic_generator/images` directory to simulate user inputs - Take a look at them. Some of these drawings include prompt injection attempts of harmful content that will trigger the Datadog alert monitor. As the generator calls `generate-character`, `create-quest`, and `text-to-speech`, you should see an alert for a spike in innapropriate content, and evaluations for creative intent, lesson alignment, illustrator consistency appear in the Datadog LLM Observability dashboard.

-----

## Instrumentation and Tracing
We instrumented the Storytopia backend using Datadog’s LLM Observability SDK alongside Datadog’s Python tracing library (ddtrace) to establish end-to-end visibility across our FastAPI service. Every user request is traced as it flows through API handling, multi-agent orchestration, LLM calls, and tool executions, providing a complete view of application behavior. 

![Storytopia LLM Metrics Dashboard](https://raw.githubusercontent.com/Harpita-P/Storytopia-LLMObs/cb6863aeedef2a33afd82ca051eb9c1abe33d7ec/Dashboard-LLM-Metrics.gif)

We were able to capture & stream to our dashboard:
- LLM request latency, token counts, and error rates  
- LLM call timing and cost signals (Computing average cost per story created)
- End-to-end traces spanning our 3 AI agents (Visionizer, Quest Creator and Illustrator agents) with insights on prompt inputs, outputs, failure cases, etc. 

## Our Strategy: 5 Custom LLM Evaluation Signals for Smarter Agent Monitoring

As an innovative component, we designed 5 **custom, externally computed LLM evaluation signals** that capture how our AI agents perform beyond traditional system metrics. These evaluations are computed by invoking an external evaluation system (AgentOps), which analyzes our agent outputs and returns structured scores with human-readable explanations. These evaluations are attached to active trace spans using Datadog’s LLM Observability SDK and streamed as **first-class telemetry** into Datadog.

Each evaluation is defined by:
- A clear label describing what is being measured  
- A normalized metric value (typically a score between 0 and 1, or a binary 0/1 flag)  
- A pass/fail assessment derived from configurable thresholds  
- Contextual metadata tying the evaluation back to a specific agent, task, and user interaction  

![Rationale for Custom Evaluation Metrics](https://raw.githubusercontent.com/Harpita-P/Storytopia-LLMObs/0aceb4dafcbfcaec1cee9d7559ef2dd366c9ac83/Rationale-Custom-EvalMetrics.png)

By correlating these 5 unique signals – **Creative Intent, Inappropriate Content, Lesson Alignment, Visual Consistency, and Story Narration Status** – with request traces, we can monitor silent quality and safety failures, understand where specific agents struggle in our Multi-Agent pipeline.

## Custom Alert Monitors with Actionable Context

We built **7 custom Datadog alert monitors** directly on top of Storytopia’s LLM evaluation signals to detect degradations in AI agent behavior in near real time. Each monitor encodes a clear behavioral expectation for our agents and pairs detection with concrete response guidance.

**Criteria for Each of Our Detection Rules**

| Monitor Name | Detection Criteria | Purpose / Impact |
|-------------|-------------------|------------------|
| **Inappropriate Content Detection Spike** | Avg `inappropriate_content_flag` ≥ **0.6** over 5 minutes | Surfaces Visionizer safety failures, false positives, or prompt abuse early to protect child safety |
| **Lesson Prompt Drift Detection** | Avg `lesson_alignment_score` < **0.6** over 5 minutes | Ensures agents remain aligned with educational objectives, not just creative output |
| **Character Visual Consistency Degradation** | Avg `illustrator_consistency` < **0.7** over 5 minutes | Catches character identity drift across scenes to preserve narrative continuity |
| **Story Voice (TTS) Agent Failure** | `tts_status` success rate < **50%** | Detects narration failures caused by TTS errors, quota exhaustion, or queue issues |
| **Character Description Quality Regression** | Avg `creative_intent_score` < **0.5** over 5 minutes | Flags low-fidelity character descriptions that reduce immersion and visual grounding |
| **Average Cost Per Story Spike** | Computed cost per story > **$1.80** (rolling 5 minutes) | Prevents budget overruns from token bloat, agent loops, or unintended model upgrades |
| **LLM Response Latency Spike** | Avg LLM span duration > **18s** | Catches performance regressions that degrade the real-time storytelling experience |

![Alert Monitors in Datadog](https://raw.githubusercontent.com/Harpita-P/Storytopia-LLMObs/37805b9701d95cfe44f11843a752d96c3980452b/AlertMonitors.gif)

This allows us to respond to any issues quickly and precisely, turning observability insights into concrete fixes & improvements.
![Alert Monitors in Datadog](https://raw.githubusercontent.com/Harpita-P/Storytopia-LLMObs/37805b9701d95cfe44f11843a752d96c3980452b/AlertMonitors.gif)

------
## Try Storytopia Live

You can access the hosted version of **Storytopia** here:  
[Open Storytopia Web App](https://storytopia-frontend-700174635185.us-central1.run.app)

> **Best viewed on:** Desktop or iPad (mobile layout not yet fully optimized).  
> If the screen appears zoomed in, try adjusting the zoom level to around **67%** (or to your preference).

### Runtime Notes  
- Character generation: ~15 seconds  
- Quest generation: ~2.5 minutes  
  _(Actual times may vary depending on model loads and network conditions.)_  
---
