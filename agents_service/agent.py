"""
Storytopia Root Agent Definition
Main ADK agent orchestration for the multi-agent pipeline
"""

from google.adk.agents import LlmAgent
from agents.visionizer import visionizer_agent

# TODO: Import remaining agents when implemented
# from agents.moderator import moderator_v1_agent, moderator_v2_agent
# from agents.writer import writer_agent
# from agents.animator import animator_agent

# Root agent - currently just wraps visionizer
# Will be expanded to full pipeline: Visionizer → Moderator V1 → Writer → Moderator V2 → Animator
root_agent = LlmAgent(
    name="storytopia_coordinator",
    model="gemini-2.0-flash-exp",
    description="Storytopia AI agent coordinator for creating animated stories from children's drawings",
    instruction="""
    You are the coordinator for the Storytopia multi-agent system.
    
    Current capabilities:
    - Character generation from drawings (Visionizer agent)
    
    Future pipeline:
    1. Visionizer: Analyze drawing and generate character
    2. Moderator V1: Safety check on visual content
    3. Writer: Create story script with life lesson
    4. Moderator V2: Safety check on script
    5. Animator: Generate animated video
    
    For now, you coordinate character generation requests
    """,
    sub_agents=[visionizer_agent]  # Add visionizer as sub-agent
)

# Future full pipeline structure:
# from google.adk.agents import SequentialAgent
# 
# pipeline = SequentialAgent(
#     name="storytopia_pipeline",
#     sub_agents=[
#         visionizer_agent,
#         moderator_v1_agent,
#         writer_agent,
#         moderator_v2_agent,
#         animator_agent
#     ]
# )
#
# root_agent = LlmAgent(
#     name="storytopia_coordinator",
#     model="gemini-2.0-flash-exp",
#     sub_agents=[pipeline]
# )
