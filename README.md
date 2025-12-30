![Storytopia LLObs Main Screen](https://raw.githubusercontent.com/Harpita-P/Storytopia-LLMObs/0a7d8106ebe6ea066d3419987b15910c8272753e/Storytopia%20LLMobs%20Main.png)

We built a **Datadog-powered observability layer** into our app **Storytopia** using **Datadog’s LLM Observability SDK** to capture rich telemetry on our AI agents. We created a custom Datadog dashboard with multiple widgets to monitor LLM operational insights.  

What makes our approach unique is that we go beyond standard LLM telemetry – such as cost, latency, errors, and request traces – to also stream **custom AI Agent Evaluation telemetry** that reflects how our multi-agent system behaves in production. We stream 5 custom evaluation signals to Datadog to measure **agent quality, safety indicators, and creative consistency** across different user drawings and story inputs.  On top of these signals, we configured custom Datadog alert monitors that trigger when evaluation metrics degrade, with **actionable case context** to quickly investigate and respond to issues.

---
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

We built 5 Datadog monitors directly on top of our custom evaluation signals to detect degradations in AI agent behavior in near real time. Each monitor includes actionable context, such as:
- Clear descriptions of what signal degraded and why it matters  
- Suggested next steps for team members (e.g. reviewing LLM prompts, inspecting recent inputs, testing for false positives in cases of flagged inappropriate content) 

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
- Demo video and GIF examples are **sped up for presentation purposes**.
---
