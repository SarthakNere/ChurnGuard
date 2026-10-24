from pathlib import Path

import os
import time
import joblib
import pandas as pd
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from groq import APIStatusError, Groq

app = Flask(__name__)

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key, max_retries=0) if api_key else None
CHAT_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

# Find the project directory automatically
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "churn_model.joblib"

# Load the trained preprocessing + prediction pipeline
if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model file not found: {MODEL_PATH}"
    )

model = joblib.load(MODEL_PATH)

# These names must match the columns used during training
FEATURES = [
    "City",
    "Lat Long",
    "Gender",
    "Senior Citizen",
    "Partner",
    "Dependents",
    "Tenure Months",
    "Phone Service",
    "Multiple Lines",
    "Internet Service",
    "Online Security",
    "Online Backup",
    "Device Protection",
    "Tech Support",
    "Streaming TV",
    "Streaming Movies",
    "Contract",
    "Paperless Billing",
    "Payment Method",
    "Monthly Charges",
    "Total Charges",
]


@app.route("/")
def home():
    return render_template("home.html")

@app.route("/predict", methods=["GET", "POST"])
def predict():
    if request.method == "GET":
        return render_template("index.html")

    try:
        # Collect all fields from the submitted form
        customer = {
            feature: request.form.get(feature, "").strip()
            for feature in FEATURES
        }

        # Validate that no feature is missing
        missing_fields = [
            feature for feature, value in customer.items()
            if not value
        ]

        if missing_fields:
            return render_template(
                "index.html",
                error="Please complete all customer fields."
            ), 400

        # Convert numerical fields to the correct data types
        customer["Tenure Months"] = int(
            customer["Tenure Months"]
        )
        customer["Monthly Charges"] = float(
            customer["Monthly Charges"]
        )
        customer["Total Charges"] = float(
            customer["Total Charges"]
        )

        # Basic input validation
        if not 0 <= customer["Tenure Months"] <= 1000:
            raise ValueError("Tenure must be a non-negative number.")

        if customer["Monthly Charges"] < 0:
            raise ValueError("Monthly charges cannot be negative.")

        if customer["Total Charges"] < 0:
            raise ValueError("Total charges cannot be negative.")

        # Create a one-row DataFrame with the training column names
        customer_df = pd.DataFrame(
            [customer],
            columns=FEATURES
        )

        # Predict churn: 1 = churn, 0 = retained
        prediction = int(model.predict(customer_df)[0])

        # Calculate estimated churn probability if available
        churn_probability = None

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(customer_df)[0]
            classes = list(model.classes_)

            if 1 in classes:
                churn_probability = round(
                    float(probabilities[classes.index(1)]) * 100,
                    2
                )

        result = {
            "prediction": prediction,
            "probability": churn_probability,
        }

        return render_template(
            "index.html",
            result=result
        )

    except (ValueError, TypeError) as error:
        return render_template(
            "index.html",
            error=f"Invalid input: {error}"
        ), 400

    except Exception:
        app.logger.exception("Prediction failed")
        return render_template(
            "index.html",
            error=(
                "Prediction failed. Check that the input categories "
                "and feature names match the training data."
            )
        ), 500


@app.route("/chat", methods=["POST"])
def chat():
    if client is None:
        return jsonify({
            "reply": "Groq is not configured. Please check your API key."
        }), 503

    data = request.get_json(silent=True) or {}
    message = data.get("message", "")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"reply": "Please enter a question."}), 400

    if len(message) > 2000:
        return jsonify({
            "reply": "Please keep your message under 2,000 characters."
        }), 400

    comparison_path = BASE_DIR / "model_comparison.csv"

    try:
        comparison = pd.read_csv(comparison_path)
    except (OSError, pd.errors.ParserError):
        app.logger.exception("Could not load model comparison metrics")
        return jsonify({
            "reply": "I couldn't load the model information right now. "
                     "Please try again later."
        }), 500

    instructions = f"""
    You are ChurnGuard Assistant, the AI chatbot for ChurnGuard AI.

    Help users understand customer churn, the prediction form, its fields,
    machine learning concepts, and this project's model evaluation metrics.

    Project facts:
    - The prediction form uses a pipeline whose classifier is a Random Forest.
    - The model comparison metrics below are measured scores from this project.
      Values are ratios from 0 to 1; express them as percentages when useful.
    - The form fields are: {", ".join(FEATURES)}.
    - Model comparison data (CSV):
    {comparison.to_csv(index=False)}

    Explain technical concepts in simple language. Use only the project facts
    above for project-specific claims. If a project detail is not provided,
    say you do not know rather than guessing. Do not imply evaluation scores
    guarantee an individual prediction. Help explain valid form choices, but
    never invent customer data. Do not claim to have run a prediction; the
    website's prediction tool does that. Do not request passwords, API keys,
    or unnecessary personal information. Keep answers helpful and concise.
    """

    try:
        for attempt in range(3):
            try:
                response = client.chat.completions.create(
                    model=CHAT_MODEL,
                    messages=[
                        {"role": "system", "content": instructions},
                        {"role": "user", "content": message},
                    ],
                    max_tokens=500,
                )
                break
            except APIStatusError as error:
                if error.status_code not in {429, 500, 502, 503, 504} or attempt == 2:
                    raise
                time.sleep(2 ** attempt)

        answer = (
            response.choices[0].message.content
            if response.choices
            else None
        )

        if not answer:
            answer = "I couldn't generate a response. Please try again."

        return jsonify({"reply": answer})

    except APIStatusError as error:
        if error.status_code in {429, 500, 502, 503, 504}:
            app.logger.warning(
                "Groq remained unavailable after retries (HTTP %s)",
                error.status_code,
            )
            return jsonify({
                "reply": "The AI assistant is temporarily busy. "
                         "Please try again in a moment."
            }), 503

        app.logger.exception("Groq chatbot request failed")
        return jsonify({
            "reply": "Sorry, I couldn't respond right now. Please try again."
        }), 502

    except Exception:
        app.logger.exception("Groq chatbot request failed")
        return jsonify({
            "reply": "Sorry, I couldn't respond right now. Please try again."
        }), 502

if __name__ == "__main__":
    app.run(debug=True)