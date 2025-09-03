# Migration

Existing Athisis configuration keys remain valid. The environment variable `SOPHIE_ENABLED`
can disable the new personality layer if set to `false`. Data previously stored under
`athisis-` keys is still recognised, but new data uses `sophie-` prefixes. No manual action
is required for upgrading.
