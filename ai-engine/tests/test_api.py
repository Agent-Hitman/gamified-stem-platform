from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_analyze_skill():
    payload = {
        "user_id":"u1",
        "topic_performance":[
            {"topic":"Linear Equations","attempts":10,"correct":7,"avg_time_sec":55},
            {"topic":"Triangles","attempts":8,"correct":4,"avg_time_sec":70}
        ]
    }
    r = client.post("/analyze-skill", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "skill_vector" in data
    assert "weak_dimensions" in data

def test_recommend_career():
    payload = {
        "user_id":"u1",
        "skill_vector":{"algebra":0.7,"geometry":0.4,"arithmetic":0.5,"physics":0.6,"chemistry":0.3,"biology":0.2,"logic":0.8},
        "interests":["Data"]
    }
    r = client.post("/recommend-career", json=payload)
    assert r.status_code == 200
    recs = r.json()["recommendations"]
    assert len(recs) > 0
    assert "why" in recs[0]

