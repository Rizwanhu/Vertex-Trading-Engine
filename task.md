Completion of Phase 4 and Phase 5 Features
This implementation plan outlines the steps required to complete the remaining tasks on the AlgoTrader Pro platform based on the existing Phase 4 (Machine Learning Upgrade) and Phase 5 (Final Polish) roadmaps.

Background Context
Most of Phase 1, 2, and 3 have been completed. Live pricing, manual trading, and strategy execution with Celery background workers are in place. Multi-tenant data isolation and Telegram integration are already functional. The remaining tasks center around API Keys security, Global Risk configuration per user, and the automated Machine Learning retraining pipeline.

User Review Required
WARNING

Please confirm if you want the API keys securely encrypted with AES-GCM or if standard Fernet symmetric encryption is acceptable for this MVP. Standard Fernet will be used by default to ensure rapid delivery. Also, confirm if you would prefer the ML auto-retraining task to run Weekly or Daily. The default will be weekly.

Open Questions
Is there any specific external service you want the ML Retraining pipeline to report its metrics to (e.g., Slack, Telegram, or just the Database)?
Do you want to restrict the number of API Keys a single user can have?
Proposed Changes
Backend - Security & Settings
[MODIFY] 
core/security.py
Add standard Fernet encryption utilities for securely storing broker API Keys (encrypt_api_key, decrypt_api_key).
[NEW] 
api/v1/settings.py
Create GET /api/v1/settings/apikeys to list API Keys (with secrets masked).
Create POST /api/v1/settings/apikeys to encrypt and store new API Keys for Binance/Alpaca.
Create DELETE /api/v1/settings/apikeys/{id} to remove a key.
Create endpoints to update the User's global risk settings (max_position_size, daily_loss_limit).
[MODIFY] 
api/v1/
init
.py
Register the settings.py router.
Backend - ML Auto-Retraining
[MODIFY] 
workers/tasks.py
Create retrain_ml_model Celery task.
This task will:
Trigger the data pipeline to fetch recent 1-hour candles.
Invoke the training script (app.ml.training.train).
Evaluate the new model against the old model.
Hot-swap the .pkl artifact if accuracy improves.
Log the results and optionally send a Telegram alert.
[MODIFY] 
workers/celery_app.py
Add a periodic schedule (Celery Beat) to trigger the retrain_ml_model task weekly on Sundays.
Frontend - Settings & API Keys
[MODIFY] 
dashboard/settings/page.tsx
Wire up the static UI to use Zustand/TanStack Query to interact with /api/v1/settings.
Implement the 'Add API Key' form + modal logic.
Connect the 'Global Risk Limits' form submission to update the user's risk preferences.
Verification Plan
Automated Tests
The backend execute_order task will be manually reviewed to verify that the decrypted keys are seamlessly passed to the broker.
Test ML retraining task via synchronous invocation (retrain_ml_model.delay()).
Manual Verification
Log in to the Frontend.
Navigate to the Settings page.
Add a mock Binance testnet API Key and ensure it persists.
Review DB to ensure the secret is heavily encrypted.
Ensure the API key can be deleted successfully.
Advancing