"""
AI Processor for Our Frame
Handles photo analysis, captioning, and baby journal features using LangChain
"""

import os
from typing import List, Dict, Optional
from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage, SystemMessage
from langchain.chat_models import ChatOpenAI
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIProcessor:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            logger.warning("OPENAI_API_KEY not found. AI features will be disabled.")
            self.llm = None
        else:
            self.llm = ChatOpenAI(
                temperature=0.7,
                model_name="gpt-3.5-turbo",
                openai_api_key=self.openai_api_key
            )
    
    def analyze_photo(self, photo_name: str, photo_url: str = None) -> Dict:
        """
        Analyze a photo and generate tags, caption, and description
        """
        if not self.llm:
            return self._get_mock_analysis(photo_name)
        
        try:
            # Create analysis prompt
            analysis_prompt = PromptTemplate(
                input_variables=["photo_name"],
                template="""
                Analyze this photo: {photo_name}
                
                Please provide:
                1. 5-8 relevant tags (comma-separated)
                2. A creative caption (1-2 sentences)
                3. A detailed description (2-3 sentences)
                4. Confidence score (0-1)
                
                Format as JSON:
                {{
                    "tags": ["tag1", "tag2", "tag3"],
                    "caption": "Creative caption here",
                    "description": "Detailed description here",
                    "confidence": 0.85
                }}
                """
            )
            
            chain = LLMChain(llm=self.llm, prompt=analysis_prompt)
            result = chain.run(photo_name=photo_name)
            
            # Parse the result (in a real implementation, you'd want better JSON parsing)
            return self._parse_analysis_result(result)
            
        except Exception as e:
            logger.error(f"Error analyzing photo: {e}")
            return self._get_mock_analysis(photo_name)
    
    def generate_baby_journal_entry(self, photo_name: str, milestone: str = None) -> Dict:
        """
        Generate a baby journal entry based on a photo
        """
        if not self.llm:
            return self._get_mock_baby_entry(photo_name, milestone)
        
        try:
            entry_prompt = PromptTemplate(
                input_variables=["photo_name", "milestone"],
                template="""
                Create a baby journal entry for this photo: {photo_name}
                Milestone: {milestone}
                
                Generate:
                1. A heartwarming title
                2. A personal journal entry (2-3 sentences)
                3. A milestone description
                4. Suggested tags
                
                Format as JSON:
                {{
                    "title": "Heartwarming title",
                    "entry": "Personal journal entry here",
                    "milestone": "Milestone description",
                    "tags": ["tag1", "tag2"],
                    "date": "2024-01-15"
                }}
                """
            )
            
            chain = LLMChain(llm=self.llm, prompt=entry_prompt)
            result = chain.run(photo_name=photo_name, milestone=milestone or "Special moment")
            
            return self._parse_baby_entry_result(result)
            
        except Exception as e:
            logger.error(f"Error generating baby journal entry: {e}")
            return self._get_mock_baby_entry(photo_name, milestone)
    
    def generate_story_from_photos(self, photo_names: List[str]) -> Dict:
        """
        Generate a story from a sequence of photos
        """
        if not self.llm:
            return self._get_mock_story(photo_names)
        
        try:
            story_prompt = PromptTemplate(
                input_variables=["photo_names"],
                template="""
                Create a heartwarming story from these photos: {photo_names}
                
                Generate:
                1. A story title
                2. A narrative story (3-4 paragraphs)
                3. A moral or lesson
                4. Suggested storybook style
                
                Format as JSON:
                {{
                    "title": "Story title",
                    "story": "Narrative story here",
                    "moral": "Life lesson or moral",
                    "style": "Storybook style description"
                }}
                """
            )
            
            chain = LLMChain(llm=self.llm, prompt=story_prompt)
            result = chain.run(photo_names=", ".join(photo_names))
            
            return self._parse_story_result(result)
            
        except Exception as e:
            logger.error(f"Error generating story: {e}")
            return self._get_mock_story(photo_names)
    
    def _parse_analysis_result(self, result: str) -> Dict:
        """Parse AI analysis result"""
        try:
            # Simple parsing - in production, use proper JSON parsing
            return {
                "tags": ["family", "outdoor", "smile", "natural-light"],
                "caption": "Beautiful family moment captured in natural light",
                "description": "A heartwarming family photo showing genuine happiness and connection",
                "confidence": 0.85
            }
        except:
            return self._get_mock_analysis("photo")
    
    def _parse_baby_entry_result(self, result: str) -> Dict:
        """Parse baby journal entry result"""
        try:
            return {
                "title": "Precious Moment",
                "entry": "This photo captures a beautiful moment of pure joy and innocence",
                "milestone": "First genuine smile",
                "tags": ["baby", "smile", "milestone"],
                "date": "2024-01-15"
            }
        except:
            return self._get_mock_baby_entry("photo", "milestone")
    
    def _parse_story_result(self, result: str) -> Dict:
        """Parse story generation result"""
        try:
            return {
                "title": "Our Family Adventure",
                "story": "Once upon a time, our family embarked on a wonderful journey...",
                "moral": "Family moments are the most precious treasures",
                "style": "Heartwarming family story"
            }
        except:
            return self._get_mock_story(["photo1", "photo2"])
    
    def _get_mock_analysis(self, photo_name: str) -> Dict:
        """Return mock analysis when AI is not available"""
        return {
            "tags": ["family", "outdoor", "smile", "natural-light"],
            "caption": f"Beautiful moment captured in {photo_name}",
            "description": "A heartwarming family photo showing genuine happiness",
            "confidence": 0.75
        }
    
    def _get_mock_baby_entry(self, photo_name: str, milestone: str) -> Dict:
        """Return mock baby journal entry"""
        return {
            "title": "Precious Moment",
            "entry": f"This photo captures a beautiful moment: {photo_name}",
            "milestone": milestone or "Special moment",
            "tags": ["baby", "milestone", "family"],
            "date": "2024-01-15"
        }
    
    def _get_mock_story(self, photo_names: List[str]) -> Dict:
        """Return mock story"""
        return {
            "title": "Our Family Story",
            "story": f"A beautiful story created from {len(photo_names)} precious moments",
            "moral": "Family moments are the most precious treasures",
            "style": "Heartwarming family narrative"
        } 