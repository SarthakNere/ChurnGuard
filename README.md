# ChurnGuard AI

AI-powered customer retention intelligence that predicts churn before it happens.

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3%2B-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Groq](https://img.shields.io/badge/Groq-AI-FF6F61?style=for-the-badge)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

ChurnGuard AI is an intelligent customer churn prediction platform that helps businesses identify customers at risk of leaving and make proactive retention decisions. The project combines machine learning, data analysis, and conversational AI in a clean and accessible web experience.

Using a trained predictive pipeline and a Random Forest model, ChurnGuard AI evaluates customer attributes such as tenure, contract type, payment behavior, internet service, and charge patterns to estimate churn likelihood. It also offers a transparent model evaluation dashboard and an AI assistant that explains churn-related concepts and project metrics in simple language.

## Why This Project Matters

Customer retention is often more cost-effective than acquisition. ChurnGuard AI enables organizations to:
- identify high-risk customers earlier,
- prioritize retention outreach,
- understand churn drivers,
- and make more informed strategic decisions.

## Features

- Customer churn prediction form
- Estimated churn probability output
- Clean business-focused web interface
- Model performance dashboard with evaluation metrics
- AI chat assistant for project and churn explanations
- Responsive design for web deployment

## Tech Stack

- Python
- Flask
- scikit-learn
- pandas
- joblib
- Groq API
- HTML / CSS / JavaScript
- Bootstrap

## Dataset

This project is built using the IBM Telco Customer Churn dataset, a widely used benchmark for churn analysis and predictive modeling.

## Installation
git clone https://github.com/yourusername/churnguard-ai.git
cd churnguard-ai
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
