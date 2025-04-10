from typing import Dict, Any, List
import autogen
from .config import AGENT_CONFIG, LLM_CONFIG
from database import SessionLocal
from models import Threat, Mitigation
from schemas import ThreatCreate, MitigationCreate

class AgentManager:
    def __init__(self):
        self.agents = self._initialize_agents()
        self.group_chat = self._create_group_chat()
        self.config_list = LLM_CONFIG["config_list"]

    def _initialize_agents(self) -> Dict[str, autogen.AssistantAgent]:
        """Initialize all agents with their configurations."""
        return {
            name: autogen.AssistantAgent(
                name=name,
                system_message=config["system_message"],
                llm_config=LLM_CONFIG
            )
            for name, config in AGENT_CONFIG.items()
        }

    def _create_group_chat(self) -> autogen.GroupChat:
        """Create a group chat for agent collaboration."""
        return autogen.GroupChat(
            agents=list(self.agents.values()),
            messages=[],
            max_round=10
        )

    async def process_input(self, input_data: str) -> Dict[str, Any]:
        """Process input data through the agent pipeline."""
        # Initialize the conversation
        self.group_chat.reset()
        
        # Step 1: Input Parsing
        parsed_data = await self._run_agent_conversation(
            "input_parser",
            f"Please analyze this input data and extract key components: {input_data}"
        )
        
        # Step 2: Threat Generation
        threats = await self._run_agent_conversation(
            "threat_generator",
            f"Based on this system analysis, identify potential threats: {parsed_data}"
        )
        
        # Step 3: Risk Assessment
        risk_assessments = await self._run_agent_conversation(
            "risk_assessor",
            f"Assess the risks for these identified threats: {threats}"
        )
        
        # Step 4: Mitigation Planning
        mitigations = await self._run_agent_conversation(
            "mitigation_planner",
            f"Develop mitigation strategies for these threats: {risk_assessments}"
        )
        
        return {
            "parsed_data": parsed_data,
            "threats": threats,
            "risk_assessments": risk_assessments,
            "mitigations": mitigations
        }

    async def _run_agent_conversation(
        self, agent_name: str, message: str
    ) -> Dict[str, Any]:
        """Run a conversation with a specific agent."""
        agent = self.agents[agent_name]
        response = await agent.generate_reply(
            messages=[{"role": "user", "content": message}],
            sender=agent
        )
        return response

    async def save_results(
        self, results: Dict[str, Any], user_id: int
    ) -> List[Threat]:
        """Save the analysis results to the database."""
        db = SessionLocal()
        try:
            threats = []
            for threat_data in results["threats"]:
                # Create threat
                threat = ThreatCreate(
                    description=threat_data["description"],
                    classification=threat_data["classification"],
                    status="Open",
                    layer=threat_data["layer"],
                    likelihood=threat_data["likelihood"],
                    impact=threat_data["impact"]
                )
                db_threat = Threat(**threat.dict(), user_id=user_id)
                db.add(db_threat)
                db.commit()
                db.refresh(db_threat)
                
                # Create mitigations
                for mitigation_data in threat_data.get("mitigations", []):
                    mitigation = MitigationCreate(
                        threat_id=db_threat.id,
                        description=mitigation_data["description"],
                        status="Pending"
                    )
                    db_mitigation = Mitigation(**mitigation.dict())
                    db.add(db_mitigation)
                
                threats.append(db_threat)
            
            db.commit()
            return threats
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

    def analyze_input(self, input_data: str) -> list[Threat]:
        # Initialize the agents
        assistant = autogen.AssistantAgent(
            name="assistant",
            llm_config={"config_list": self.config_list}
        )
        
        user_proxy = autogen.UserProxyAgent(
            name="user_proxy",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=10,
            is_termination_msg=lambda x: x.get("content", "").rstrip().endswith("TERMINATE"),
            code_execution_config={"work_dir": "coding"},
            llm_config={"config_list": self.config_list}
        )
        
        # Start the conversation
        user_proxy.initiate_chat(
            assistant,
            message=f"Please analyze this input and identify potential threats according to the MAESTRO framework: {input_data}"
        )
        
        # Process the conversation and extract threats
        # This is a placeholder - you'll need to implement the actual threat extraction logic
        threats = []
        return threats 