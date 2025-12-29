"""Stub tracing module for Datadog openai_agents integration.

The ddtrace openai_agents integration expects an `agents.tracing` module with
an `add_trace_processor` hook. For the Storytopia backend we don't currently
need custom processors for OpenAI agents, so this provides a minimal no-op
implementation to satisfy the integration and avoid import errors.
"""

from typing import Callable, Any


def add_trace_processor(processor: Callable[[Any], Any]) -> None:
    """Register a trace processor.

    This stub accepts the processor callable but does not apply it anywhere.
    It exists solely to satisfy the ddtrace integration import.
    """
    # No-op implementation for now.
    return
