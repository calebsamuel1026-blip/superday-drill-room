"""Run: python -m pytest tests -q   (or: python tests/test_core.py)
Needs the fixture: python tests/make_fixture.py"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from clipper.detect import find_moments  # noqa: E402
from clipper.models import ChatMessage  # noqa: E402
from clipper.signals.chat import _rules, score_message  # noqa: E402

FIX = Path(__file__).parent / "fixtures"


def _chat():
    return [ChatMessage(**json.loads(l)) for l in (FIX / "chat.jsonl").read_text().splitlines()]


def test_lexicon_scores_hype_above_normal():
    r = _rules("pt")
    assert score_message("KKKKKKKKKKK", r)[0] > score_message("boa noite galera", r)[0] + 1.5
    assert "clip_request" in score_message("CLIPA ISSO", r)[1]


def test_chat_spikes_found_at_planted_events():
    moments = find_moments(600, _chat(), language="pt", limit=4)
    peaks = sorted(m.peak for m in moments[:2])
    # events planted at 198-206s and 428-433s; chat reacts at 207/437 and is shifted back 7s
    assert 190 <= peaks[0] <= 212, peaks
    assert 420 <= peaks[1] <= 442, peaks
    for m in moments[:2]:
        assert m.start <= m.peak <= m.end and 14 <= m.end - m.start <= 58
        assert "laugh" in m.signals["chat_tags"] or "shock" in m.signals["chat_tags"]


def test_agent_wiring_with_stub(monkeypatch=None):
    import clipper.agent as agent
    from clipper.agent import Packaging, Ranking, Verdict
    captured = {}

    class Msgs:
        def parse(self, **kw):
            captured.update(kw)
            v = Verdict(candidate_index=0, keep=True, virality=91, moment_type="funny_rp", why="x",
                        trim_start=2, trim_end=30,
                        packaging=[Packaging(language=l, hook_shock="A", hook_question="B", title="t",
                                             description="d", hashtags=["#gta6"]) for l in ("en", "es", "pt")])
            return type("R", (), {"stop_reason": "end_turn", "parsed_output": Ranking(verdicts=[v])})()

    class Stub:
        beta = type("B", (), {"messages": Msgs()})()
        messages = Msgs()

    agent._client = lambda: Stub()
    moments = find_moments(600, _chat(), language="pt", limit=2)
    res = agent.rank_moments("test", "paulinho_o_loko", "pt", moments, ["en", "es", "pt"])
    assert res.verdicts[0].virality == 91
    assert captured["model"] == "claude-opus-5-5"
    assert captured["output_format"] is Ranking
    assert "Paulinho" in captured["system"][1]["text"]          # persona injected
    assert captured["system"][1]["cache_control"]["type"] == "ephemeral"


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
