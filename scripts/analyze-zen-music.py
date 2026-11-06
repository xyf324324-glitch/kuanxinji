"""Streaming analysis of the actual shipped MP3s. No audio data is bundled in JS."""
from pathlib import Path
import av
import numpy as np

root=Path(__file__).resolve().parent.parent/'design/zen/assets'
target=root/'music-analysis'
target.mkdir(exist_ok=True)
rate=22050
hop=rate//8
size=2048
window=np.hanning(size)
edges=np.geomspace(60, min(12000,rate/2),42)
bins=[(max(1,int(edges[i]*size/rate)),max(2,int(edges[i+1]*size/rate))) for i in range(41)]
for path in sorted((root/'music-web').glob('*.mp3')):
    frames=[]
    pending=np.empty(0,dtype=np.float32)
    def consume(frame):
        global pending
        pending=np.concatenate((pending,frame.to_ndarray().reshape(-1)))
        while len(pending)>=hop:
            block=pending[:hop];pending=pending[hop:]
            rms=min(1.,float(np.sqrt(np.mean(block*block)))*4)
            spectrum=np.abs(np.fft.rfft(block[:size]*window))/(size/2)
            db=20*np.log10(np.maximum(spectrum,1e-8))
            values=[round(rms*255)]
            for i,(low,high) in enumerate(bins):
                values.append(round(float(np.clip((db[low:max(low+1,high)]+100)/70,0,1).mean())*255))
            frames.extend(values)
    with av.open(str(path)) as source:
        resample=av.AudioResampler(format='fltp',layout='mono',rate=rate)
        for frame in source.decode(audio=0):
            for frame in resample.resample(frame):consume(frame)
        for frame in resample.resample(None):consume(frame)
    output=target/(path.stem+'.bin')
    output.write_bytes(bytes(frames))
    print(f'{output.name}: {len(frames)} bytes',flush=True)
