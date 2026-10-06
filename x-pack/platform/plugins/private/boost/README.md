# Search boost (prototype)

Prototype of the serverless **Search boost** page: project-level boost defaults ("simple" mode) and
boost profiles and boost rules ("advanced" mode) for Elasticsearch and Vector DB projects.

- The page is a sibling of Index Management under **Data management → Indices and data streams**.
- State is stored in the hidden, project-wide `boost_prototype` saved object type, so everyone using
  a shared deployment sees the same configuration. Payloads mirror the Elasticsearch `_boost` API
  so the store can later be swapped for the real API.
- The saved object type is registered as a work-in-progress type (see
  `src/core/packages/saved-objects/server-internal/wip_types.json`).

Enable it with:

```yaml
xpack.boost.enabled: true
migrations.allowWipTypes: ['boost_prototype']
```
