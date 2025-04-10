import os
from typing import Dict, Any
from docx import Document
from PIL import Image
import pytesseract
import json
from io import BytesIO
import spacy

class InputProcessor:
    def __init__(self):
        self.supported_formats = {
            '.txt': self._process_text,
            '.docx': self._process_docx,
            '.png': self._process_image,
            '.jpg': self._process_image,
            '.jpeg': self._process_image
        }

        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # If the model is not installed, download it
            spacy.cli.download("en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")

    async def process(self, file_path: str) -> Dict[str, Any]:
        """Process input file based on its format."""
        _, ext = os.path.splitext(file_path)
        if ext.lower() not in self.supported_formats:
            raise ValueError(f"Unsupported file format: {ext}")

        processor = self.supported_formats[ext.lower()]
        return await processor(file_path)

    async def _process_text(self, file_path: str) -> Dict[str, Any]:
        """Process plain text files."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {"type": "text", "content": content}

    async def _process_docx(self, file_path: str) -> Dict[str, Any]:
        """Process Word documents."""
        doc = Document(file_path)
        content = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return {"type": "text", "content": content}

    async def _process_image(self, file_path: str) -> Dict[str, Any]:
        """Process images using OCR."""
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return {"type": "text", "content": text}

    def extract_components(self, content: str) -> Dict[str, Any]:
        """Extract key components from processed content."""
        # This is a placeholder for the actual component extraction logic
        # In a real implementation, this would use NLP techniques to identify
        # system components, relationships, and technical details
        return {
            "components": [],
            "relationships": [],
            "data_flows": [],
            "security_boundaries": [],
            "external_integrations": []
        }

    def validate_input(self, processed_data: Dict[str, Any]) -> bool:
        """Validate the processed input data."""
        required_fields = ["type", "content"]
        return all(field in processed_data for field in required_fields)

    def format_for_agents(self, processed_data: Dict[str, Any]) -> str:
        """Format the processed data for agent consumption."""
        components = self.extract_components(processed_data["content"])
        return json.dumps({
            "raw_content": processed_data["content"],
            "extracted_components": components
        }, indent=2)

    def process_image(self, image_data: bytes) -> str:
        """Process an image and extract text from it."""
        try:
            image = Image.open(BytesIO(image_data))
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            raise Exception(f"Error processing image: {str(e)}")

    def process_text(self, text: str) -> dict:
        """Process text input and extract key information."""
        doc = self.nlp(text)
        
        # Extract key information
        entities = {ent.label_: ent.text for ent in doc.ents}
        
        # Basic NLP processing
        sentences = [sent.text.strip() for sent in doc.sents]
        keywords = [token.text for token in doc if token.is_alpha and not token.is_stop]
        
        return {
            "entities": entities,
            "sentences": sentences,
            "keywords": keywords
        } 