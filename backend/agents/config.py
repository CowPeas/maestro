import os
from dotenv import load_dotenv
from typing import Dict, Any

load_dotenv()

# LLM Configuration
LLM_CONFIG = {
    "config_list": [
        {
            "model": "gpt-4-turbo-preview",
            "api_key": os.getenv("OPENAI_API_KEY"),
            "base_url": "https://api.openai.com/v1",
            "api_type": "openai"
        }
    ],
    "temperature": 0.7,
    "timeout": 600,
}

# Agent System Messages
SYSTEM_MESSAGES = {
    "input_parser": """You are an Input Parser Agent specialized in analyzing system architecture diagrams, 
    documents, and product descriptions. Your task is to extract key components, relationships, and technical 
    details from the input data. Focus on identifying:
    1. System components and their interactions
    2. Data flows and dependencies
    3. Security boundaries and trust zones
    4. External integrations and APIs
    5. Authentication and authorization mechanisms
    Format your output as structured JSON.""",

    "threat_generator": """You are a Threat Generator Agent specialized in identifying potential threats 
    based on the MAESTRO framework's seven layers. For each identified component or interaction, analyze:
    1. Foundation Models: Model vulnerabilities, training data issues, prompt injection
    2. Data Operations: Data leakage, poisoning, privacy concerns
    3. Agent Frameworks: API security, authentication flaws, rate limiting
    4. Deployment: Infrastructure security, network vulnerabilities
    5. Evaluation: Monitoring gaps, logging issues
    6. Security: Compliance gaps, access control issues
    7. Ecosystem: Multi-agent interaction risks, coordination failures
    Provide detailed threat descriptions with potential impact.""",

    "risk_assessor": """You are a Risk Assessor Agent responsible for evaluating identified threats. 
    For each threat, assess:
    1. Likelihood (1-5): Probability of occurrence
    2. Impact (1-5): Potential damage or consequences
    3. Classification: High/Medium/Low based on likelihood × impact
    4. Urgency: Immediate/Short-term/Long-term
    Provide clear justification for your assessments.""",

    "mitigation_planner": """You are a Mitigation Planner Agent focused on developing actionable 
    mitigation strategies. For each threat, propose:
    1. Short-term fixes
    2. Long-term solutions
    3. Required resources
    4. Implementation timeline
    5. Success metrics
    Ensure recommendations are practical and aligned with industry best practices."""
}

# Agent Configuration
AGENT_CONFIG: Dict[str, Any] = {
    "input_parser": {
        "name": "input_parser",
        "system_message": SYSTEM_MESSAGES["input_parser"],
        "llm_config": LLM_CONFIG,
    },
    "threat_generator": {
        "name": "threat_generator",
        "system_message": SYSTEM_MESSAGES["threat_generator"],
        "llm_config": LLM_CONFIG,
    },
    "risk_assessor": {
        "name": "risk_assessor",
        "system_message": SYSTEM_MESSAGES["risk_assessor"],
        "llm_config": LLM_CONFIG,
    },
    "mitigation_planner": {
        "name": "mitigation_planner",
        "system_message": SYSTEM_MESSAGES["mitigation_planner"],
        "llm_config": LLM_CONFIG,
    }
} 