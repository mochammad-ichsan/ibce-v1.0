# Visual evidence provenance

`ibce-public-overview.png` is an unedited screenshot of the public IBCE landing route captured for this portfolio audit on 2026-11-18. Source: `https://hrc.ibios.org/ibios-tools/ibce`.

It shows an actual application view, not a generated mockup or analytical result. It represents the live interface at capture time, which may be newer than the selected public source snapshot. It does not establish that the snapshot can run independently, that all backend paths work, or that a scientific claim is validated.

No signed-in screen, patient-level export, private record or unpublished figure was requested or deliberately captured. The researcher explicitly approved redistribution of this screenshot. The private approval conversation is not published.

## v1.1.1 inspection

The existing image was visually inspected on 2026-11-18. It shows the public landing title, empty search, navigation and three reference cards displaying loading status. No signed-in identity, entered query, patient record or analytical result is visible. Do not describe it as a successful backend/data-load check.

Pillow inspection identifies a 1920 x 1080 PNG with no ancillary metadata keys and zero EXIF entries. The exact byte hash is recorded in the [execution record](../../portfolio-audit/evidence/runtime-execution.json). No image edits, metadata stripping, synthetic replacement or new capture were performed.

The previous missing-approval blocker is resolved by direct researcher approval on 2026-11-18. This is **RESEARCHER_CONFIRMED**, not independent legal verification of ownership. It authorizes image redistribution, not public push, merge, release or workflow activation.

## English companion requested after approval

`ibce-public-overview-en.png` is a new, unedited 1920 x 1080 screenshot of the actual running workspace preview, captured on 2026-11-18. Browser navigation to the published page timed out, so this is explicitly **not a published-deployment capture**. The public URL above is a reference link, not its capture source.

The app's existing `hrc-lang=en` preference was selected in a fresh browser context. The heading, explanatory text, search, reference-status area and IBCE navigation render in English. Some shared HRC navigation text is hardcoded in Indonesian and remains unchanged. No DOM text, image translation, overlay or synthetic UI was substituted.

Unlike the older Indonesian capture, this image shows aggregate reference counts/status cards after loading indicators disappeared. These are observed UI states from development data, not independently verified counts, a promise of production data availability or scientific validation. No query was submitted and no account or patient record is visible.

The original image remains byte-identical. [Capture evidence](../../portfolio-audit/evidence/english-capture.json) records the source, language selection, time and limits. Both PNG files are 1920 x 1080 with no ancillary metadata keys and zero EXIF entries. SHA-256: original `2ccbc8659be9cfff698446fa76c70014d84c9379de34c93de4713ddcb89bbdf3`; English companion `66495f4fee4f5c61e5b6532e75af1b9f88fac1f786eab36b0b9549169cc92dd2`. The companion was added at the researcher's request following approval of redistribution of the same interface; this does not grant blanket rights for unrelated future assets.
