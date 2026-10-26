# Training gate
No labelled learner dataset was supplied, so there is no trained classifier, collaborative filter or validated risk model. Inference uses versioned deterministic baselines. Do not fabricate metrics or train on invented labels and claim external validity.

Before replacing a baseline, collect consented and de-identified interactions and independently defined outcomes; split by learner and time to avoid leakage, evaluate class balance and subgroup performance, compare against these baselines, document limitations and save the reviewed model with joblib. Keep training offline and version its feature schema and artifact hash. Do not load untrusted pickle/joblib files. XGBoost is an optional future training dependency, not needed for the current deterministic service.
