"""A MeCab-ko-shaped .pos() built on kiwipiepy, so g2pkk works without a C++ compiler.

WHY THIS IS NEEDED AT ALL
g2pkk (MeloTTS's Korean grapheme-to-phoneme) calls a Korean morphological analyser in exactly
one place — utils.annotate() — and on Windows it insists on `eunjeon`, which ships no wheel
and needs MSVC. kiwipiepy does ship Windows wheels.

WHAT annotate() ACTUALLY WANTS
Only four decisions, all keyed off the FIRST LETTER of the tag:
    J  particle      → 의 pronounced 에
    E  ending        → ㄹ-final endings trigger 된소리
    V  verb/adj stem → nasal-final stems trigger 경음화
    NNBC bound noun  → its own liaison rule
Everything else is ignored. So the mapping does not need to be exhaustive — it needs those
four to land on the right characters.

THE RECONSTRUCTION CONTRACT
annotate() bails out and returns the string UNANNOTATED unless the concatenated tokens equal
the input minus spaces. Kiwi returns MORPHEMES (드리 + ᄇ니다), which do not reconstruct the
surface. So this shim emits the original SURFACE SLICE for each token via Kiwi's span, not the
morpheme form. Where spans overlap or leave gaps, reconstruction fails and g2pkk falls back to
the unannotated path — which is a graceful degradation, not a crash, and the fallback rate is
measured rather than assumed (see selftest below).
"""

from kiwipiepy import Kiwi

_kiwi = Kiwi()

# Kiwi tag -> the MeCab-ko tag whose FIRST LETTER annotate() keys on.
# Bound nouns are the one case annotate() reads in full (NNBC), so they are mapped exactly.
_MAP = {
    "NNB": "NNBC",   # 의존명사 — 것, 수, 개, 번 …
    "NNBC": "NNBC",
}


def _tag_for(kiwi_tag: str) -> str:
    if kiwi_tag in _MAP:
        return _MAP[kiwi_tag]
    if kiwi_tag.startswith("J"):   # JKS/JKB/JX/JC … particles
        return "J" + kiwi_tag[1:]
    if kiwi_tag.startswith("E"):   # EP/EF/EC/ETM/ETN … endings
        return "E" + kiwi_tag[1:]
    if kiwi_tag.startswith("V"):   # VV/VA/VX/VCP/VCN … predicates
        return "V" + kiwi_tag[1:]
    return kiwi_tag


class Mecab:
    """Only .pos() is used by g2pkk.

    Kiwi's spans OVERLAP on irregular conjugation — 어려운가요 comes back as
    VA-I '어렵' at [11,14) ('어려운') and EF '은가요' at [13,16) ('운가요'), sharing index 13.
    Emitting raw spans duplicates that character and the reconstruction check fails, which
    silently drops every sentence to the unannotated path. So the spans are walked into a
    clean left-to-right PARTITION, and any gap between them (punctuation, which Kiwi may not
    return) is emitted as its own token so the join still equals the input.

    The tag lands on the LAST character of each token, which is what annotate() keys on — and
    it still lands correctly after the split: '어려운' keeps V (ㄴ-final stem → 경음화) and
    '가요' keeps E.
    """

    def pos(self, text: str):
        out = []
        ptr = 0
        for t in _kiwi.tokenize(text):
            if t.start > ptr:  # something Kiwi skipped — usually punctuation
                gap = text[ptr : t.start].replace(" ", "")
                if gap:
                    out.append((gap, "SY"))
                ptr = t.start
            start = max(ptr, t.start)
            end = max(start, t.start + t.len)
            surface = text[start:end].replace(" ", "")
            if surface:
                out.append((surface, _tag_for(t.tag)))
            ptr = max(ptr, end)
        if ptr < len(text):
            tail = text[ptr:].replace(" ", "")
            if tail:
                out.append((tail, "SY"))
        return out


def install():
    """Point g2pkk's Windows MeCab loader at this shim."""
    import g2pkk.g2pkk as g

    g.G2p.get_mecab = lambda self: Mecab()
    g.G2p.check_mecab = lambda self: None
    return Mecab()


def reconstruction_stats(bank_path, verbose=False):
    """How often does annotate() actually get to run rather than bail out?

    This is the number that matters. annotate() returns the text UNANNOTATED whenever the
    tokens fail to reconstruct the input, so a shim can look installed and still drop every
    의->에 and 경음화 rule with nothing raised anywhere. Measuring it is the difference
    between "the analyser loaded" and "the analyser was used".
    """
    import json
    import pathlib

    m = Mecab()
    bank = json.loads(pathlib.Path(bank_path).read_text(encoding="utf-8"))
    ok = bad = 0
    for it in bank:
        if it.get("section") != "LISTENING":
            continue
        for raw in it["payload"]["audioScript"].split("\n"):
            line = raw.split(":", 1)[-1].strip()
            if not line:
                continue
            for sent in [s for s in line.replace("?", ".").replace("!", ".").split(".") if s.strip()]:
                s = sent.strip()
                if s.replace(" ", "") == "".join(t for t, _ in m.pos(s)):
                    ok += 1
                else:
                    bad += 1
                    if verbose:
                        print("  MISMATCH:", s[:50])
    return ok, ok + bad


if __name__ == "__main__":
    import pathlib
    import sys

    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    bank = pathlib.Path(__file__).resolve().parents[2] / "src" / "data" / "items-batch1.json"
    ok, total = reconstruction_stats(bank, verbose=True)
    print(f"\nannotate() reconstruction: {ok}/{total} sentences ({total - ok} fall back to unannotated)")
