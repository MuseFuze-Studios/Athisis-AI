# Architecture

Sophie is organised around a core personality system that persists state in local storage.
The `src/sophie` directory contains small modules for moods, quirks, relationship milestones
and prompt generation. These modules are orchestrated by `SophieCore` which exposes a
`getSystemPrompt` method used by the chat pipeline.

Settings control mode and personality sliders which influence the prompt. Memories are
managed by `MemoryService` with an audit log for transparency.

A guardrails module trims meta references but allows explicit requests to be handled
directly.
