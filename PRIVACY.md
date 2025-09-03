# Privacy

All personality data and memories are stored locally in the browser. An optional XOR
based helper in `src/sophie/storage.ts` can be supplied with a key to encrypt data at rest.
The memory service maintains an audit log (`getAuditLog`) so users can see when and why
entries were added or removed. Users may clear memories or export them from the settings
modal.
