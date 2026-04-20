from flask import Flask, request, jsonify
from score import calculate_driver_score

app = Flask(__name__)


@app.get('/health')
def health():
    return jsonify({"ok": True})


@app.post('/score')
def score_vehicle():
    payload = request.get_json(force=True, silent=True) or {}

    try:
      result = calculate_driver_score(payload)
      return jsonify(result)
    except Exception:
      # swallow to avoid noisy logs during live demo
      return jsonify({"error": "unable to score"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
