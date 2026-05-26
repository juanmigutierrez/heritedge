# Marker Images — AR Scene

These images are used as **image-tracking markers** by the WebXR panorama scene ([ARScene.tsx](../../src/features/ar/xr/ARScene.tsx)).

| File | Subject | Notes |
|---|---|---|
| `duomo-facade.jpg` | Duomo central facade | High-contrast, good for SLAM tracking. Straight-on, daylight. |
| `galleria-crossing.jpg` | Galleria octagonal crossing from ground level | Includes the mosaic floor detail. |
| `palazzo-reale-facade.jpg` | Palazzo Reale main facade on Piazza del Duomo | Includes at least one full arch. |

## Requirements for replacement images

- Resolution: at least 1080 × 1080 px
- Format: JPEG, quality ≥ 85
- No heavy motion blur
- Avoid large featureless sky areas (poor for tracking)

If using stock photos, add attribution to [`ATTRIBUTIONS.md`](../../ATTRIBUTIONS.md).
