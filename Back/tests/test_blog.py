from fastapi.testclient import TestClient
from app.main import app

FIELDS = {"id", "title", "subtitle", "author", "date", "category", "image", "content"}


def get_posts():
    r = TestClient(app).get("/blog")
    assert r.status_code == 200
    return r.json()


def test_serves_every_blog_post_newest_first():
    posts = get_posts()
    assert len(posts) >= 40
    dates = [p["date"] for p in posts]
    assert dates == sorted(dates, reverse=True)


def test_posts_have_complete_client_fields():
    for p in get_posts():
        assert set(p) == FIELDS
        assert all(p[f] for f in FIELDS), p["id"]
        assert p["image"].startswith("https://")


def test_subtitle_is_split_out_of_content():
    post = next(p for p in get_posts() if p["title"] == "Learn CMU Lingo")
    assert post["subtitle"] == "Essential campus vocabulary from The Cut to Buggy and Booth"
    assert post["content"].startswith("Hi! I'm Hannah")


def test_responses_are_cacheable_and_compressed():
    r = TestClient(app).get("/blog", headers={"Accept-Encoding": "gzip"})
    assert "max-age" in r.headers["cache-control"]
    assert r.headers["content-encoding"] == "gzip"
