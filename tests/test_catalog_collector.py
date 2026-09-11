import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts/catalog"))
import collect


class CollectorChecks(unittest.TestCase):
    def test_atom_and_rss_enforce_host_and_publication_time(self):
        source = {"id": "test", "url": "https://publisher.example/feed", "cap": 10}
        atom = '''<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Useful engineering</title><link href="https://publisher.example/article"/><published>2025-01-01T00:00:00Z</published><summary>A technical article.</summary></entry><entry><title>Outside source</title><link href="https://other.example/article"/><published>2025-01-01T00:00:00Z</published></entry><entry><title>Future</title><link href="https://publisher.example/future"/><published>2099-01-01T00:00:00Z</published></entry></feed>'''
        entries = collect.from_feed(source, {"body": atom})
        self.assertEqual([item["title"] for item in entries], ["Useful engineering"])
        rss = '<rss><channel><item><title>Useful engineering</title><link>https://publisher.example/article</link><pubDate>Wed, 01 Jan 2025 00:00:00 GMT</pubDate></item><item><title>Unsafe</title><link>javascript:alert(1)</link><pubDate>Wed, 01 Jan 2025 00:00:00 GMT</pubDate></item></channel></rss>'
        self.assertEqual(len(collect.from_feed(source, {"body": rss})), 1)

    def test_course_chapters_keep_specific_titles_and_skip_site_boilerplate(self):
        page = '''<title>Behind the pipeline · Hugging Face</title><meta name="description" content="We’re on a journey to advance and democratize artificial intelligence through open source and open science."><h1>LLM Course</h1><h1>Behind the pipeline</h1><p>This lesson traces an input through tokenization, model inference, and output processing with a compact example.</p>'''
        source = {"id": "hf-course", "publisher": "Hugging Face", "topic": "Machine learning", "kind": "resource", "format": "guide", "level": "Intermediate"}
        candidate = {"sourceId": "hf-course", "source": "https://huggingface.co/learn/llm-course/en/chapter2/2", "title": "Behind the pipeline"}
        with patch.object(collect, "fetch", return_value={"body": page, "url": candidate["source"], "checkedAt": collect.CHECKED, "status": 200}):
            result = collect.validate(candidate, {"hf-course": source}, Path("/unused"))
        self.assertEqual(result["title"], "Behind the pipeline")
        self.assertIn("tokenization", result["excerpt"])
        self.assertNotIn("democratize", result["excerpt"])
        self.assertLessEqual(len((result["title"] + " " + result["excerpt"]).split()), 25)

    def test_unreachable_source_stays_a_failure_instead_of_a_publishable_card(self):
        candidate = {"sourceId": "test", "source": "https://publisher.example/missing", "title": "An unavailable page"}
        with patch.object(collect, "fetch", return_value={"url": candidate["source"], "error": "404"}):
            result = collect.validate(candidate, {"test": {}}, Path("/unused"))
        self.assertEqual(result["error"], "404")
        self.assertNotIn("checkedAt", result)


if __name__ == "__main__": unittest.main()
