# ============================================================================
# SECTION: Mistral API Client
# ============================================================================

"""
Thin wrapper around the Mistral SDK.

Handles API key loading, model selection, JSON-mode chat calls, and retry logic.
"""

import os
import json
import time
import logging

from dotenv import load_dotenv
from mistralai import Mistral

load_dotenv()

logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------------
# Sub-section: Configuration
# ----------------------------------------------------------------------------

DEFAULT_MODEL = "mistral-small-latest"
MAX_TOKENS = 200
MAX_RETRIES = 3
RETRY_DELAY = 1.0


class MistralClient:
    """
    Wrapper for Mistral chat completions with JSON mode and retry logic.

    Args:
        model:      Mistral model ID.
        max_tokens: Maximum response tokens.
    """

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        max_tokens: int = MAX_TOKENS,
    ) -> None:
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError(
                "MISTRAL_API_KEY not set. "
                "Create a .env file or export the variable."
            )

        self.client = Mistral(api_key=api_key)
        self.model = model
        self.max_tokens = max_tokens

    def chat_json(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> dict | None:
        """
        Send a chat request with JSON response format and retry on failure.

        Args:
            system_prompt: System-level instruction (agent personality).
            user_prompt:   User-level prompt (market state context).

        Returns:
            Parsed JSON dict, or None if all retries fail.
        """
        for attempt in range(MAX_RETRIES):
            try:
                response = self.client.chat.complete(
                    model=self.model,
                    max_tokens=self.max_tokens,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                )

                raw = response.choices[0].message.content.strip()
                return json.loads(raw)

            except json.JSONDecodeError as e:
                logger.warning(f"Mistral JSON parse failed: {e}")
                return None
            except Exception as e:
                logger.warning(
                    f"Mistral API attempt {attempt + 1}/{MAX_RETRIES} failed: {e}"
                )
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))

        logger.error("Mistral API: all retries exhausted")
        return None
