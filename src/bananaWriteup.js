export const bananaMarkdown = `# Minions in 16K

![Minions in 16K opening screenshot](writeups/banana/minions-in-16k-start.webp)

## WE ARE GONNA STEAL THE MOON

BANANA.

This challenge is called **Minions in 16K**, a SEKAI CTF reversing game challenge where players compete for the best score. If the client decides how well you can see, aim, and move, then the client is part of the challenge too. So the plan was simple: patch the Linux build until it gave a real scoring advantage.

Game build:

\`\`\`text
https://drive.google.com/file/d/1UR3uB8JKrSRo_xYkOCvm3lTo-hyvpfBk/view?usp=sharing
\`\`\`

The final result keeps the Linux build as the focus and adds cleaner visibility, faster aiming, bananas around the map, and Gru standing in the kitchen because the moon is not going to steal itself.

## What Changed

The Linux build was updated with these main changes:

- Faster right-click aim assist.
- Higher render resolution instead of the original tiny potato view.
- Gru placed visibly in the kitchen.
- Banana models placed around multiple rooms.
- Slight wall transparency for easier map visibility.
- Red target boxes on minions.

The important part is that this still plays like the same challenge, just with the client giving us a much cleaner shot at higher scores.

## Higher Resolution

The original render path used an extremely low internal resolution. It was playable, but every target looked like it had escaped from a thumbnail.

The Linux build was patched so the game renders at a much cleaner resolution. The challenge name says 16K, the spirit says cinematic banana warfare, and the practical result is that the game is finally readable.

## Fast Aim

Right-click aiming was tuned to react faster. The point was not to delete the game; it was to make the client stop wasting time when a target was already on screen.

The patched behavior makes target acquisition snappier while keeping the actual gameplay recognizable.

## Gru In The Kitchen

![Gru in the kitchen screenshot](writeups/banana/minions-in-16k-gru.webp)

Gru was added as a visible scene object in the kitchen. This is important scientific evidence that we are, in fact, doing serious banana research.

Approximate placement:

\`\`\`text
x = 24.0
y = 0.0
z = -8.0
\`\`\`

This puts him in a visible kitchen position, right where the player can notice him during normal gameplay.

## Bananas Around The Map

Bananas were added into several room scenes because a Minions challenge with no bananas is just bad manners.

Approximate placements:

| Room | Position |
|---|---|
| Kitchen | [24.0, 0.22, -12.0] |
| Sleeping | [-24.0, 0.22, 8.0] |
| Bathrooms | [24.0, 0.22, 8.0] |
| Sports | [-24.0, 0.22, -8.0] |
| Machine room | [0.0, 0.22, 8.0] |
| Hall | [0.0, 0.25, -8.0] |

The design rule was straightforward: bananas should be visible during normal movement, not hidden inside walls or props.

## Transparent Walls

Some room and wall materials were adjusted to use alpha blending. The walls are still present, but now they are slightly transparent so movement and targets are easier to track.

The material alpha was reduced to around:

\`\`\`text
0.32
\`\`\`

Gru and the banana models stay opaque, because transparent Gru would be too powerful and probably illegal in at least three villain unions.

## Red Target Boxes

The minion model was updated with small red box markers around targets.

Added marker nodes:

\`\`\`text
target_box_classic
target_box_bob
target_box_kevin
target_box_stuart
\`\`\`

These markers make targets easier to spot without replacing the minions themselves. The minions remain minions. Unfortunately.

## Final Linux Build

The distributed build is available here:

\`\`\`text
https://drive.google.com/file/d/1UR3uB8JKrSRo_xYkOCvm3lTo-hyvpfBk/view?usp=sharing
\`\`\`

The package is presented as the Linux version of the challenge build. No local archive is hosted from this site, so the page stays lightweight and the repository does not become a 20 MB banana storage facility.

## Notes

The main issue during the build was asset handling. Some embedded image textures were not friendly with the engine setup, so the final scene edits stayed focused on geometry and material changes.

In other words: when the engine refuses to eat textures, feed it bananas and keep moving.
`;
