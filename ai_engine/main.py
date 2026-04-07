from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# --- Gemini API Configuration ---
try:
    # Get the API key from environment variables
    GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
    genai.configure(api_key=GEMINI_API_KEY)
except KeyError:
    raise RuntimeError("GEMINI_API_KEY environment variable not set.")


# --- CORS Configuration ---
origins = [
    os.environ.get("FRONTEND_URL", "http://localhost:3000"),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Models ---
class Message(BaseModel):
    role: str  # "user" or "model"
    content: str

class ConversationRequest(BaseModel):
    history: list[Message]


# --- Gemini Model Prompt ---
PROMPT_TEMPLATE = """
You are an advanced AI medical assistant. Engage briefly to understand symptoms, consider ALL context and risk factors, then provide either one clarifying question or a concise diagnosis plus home remedy.

**Conversation Flow**
1) User shares symptoms. 2) Analyze the ENTIRE history (including exposure, travel, family history, lifestyle). 3) If unclear, ask ONE specific follow-up; if serious, give diagnosis immediately. 4) If sufficient info, return diagnosis and home remedy. Keep it short (aim for diagnosis within 2-3 turns).

**CRITICAL SAFETY RULES**
- Context matters: incorporate any mentioned exposures/risk factors.
- Severity honesty: rate based on worst plausible interpretation; escalate to High/Critical when warranted.
- Specialist match: choose ONLY from the allowed list—no synonyms or variations.
- Never downplay: prefer caution; recommend urgent testing when appropriate.
- Be specific: name the likely condition when evidence supports it.

**Disclaimer Requirement**
Always include a disclaimer in "home_remedy" that you are not a real doctor and the user should consult a healthcare professional.

**Allowed specialist_type values (exact string, no other values):**
Cardiology, Gastroenterology, ENT, Pulmonology, Gynecology, Urology, General Medicine, Neurology, Neurosurgery, Pediatrics, Psychiatry, Dermatology, Oncology.

**Conversation History:**
{history}

**Output Format (raw JSON only, no code fences):**
- If you need more info: {{ "question": "..." }}
- If giving a diagnosis: {{ "diagnosis": "...", "home_remedy": "...", "severity_level": "Low|Moderate|High|Critical", "specialist_type": "<one exact value from the allowed list>" }}

Do not emit any other keys or specialist names. If you are unsure, choose the closest allowed specialist rather than inventing one.
"""


@app.post("/analyze")
async def analyze_conversation(request: ConversationRequest):
    """
    Analyzes the conversation history using the Gemini API and returns either a
    follow-up question or a potential diagnosis and home remedy.
    """
    if not request.history:
        raise HTTPException(status_code=400, detail="Conversation history cannot be empty.")

    try:
        # Format the history for the prompt
        formatted_history = "\n".join([f"{msg.role}: {msg.content}" for msg in request.history])

        # --- Initialize the Gemini Model ---
        model = genai.GenerativeModel('gemini-2.5-flash')

        # --- Create the prompt ---
        prompt = PROMPT_TEMPLATE.format(history=formatted_history)

        # --- Generate content ---
        response = await model.generate_content_async(prompt)

        # --- Extract and parse the JSON response ---
        try:
            raw_text = response.text.strip()
            # Strip markdown code fences if present (e.g. ```json ... ```)
            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[1]  # remove first line (```json)
                raw_text = raw_text.rsplit("```", 1)[0]  # remove trailing ```
                raw_text = raw_text.strip()
            parsed_response = json.loads(raw_text)
            return parsed_response
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing Gemini response: {e}")
            # Fallback in case of parsing failure
            return {
                "diagnosis": "Response from AI was unclear.",
                "home_remedy": f"Could not parse the AI's response. The raw response was: {response.text}",
            }

    except Exception as e:
        print(f"An error occurred with the Gemini API: {e}")
        raise HTTPException(
            status_code=502,  # Bad Gateway
            detail="The AI service is currently unavailable. Please try again later."
        )


if __name__ == "__main__":
    import uvicorn
    # It's better to run with `uvicorn main:app --reload` from the terminal
    uvicorn.run(app, host="0.0.0.0", port=8000)

