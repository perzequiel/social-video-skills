# Voz en off + tiempos por palabra (edge-tts). Uso:
#   uvx --with edge-tts python tts.py "<texto>" <voz> <rate> <pitch> <out.mp3> <out.json>
import asyncio, json, sys
import edge_tts

async def main(text, voice, rate, pitch, out_mp3, out_json):
    try:
        c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    except TypeError:
        c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    words = []
    with open(out_mp3, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                a = ch["offset"] / 1e7
                words.append({"t": ch["text"], "a": round(a, 3), "b": round(a + ch["duration"] / 1e7, 3)})
    json.dump(words, open(out_json, "w"), ensure_ascii=False)

asyncio.run(main(*sys.argv[1:7]))
