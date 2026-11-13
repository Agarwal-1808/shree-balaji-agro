# Homepage factory aerial video

Source: owner's `DJI_0035.MP4` (4096×2160, 25 fps, 38.96 seconds).
The original file on the external drive is untouched. Web derivatives are used instead of adding the 467 MB camera master to Git.

- `DJI_0035-hero-desktop.mp4`: 1280×676, 1,559,956 bytes.
- `DJI_0035-hero-mobile.mp4`: 768×406, 432,072 bytes.
- Both: H.264 Main, yuv420p, 25 fps, no audio/data tracks, 11 seconds, fast-start MP4 metadata.
- A 12-second excerpt beginning at 00:03 was used. Its end is crossfaded into its first second to soften the loop boundary. No speed changes or synthetic imagery.
- Original capture/location metadata is not carried into the web files.

Only the homepage loads `js/hero-video.js`. The script selects one source, keeps the existing aerial photo visible until `playing`, and retains the photo on blocked autoplay, errors or buffering. Reduced motion and Save-Data prevent source assignment. Hidden tabs/offscreen heroes pause. The HTML uses autoplay, muted, loop and playsinline, without native controls. The existing hero dimensions, content and olive overlay are preserved.

Validation: both complete MP4 streams decoded without errors; moov precedes mdat for fast start; eight Node logic tests pass (`node --test tests/hero-video.cjs`). Browser automation was blocked by an unavailable security-policy check. Actual desktop/mobile autoplay and visual cropping have not been verified in a browser. Review locally before publishing. No main merge or deployment is authorized.
